import { z } from 'zod'

const DEV_INTERNAL_SECRET = 'dev-internal-secret-change-in-prod-please'
const isProd = process.env.NODE_ENV === 'production'

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3006),
  HOST: z.string().default('0.0.0.0'),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),

  DATABASE_URL: z.string().url(),

  CORS_ORIGINS: z.string().default('http://localhost:5173,http://localhost:3000'),

  // URLs других сервисов — для health-пингов в админке.
  AUTH_SERVICE_URL: z.string().url().default('http://localhost:3001'),
  TOURNAMENT_SERVICE_URL: z.string().url().default('http://localhost:3002'),
  PAYMENT_SERVICE_URL: z.string().url().default('http://localhost:3003'),
  CLUB_SERVICE_URL: z.string().url().default('http://localhost:3004'),
  /** URL bot-сервиса для отправки Telegram-алертов. Если пусто — алерты только в журнал. */
  BOT_SERVICE_URL: z.preprocess((v) => (v === '' ? undefined : v), z.string().url().optional()),

  INTERNAL_SECRET: isProd
    ? z.string().min(32, 'INTERNAL_SECRET must be >=32 chars in production')
    : z.string().min(16).default(DEV_INTERNAL_SECRET),

  /** Лимит времени на один SQL-запрос из консоли (мс). */
  SQL_TIMEOUT_MS: z.coerce.number().int().min(1000).max(120_000).default(15_000),

  /**
   * Ролевая модель внутри админки: ID супер-админов (через запятую), которым доступны
   * опасные операции — SQL-запись, удаление, дамп БД, очистка аудита. Остальные ADMIN —
   * read-only. Пусто = все ADMIN являются супер-админами (обратная совместимость).
   */
  ADMIN_SUPERUSER_IDS: z.string().default(''),

  // ---- pg_dump бэкапы ----
  /** Куда складывать фоновые бэкапы (.sql.gz). */
  BACKUP_DIR: z.string().default('./backups'),
  /** Период бэкапа в часах. 0 = выключено (только on-demand через UI). */
  BACKUP_INTERVAL_HOURS: z.coerce.number().int().min(0).max(168).default(0),
  /** Сколько дней держать файлы бэкапов перед удалением. */
  BACKUP_RETENTION_DAYS: z.coerce.number().int().min(1).max(365).default(7),

  // ---- Ретеншн аудита ----
  /** Сколько дней хранить записи activity_log (старше — удаляются фоновым джобом). */
  ACTIVITY_RETENTION_DAYS: z.coerce.number().int().min(1).max(3650).default(30),
  /** Сколько дней хранить alert_log. */
  ALERT_RETENTION_DAYS: z.coerce.number().int().min(1).max(3650).default(90),

  // ---- Детектор аномалий ----
  /** Включить фоновую проверку всплесков ошибок/трафика. */
  ANOMALY_ENABLED: z.coerce.boolean().default(true),
  /** Порог 5xx за 5 минут, выше которого шлём алерт. */
  ANOMALY_ERROR_THRESHOLD: z.coerce.number().int().min(1).default(10),
  /** Во сколько раз трафик за 5 мин должен превысить предыдущие 5 мин, чтобы считать всплеском. */
  ANOMALY_TRAFFIC_FACTOR: z.coerce.number().min(1.5).default(4),
  /** Минимум запросов за окно, ниже которого всплеск не считаем (отсечь шум). */
  ANOMALY_TRAFFIC_MIN: z.coerce.number().int().min(1).default(50),
})

const parsed = envSchema.safeParse(process.env)
if (!parsed.success) {
  console.error('❌ Invalid environment variables in admin service:')
  console.error(parsed.error.flatten().fieldErrors)
  process.exit(1)
}

if (isProd && parsed.data.INTERNAL_SECRET === DEV_INTERNAL_SECRET) {
  console.error('❌ Refusing to start: INTERNAL_SECRET uses the dev default in production')
  process.exit(1)
}

export const env = parsed.data

export const corsOrigins = env.CORS_ORIGINS.split(',').map((s) => s.trim()).filter(Boolean)

/** Список ID супер-админов. Пустой = ограничения выключены (любой ADMIN — супер). */
export const superuserIds = env.ADMIN_SUPERUSER_IDS.split(',').map((s) => s.trim()).filter(Boolean)

/** Является ли пользователь супер-админом (доступ к опасным операциям). */
export function isSuperAdmin(userId: string): boolean {
  return superuserIds.length === 0 || superuserIds.includes(userId)
}
