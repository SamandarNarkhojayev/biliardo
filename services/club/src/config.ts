import { z } from 'zod'

const DEV_INTERNAL_SECRET = 'dev-internal-secret-change-in-prod-please'
const isProd = process.env.NODE_ENV === 'production'

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3004),
  HOST: z.string().default('0.0.0.0'),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),

  DATABASE_URL: z.string().url(),

  CORS_ORIGINS: z.string().default('http://localhost:5173,http://localhost:3000'),

  /** URL auth-сервиса для internal RPC (выдача desktop-токена) и публичного ключа JWT. */
  AUTH_SERVICE_URL: z.string().url().default('http://localhost:3001'),

  INTERNAL_SECRET: isProd
    ? z.string().min(32, 'INTERNAL_SECRET must be >=32 chars in production')
    : z.string().min(16).default(DEV_INTERNAL_SECRET),

  ONLINE_THRESHOLD_SECONDS: z.coerce.number().default(60),
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

export const env = parsed.data
export const corsOrigins = env.CORS_ORIGINS.split(',').map((s) => s.trim()).filter(Boolean)
