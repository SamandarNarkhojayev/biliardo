import type { FastifyInstance, FastifyRequest } from 'fastify'
import { createPaymentInputSchema, type Payment } from '@billiard/shared'
import type {
  Payment as DbPayment,
  PaymentProvider as DbPaymentProvider,
  PaymentStatus as DbPaymentStatus,
  PaymentTargetType as DbPaymentTargetType,
} from './_prisma/index.js'
import { prisma } from './db.js'
import { env } from './config.js'
import { findPlan, PLANS } from './plans.js'
import { getUser, requireUser } from './auth-context.js'
import { kaspi, KASPI_PROVIDER, type KaspiWebhookPayload, type KaspiNormalizedStatus } from './kaspi-client.js'
import {
  verifyBridgeSecret,
  isCreditNotification,
  parseKaspiAmount,
  notificationHash,
  isDuplicateNotification,
} from './kaspi-bridge.js'
import { checkAutomation } from './automation.js'

function toApi(p: DbPayment): Payment {
  return {
    id: p.id,
    userId: p.userId,
    planCode: p.planCode as Payment['planCode'],
    amountKzt: p.amountKzt,
    status: p.status as Payment['status'],
    provider: p.provider as Payment['provider'],
    targetType: p.targetType as Payment['targetType'],
    tournamentId: p.tournamentId,
    externalId: p.externalId,
    paymentUrl: p.paymentUrl,
    qrCode: p.qrCode,
    createdAt: p.createdAt.toISOString(),
    completedAt: p.completedAt?.toISOString() ?? null,
    expiresAt: p.expiresAt?.toISOString() ?? null,
  }
}

