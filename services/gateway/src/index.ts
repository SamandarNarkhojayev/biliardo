import Fastify from 'fastify'
import cors from '@fastify/cors'
import sensible from '@fastify/sensible'
import rateLimit from '@fastify/rate-limit'
import httpProxy from '@fastify/http-proxy'
import { Redis } from 'ioredis'
import { env, corsOrigins } from './config.js'
import { verifyToken, warmupPublicKey } from './jwt-verifier.js'

/**
 * Маршруты, которые НЕ требуют JWT (auth-эндпоинты, health, public-key).
 * Всё остальное — требует валидный access-токен в Authorization header.
 */
const PUBLIC_PATHS = [
  /^\/api\/auth\/(register|login|refresh|public-key)$/,
  /^\/api\/health$/,
  /^\/api\/tournaments(\/[^/]+)?$/, // просмотр публичных турниров — без auth
  /^\/api\/plans$/,                  // каталог тарифов открыт всем
  /^\/api\/payments\/webhook\/[a-z]+$/, // webhook'и от платёжных провайдеров (Kaspi и т.п.)
  /^\/api\/club\/auth$/,             // desktop логин — phone+password, без JWT
]

/** Internal-эндпоинты не должны проксироваться через gateway вообще. */
const FORBIDDEN_PUBLIC_PREFIXES = [
  '/api/auth/internal/',
]

function isPublicPath(path: string): boolean {
  return PUBLIC_PATHS.some((re) => re.test(path))
}

interface ActivityPayload {
  userId: string | null
  userName: string | null
  role: string | null
  method: string
  path: string
  statusCode: number
  ip: string
  userAgent: string | null
  durationMs: number
}

/** Fire-and-forget: отправляет запись аудита в admin-сервис. Ошибки глушим. */
async function postActivity(payload: ActivityPayload): Promise<void> {
  try {
    await fetch(`${env.ADMIN_SERVICE_URL.replace(/\/$/, '')}/internal/activity`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-internal-secret': env.INTERNAL_SECRET },
      body: JSON.stringify(payload),
    })
  } catch { /* admin offline — аудит не критичен */ }
}

interface AlertPayload {
  level: 'info' | 'warning' | 'error' | 'critical'
  source: string
  title: string
  message: string
  context?: unknown
}

/** Fire-and-forget: отправляет алерт в admin-сервис (тот разошлёт в Telegram). */
async function postAlert(payload: AlertPayload): Promise<void> {
  try {
    await fetch(`${env.ADMIN_SERVICE_URL.replace(/\/$/, '')}/internal/alert`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-internal-secret': env.INTERNAL_SECRET },
      body: JSON.stringify(payload),
    })
  } catch { /* admin offline */ }
}

// IP-баны. Source of truth — admin.ip_ban; здесь in-memory копия, синкаем раз в минуту.
// Значение Map: null = бессрочно, number = epoch ms когда бан истекает.
// Fail-open: если admin не отвечает — никого не банить (лучше пропустить плохого, чем заблокировать всех).
const ipBans = new Map<string, number | null>()
const IP_BAN_SYNC_INTERVAL_MS = 60_000

async function refreshIpBans(log: { warn: (...a: unknown[]) => void }): Promise<void> {
  try {
    const res = await fetch(`${env.ADMIN_SERVICE_URL.replace(/\/$/, '')}/internal/ipbans`, {
      headers: { 'x-internal-secret': env.INTERNAL_SECRET },
    })
    if (!res.ok) {
      log.warn({ status: res.status }, 'ipban sync: non-200')
      return
    }
    const data = (await res.json()) as { bans: Array<{ ip: string; until: string | null }> }
    const next = new Map<string, number | null>()
    for (const b of data.bans) {
      next.set(b.ip, b.until ? Date.parse(b.until) : null)
    }
    ipBans.clear()
    for (const [ip, until] of next) ipBans.set(ip, until)
  } catch (err) {
    log.warn({ err }, 'ipban sync failed (fail-open)')
  }
}

