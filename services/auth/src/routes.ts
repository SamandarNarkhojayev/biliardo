import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import bcrypt from 'bcrypt'
import { timingSafeEqual, randomBytes } from 'node:crypto'
import {
  registerInputSchema,
  loginInputSchema,
  updateProfileInputSchema,
  setApiPasswordInputSchema,
  clubAuthInputSchema,
  phoneSchema,
  type LoginResponse,
  type User,
  type ClubAuthResponse,
} from '@billiard/shared'
import { z } from 'zod'
import { prisma } from './prisma.js'
import { signAccessToken, signDesktopToken, verifyAccessToken, getPublicKeyPem } from './jwt.js'
import {
  issueRefreshToken,
  rotateRefreshToken,
  revokeRefreshToken,
  revokeAllForUser,
} from './refresh-token.js'
import { env } from './config.js'
import { getRegisterQueue, getRegisterEvents, type RegisterJobData, type RegisterJobResult, type RegisterJobError } from './queue.js'
import { s3Configured, presignAvatarUpload, isAllowedAvatarMime } from './s3.js'

const REFRESH_COOKIE = 'billiard.refresh'
const API_PASSWORD_BCRYPT_ROUNDS = 10

function safeEqualInternalSecret(presented: unknown): boolean {
  if (typeof presented !== 'string') return false
  const a = Buffer.from(presented)
  const b = Buffer.from(env.INTERNAL_SECRET)
  if (a.length !== b.length) return false
  return timingSafeEqual(a, b)
}

interface UserDb {
  id: string
  phone: string
  name: string
  avatar: string | null
  role: string
  accountType: string
  clubName: string | null
  createdAt: Date
}

function userToPublic(u: UserDb, hasApiPassword: boolean): User {
  return {
    id: u.id,
    phone: u.phone,
    name: u.name,
    avatar: u.avatar,
    role: u.role as User['role'],
    accountType: u.accountType as User['accountType'],
    clubName: u.clubName,
    hasApiPassword,
    createdAt: u.createdAt.toISOString(),
  }
}

function setRefreshCookie(reply: FastifyReply, token: string, expiresAt: Date): void {
  reply.setCookie(REFRESH_COOKIE, token, {
    httpOnly: true,
    sameSite: env.COOKIE_SECURE ? 'strict' : 'lax',
    secure: env.COOKIE_SECURE,
    domain: env.COOKIE_DOMAIN,
    // path='/' — иначе через gateway, где URL имеет префикс /api/, браузер
    // не отправляет refresh-cookie обратно на /api/auth/refresh, и пользователя
    // выкидывает после перезагрузки страницы.
    path: '/',
    expires: expiresAt,
  })
}

function clearRefreshCookie(reply: FastifyReply): void {
  reply.clearCookie(REFRESH_COOKIE, { path: '/' })
}

function getRefreshCookie(req: FastifyRequest): string | undefined {
  return (req.cookies as Record<string, string | undefined>)[REFRESH_COOKIE]
}

function metaFromReq(req: FastifyRequest): { userAgent: string | null; ip: string | null } {
  return {
    userAgent: req.headers['user-agent'] ?? null,
    ip: req.ip ?? null,
  }
}

/** Извлекает Bearer-токен из Authorization header. */
async function getUserFromAuthHeader(req: FastifyRequest): Promise<{ id: string; role: string; name: string; accountType: 'PLAYER' | 'CLUB' } | null> {
  const auth = req.headers.authorization
  if (!auth?.startsWith('Bearer ')) return null
  try {
    const payload = await verifyAccessToken(auth.slice(7))
    return { id: payload.sub, role: payload.role, name: payload.name, accountType: payload.accountType }
  } catch {
    return null
  }
}

/** Проверяет, есть ли у пользователя установленный API-пароль (1 hit к БД). */
async function hasApiPasswordFor(userId: string): Promise<boolean> {
  const c = await prisma.clubApiPassword.count({ where: { userId } })
  return c > 0
}