export async function registerRoutes(app: FastifyInstance): Promise<void> {
  // ---- Health ----
  app.get('/health', async () => ({
    status: 'ok',
    service: 'payment',
    kaspiMode: env.KASPI_MODE,
    time: new Date().toISOString(),
  }))

  // ---- Plans (public — каталог тарифов) ----
  app.get('/plans', async () => ({ plans: PLANS }))

  // ---- Create payment (auth required) ----
  app.post('/payments', async (req, reply) => {
    const user = getUser(req)
    if (!user) return reply.code(401).send({ code: 'UNAUTHORIZED', message: 'Требуется авторизация' })

    const parsed = createPaymentInputSchema.safeParse(req.body)
    if (!parsed.success) {
      return reply.code(400).send({
        code: 'VALIDATION_ERROR',
        message: 'Невалидные данные',
        details: parsed.error.flatten(),
      })
    }
    const { planCode, tournamentId } = parsed.data

    const plan = findPlan(planCode)
    if (!plan) return reply.code(404).send({ code: 'PLAN_NOT_FOUND', message: 'Тариф не найден' })

    // FREE — не требует оплаты, но создавать запись бессмысленно.
    if (plan.priceKzt === 0) {
      return reply.code(400).send({
        code: 'FREE_PLAN_NO_PAYMENT',
        message: 'FREE-тариф не требует оплаты',
      })
    }

    // Free-by-automation: клуб с установленным API-паролем не платит за per-tournament тарифы.
    // Подписка (monthly) и lifetime — отдельная история, их не амнистируем.
    const isSubscription = plan.billing === 'monthly' || plan.billing === 'lifetime'
    const targetType: DbPaymentTargetType = isSubscription ? 'SUBSCRIPTION' : 'TOURNAMENT'

    if (targetType === 'TOURNAMENT' && user.accountType === 'CLUB') {
      const status = await checkAutomation(user.id)
      if (status.automationActive) {
        return reply.code(200).send({
          free: true,
          reason: 'AUTOMATION_CONNECTED',
          message: 'Турниры бесплатны для клубов с подключённой автоматизацией',
          plan: { code: plan.code, name: plan.name },
        })
      }
    }

    if (targetType === 'TOURNAMENT' && !tournamentId) {
      return reply.code(400).send({
        code: 'TOURNAMENT_ID_REQUIRED',
        message: 'Для разовой оплаты нужен tournamentId',
      })
    }

    // В bridge-режиме делаем сумму уникальной (+смещение), чтобы различать
    // параллельные переводы по точному совпадению суммы в уведомлении.
    let amountKzt = plan.priceKzt
    if (env.KASPI_MODE === 'bridge') {
      const allocated = await allocateBridgeAmount(plan.priceKzt)
      if (allocated === null) {
        return reply.code(503).send({
          code: 'NO_FREE_AMOUNT_SLOT',
          message: 'Слишком много одновременных платежей этого тарифа, попробуй через пару минут',
        })
      }
      amountKzt = allocated
    }

    // Создаём payment в PENDING, потом дёргаем Kaspi.
    // Если Kaspi упадёт — payment останется PENDING, очистится по TTL.
    const payment = await prisma.payment.create({
      data: {
        userId: user.id,
        planCode: plan.code,
        amountKzt,
        status: 'PENDING',
        provider: KASPI_PROVIDER as DbPaymentProvider,
        targetType,
        tournamentId: targetType === 'TOURNAMENT' ? tournamentId! : null,
      },
    })

    try {
      const order = await kaspi.createOrder({
        paymentId: payment.id,
        amountKzt: plan.priceKzt,
        description: `${plan.name} (${plan.code})`,
        returnUrl: `${env.PUBLIC_APP_URL}/payment/return?paymentId=${payment.id}`,
      })

      const updated = await prisma.payment.update({
        where: { id: payment.id },
        data: {
          externalId: order.externalId,
          paymentUrl: order.paymentUrl ?? null,
          qrCode: order.qrPayload ?? null,
          expiresAt: order.expiresAt,
        },
      })

      const stubCompleteUrl = env.KASPI_MODE === 'stub'
        ? `/payments/${payment.id}/stub-complete`
        : undefined

      return reply.code(201).send({ payment: toApi(updated), stubCompleteUrl })
    } catch (err) {
      app.log.error({ err, paymentId: payment.id }, 'kaspi createOrder failed')
      await prisma.payment.update({ where: { id: payment.id }, data: { status: 'FAILED' } })
      return reply.code(502).send({
        code: 'PROVIDER_ERROR',
        message: 'Не удалось создать заказ в Kaspi. Попробуй ещё раз.',
      })
    }
  })

  // ---- Get payment status (для polling-а с фронта) ----
  // Kaspi QR Merchant API не шлёт webhook — статус узнаём опросом. Поэтому при
  // каждом запросе PENDING-платежа в live-режиме подтягиваем актуальный статус
  // из Kaspi и финализируем, если оплата прошла.
  app.get<{ Params: { id: string } }>('/payments/:id', async (req, reply) => {
    const user = getUser(req)
    if (!user) return reply.code(401).send({ code: 'UNAUTHORIZED', message: 'Требуется авторизация' })

    let payment = await prisma.payment.findUnique({ where: { id: req.params.id } })
    if (!payment) return reply.code(404).send({ code: 'NOT_FOUND', message: 'Платёж не найден' })
    if (payment.userId !== user.id && user.role !== 'ADMIN') {
      return reply.code(403).send({ code: 'FORBIDDEN', message: 'Нет доступа' })
    }

    if (kaspi.supportsPolling && payment.status === 'PENDING' && payment.externalId) {
      await refreshPaymentFromProvider(payment.id, payment.externalId, app)
      payment = (await prisma.payment.findUnique({ where: { id: payment.id } })) ?? payment
    }

    return { payment: toApi(payment) }
  })

  // ---- My payments ----
  app.get('/payments/me/history', async (req, reply) => {
    const user = getUser(req)
    if (!user) return reply.code(401).send({ code: 'UNAUTHORIZED', message: 'Требуется авторизация' })

    const items = await prisma.payment.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 50,
    })
    return { payments: items.map(toApi) }
  })

  // ---- My subscription (если есть активная) ----
  app.get('/subscriptions/me', async (req, reply) => {
    const user = getUser(req)
    if (!user) return reply.code(401).send({ code: 'UNAUTHORIZED', message: 'Требуется авторизация' })

    const sub = await prisma.subscription.findFirst({
      where: { userId: user.id, status: 'ACTIVE', endsAt: { gt: new Date() } },
      orderBy: { endsAt: 'desc' },
    })
    return { subscription: sub ?? null }
  })

  // ---- Refund (ADMIN) — возврат оплаченного платежа через Kaspi payment/return ----
  app.post<{ Params: { id: string } }>('/payments/:id/refund', async (req, reply) => {
    const user = getUser(req)
    if (!user) return reply.code(401).send({ code: 'UNAUTHORIZED', message: 'Требуется авторизация' })
    if (user.role !== 'ADMIN') return reply.code(403).send({ code: 'FORBIDDEN', message: 'Только для админа' })

    const payment = await prisma.payment.findUnique({ where: { id: req.params.id } })
    if (!payment) return reply.code(404).send({ code: 'NOT_FOUND', message: 'Платёж не найден' })
    if (payment.status !== 'COMPLETED') {
      return reply.code(409).send({ code: 'NOT_REFUNDABLE', message: `Нельзя вернуть платёж в статусе ${payment.status}` })
    }
    if (!payment.externalId) {
      return reply.code(409).send({ code: 'NO_EXTERNAL_ID', message: 'У платежа нет externalId Kaspi' })
    }

    try {
      await kaspi.refund(payment.externalId, payment.amountKzt)
    } catch (err) {
      app.log.error({ err, paymentId: payment.id }, 'kaspi refund failed')
      return reply.code(502).send({ code: 'PROVIDER_ERROR', message: 'Возврат в Kaspi не прошёл' })
    }

    const updated = await prisma.$transaction(async (tx) => {
      // Снимаем активную подписку, если платёж её создавал.
      await tx.subscription.updateMany({
        where: { paymentId: payment.id, status: 'ACTIVE' },
        data: { status: 'CANCELLED' },
      })
      return tx.payment.update({ where: { id: payment.id }, data: { status: 'REFUNDED' } })
    })

    return { payment: toApi(updated) }
  })

  // ---- Kaspi webhook (PUBLIC — Kaspi дёргает извне, без JWT) ----
  // Принимает raw body для проверки HMAC. Подпись в заголовке `x-kaspi-signature`.
  app.post('/payments/webhook/kaspi', { config: { rawBody: true } }, async (req, reply) => {
    const rawBody = (req as FastifyRequest & { rawBody?: string }).rawBody ?? JSON.stringify(req.body)
    const signature = req.headers['x-kaspi-signature']

    if (!kaspi.verifyWebhookSignature(rawBody, typeof signature === 'string' ? signature : undefined)) {
      app.log.warn({ ip: req.ip }, 'kaspi webhook: invalid signature')
      return reply.code(401).send({ code: 'INVALID_SIGNATURE' })
    }

    const payload = req.body as Partial<KaspiWebhookPayload>
    if (!payload.paymentId || !payload.status) {
      return reply.code(400).send({ code: 'INVALID_PAYLOAD' })
    }

    await applyPaymentResult(
      payload.paymentId,
      {
        status: payload.status,
        amountKzt: payload.amountKzt,
        paidAt: payload.paidAt ? new Date(payload.paidAt) : undefined,
        raw: payload,
      },
      app,
    )
    return reply.code(200).send({ ok: true })
  })

  // ---- Kaspi BRIDGE: приём уведомлений о переводе с телефона ----
  // Форвардер пушей (MacroDroid/Tasker) шлёт сюда текст уведомления Kaspi.
  // Защищён секретом в заголовке x-bridge-secret. Матчим по точной сумме.
  if (env.KASPI_MODE === 'bridge') {
    app.post('/payments/provider/kaspi-notify', async (req, reply) => {
      const secret = req.headers['x-bridge-secret']
      if (!verifyBridgeSecret(typeof secret === 'string' ? secret : undefined)) {
        app.log.warn({ ip: req.ip }, 'kaspi-notify: invalid secret')
        return reply.code(401).send({ code: 'INVALID_SECRET' })
      }

      const body = req.body as { text?: string } | undefined
      const text = typeof body?.text === 'string' ? body.text : ''
      if (!text.trim()) return reply.code(400).send({ code: 'NO_TEXT' })

      if (isDuplicateNotification(notificationHash(text))) {
        return reply.code(200).send({ ok: true, duplicate: true })
      }
      if (!isCreditNotification(text)) {
        app.log.info({ text }, 'kaspi-notify: not a credit notification, ignored')
        return reply.code(200).send({ ok: true, ignored: 'not_credit' })
      }

      const amount = parseKaspiAmount(text)
      if (amount === null) {
        app.log.warn({ text }, 'kaspi-notify: could not parse amount')
        return reply.code(200).send({ ok: true, ignored: 'no_amount' })
      }

      const candidates = await prisma.payment.findMany({
        where: {
          status: 'PENDING',
          provider: 'KASPI',
          amountKzt: amount,
          OR: [{ expiresAt: { gt: new Date() } }, { expiresAt: null }],
        },
        orderBy: { createdAt: 'asc' },
        take: 2,
      })

      if (candidates.length === 0) {
        app.log.warn({ amount, text }, 'kaspi-notify: no matching pending payment')
        return reply.code(200).send({ ok: true, matched: false })
      }
      if (candidates.length > 1) {
        app.log.warn({ amount }, 'kaspi-notify: multiple matches, completing oldest')
      }

      const target = candidates[0]
      await applyPaymentResult(
        target.id,
        { status: 'COMPLETED', amountKzt: amount, paidAt: new Date(), raw: { bridge: true, text } },
        app,
      )
      app.log.info({ paymentId: target.id, amount }, 'kaspi-notify: matched & completed')
      return reply.code(200).send({ ok: true, matched: true, paymentId: target.id })
    })
  }

  // ---- Dev-only: имитация успешной оплаты в stub-режиме ----
  // Frontend в stub-режиме перенаправляет пользователя на этот эндпоинт по кнопке "оплатить".
  if (env.KASPI_MODE === 'stub') {
    app.post<{ Params: { id: string } }>('/payments/:id/stub-complete', async (req, reply) => {
      const user = requireUser(req)
      const payment = await prisma.payment.findUnique({ where: { id: req.params.id } })
      if (!payment) return reply.code(404).send({ code: 'NOT_FOUND' })
      if (payment.userId !== user.id) return reply.code(403).send({ code: 'FORBIDDEN' })
      if (payment.status !== 'PENDING') {
        return reply.code(409).send({ code: 'ALREADY_FINALIZED', status: payment.status })
      }

      await applyPaymentResult(
        payment.id,
        { status: 'COMPLETED', amountKzt: payment.amountKzt, paidAt: new Date(), raw: { stub: true } },
        app,
      )

      const updated = await prisma.payment.findUnique({ where: { id: payment.id } })
      return { payment: toApi(updated!) }
    })
  }
}

