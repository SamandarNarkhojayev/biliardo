import { q } from './sql.js'

const SCHEMAS = ['auth', 'tournament', 'payment', 'club', 'admin']
const ROW_CAP = 50_000

export interface DbDump {
  generatedAt: string
  rowCap: number
  tables: Record<string, { total: number; truncated: boolean; rows: Record<string, unknown>[] }>
}

/**
 * Полный дамп БД в JSON: перебирает базовые таблицы во всех схемах сервисов и
 * выгружает строки (с ограничением ROW_CAP на таблицу). BigInt/Date уже сериализованы
 * хелпером q(). Подходит для бэкапа/переноса небольших инсталляций.
 */
export async function exportDatabase(): Promise<DbDump> {
  const schemaList = SCHEMAS.map((s) => `'${s}'`).join(', ')
  const tableList = await q<{ schema: string; table: string }>(
    `SELECT table_schema AS schema, table_name AS "table"
     FROM information_schema.tables
     WHERE table_type = 'BASE TABLE' AND table_schema IN (${schemaList})
     ORDER BY table_schema, table_name`,
  )

  const tables: DbDump['tables'] = {}
  for (const t of tableList) {
    const key = `${t.schema}.${t.table}`
    const totalRows = await q<{ c: number }>(`SELECT count(*)::int AS c FROM "${t.schema}"."${t.table}"`)
    const total = totalRows[0]?.c ?? 0
    const rows = await q(`SELECT * FROM "${t.schema}"."${t.table}" LIMIT ${ROW_CAP}`)
    tables[key] = { total, truncated: total > rows.length, rows }
  }

  return { generatedAt: new Date().toISOString(), rowCap: ROW_CAP, tables }
}
