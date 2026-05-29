import Fastify from 'fastify'
import cors from '@fastify/cors'
import sensible from '@fastify/sensible'
import { env } from './config.js'
import { createBot } from './bot.js'
import { registerRoutes } from './routes.js'

async function main(): Promise<void> {
  const app = Fastify({
    logger: {
      level: env.LOG_LEVEL,
      redact: {
        paths: ['req.headers.authorization', 'req.headers["x-internal-secret"]'],
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
  await app.register(cors, { origin: false })

  const bot = createBot()
  await registerRoutes(app, bot)

  // Запускаем bot в polling-режиме (без webhook). Подходит для dev и небольшого prod.
  void bot.launch().catch((err) => app.log.error({ err }, 'telegram bot launch failed'))

  const shutdown = async (sig: string) => {
    app.log.info({ sig }, 'shutting down…')
    try { bot.stop(sig) } catch { /* ignore */ }
    await app.close()
    process.exit(0)
  }
  process.on('SIGINT', () => void shutdown('SIGINT'))
  process.on('SIGTERM', () => void shutdown('SIGTERM'))

  try {
    await app.listen({ port: env.PORT, host: env.HOST })
    app.log.info(`✅ bot service listening on :${env.PORT}`)
  } catch (err) {
    app.log.error(err)
    process.exit(1)
  }
}

void main()