/**
 * Подбирает уникальную сумму для bridge-платежа: базовая цена + наименьшее
 * свободное смещение [0..spread). Уникальность среди активных PENDING нужна,
 * чтобы по сумме в уведомлении однозначно найти платёж. null — свободных нет.
 */
async function allocateBridgeAmount(base: number): Promise<number | null> {
  const spread = env.KASPI_BRIDGE_AMOUNT_SPREAD
  const since = new Date(Date.now() - env.PAYMENT_EXPIRY_MINUTES * 60_000)
  const taken = await prisma.payment.findMany({
    where: {
      status: 'PENDING',
      provider: 'KASPI',
      createdAt: { gte: since },
      amountKzt: { gte: base, lt: base + spread },
    },
    select: { amountKzt: true },
  })
  const used = new Set(taken.map((t) => t.amountKzt))
  for (let off = 0; off < spread; off++) {
    if (!used.has(base + off)) return base + off
  }
  return null
}

/** Нормализованный результат платежа — общий для webhook, поллинга и stub. */
interface PaymentResult {
  status: KaspiNormalizedStatus
  amountKzt?: number
  paidAt?: Date
  raw?: unknown
}

/**
 * Опрашивает Kaspi о статусе платежа и финализирует его, если оплата завершилась.
 * Вызывается при polling-е GET /payments/:id (live-режим). Ошибки провайдера
 * глотаем — платёж остаётся PENDING до следующего опроса.
 */