export async function registerRoutes(app: FastifyInstance): Promise<void> {
  // ---- Health ----
  app.get('/health', async () => ({
    status: 'ok',
    service: 'auth',
    time: new Date().toISOString(),
  }))

  // ---- JWKS-аналог: отдаёт публичный ключ для проверки токенов другими сервисами ----
  app.get('/auth/public-key', async () => ({
    alg: 'RS256',
    publicKey: getPublicKeyPem(),
  }))

  // ---- POST /auth/register ----
  // Регистрация идёт через очередь (BullMQ/Redis):
  //   1) кидаем job, fast-path: ждём до 2 сек — если успело, отдаём 201 + токены;
  //   2) иначе 202 + jobId, клиент опрашивает GET /auth/register/status/:jobId.
  // Зачем: bcrypt cost=12 даёт ~300 мс CPU. При наплыве запросов синхронный путь
  // ложит event-loop, очередь шарит нагрузку по воркерам и переживает рестарт.
  app.post('/auth/register', async (req, reply) => {
    const parsed = registerInputSchema.safeParse(req.body)
    if (!parsed.success) {
      return reply.code(400).send({
        code: 'VALIDATION_ERROR',
        message: 'Некорректные данные',
        details: parsed.error.flatten(),
      })
    }
    const { name, phone, password, accountType, clubName } = parsed.data

    // Ранняя проверка — экономим bcrypt-cost. Финальный rubicon — unique constraint в БД.
    const existsEarly = await prisma.user.findUnique({ where: { phone }, select: { id: true } })
    if (existsEarly) {
      return reply.code(409).send({
        code: 'USER_EXISTS',
        message: 'Аккаунт с этим номером уже существует',
      })
    }

    const jobData: RegisterJobData = { name, phone, password, accountType, clubName: clubName ?? null }
    const queue = getRegisterQueue()
    // jobId = phone (без `:`, BullMQ запрещает) → отбрасываются дубли того же номера.
    const job = await queue.add('register', jobData, { jobId: `phone-${phone}` })

    const FAST_PATH_MS = 2000
    let result: RegisterJobResult | RegisterJobError | null = null
    try {
      result = (await job.waitUntilFinished(getRegisterEvents(), FAST_PATH_MS)) as RegisterJobResult | RegisterJobError
    } catch {
      // timeout — отвечаем 202, клиент опросит статус
    }

    if (!result) {
      return reply.code(202).send({
        code: 'QUEUED',
        message: 'Регистрация в очереди',
        jobId: job.id,
        statusUrl: `/auth/register/status/${job.id}`,
      })
    }
    if (!result.ok) {
      return reply.code(409).send({ code: result.code, message: result.message })
    }

    const user = await prisma.user.findUniqueOrThrow({ where: { id: result.userId } })
    const accessToken = await signAccessToken({
      sub: user.id, role: user.role, name: user.name, accountType: user.accountType,
    })
    const refresh = await issueRefreshToken({ userId: user.id, ...metaFromReq(req) })
    setRefreshCookie(reply, refresh.token, refresh.expiresAt)
    const response: LoginResponse = { user: userToPublic(user, false), accessToken }
    return reply.code(201).send(response)
  })

  // ---- GET /auth/register/status/:jobId ----
  app.get<{ Params: { jobId: string } }>('/auth/register/status/:jobId', async (req, reply) => {
    const queue = getRegisterQueue()
    const job = await queue.getJob(req.params.jobId)
    if (!job) return reply.code(404).send({ code: 'JOB_NOT_FOUND' })
    const state = await job.getState()
    if (state === 'completed') {
      const result = job.returnvalue as RegisterJobResult | RegisterJobError
      if (!result?.ok) return reply.code(409).send({ code: result?.code ?? 'FAILED', message: result?.message })
      const user = await prisma.user.findUnique({ where: { id: result.userId } })
      if (!user) return reply.code(500).send({ code: 'USER_VANISHED' })
      const accessToken = await signAccessToken({
        sub: user.id, role: user.role, name: user.name, accountType: user.accountType,
      })
      const refresh = await issueRefreshToken({ userId: user.id, ...metaFromReq(req) })
      setRefreshCookie(reply, refresh.token, refresh.expiresAt)
      return reply.send({ status: 'completed', user: userToPublic(user, false), accessToken })
    }
    if (state === 'failed') {
      return reply.code(500).send({ status: 'failed', reason: job.failedReason })
    }
    return reply.send({ status: state })
  })

  // ---- POST /auth/login ----
  app.post('/auth/login', async (req, reply) => {
    const parsed = loginInputSchema.safeParse(req.body)
    if (!parsed.success) {
      return reply.code(400).send({
        code: 'VALIDATION_ERROR',
        message: 'Некорректные данные',
        details: parsed.error.flatten(),
      })
    }
    const { phone, password } = parsed.data

    const user = await prisma.user.findUnique({ where: { phone } })
    if (!user) {
      // Не раскрываем существование аккаунта (timing-safe ответ)
      // → но для UX отдаём конкретную ошибку. В production стоит размыть.
      return reply.code(401).send({
        code: 'INVALID_CREDENTIALS',
        message: 'Неверный телефон или пароль',
      })
    }
    const ok = await bcrypt.compare(password, user.passwordHash)
    if (!ok) {
      return reply.code(401).send({
        code: 'INVALID_CREDENTIALS',
        message: 'Неверный телефон или пароль',
      })
    }

    const accessToken = await signAccessToken({
      sub: user.id, role: user.role, name: user.name, accountType: user.accountType,
    })
    const refresh = await issueRefreshToken({ userId: user.id, ...metaFromReq(req) })
    setRefreshCookie(reply, refresh.token, refresh.expiresAt)

    const hasApiPwd = await hasApiPasswordFor(user.id)
    const response: LoginResponse = { user: userToPublic(user, hasApiPwd), accessToken }
    return reply.send(response)
  })

  // ---- POST /auth/refresh ----
  app.post('/auth/refresh', async (req, reply) => {
    const presented = getRefreshCookie(req)
    if (!presented) {
      return reply.code(401).send({ code: 'NO_REFRESH', message: 'Нет refresh-токена' })
    }
    const result = await rotateRefreshToken(presented, metaFromReq(req))
    if (!result) {
      clearRefreshCookie(reply)
      return reply.code(401).send({ code: 'INVALID_REFRESH', message: 'Refresh-токен невалиден' })
    }
    const user = await prisma.user.findUnique({ where: { id: result.userId } })
    if (!user) {
      return reply.code(401).send({ code: 'USER_GONE', message: 'Пользователь удалён' })
    }
    const accessToken = await signAccessToken({
      sub: user.id, role: user.role, name: user.name, accountType: user.accountType,
    })
    setRefreshCookie(reply, result.newToken, result.newExpiresAt)
    const hasApiPwd = await hasApiPasswordFor(user.id)
    return reply.send({ accessToken, user: userToPublic(user, hasApiPwd) })
  })

  // ---- DELETE /auth/logout ----
  app.delete('/auth/logout', async (req, reply) => {
    const presented = getRefreshCookie(req)
    if (presented) await revokeRefreshToken(presented)
    clearRefreshCookie(reply)
    return reply.code(204).send()
  })

  // ---- DELETE /auth/sessions (logout everywhere) ----
  app.delete('/auth/sessions', async (req, reply) => {
    const auth = await getUserFromAuthHeader(req)
    if (!auth) return reply.code(401).send({ code: 'UNAUTHORIZED', message: 'Не авторизован' })
    await revokeAllForUser(auth.id)
    clearRefreshCookie(reply)
    return reply.code(204).send()
  })

  // ---- GET /auth/me ----
  app.get('/auth/me', async (req, reply) => {
    const auth = await getUserFromAuthHeader(req)
    if (!auth) return reply.code(401).send({ code: 'UNAUTHORIZED', message: 'Не авторизован' })
    const user = await prisma.user.findUnique({ where: { id: auth.id } })
    if (!user) return reply.code(404).send({ code: 'NOT_FOUND', message: 'Пользователь не найден' })
    const hasApiPwd = await hasApiPasswordFor(user.id)
    return reply.send(userToPublic(user, hasApiPwd))
  })

  // ---- POST /auth/lookup-by-phone ----
  // Поиск пользователя по точному номеру (+7XXXXXXXXXX).
  // Используется организаторами турниров для добавления участника по его номеру.
  // Требует авторизации (Bearer). Возвращает минимальный публичный профиль либо 404.
  const lookupByPhoneSchema = z.object({ phone: phoneSchema })
  app.post('/auth/lookup-by-phone', async (req, reply) => {
    const auth = await getUserFromAuthHeader(req)
    if (!auth) return reply.code(401).send({ code: 'UNAUTHORIZED', message: 'Не авторизован' })
    const parsed = lookupByPhoneSchema.safeParse(req.body)
    if (!parsed.success) {
      return reply.code(400).send({
        code: 'VALIDATION_ERROR',
        message: 'Некорректный номер',
        details: parsed.error.flatten(),
      })
    }
    const user = await prisma.user.findUnique({
      where: { phone: parsed.data.phone },
      select: { id: true, phone: true, name: true, avatar: true, accountType: true },
    })
    if (!user) return reply.code(404).send({ code: 'NOT_FOUND', message: 'Пользователь не найден' })
    return reply.send({
      user: {
        id: user.id,
        phone: user.phone,
        name: user.name,
        avatar: user.avatar,
        accountType: user.accountType,
      },
    })
  })

  // ---- PATCH /auth/me ----
  app.patch('/auth/me', async (req, reply) => {
    const auth = await getUserFromAuthHeader(req)
    if (!auth) return reply.code(401).send({ code: 'UNAUTHORIZED', message: 'Не авторизован' })
    const parsed = updateProfileInputSchema.safeParse(req.body)
    if (!parsed.success) {
      return reply.code(400).send({
        code: 'VALIDATION_ERROR', message: 'Некорректные данные',
        details: parsed.error.flatten(),
      })
    }
    // clubName можно менять только для CLUB-аккаунтов.
    const data = { ...parsed.data }
    if ('clubName' in data && auth.accountType !== 'CLUB') {
      delete data.clubName
    }
    try {
      const updated = await prisma.user.update({ where: { id: auth.id }, data })
      const hasApiPwd = await hasApiPasswordFor(updated.id)
      return reply.send(userToPublic(updated, hasApiPwd))
    } catch (err) {
      // Prisma P2002 — нарушение уникального индекса (например, телефон уже занят).
      if (typeof err === 'object' && err !== null && 'code' in err && (err as { code?: unknown }).code === 'P2002') {
        return reply.code(409).send({
          code: 'USER_EXISTS',
          message: 'Этот номер уже зарегистрирован',
        })
      }
      throw err
    }
  })

  // ---- POST /auth/me/api-password ----
  // Установить или сменить API-пароль для подключения desktop-приложения.
  // Только для accountType=CLUB. Минимум 8 символов (валидация в zod).
  app.post('/auth/me/api-password', async (req, reply) => {
    const auth = await getUserFromAuthHeader(req)
    if (!auth) return reply.code(401).send({ code: 'UNAUTHORIZED', message: 'Не авторизован' })
    if (auth.accountType !== 'CLUB') {
      return reply.code(403).send({
        code: 'NOT_A_CLUB',
        message: 'API-пароль доступен только для клубных аккаунтов',
      })
    }
    const parsed = setApiPasswordInputSchema.safeParse(req.body)
    if (!parsed.success) {
      return reply.code(400).send({
        code: 'VALIDATION_ERROR', message: 'Минимум 8 символов',
        details: parsed.error.flatten(),
      })
    }
    const passwordHash = await bcrypt.hash(parsed.data.password, API_PASSWORD_BCRYPT_ROUNDS)
    await prisma.clubApiPassword.upsert({
      where: { userId: auth.id },
      create: { userId: auth.id, passwordHash },
      update: { passwordHash },
    })
    return reply.code(200).send({ ok: true })
  })

  // ---- DELETE /auth/me/api-password ----
  // Удаляет API-пароль → отключает desktop-интеграцию (и убирает «free-by-automation»).
  app.delete('/auth/me/api-password', async (req, reply) => {
    const auth = await getUserFromAuthHeader(req)
    if (!auth) return reply.code(401).send({ code: 'UNAUTHORIZED', message: 'Не авторизован' })
    await prisma.clubApiPassword.deleteMany({ where: { userId: auth.id } })
    return reply.code(200).send({ ok: true })
  })

  // ---- POST /auth/me/avatar/upload-url ----
  // Возвращает presigned PUT URL, на который клиент сам пушит файл в S3.
  // Лимит — 5 MB. После загрузки клиент вызывает PATCH /auth/me { avatar: publicUrl }.
  const MAX_AVATAR_BYTES = 5 * 1024 * 1024
  app.post('/auth/me/avatar/upload-url', async (req, reply) => {
    const auth = await getUserFromAuthHeader(req)
    if (!auth) return reply.code(401).send({ code: 'UNAUTHORIZED', message: 'Не авторизован' })
    if (!s3Configured()) {
      return reply.code(503).send({
        code: 'S3_NOT_CONFIGURED',
        message: 'Загрузка файлов временно недоступна',
      })
    }
    const body = req.body as { contentType?: unknown; size?: unknown } | null
    const contentType = typeof body?.contentType === 'string' ? body.contentType : ''
    const size = typeof body?.size === 'number' ? body.size : 0
    if (!isAllowedAvatarMime(contentType)) {
      return reply.code(400).send({
        code: 'INVALID_MIME',
        message: 'Поддерживаются JPEG, PNG, WebP, GIF',
      })
    }
    if (size <= 0 || size > MAX_AVATAR_BYTES) {
      return reply.code(400).send({
        code: 'INVALID_SIZE',
        message: `Размер файла должен быть от 1 байта до ${MAX_AVATAR_BYTES} байт`,
      })
    }
    try {
      const out = await presignAvatarUpload({ userId: auth.id, contentType, maxBytes: size })
      return reply.send(out)
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Не удалось подготовить загрузку'
      req.log.error({ err: e }, 'presign avatar upload failed')
      return reply.code(500).send({ code: 'PRESIGN_FAILED', message: msg })
    }
  })

  // ---- Telegram linking endpoints ----
  // POST /auth/me/telegram/link-token — выпустить одноразовый токен для привязки.
  // GET  /auth/me/telegram          — статус (подключён ли).
  // DELETE /auth/me/telegram        — отвязать.
  // POST /auth/internal/telegram/consume — internal: бот сообщает, что пользователь привязался.
  // POST /auth/internal/telegram/resolve — internal: бот спрашивает chat_id'ы для userIds.

  app.post('/auth/me/telegram/link-token', async (req, reply) => {
    const auth = await getUserFromAuthHeader(req)
    if (!auth) return reply.code(401).send({ code: 'UNAUTHORIZED' })
    // 10 минут TTL, 32 символа hex.
    const token = randomBytes(16).toString('hex')
    const expiresAt = new Date(Date.now() + 10 * 60_000)
    await prisma.telegramLinkToken.create({
      data: { userId: auth.id, token, expiresAt },
    })
    const botUsername = env.TELEGRAM_BOT_USERNAME
    const deepLink = botUsername ? `https://t.me/${botUsername}?start=${token}` : null
    return reply.send({ token, expiresAt: expiresAt.toISOString(), deepLink })
  })

  app.get('/auth/me/telegram', async (req, reply) => {
    const auth = await getUserFromAuthHeader(req)
    if (!auth) return reply.code(401).send({ code: 'UNAUTHORIZED' })
    const user = await prisma.user.findUnique({
      where: { id: auth.id },
      select: { telegramChatId: true, telegramUsername: true },
    })
    if (!user) return reply.code(404).send({ code: 'NOT_FOUND' })
    return reply.send({
      connected: user.telegramChatId !== null,
      username: user.telegramUsername,
    })
  })

  app.delete('/auth/me/telegram', async (req, reply) => {
    const auth = await getUserFromAuthHeader(req)
    if (!auth) return reply.code(401).send({ code: 'UNAUTHORIZED' })
    await prisma.user.update({
      where: { id: auth.id },
      data: { telegramChatId: null, telegramUsername: null },
    })
    return reply.code(204).send()
  })

  // Internal: бот шлёт сюда после успешного /start <token>.
  // Тело: { token, chatId, username? }.
  app.post('/auth/internal/telegram/consume', async (req, reply) => {
    if (!safeEqualInternalSecret(req.headers['x-internal-secret'])) {
      return reply.code(401).send({ code: 'INVALID_INTERNAL_SECRET' })
    }
    const body = req.body as { token?: unknown; chatId?: unknown; username?: unknown } | null
    const token = typeof body?.token === 'string' ? body.token : null
    const chatId = typeof body?.chatId === 'number' ? body.chatId : null
    const username = typeof body?.username === 'string' ? body.username : null
    if (!token || !chatId) {
      return reply.code(400).send({ code: 'VALIDATION_ERROR' })
    }
    const link = await prisma.telegramLinkToken.findUnique({ where: { token } })
    if (!link) return reply.code(404).send({ code: 'TOKEN_NOT_FOUND' })
    if (link.usedAt) return reply.code(409).send({ code: 'TOKEN_USED' })
    if (link.expiresAt.getTime() < Date.now()) return reply.code(410).send({ code: 'TOKEN_EXPIRED' })
    try {
      await prisma.$transaction([
        prisma.user.update({
          where: { id: link.userId },
          data: { telegramChatId: BigInt(chatId), telegramUsername: username },
        }),
        prisma.telegramLinkToken.update({
          where: { id: link.id },
          data: { usedAt: new Date() },
        }),
      ])
    } catch (err) {
      // Если этот chat_id уже привязан к другому пользователю — unique violation.
      if (typeof err === 'object' && err !== null && 'code' in err && (err as { code?: unknown }).code === 'P2002') {
        return reply.code(409).send({ code: 'CHAT_ALREADY_LINKED' })
      }
      throw err
    }
    return reply.send({ userId: link.userId })
  })

  // Internal: бот спрашивает chat_id'ы для списка userIds (чтобы разослать сообщения).
  // Тело: { userIds: string[] } → { items: [{ userId, chatId, telegramUsername, name, avatar }] }
  app.post('/auth/internal/telegram/resolve', async (req, reply) => {
    if (!safeEqualInternalSecret(req.headers['x-internal-secret'])) {
      return reply.code(401).send({ code: 'INVALID_INTERNAL_SECRET' })
    }
    const body = req.body as { userIds?: unknown } | null
    if (!body || !Array.isArray(body.userIds)) {
      return reply.code(400).send({ code: 'VALIDATION_ERROR' })
    }
    const ids = (body.userIds as unknown[]).filter((x): x is string => typeof x === 'string')
    if (ids.length === 0) return reply.send({ items: [] })
    const users = await prisma.user.findMany({
      where: { id: { in: ids }, telegramChatId: { not: null } },
      select: { id: true, telegramChatId: true, telegramUsername: true, name: true, avatar: true },
    })
    return reply.send({
      items: users.map((u) => ({
        userId: u.id,
        chatId: u.telegramChatId !== null ? Number(u.telegramChatId) : null,
        telegramUsername: u.telegramUsername,
        name: u.name,
        avatar: u.avatar,
      })),
    })
  })

  // ---- POST /auth/internal/desktop-token ----
  // Internal RPC для club-сервиса: проверяет phone+API-пароль и выдаёт desktop JWT (90d).
  // Защищено x-internal-secret. Не проксируется через gateway.
  app.post('/auth/internal/desktop-token', async (req, reply) => {
    if (!safeEqualInternalSecret(req.headers['x-internal-secret'])) {
      return reply.code(401).send({ code: 'INVALID_INTERNAL_SECRET' })
    }
    const parsed = clubAuthInputSchema.safeParse(req.body)
    if (!parsed.success) {
      return reply.code(400).send({ code: 'VALIDATION_ERROR', details: parsed.error.flatten() })
    }
    const { phone, password } = parsed.data

    const user = await prisma.user.findUnique({
      where: { phone },
      include: { clubApiPassword: true },
    })
    if (!user) {
      return reply.code(404).send({ code: 'NOT_FOUND', message: 'Аккаунт не зарегистрирован' })
    }
    if (user.accountType !== 'CLUB') {
      return reply.code(403).send({ code: 'NOT_A_CLUB', message: 'Этот аккаунт не клубный' })
    }
    if (!user.clubApiPassword) {
      return reply.code(403).send({ code: 'NO_API_PASSWORD', message: 'API-пароль не установлен' })
    }
    const ok = await bcrypt.compare(password, user.clubApiPassword.passwordHash)
    if (!ok) {
      return reply.code(401).send({ code: 'WRONG_PASSWORD', message: 'Неверный пароль' })
    }

    const clubName = user.clubName ?? user.name
    const token = await signDesktopToken({
      sub: user.id,
      clubId: user.id,
      clubName,
    })
    const response: ClubAuthResponse = { token, clubId: user.id, clubName }
    return reply.code(200).send(response)
  })

  // ---- GET /auth/internal/automation/:userId ----
  // Internal RPC для payment-сервиса: «есть ли у юзера активная автоматизация?»
  // Защищено x-internal-secret. Не проксируется через gateway (см. PUBLIC_PATHS).
  app.get<{ Params: { userId: string } }>('/auth/internal/automation/:userId', async (req, reply) => {
    if (!safeEqualInternalSecret(req.headers['x-internal-secret'])) {
      return reply.code(401).send({ code: 'INVALID_INTERNAL_SECRET' })
    }
    const u = await prisma.user.findUnique({
      where: { id: req.params.userId },
      select: { accountType: true },
    })
    if (!u) return reply.code(404).send({ code: 'NOT_FOUND' })
    const hasApiPwd = u.accountType === 'CLUB' && await hasApiPasswordFor(req.params.userId)
    return reply.send({
      accountType: u.accountType,
      hasApiPassword: hasApiPwd,
      automationActive: hasApiPwd,
    })
  })
}
