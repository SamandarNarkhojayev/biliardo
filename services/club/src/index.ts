import Fastify from 'fastify'
import cors from '@fastify/cors'
import sensible from '@fastify/sensible'
import { env, corsOrigins } from './config.js'
import { registerRoutes } from './routes.js'
import { registerWebSocket } from './ws-route.js'
import { warmupPublicKey } from './jwt-verifier.js'
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

  await registerWebSocket(app)
  await registerRoutes(app)

  await warmupPublicKey()

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
    app.log.info(`✅ club service listening on :${env.PORT}`)
  } catch (err) {
    app.log.error(err)
    process.exit(1)
  }
}

void main()
