import { z } from 'zod'

const DEV_INTERNAL_SECRET = 'dev-internal-secret-change-in-prod-please'
const isProd = process.env.NODE_ENV === 'production'

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3001),
  HOST: z.string().default('0.0.0.0'),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),

  DATABASE_URL: z.string().url(),

  REDIS_URL: z.string().default('redis://localhost:6379'),

  JWT_PRIVATE_KEY: z.string().optional(),
  JWT_PUBLIC_KEY: z.string().optional(),

  ACCESS_TOKEN_TTL: z.string().default('15m'),
  REFRESH_TOKEN_TTL_DAYS: z.coerce.number().default(30),

  COOKIE_DOMAIN: z.string().optional(),
  COOKIE_SECURE: z.coerce.boolean().optional(),

  CORS_ORIGINS: z.string().default('http://localhost:5173,http://localhost:5174,http://localhost:3000'),

  INTERNAL_SECRET: isProd
    ? z.string().min(32, 'INTERNAL_SECRET must be >=32 chars in production')
    : z.string().min(16).default(DEV_INTERNAL_SECRET),

  // ---- S3 (ps.kz / любой S3-совместимый бакет) ----
  // В dev можно не выставлять — upload-эндпоинт отдаст 503.
  // Пустые строки в .env (S3_PUBLIC_URL=) трактуем как undefined, иначе
  // .url() валидация zod падает на пустоте.
  S3_ENDPOINT: z.preprocess((v) => (v === '' ? undefined : v), z.string().url().optional()),
  S3_REGION: z.string().default('kz-1'),
  S3_ACCESS_KEY_ID: z.preprocess((v) => (v === '' ? undefined : v), z.string().optional()),
  S3_SECRET_ACCESS_KEY: z.preprocess((v) => (v === '' ? undefined : v), z.string().optional()),
  S3_BUCKET_MEDIA: z.string().default('biliardo-media'),
  // Префикс URL для отдачи готовых файлов. Если бакет публичный — это
  // обычно `${S3_ENDPOINT}/${S3_BUCKET_MEDIA}`. Если используется CDN — указать его.
  S3_PUBLIC_URL: z.preprocess((v) => (v === '' ? undefined : v), z.string().url().optional()),

  // ---- Telegram ----
  // Username бота (без @) — используется для генерации deep-link t.me/<bot>?start=<token>.
  // Если не задан — deep-link не отдаём, UI покажет только токен с инструкцией.
  TELEGRAM_BOT_USERNAME: z.preprocess((v) => (v === '' ? undefined : v), z.string().optional()),
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

export const env = {
  ...parsed.data,
  COOKIE_SECURE: parsed.data.COOKIE_SECURE ?? isProd,
}

export const corsOrigins = env.CORS_ORIGINS.split(',').map((s) => s.trim()).filter(Boolean)
