import { z } from 'zod'

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3000),
  HOST: z.string().default('0.0.0.0'),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),

  AUTH_SERVICE_URL: z.string().url().default('http://localhost:3001'),
  TOURNAMENT_SERVICE_URL: z.string().url().default('http://localhost:3002'),
  PAYMENT_SERVICE_URL: z.string().url().default('http://localhost:3003'),
  CLUB_SERVICE_URL: z.string().url().default('http://localhost:3004'),
  ADMIN_SERVICE_URL: z.string().url().default('http://localhost:3006'),

  /** Секрет для internal-вызовов admin-сервиса (аудит + алерты). */
  INTERNAL_SECRET: z.string().min(16).default('dev-internal-secret-change-in-prod-please'),

  REDIS_URL: z.string().default('redis://localhost:6379'),

  CORS_ORIGINS: z.string().default('http://localhost:5173,http://localhost:5174'),

  RATE_LIMIT_MAX: z.coerce.number().default(100),
  RATE_LIMIT_WINDOW: z.string().default('1 minute'),
})

const parsed = envSchema.safeParse(process.env)
if (!parsed.success) {
  console.error('❌ Invalid environment variables:')
  console.error(parsed.error.flatten().fieldErrors)
  process.exit(1)
}

export const env = parsed.data
export const corsOrigins = env.CORS_ORIGINS.split(',').map((s) => s.trim())