async function refreshPaymentFromProvider(
  paymentId: string,
  externalId: string,
  app: FastifyInstance,
): Promise<void> {
  try {
    const result = await kaspi.getStatus(externalId)
    if (result.status === 'PENDING') return
    await applyPaymentResult(
      paymentId,
      { status: result.status, amountKzt: result.amountKzt, paidAt: new Date(), raw: result.raw },
      app,
    )
  } catch (err) {
    app.log.warn({ err, paymentId }, 'kaspi getStatus failed during poll')
  }
}

/**
 * Применяет результат платежа: обновляет Payment, для SUBSCRIPTION — создаёт Subscription.
 * Идемпотентен: повторный финализирующий вызов с тем же статусом ничего не ломает.
 */
async function applyPaymentResult(
  paymentId: string,
  result: PaymentResult,
  app: FastifyInstance,
): Promise<void> {
  const payment = await prisma.payment.findUnique({ where: { id: paymentId } })
  if (!payment) {
    app.log.warn({ paymentId }, 'applyPaymentResult: payment not found')
    return
  }

  if (payment.status !== 'PENDING') {
    app.log.info({ id: payment.id, status: payment.status }, 'applyPaymentResult: already finalized')
    return
  }

  if (result.status !== 'COMPLETED') {
    await prisma.payment.update({
      where: { id: payment.id },
      data: { status: result.status as DbPaymentStatus, raw: (result.raw ?? {}) as object },
    })
    return
  }

  // Sanity check: сумма из Kaspi должна совпадать с тем, что мы создали.
  if (result.amountKzt != null && result.amountKzt !== payment.amountKzt) {
    app.log.error({ expected: payment.amountKzt, got: result.amountKzt }, 'applyPaymentResult: amount mismatch')
    await prisma.payment.update({
      where: { id: payment.id },
      data: { status: 'FAILED', raw: (result.raw ?? {}) as object },
    })
    return
  }

  await prisma.$transaction(async (tx) => {
    const completedAt = result.paidAt ?? new Date()
    await tx.payment.update({
      where: { id: payment.id },
      data: { status: 'COMPLETED', completedAt, raw: (result.raw ?? {}) as object },
    })

    if (payment.targetType === 'SUBSCRIPTION') {
      // LIFETIME — единоразово, не истекает. Кодируем «вечно» далёкой датой
      // (DateTime в Postgres ограничен 4713 BC – 294276 AD, 9999 безопасен).
      // monthly — продлеваем 30 дней от текущего окончания, если активна.
      const existing = await tx.subscription.findFirst({
        where: { userId: payment.userId, planCode: payment.planCode, status: 'ACTIVE' },
        orderBy: { endsAt: 'desc' },
      })
      const startsAt = existing && existing.endsAt > completedAt ? existing.endsAt : completedAt
      const endsAt = payment.planCode === 'LIFETIME'
        ? new Date('9999-12-31T23:59:59.000Z')
        : new Date(startsAt.getTime() + 30 * 24 * 60 * 60 * 1000)

      await tx.subscription.create({
        data: {
          userId: payment.userId,
          planCode: payment.planCode,
          startsAt,
          endsAt,
          paymentId: payment.id,
        },
      })
    }
    // TODO: для TOURNAMENT — здесь можно эмитить событие "payment.completed"
    // в tournament-сервис (HTTP/NATS), чтобы тот разблокировал турнир.
    // Пока tournament-сервис скелет — сделаем в следующем туре.
  })

  app.log.info({ id: payment.id }, 'payment completed')
}
