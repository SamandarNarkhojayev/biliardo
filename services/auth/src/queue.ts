import { Queue, QueueEvents, Worker, type Job, type ConnectionOptions } from 'bullmq'
import { Redis } from 'ioredis'
import bcrypt from 'bcrypt'
import { prisma } from './prisma.js'
import { env } from './config.js'

/**
 * Очередь регистрации.
 *
 * Зачем: bcrypt с cost=12 даёт ~250–400 мс CPU на хеш. При наплыве регистраций
 * (флешмоб, рекламная кампания) синхронный путь в роутере деградирует p99 и
 * блокирует event-loop. Очередь:
 *   1) даёт быстрый ack юзеру (HTTP 202 + jobId);
 *   2) сериализует тяжёлый bcrypt через worker'ов с заданной concurrency;
 *   3) шарит нагрузку между нодами auth-сервиса (один Redis, N воркеров);
 *   4) переживает рестарт сервиса — job-ы лежат в Redis.
 *
 * Идемпотентность: jobId = phone — повторная попытка с тем же телефоном
 * возвращает существующий job (попадёт в "already exists" в BullMQ).
 */

const REGISTER_QUEUE = 'auth-register'

export interface RegisterJobData {
  name: string
  phone: string
  password: string
  accountType: 'PLAYER' | 'CLUB'
  clubName?: string | null
}

export interface RegisterJobResult {
  ok: true
  userId: string
}

export type RegisterJobError =
  | { ok: false; code: 'USER_EXISTS'; message: string }

let connection: Redis | null = null
let registerQueue: Queue<RegisterJobData, RegisterJobResult | RegisterJobError> | null = null
let registerEvents: QueueEvents | null = null
let registerWorker: Worker<RegisterJobData, RegisterJobResult | RegisterJobError> | null = null

function getConnection(): ConnectionOptions {
  if (!connection) {
    // BullMQ требует maxRetriesPerRequest: null для нормальной работы blocking-команд.
    connection = new Redis(env.REDIS_URL, { maxRetriesPerRequest: null })
  }
  // Каст: bullmq и ioredis в дереве могут резолвиться в разные минорные версии,
  // из-за чего их типы Redis формально не совпадают. Рантайм-контракт идентичен —
  // инстанс ioredis является валидным connection для bullmq.
  return connection as unknown as ConnectionOptions
}

export function getRegisterQueue(): Queue<RegisterJobData, RegisterJobResult | RegisterJobError> {
  if (!registerQueue) {
    registerQueue = new Queue<RegisterJobData, RegisterJobResult | RegisterJobError>(REGISTER_QUEUE, {
      connection: getConnection(),
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: 'exponential', delay: 1000 },
        removeOnComplete: { age: 3600, count: 1000 },
        removeOnFail: { age: 24 * 3600 },
      },
    })
  }
  return registerQueue
}

export function getRegisterEvents(): QueueEvents {
  if (!registerEvents) {
    registerEvents = new QueueEvents(REGISTER_QUEUE, { connection: getConnection() })
  }
  return registerEvents
}

const BCRYPT_ROUNDS = 12

export async function startRegisterWorker(concurrency = 8): Promise<void> {
  if (registerWorker) return
  registerWorker = new Worker<RegisterJobData, RegisterJobResult | RegisterJobError>(
    REGISTER_QUEUE,
    async (job: Job<RegisterJobData>) => {
      const { name, phone, password, accountType, clubName } = job.data

      // Идемпотентная проверка существования. Уникальный constraint в БД — последний
      // рубеж, но проверяем тут чтобы не платить bcrypt-cost напрасно.
      const exists = await prisma.user.findUnique({ where: { phone } })
      if (exists) {
        return { ok: false, code: 'USER_EXISTS', message: 'Аккаунт с этим номером уже существует' }
      }

      const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS)

      try {
        const user = await prisma.user.create({
          data: {
            phone,
            name: name.trim(),
            passwordHash,
            accountType,
            clubName: accountType === 'CLUB' ? clubName?.trim() ?? null : null,
          },
          select: { id: true },
        })
        return { ok: true, userId: user.id }
      } catch (err) {
        // race: между findUnique и create вклинился другой воркер
        const msg = (err as Error).message ?? ''
        if (msg.includes('Unique constraint')) {
          return { ok: false, code: 'USER_EXISTS', message: 'Аккаунт с этим номером уже существует' }
        }
        throw err
      }
    },
    {
      connection: getConnection(),
      concurrency,
    },
  )

  registerWorker.on('failed', (job, err) => {
    console.warn(`[register-worker] job ${job?.id} failed: ${err.message}`)
  })
}

export async function stopQueue(): Promise<void> {
  if (registerWorker) {
    await registerWorker.close()
    registerWorker = null
  }
  if (registerEvents) {
    await registerEvents.close()
    registerEvents = null
  }
  if (registerQueue) {
    await registerQueue.close()
    registerQueue = null
  }
  if (connection) {
    connection.disconnect()
    connection = null
  }
}
