import { spawn, type ChildProcessByStdio } from 'node:child_process'
import { createReadStream, createWriteStream, existsSync, mkdirSync, readdirSync, statSync, unlinkSync } from 'node:fs'
import path from 'node:path'
import type { Readable } from 'node:stream'
import { createGzip } from 'node:zlib'
import { env } from './config.js'

/** Схемы, которые включаем в дамп (все, что владеют сервисы). */
const DUMP_SCHEMAS = ['auth', 'tournament', 'payment', 'club', 'admin']

interface Logger {
  info: (o: unknown, m?: string) => void
  warn: (o: unknown, m?: string) => void
}

/** Аргументы pg_dump: чистая порядково восстановимая выгрузка нужных схем. */
function buildPgDumpArgs(): string[] {
  // Prisma-формат DATABASE_URL содержит ?schema=... — pg_dump его не понимает, режем.
  const dbUrl = env.DATABASE_URL
    .replace(/\?schema=[^&]*(&|$)/, '$1')
    .replace(/[?&]$/, '')
  return [
    '--dbname=' + dbUrl,
    '--clean', '--if-exists',         // DROP IF EXISTS перед CREATE — для идемпотентного restore
    '--no-owner', '--no-privileges',  // не привязываем дамп к конкретному пользователю
    '--encoding=UTF8',
    ...DUMP_SCHEMAS.flatMap((s) => ['-n', s]),
  ]
}

/** Запускает pg_dump процесс. Стримит SQL в stdout. */
export function spawnPgDump(): ChildProcessByStdio<null, Readable, Readable> {
  return spawn('pg_dump', buildPgDumpArgs(), { stdio: ['ignore', 'pipe', 'pipe'] })
}

export interface BackupFile {
  name: string
  sizeBytes: number
  createdAt: string
}

export function ensureBackupDir(): string {
  const dir = path.resolve(env.BACKUP_DIR)
  mkdirSync(dir, { recursive: true })
  return dir
}

export function listBackups(): BackupFile[] {
  const dir = ensureBackupDir()
  return readdirSync(dir)
    .filter((f) => f.endsWith('.sql') || f.endsWith('.sql.gz'))
    .map((f) => {
      const s = statSync(path.join(dir, f))
      return { name: f, sizeBytes: s.size, createdAt: s.mtime.toISOString() }
    })
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

/** Преобразует имя файла в безопасный полный путь, либо null если имя подозрительное. */
export function backupFilePath(name: string): string | null {
  if (!/^[\w.-]+\.(sql|sql\.gz)$/.test(name)) return null
  const dir = ensureBackupDir()
  const full = path.join(dir, name)
  // На всякий случай проверяем, что итоговый путь внутри dir (защита от ../).
  if (!full.startsWith(dir + path.sep) && full !== dir) return null
  return full
}

/** Открывает поток на чтение бэкап-файла. */
export function openBackupForRead(filePath: string): NodeJS.ReadableStream {
  return createReadStream(filePath)
}

/** Запускает pg_dump → gzip → файл. Возвращает результат или null при ошибке. */
export async function runBackupToFile(log: Logger): Promise<BackupFile | null> {
  const dir = ensureBackupDir()
  const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
  const name = `billiard-${stamp}.sql.gz`
  const filePath = path.join(dir, name)

  const child = spawnPgDump()
  const gzip = createGzip()
  const out = createWriteStream(filePath)

  let stderr = ''
  child.stderr.on('data', (chunk: Buffer) => { stderr += chunk.toString() })
  child.stdout.pipe(gzip).pipe(out)

  const result = await new Promise<BackupFile | null>((resolve) => {
    let done = false
    const finish = (ok: boolean) => {
      if (done) return
      done = true
      if (ok) {
        try {
          const s = statSync(filePath)
          log.info({ name, sizeBytes: s.size }, 'backup created')
          resolve({ name, sizeBytes: s.size, createdAt: s.mtime.toISOString() })
        } catch { resolve(null) }
      } else {
        try { if (existsSync(filePath)) unlinkSync(filePath) } catch { /* ignore */ }
        log.warn({ stderr: stderr.slice(0, 800) }, 'backup failed')
        resolve(null)
      }
    }
    child.on('error', (err) => { log.warn({ err: err.message }, 'pg_dump spawn failed'); finish(false) })
    child.on('close', (code) => { if (code !== 0) finish(false) })
    out.on('finish', () => finish(true))
    out.on('error', (err) => { log.warn({ err: err.message }, 'backup write failed'); finish(false) })
  })

  return result
}

/** Удаляет бэкапы старше retentionDays. Возвращает число удалённых файлов. */
export function pruneBackups(retentionDays: number, log: Logger): number {
  const dir = ensureBackupDir()
  const cutoff = Date.now() - retentionDays * 24 * 60 * 60 * 1000
  let removed = 0
  for (const f of listBackups()) {
    if (new Date(f.createdAt).getTime() < cutoff) {
      try { unlinkSync(path.join(dir, f.name)); removed++ } catch { /* ignore */ }
    }
  }
  if (removed > 0) log.info({ removed }, 'old backups pruned')
  return removed
}
