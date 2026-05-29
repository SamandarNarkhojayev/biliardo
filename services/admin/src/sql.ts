import type { AdminSqlResult } from '@billiard/shared'
import { prisma } from './db.js'
import { env } from './config.js'

/**
 * Делает значения из raw-SQL JSON-безопасными:
 *  - BigInt → number (если влезает в безопасный диапазон) либо string
 *  - Date   → ISO-строка
 *  - Buffer → base64
 *  - Прочее — как есть (Prisma уже отдаёт примитивы / объекты).
 */
export function toJsonSafe(value: unknown): unknown {
  if (value === null || value === undefined) return value
  if (typeof value === 'bigint') {
    return value >= BigInt(Number.MIN_SAFE_INTEGER) && value <= BigInt(Number.MAX_SAFE_INTEGER)
      ? Number(value)
      : value.toString()
  }
  if (value instanceof Date) return value.toISOString()
  if (Buffer.isBuffer(value)) return value.toString('base64')
  if (Array.isArray(value)) return value.map(toJsonSafe)
  if (typeof value === 'object') {
    const out: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) out[k] = toJsonSafe(v)
    return out
  }
  return value
}

function serializeRows(rows: Record<string, unknown>[]): Record<string, unknown>[] {
  return rows.map((r) => toJsonSafe(r) as Record<string, unknown>)
}

/** Параметризованный SELECT (читает любые схемы). Возвращает уже JSON-безопасные строки. */
export async function q<T = Record<string, unknown>>(sql: string, ...params: unknown[]): Promise<T[]> {
  const rows = await prisma.$queryRawUnsafe<Record<string, unknown>[]>(sql, ...params)
  return serializeRows(rows) as T[]
}

/** Параметризованная запись (INSERT/UPDATE/DELETE). Возвращает число затронутых строк. */
export async function exec(sql: string, ...params: unknown[]): Promise<number> {
  return prisma.$executeRawUnsafe(sql, ...params)
}

export interface ColSpec {
  /** Тип для каста: 'int' | 'boolean' | 'timestamptz' | '"schema"."EnumType"'. */
  cast?: string
}

/**
 * Безопасно собирает UPDATE из белого списка колонок: имена колонок берутся ТОЛЬКО из
 * allowed (не из пользовательского ввода), значения — параметризованы ($1..). Для enum/типов
 * добавляется явный каст. Возвращает null, если в patch нет ни одной разрешённой колонки.
 */
export function buildUpdate(opts: {
  schema: string
  table: string
  allowed: Record<string, ColSpec>
  patch: Record<string, unknown>
  idValue: string
  touchUpdatedAt?: boolean
}): { sql: string; params: unknown[] } | null {
  const sets: string[] = []
  const params: unknown[] = []
  let i = 1
  for (const [key, spec] of Object.entries(opts.allowed)) {
    if (!(key in opts.patch)) continue
    sets.push(`"${key}" = ${spec.cast ? `$${i}::${spec.cast}` : `$${i}`}`)
    params.push(opts.patch[key])
    i++
  }
  if (sets.length === 0) return null
  if (opts.touchUpdatedAt) sets.push(`"updatedAt" = now()`)
  params.push(opts.idValue)
  const sql = `UPDATE "${opts.schema}"."${opts.table}" SET ${sets.join(', ')} WHERE "id" = $${i}`
  return { sql, params }
}

/** Эвристика: вернёт ли запрос строки (SELECT/CTE/...) или это команда (INSERT/UPDATE/DDL). */
function returnsRows(sqlText: string): boolean {
  const head = sqlText.trimStart().replace(/^\(+\s*/, '').slice(0, 16).toLowerCase()
  if (/^(select|with|table|values|show|explain)/.test(head)) return true
  // INSERT/UPDATE/DELETE ... RETURNING тоже возвращает строки.
  return /\breturning\b/i.test(sqlText)
}

/**
 * Выполняет ПРОИЗВОЛЬНЫЙ SQL (чтение + запись) из консоли супер-админа.
 * Оборачивает в транзакцию с SET LOCAL statement_timeout, чтобы тяжёлый/зависший
 * запрос не подвесил пул. Любой запрос пишется в аудит вызывающей стороной.
 */
export async function runSql(sqlText: string): Promise<AdminSqlResult> {
  const trimmed = sqlText.trim().replace(/;\s*$/, '')
  if (!trimmed) throw new Error('EMPTY_SQL')
  const wantsRows = returnsRows(trimmed)
  const startedAt = Date.now()

  const result = await prisma.$transaction(async (tx) => {
    await tx.$executeRawUnsafe(`SET LOCAL statement_timeout = ${env.SQL_TIMEOUT_MS}`)
    if (wantsRows) {
      const rows = await tx.$queryRawUnsafe<Record<string, unknown>[]>(trimmed)
      return { kind: 'rows' as const, rows }
    }
    const count = await tx.$executeRawUnsafe(trimmed)
    return { kind: 'command' as const, count }
  })

  const durationMs = Date.now() - startedAt

  if (result.kind === 'rows') {
    const rows = serializeRows(result.rows)
    const columns = rows.length > 0 ? Object.keys(rows[0]) : []
    return { kind: 'rows', columns, rows, rowCount: rows.length, command: 'SELECT', durationMs }
  }
  return { kind: 'command', columns: [], rows: [], rowCount: result.count, command: 'OK', durationMs }
}
