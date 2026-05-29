import { z } from 'zod'

const DEV_INTERNAL_SECRET = 'dev-internal-secret-change-in-prod-please'
const isProd = process.env.NODE_ENV === 'production'

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3003),
  HOST: z.string().default('0.0.0.0'),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),

  DATABASE_URL: z.string().url(),

  // CORS — обычно payment-сервис вызывается через gateway, но webhook от Kaspi приходит напрямую
  CORS_ORIGINS: z.string().default('http://localhost:5173,http://localhost:3000'),

  // ---- Kaspi ----
  // stub:   фейковый платёжный поток (для dev / e2e)
  // live:   официальная Kaspi QR Merchant API (требует merchant credentials)
  // bridge: «надстройка» над своим Kaspi Gold — оплата переводом, детект по
  //         уведомлению с твоего телефона (см. kaspi-bridge.ts). Без онбординга.
  KASPI_MODE: z.enum(['stub', 'live', 'bridge']).default('stub'),
  /** Базовый домен API, напр. https://mtokentest.kaspi.kz (test) или https://mtoken.kaspi.kz (prod). */
  KASPI_BASE_DOMAIN: z.string().url().optional(),
  /** Схема авторизации: r1 (EASY), r2 (MEDIUM), r3 (STRONG, mTLS). По умолчанию STRONG. */
  KASPI_SCHEME: z.enum(['r1', 'r2', 'r3']).default('r3'),
  /** Ключ мерчанта (заголовок Api-Key). */
  KASPI_API_KEY: z.string().optional(),
  /** Токен устройства (кассы), выдаётся при регистрации устройства на торговой точке. */
  KASPI_DEVICE_TOKEN: z.string().optional(),
  /** БИН организации — обязателен для STRONG (r3). */
  KASPI_ORGANIZATION_BIN: z.string().optional(),
  // mTLS-сертификаты для STRONG (r3):
  KASPI_CA_PATH: z.string().optional(),
  KASPI_CERT_PATH: z.string().optional(),
  KASPI_KEY_PATH: z.string().optional(),
  KASPI_KEY_PASS: z.string().optional(),
  /** Отключает проверку SSL (только для sandbox). */
  KASPI_TEST_MODE: z.coerce.boolean().default(false),
  /** Опциональный секрет для HMAC-подписи callback'а от Kaspi (если включён в договоре). */
  KASPI_WEBHOOK_SECRET: z.string().optional(),

  // ---- Kaspi BRIDGE (надстройка над своим Kaspi Gold) ----
  /** Секрет для эндпоинта приёма уведомлений с телефона (заголовок x-bridge-secret). */
  KASPI_BRIDGE_SECRET: z.string().optional(),
  /** Номер Kaspi Gold, на который клиент делает перевод (для инструкции на чекауте). */
  KASPI_GOLD_NUMBER: z.string().optional(),
  /** Имя получателя (как видно в Kaspi) — для подтверждения клиенту. */
  KASPI_GOLD_NAME: z.string().optional(),
  /**
   * Разброс уникальных «хвостов» суммы (в тенге) для различения параллельных
   * платежей: к базовой цене прибавляется уникальное смещение 0..N-1.
   */
  KASPI_BRIDGE_AMOUNT_SPREAD: z.coerce.number().int().min(1).max(1000).default(100),

  /** Куда Kaspi редиректит пользователя после оплаты (success URL). */
  PUBLIC_APP_URL: z.string().url().default('http://localhost:5173'),

  /** TTL платежа: за сколько минут истечёт PENDING-платёж, если не оплачен. */
  PAYMENT_EXPIRY_MINUTES: z.coerce.number().default(30),

  /** URL auth-сервиса для internal RPC (проверка автоматизации клуба). */
  AUTH_SERVICE_URL: z.string().url().default('http://localhost:3001'),

  INTERNAL_SECRET: isProd
    ? z.string().min(32, 'INTERNAL_SECRET must be >=32 chars in production')
    : z.string().min(16).default(DEV_INTERNAL_SECRET),
})

const parsed = envSchema.safeParse(process.env)
if (!parsed.success) {
  console.error('❌ Invalid environment variables:')
  console.error(parsed.error.flatten().fieldErrors)
  process.exit(1)
}

if (isProd && parsed.data.INTERNAL_SECRET === DEV_INTERNAL_SECRET) {
  console.error('❌ Refusing to start: INTERNAL_SECRET uses the dev default in production')
  process.exit(1)
}

if (isProd && parsed.data.KASPI_MODE === 'stub') {
  console.error('❌ Refusing to start: KASPI_MODE must be "live" or "bridge" in production')
  process.exit(1)
}

export const env = parsed.data

export const corsOrigins = env.CORS_ORIGINS.split(',').map((s) => s.trim()).filter(Boolean)

if (env.KASPI_MODE === 'live') {
  const missing: string[] = []
  if (!env.KASPI_BASE_DOMAIN) missing.push('KASPI_BASE_DOMAIN')
  if (!env.KASPI_API_KEY) missing.push('KASPI_API_KEY')
  if (!env.KASPI_DEVICE_TOKEN) missing.push('KASPI_DEVICE_TOKEN')
  // STRONG (r3) — взаимный TLS + БИН организации.
  if (env.KASPI_SCHEME === 'r3') {
    if (!env.KASPI_ORGANIZATION_BIN) missing.push('KASPI_ORGANIZATION_BIN')
    if (!env.KASPI_CERT_PATH) missing.push('KASPI_CERT_PATH')
    if (!env.KASPI_KEY_PATH) missing.push('KASPI_KEY_PATH')
  }
  if (missing.length > 0) {
    console.error(`❌ KASPI_MODE=live, but missing: ${missing.join(', ')}`)
    process.exit(1)
  }
}

if (env.KASPI_MODE === 'bridge') {
  const missing: string[] = []
  if (!env.KASPI_BRIDGE_SECRET) missing.push('KASPI_BRIDGE_SECRET')
  if (!env.KASPI_GOLD_NUMBER) missing.push('KASPI_GOLD_NUMBER')
  if (missing.length > 0) {
    console.error(`❌ KASPI_MODE=bridge, but missing: ${missing.join(', ')}`)
    process.exit(1)
  }
}
