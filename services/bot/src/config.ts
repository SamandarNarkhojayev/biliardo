import { z } from 'zod'

const DEV_INTERNAL_SECRET = 'dev-internal-secret-change-in-prod-please'
const isProd = process.env.NODE_ENV === 'production'

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3005),
  HOST: z.string().default('0.0.0.0'),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),

  /** Токен бота из @BotFather. БЕЗ него сервис не стартует. */
  TELEGRAM_BOT_TOKEN: z.string().min(20),
  /** Username бота — нужен для красивых ссылок. */
  TELEGRAM_BOT_USERNAME: z.preprocess((v) => (v === '' ? undefined : v), z.string().optional()),

  AUTH_SERVICE_URL: z.string().url().default('http://localhost:3001'),

  INTERNAL_SECRET: isProd
    ? z.string().min(32, 'INTERNAL_SECRET must be >=32 chars in production')
    : z.string().min(16).default(DEV_INTERNAL_SECRET),

  /** Публичный URL фронтенда — кладём его в кнопки сообщений. */
  PUBLIC_APP_URL: z.string().url().default('http://localhost:5173'),
})

const parsed = envSchema.safeParse(process.env)
if (!parsed.success) {
  console.error('❌ Invalid environment variables in bot service:')
  console.error(parsed.error.flatten().fieldErrors)
  process.exit(1)
}

export const env = parsed.data
