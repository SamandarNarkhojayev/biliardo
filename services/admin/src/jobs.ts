import { prisma } from './db.js'
import { env } from './config.js'
import { q } from './sql.js'
import { notifyAdmins } from './alerts.js'
import { pingAll } from './pings.js'
import { runBackupToFile, pruneBackups } from './backup.js'

interface Logger {
  info: (o: unknown, m?: string) => void
  warn: (o: unknown, m?: string) => void
}

const HOUR_MS = 60 * 60 * 1000
const MINUTE_MS = 60 * 1000
const ALERT_COOLDOWN_MS = 15 * MINUTE_MS

let lastErrorAlertAt = 0
let lastTrafficAlertAt = 0

/** Удаляет старые записи аудита и алертов согласно ретеншну. */
async function runRetention(log: Logger): Promise<void> {
  try {
    const activity = await prisma.activityLog.deleteMany({
      where: { createdAt: { lt: new Date(Date.now() - env.ACTIVITY_RETENTION_DAYS * 24 * HOUR_MS) } },
    })
    const alerts = await prisma.alertLog.deleteMany({
      where: { createdAt: { lt: new Date(Date.now() - env.ALERT_RETENTION_DAYS * 24 * HOUR_MS) } },
    })
    // Сэмплы здоровья растут быстро (раз в минуту) — держим 7 дней.
    const samples = await prisma.serviceHealthSample.deleteMany({
      where: { createdAt: { lt: new Date(Date.now() - 7 * 24 * HOUR_MS) } },
    })
    if (activity.count > 0 || alerts.count > 0 || samples.count > 0) {
      log.info({ activity: activity.count, alerts: alerts.count, samples: samples.count }, 'retention purge')
    }
  } catch (err) {
    log.warn({ err: (err as Error).message }, 'retention job failed')
  }
}

/** Делает фоновый бэкап БД через pg_dump и удаляет файлы вне ретеншна. */
async function runScheduledBackup(log: Logger): Promise<void> {
  if (env.BACKUP_INTERVAL_HOURS <= 0) return
  const result = await runBackupToFile(log)
  if (result) {
    pruneBackups(env.BACKUP_RETENTION_DAYS, log)
  } else {
    await notifyAdmins({
      level: 'error', source: 'backup',
      title: 'Фоновый бэкап БД упал',
      message: 'pg_dump вернул не-нулевой код или поток оборвался. Смотри логи admin-сервиса.',
    }, log).catch(() => undefined)
  }
}

/** Пингует сервисы и пишет сэмплы латентности/аптайма в admin.service_health_sample. */
async function recordHealth(log: Logger): Promise<void> {
  try {
    const samples = await pingAll()
    await prisma.serviceHealthSample.createMany({
      data: samples.map((s) => ({ service: s.name, ok: s.ok, status: s.status, latencyMs: s.latencyMs })),
    })
  } catch (err) {
    log.warn({ err: (err as Error).message }, 'health sampling failed')
  }
}

/** Проверяет всплески ошибок (5xx) и трафика за последние 5 минут. */
async function runAnomalyCheck(log: Logger): Promise<void> {
  try {
    const rows = await q<{ errors5: number; cur5: number; prev5: number }>(
      `SELECT
        count(*) FILTER (WHERE "statusCode" >= 500 AND "createdAt" > now() - interval '5 minutes')::int AS errors5,
        count(*) FILTER (WHERE "createdAt" > now() - interval '5 minutes')::int AS cur5,
        count(*) FILTER (WHERE "createdAt" <= now() - interval '5 minutes' AND "createdAt" > now() - interval '10 minutes')::int AS prev5
      FROM admin.activity_log WHERE "createdAt" > now() - interval '10 minutes'`,
    )
    const m = rows[0] ?? { errors5: 0, cur5: 0, prev5: 0 }
    const now = Date.now()

    if (m.errors5 >= env.ANOMALY_ERROR_THRESHOLD && now - lastErrorAlertAt > ALERT_COOLDOWN_MS) {
      lastErrorAlertAt = now
      await notifyAdmins({
        level: 'critical',
        source: 'anomaly',
        title: `Всплеск ошибок: ${m.errors5} × 5xx за 5 минут`,
        message: `Порог ${env.ANOMALY_ERROR_THRESHOLD}. Проверь сервисы и логи.`,
        context: m,
      }, log)
    }

    if (
      m.cur5 >= env.ANOMALY_TRAFFIC_MIN &&
      m.cur5 > m.prev5 * env.ANOMALY_TRAFFIC_FACTOR &&
      now - lastTrafficAlertAt > ALERT_COOLDOWN_MS
    ) {
      lastTrafficAlertAt = now
      await notifyAdmins({
        level: 'warning',
        source: 'anomaly',
        title: `Всплеск трафика: ${m.cur5} запросов за 5 минут`,
        message: `Предыдущие 5 минут: ${m.prev5}. Рост ×${(m.cur5 / Math.max(m.prev5, 1)).toFixed(1)}.`,
        context: m,
      }, log)
    }
  } catch (err) {
    log.warn({ err: (err as Error).message }, 'anomaly job failed')
  }
}

/** Запускает фоновые джобы. Возвращает функцию остановки. */
export function startJobs(log: Logger): () => void {
  // Ретеншн: сразу при старте (с задержкой) и далее раз в час.
  const retentionKick = setTimeout(() => void runRetention(log), 30 * 1000)
  const retentionTimer = setInterval(() => void runRetention(log), HOUR_MS)

  const anomalyTimer = env.ANOMALY_ENABLED
    ? setInterval(() => void runAnomalyCheck(log), MINUTE_MS)
    : null

  // Сэмплы здоровья сервисов: сразу при старте и далее раз в минуту.
  const healthKick = setTimeout(() => void recordHealth(log), 5 * 1000)
  const healthTimer = setInterval(() => void recordHealth(log), MINUTE_MS)

  // Фоновый бэкап БД — если включён, интервал в часах.
  const backupTimer = env.BACKUP_INTERVAL_HOURS > 0
    ? setInterval(() => void runScheduledBackup(log), env.BACKUP_INTERVAL_HOURS * HOUR_MS)
    : null

  log.info({
    anomaly: env.ANOMALY_ENABLED,
    retentionDays: env.ACTIVITY_RETENTION_DAYS,
    backupIntervalHours: env.BACKUP_INTERVAL_HOURS,
  }, 'admin jobs started')

  return () => {
    clearTimeout(retentionKick)
    clearInterval(retentionTimer)
    if (anomalyTimer) clearInterval(anomalyTimer)
    clearTimeout(healthKick)
    clearInterval(healthTimer)
    if (backupTimer) clearInterval(backupTimer)
  }
}
