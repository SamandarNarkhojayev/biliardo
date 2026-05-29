import Fastify from 'fastify'
import cors from '@fastify/cors'
import sensible from '@fastify/sensible'
import { registerRoutes } from './routes.js'
import { disconnectDb } from './db.js'
import { warmupPublicKey } from './auth.js'
import { startReminderScheduler, stopReminderScheduler } from './scheduler.js'
import { env } from './config.js'

async function main(): Promise<void> {
  const corsOrigins = env.CORS_ORIGINS.split(',').map((s) => s.trim()).filter(Boolean)

  const app = Fastify({
    logger: {
      level: env.LOG_LEVEL,
      redact: {
        paths: ['req.headers.authorization', 'req.headers.cookie', 'req.headers["x-internal-secret"]'],
        censor: '[REDACTED]',
      },
      transport: env.NODE_ENV === 'production' ? undefined : {
        target: 'pino-pretty',
        options: { colorize: true, translateTime: 'HH:MM:ss', ignore: 'pid,hostname' },
      },
    },
    trustProxy: true,
  })

  await app.register(sensible)
  await app.register(cors, { origin: corsOrigins, credentials: true })

  await registerRoutes(app)
  await warmupPublicKey()

  // Напоминания «турнир через 2 часа» — фоновый планировщик. Без бота (BOT_SERVICE_URL)
  // тикает вхолостую: notifyBot тихо выходит, но startReminderSentAt всё равно проставится.
  startReminderScheduler(app.log)

  const shutdown = async (sig: string) => {
    app.log.info({ sig }, 'shutting down…')
    stopReminderScheduler()
    await app.close()
    await disconnectDb()
    process.exit(0)
  }
  process.on('SIGINT', () => void shutdown('SIGINT'))
  process.on('SIGTERM', () => void shutdown('SIGTERM'))

  try {
    await app.listen({ port: env.PORT, host: env.HOST })
    app.log.info(`✅ tournament service listening on :${env.PORT}`)
  } catch (err) {
    app.log.error(err)
    process.exit(1)
  }
}

void main()
