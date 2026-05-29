import Fastify, { type FastifyError } from 'fastify'
import cors from '@fastify/cors'
import sensible from '@fastify/sensible'
import { env, corsOrigins } from './config.js'
import { registerRoutes } from './routes.js'
import { disconnectDb } from './db.js'
import { notifyAdmins } from './alerts.js'
import { startJobs } from './jobs.js'

async function main(): Promise<void> {
  const app = Fastify({
    logger: {
      level: env.LOG_LEVEL,
      redact: {
        paths: [
          'req.headers.authorization',
          'req.headers.cookie',
          'req.headers["x-internal-secret"]',
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

  await app.register(sensible)
  await app.register(cors, { origin: corsOrigins, credentials: true })

  // Необработанные ошибки самого admin-сервиса → Telegram-алерт (fire-and-forget).
  app.setErrorHandler((err: FastifyError, req, reply) => {
    const status = err.statusCode ?? 500
    req.log.error({ err }, 'request error')
    if (status >= 500) {
      void notifyAdmins({
        level: 'error',
        source: 'admin',
        title: `Ошибка admin-сервиса: ${req.method} ${req.url.split('?')[0]}`,
        message: err.message,
        context: { stack: err.stack?.split('\n').slice(0, 4).join('\n') },
      }, req.log).catch(() => undefined)
    }
    void reply.code(status).send({ code: err.code ?? 'INTERNAL', message: status >= 500 ? 'Внутренняя ошибка' : err.message })
  })

  await registerRoutes(app)

  let stopJobs: (() => void) | null = null

  const shutdown = async (sig: string): Promise<void> => {
    app.log.info({ sig }, 'shutting down…')
    stopJobs?.()
    await app.close()
    await disconnectDb()
    process.exit(0)
  }
  process.on('SIGINT', () => void shutdown('SIGINT'))
  process.on('SIGTERM', () => void shutdown('SIGTERM'))

  try {
    await app.listen({ port: env.PORT, host: env.HOST })
    app.log.info(`✅ admin service listening on :${env.PORT}`)
    stopJobs = startJobs(app.log)
  } catch (err) {
    app.log.error(err)
    process.exit(1)
  }
}

void main()
