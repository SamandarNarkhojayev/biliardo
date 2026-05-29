import Fastify from 'fastify'
import cors from '@fastify/cors'
import cookie from '@fastify/cookie'
import sensible from '@fastify/sensible'
import { env, corsOrigins } from './config.js'
import { initJwt } from './jwt.js'
import { registerRoutes } from './routes.js'
import { prisma } from './prisma.js'
import { startRegisterWorker, stopQueue } from './queue.js'

async function main(): Promise<void> {
  const app = Fastify({
    logger: {
      level: env.LOG_LEVEL,
      redact: {
        paths: [
          'req.headers.authorization',
          'req.headers.cookie',
          'req.headers["x-internal-secret"]',
          'req.headers["x-kaspi-signature"]',
          'req.body.password',
          'req.body.passwordHash',
          '*.password',
          '*.passwordHash',
        ],
        censor: '[REDACTED]',
      },
      transport: env.NODE_ENV === 'production' ? undefined : {
        target: 'pino-pretty',
        options: { colorize: true, translateTime: 'HH:MM:ss', ignore: 'pid,hostname' },
      },
    },
    trustProxy: true,
  })

  await initJwt()

  await app.register(sensible)
  await app.register(cookie)
  await app.register(cors, {
    origin: corsOrigins,
    credentials: true,
  })

  await registerRoutes(app)

  // Воркер регистрации в том же процессе. Для масштабирования: вынести в отдельный
  // деплоймент с тем же кодом и просто запустить startRegisterWorker (без app.listen).
  const REGISTER_CONCURRENCY = Number(process.env.REGISTER_CONCURRENCY ?? 8)
  await startRegisterWorker(REGISTER_CONCURRENCY)

  // Graceful shutdown
  const shutdown = async (sig: string) => {
    app.log.info({ sig }, 'shutting down…')
    await app.close()
    await stopQueue()
    await prisma.$disconnect()
    process.exit(0)
  }
  process.on('SIGINT', () => void shutdown('SIGINT'))
  process.on('SIGTERM', () => void shutdown('SIGTERM'))

  try {
    await app.listen({ port: env.PORT, host: env.HOST })
    app.log.info(`✅ auth service listening on :${env.PORT}`)
  } catch (err) {
    app.log.error(err)
    process.exit(1)
  }
}

void main()
