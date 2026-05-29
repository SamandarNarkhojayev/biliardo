import { z } from 'zod'

const DEV_INTERNAL_SECRET = 'dev-internal-secret-change-in-prod-please'
const isProd = process.env.NODE_ENV === 'production'

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3002),
  HOST: z.string().default('0.0.0.0'),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),

  DATABASE_URL: z.string().url(),

  CORS_ORIGINS: z.string().default('http://localhost:5173,http://localhost:3000'),

  /** Auth-сервис — для проверки JWT по публичному ключу. */
  AUTH_SERVICE_URL: z.string().url().default('http://localhost:3001'),

  /** Bot-сервис — internal-эндпоинт /notify. Опционален: если не задан, уведомления не идут. */
  BOT_SERVICE_URL: z.string().url().optional(),

  INTERNAL_SECRET: isProd
    ? z.string().min(32, 'INTERNAL_SECRET must be >=32 chars in production')
    : z.string().min(16).default(DEV_INTERNAL_SECRET),
})

const parsed = envSchema.safeParse(process.env)
if (!parsed.success) {
  console.error('❌ Invalid environment variables in tournament service:')
  console.error(parsed.error.flatten().fieldErrors)
  process.exit(1)
}

export const env = parsed.data