function isBanned(ip: string): boolean {
  const v = ipBans.get(ip)
  if (v === undefined) return false
  if (v === null) return true
  return v > Date.now()
}

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
        ],
        censor: '[REDACTED]',
      },
      transport: env.NODE_ENV === 'production' ? undefined : {
        target: 'pino-pretty',
        options: { colorize: true, translateTime: 'HH:MM:ss', ignore: 'pid,hostname' },
      },
    },
    trustProxy: true,
    disableRequestLogging: env.NODE_ENV === 'production',
  })

  await app.register(sensible)
  await app.register(cors, {
    origin: corsOrigins,
    credentials: true,
  })

  // Rate limit через Redis (распределённый: scale-out gateway-нод не сбрасывает счётчики).
  const redis = new Redis(env.REDIS_URL, { maxRetriesPerRequest: 3 })

  // Узкие лимиты для горячих/чувствительных эндпоинтов в одном окне (1 минута):
  //  /api/auth/login     — bruteforce паролей: 5/мин/ip
  //  /api/auth/register  — спам регистраций: 5/мин/ip (плюс nginx-уровень даёт 2r/s)
  //  /api/auth/refresh   — refresh-loop: 30/мин/ip
  //  /api/club/auth      — десктоп-логин клуба: 10/мин/ip
  //  /api/payments/*     — создание платежа: 20/мин/ip
  // Всё остальное — глобальный RATE_LIMIT_MAX.
  function maxForRequest(req: { url?: string; method?: string }): number {
    const url = (req.url ?? '').split('?')[0]
    if (req.method !== 'POST') return env.RATE_LIMIT_MAX
    if (url === '/api/auth/login') return 5
    if (url === '/api/auth/register') return 5
    if (url === '/api/auth/refresh') return 30
    if (url === '/api/club/auth') return 10
    if (url.startsWith('/api/payments') && !url.startsWith('/api/payments/webhook/')) return 20
    return env.RATE_LIMIT_MAX
  }
  await app.register(rateLimit, {
    global: true,
    max: maxForRequest as never,
    timeWindow: env.RATE_LIMIT_WINDOW,
    redis,
    keyGenerator: (req) => {
      const url = (req.url ?? '').split('?')[0]
      return `${req.ip}|${req.method}|${url}`
    },
    skipOnError: false,
  })

  // IP-бан (первая линия): забаненный IP получает 403 ещё до санитарии заголовков
  // и до JWT-проверки. Бан-лист пуллится из admin раз в минуту (см. refreshIpBans).
  app.addHook('onRequest', async (req, reply) => {
    if (req.url === '/api/health') return // health-probe оставляем доступным
    if (isBanned(req.ip)) {
      return reply.code(403).send({ code: 'IP_BANNED', message: 'Доступ заблокирован' })
    }
  })

  // Спуфинг x-user-* / x-internal-secret снаружи запрещён всегда — иначе клиент
  // мог бы прислать свои заголовки и downstream-сервис принял бы их за auth.
  // Здесь же снепшотим IP в req.headers, чтобы onResponse мог его прочитать даже
  // после закрытия сокета (иначе `req.ip` упадёт в proxy-addr с null remoteAddress).
  app.addHook('onRequest', async (req) => {
    delete req.headers['x-user-id']
    delete req.headers['x-user-role']
    delete req.headers['x-user-name']
    delete req.headers['x-user-account-type']
    delete req.headers['x-internal-secret']
    try {
      (req as unknown as { _capturedIp?: string })._capturedIp = req.ip
    } catch {
      (req as unknown as { _capturedIp?: string })._capturedIp = '0.0.0.0'
    }
  })

  // Auth-middleware: проверяет JWT, прокидывает x-user-* в downstream.
  app.addHook('preHandler', async (req, reply) => {
    const path = req.url.split('?')[0]
    if (FORBIDDEN_PUBLIC_PREFIXES.some((p) => path.startsWith(p))) {
      return reply.code(404).send({ code: 'NOT_FOUND', message: 'Not found' })
    }
    if (isPublicPath(path)) return
    const auth = req.headers.authorization
    if (!auth?.startsWith('Bearer ')) {
      return reply.code(401).send({ code: 'UNAUTHORIZED', message: 'Требуется авторизация' })
    }
    const user = await verifyToken(auth.slice(7))
    if (!user) {
      return reply.code(401).send({ code: 'INVALID_TOKEN', message: 'Невалидный токен' })
    }
    // Супер-админка: /api/admin/* доступна только роли ADMIN.
    if (path.startsWith('/api/admin') && user.role !== 'ADMIN') {
      return reply.code(403).send({ code: 'FORBIDDEN', message: 'Только для администратора' })
    }
    req.headers['x-user-id'] = user.id
    req.headers['x-user-role'] = user.role
    req.headers['x-user-name'] = encodeURIComponent(user.name)
    req.headers['x-user-account-type'] = user.accountType
  })

  // Аудит активности: каждый проксированный запрос пишем в admin-сервис
  // (fire-and-forget). 5xx-ответы дополнительно шлём как алерт.
  // ВАЖНО: НЕ читаем req.ip здесь — сокет уже может быть закрыт. Берём _capturedIp,
  // снепшот сделан в onRequest. Иначе proxy-addr падает на null remoteAddress.
  app.addHook('onResponse', async (req, reply) => {
    const path = req.url.split('?')[0]
    if (path === '/api/health' || !path.startsWith('/api/')) return
    const nameHeader = req.headers['x-user-name']
    const ip = (req as unknown as { _capturedIp?: string })._capturedIp ?? '0.0.0.0'
    void postActivity({
      userId: (req.headers['x-user-id'] as string | undefined) ?? null,
      userName: typeof nameHeader === 'string' ? decodeURIComponent(nameHeader) : null,
      role: (req.headers['x-user-role'] as string | undefined) ?? null,
      method: req.method,
      path,
      statusCode: reply.statusCode,
      ip,
      userAgent: (req.headers['user-agent'] as string | undefined) ?? null,
      durationMs: Math.round(reply.elapsedTime),
    })
    if (reply.statusCode >= 500) {
      void postAlert({
        level: 'error',
        source: 'gateway',
        title: `5xx: ${req.method} ${path}`,
        message: `Ответ ${reply.statusCode} за ${Math.round(reply.elapsedTime)}мс`,
        context: { ip, userId: req.headers['x-user-id'] ?? null },
      })
    }
  })

  app.get('/api/health', async () => ({
    status: 'ok',
    service: 'gateway',
    time: new Date().toISOString(),
  }))

  // ---- Прокси на сервисы ----
  await app.register(httpProxy, {
    upstream: env.AUTH_SERVICE_URL,
    prefix: '/api/auth',
    rewritePrefix: '/auth',
    http2: false,
  })

  await app.register(httpProxy, {
    upstream: env.TOURNAMENT_SERVICE_URL,
    prefix: '/api/tournaments',
    rewritePrefix: '/tournaments',
    http2: false,
  })

  await app.register(httpProxy, {
    upstream: env.TOURNAMENT_SERVICE_URL,
    prefix: '/api/organizer/tournaments',
    rewritePrefix: '/organizer/tournaments',
    http2: false,
  })

  await app.register(httpProxy, {
    upstream: env.PAYMENT_SERVICE_URL,
    prefix: '/api/plans',
    rewritePrefix: '/plans',
    http2: false,
  })

  await app.register(httpProxy, {
    upstream: env.PAYMENT_SERVICE_URL,
    prefix: '/api/payments',
    rewritePrefix: '/payments',
    http2: false,
  })

  await app.register(httpProxy, {
    upstream: env.PAYMENT_SERVICE_URL,
    prefix: '/api/subscriptions',
    rewritePrefix: '/subscriptions',
    http2: false,
  })

  // Desktop POST'ы /club/sync и /club/session приходят с long-lived JWT, который
  // gateway НЕ верифицирует (другой класс токена). Browser GET'ы /club/status и
  // /club/sessions* идут через стандартный JWT (gateway проверил выше). Все они
  // упираются в один upstream — club-сервис сам разберётся, кто пришёл.
  await app.register(httpProxy, {
    upstream: env.CLUB_SERVICE_URL,
    prefix: '/api/club',
    rewritePrefix: '/club',
    http2: false,
  })

  // Супер-админка. preHandler уже отсёк не-ADMIN (403).
  await app.register(httpProxy, {
    upstream: env.ADMIN_SERVICE_URL,
    prefix: '/api/admin',
    rewritePrefix: '/admin',
    http2: false,
  })

  await warmupPublicKey()

  // Первая загрузка IP-банов + фоновый ресинк раз в минуту.
  await refreshIpBans(app.log)
  const ipBanTimer = setInterval(() => void refreshIpBans(app.log), IP_BAN_SYNC_INTERVAL_MS)

  const shutdown = async (sig: string) => {
    app.log.info({ sig }, 'shutting down…')
    clearInterval(ipBanTimer)
    await app.close()
    redis.disconnect()
    process.exit(0)
  }
  process.on('SIGINT', () => void shutdown('SIGINT'))
  process.on('SIGTERM', () => void shutdown('SIGTERM'))

  try {
    await app.listen({ port: env.PORT, host: env.HOST })
    app.log.info(`✅ gateway listening on :${env.PORT}`)
  } catch (err) {
    app.log.error(err)
    process.exit(1)
  }
}

void main()
