import Fastify from 'fastify'
import cors from '@fastify/cors'
import sensible from '@fastify/sensible'
import { env, corsOrigins } from './config.js'
import { registerRoutes } from './routes.js'
import { disconnectDb } from './db.js'

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
          '*.apiKey',
          '*.webhookSecret',
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

  // Сохраняем сырое тело запроса для webhook'ов: подпись считается по байтам.
  app.addContentTypeParser('application/json', { parseAs: 'string' }, (req, body, done) => {
    ;(req as typeof req & { rawBody?: string }).rawBody = body as string
    try {
      const json = (body as string).length === 0 ? null : JSON.parse(body as string)
      done(null, json)
    } catch (err) {
      done(err as Error, undefined)
    }
  })

  await app.register(sensible)
  await app.register(cors, { origin: corsOrigins, credentials: true })

  await registerRoutes(app)

  const shutdown = async (sig: string): Promise<void> => {
    app.log.info({ sig }, 'shutting down…')
    await app.close()
    await disconnectDb()
    process.exit(0)
  }
  process.on('SIGINT', () => void shutdown('SIGINT'))
  process.on('SIGTERM', () => void shutdown('SIGTERM'))

  try {
    await app.listen({ port: env.PORT, host: env.HOST })
    app.log.info(`✅ payment service listening on :${env.PORT} (KASPI_MODE=${env.KASPI_MODE})`)
  } catch (err) {
    app.log.error(err)
    process.exit(1)
  }
}

void main()
