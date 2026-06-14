import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import {
  clubAuthInputSchema,
  clubSyncInputSchema,
  clubSessionInputSchema,
  clubShiftInputSchema,
  type ClubAuthResponse,
  type ClubStatusSnapshot,
  type ClubSessionsResponse,
  type ClubSessionsSummaryRow,
  type ClubRevenue,
  type TableSnapshot,
  type ClubShiftsResponse,
} from '@billiard/shared'
import type { Prisma } from './_prisma/index.js'
import { prisma } from './db.js'
import { env } from './config.js'
import { getBrowserUser, getDesktopClient } from './auth-context.js'

/**
 * Club-сервис: REST поверх ClubSyncSnapshot + ClubSessionRecord.
 * Эндпоинты делятся на browser-only (читают через gateway) и desktop-only
 * (горячие POST'ы — приходят прямо к нам с long-lived JWT).
 */

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/

async function browserOrReject(req: FastifyRequest, reply: FastifyReply) {
  const user = getBrowserUser(req)
  if (!user) {
    return reply.code(401).send({ code: 'UNAUTHORIZED', message: 'Требуется авторизация' })
  }
  if (user.accountType !== 'CLUB') {
    return reply.code(403).send({ code: 'NOT_A_CLUB', message: 'Только для клубных аккаунтов' })
  }
  return user
}

async function desktopOrReject(req: FastifyRequest, reply: FastifyReply) {
  const client = await getDesktopClient(req)
  if (!client) {
    return reply.code(401).send({ code: 'UNAUTHORIZED', message: 'Требуется desktop-токен' })
  }
  return client
}

export async function registerRoutes(app: FastifyInstance): Promise<void> {
  // ---- Health ----
  app.get('/health', async () => ({
    status: 'ok',
    service: 'club',
    time: new Date().toISOString(),
  }))

  // ---- POST /club/auth ----
  // Desktop логинится по phone + API-password.
  // Мы НЕ храним пароль — пробрасываем в auth-сервис (там bcrypt-хэш) через internal RPC.
  app.post('/club/auth', async (req, reply) => {
    const parsed = clubAuthInputSchema.safeParse(req.body)
    if (!parsed.success) {
      return reply.code(400).send({ code: 'VALIDATION_ERROR', details: parsed.error.flatten() })
    }

    const url = `${env.AUTH_SERVICE_URL.replace(/\/$/, '')}/auth/internal/desktop-token`
    let upstream: Response
    try {
      upstream = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-internal-secret': env.INTERNAL_SECRET,
        },
        body: JSON.stringify(parsed.data),
      })
    } catch (err) {
      app.log.error({ err }, 'club: auth-service unreachable')
      return reply.code(502).send({ code: 'AUTH_UNREACHABLE', message: 'Auth-сервис недоступен' })
    }

    // Прозрачно прокидываем статус и тело ответа от auth наружу
    // (404/401/403 — пользователь увидит то же, что вернул auth)
    const body = await upstream.json().catch(() => ({}))
    if (!upstream.ok) {
      return reply.code(upstream.status).send(body)
    }
    return reply.code(200).send(body as ClubAuthResponse)
  })

  // ---- POST /club/sync ----
  // Desktop отправляет полный снимок состояния каждые 30 секунд.
  // Идемпотентно: один snapshot на клуб, каждый sync — UPDATE.
  app.post('/club/sync', async (req, reply) => {
    const client = await desktopOrReject(req, reply)
    if (!('clubId' in client)) return // reject уже отправлен

    const parsed = clubSyncInputSchema.safeParse(req.body)
    if (!parsed.success) {
      return reply.code(400).send({ code: 'VALIDATION_ERROR', details: parsed.error.flatten() })
    }

    const now = new Date()
    await prisma.clubSyncSnapshot.upsert({
      where: { clubId: client.clubId },
      create: {
        clubId: client.clubId,
        tables: parsed.data.tables as unknown as Prisma.InputJsonValue,
        revenue: parsed.data.todayRevenue as unknown as Prisma.InputJsonValue,
        syncedAt: now,
      },
      update: {
        tables: parsed.data.tables as unknown as Prisma.InputJsonValue,
        revenue: parsed.data.todayRevenue as unknown as Prisma.InputJsonValue,
        syncedAt: now,
      },
    })

    return reply.code(200).send({ ok: true, syncedAt: now.toISOString() })
  })

  // ---- POST /club/session ----
  // Desktop присылает завершённую сессию. Idempotent: повтор по {clubId, externalId} → 409.
  app.post('/club/session', async (req, reply) => {
    const client = await desktopOrReject(req, reply)
    if (!('clubId' in client)) return

    const parsed = clubSessionInputSchema.safeParse(req.body)
    if (!parsed.success) {
      return reply.code(400).send({ code: 'VALIDATION_ERROR', details: parsed.error.flatten() })
    }
    const s = parsed.data

    try {
      await prisma.clubSessionRecord.create({
        data: {
          clubId: client.clubId,
          externalId: s.id,
          tableId: s.tableId,
          tableName: s.tableName,
          mode: s.mode,
          tariffName: s.tariffName ?? null,
          startTime: new Date(s.startTime),
          endTime: new Date(s.endTime),
          duration: s.duration,
          tableCost: s.tableCost,
          barCost: s.barCost,
          totalCost: s.totalCost,
          barOrders: s.barOrders ? (s.barOrders as unknown as Prisma.InputJsonValue) : undefined,
          shiftId: s.shiftId ?? null,
          date: s.date,
        },
      })
      return reply.code(200).send({ ok: true })
    } catch (err) {
      const code = (err as { code?: string }).code
      if (code === 'P2002') {
        // Unique constraint — дубль, спокойно отдаём 409
        return reply.code(409).send({ error: 'DUPLICATE' })
      }
      throw err
    }
  })

  // ---- POST /club/shift ----
  // Desktop пушит смену: открыл/закрыл/обновил итоги. Идемпотентно по {clubId, externalId}.
  app.post('/club/shift', async (req, reply) => {
    const client = await desktopOrReject(req, reply)
    if (!('clubId' in client)) return

    const parsed = clubShiftInputSchema.safeParse(req.body)
    if (!parsed.success) {
      return reply.code(400).send({ code: 'VALIDATION_ERROR', details: parsed.error.flatten() })
    }
    const s = parsed.data
    const isActive = s.endTime === null

    await prisma.clubShiftRecord.upsert({
      where: { clubId_externalId: { clubId: client.clubId, externalId: s.id } },
      create: {
        clubId: client.clubId,
        externalId: s.id,
        operatorId: s.operatorId,
        operatorName: s.operatorName,
        startTime: new Date(s.startTime),
        endTime: s.endTime ? new Date(s.endTime) : null,
        isActive,
        totalRevenue: s.totalRevenue,
        tableRevenue: s.tableRevenue,
        barRevenue: s.barRevenue,
        sessionsCount: s.sessionsCount,
      },
      update: {
        operatorName: s.operatorName,
        endTime: s.endTime ? new Date(s.endTime) : null,
        isActive,
        totalRevenue: s.totalRevenue,
        tableRevenue: s.tableRevenue,
        barRevenue: s.barRevenue,
        sessionsCount: s.sessionsCount,
      },
    })
    return reply.code(200).send({ ok: true })
  })

  // ---- GET /club/shifts ----
  // Browser-отчёты: список смен (последние 50).
  app.get('/club/shifts', async (req, reply) => {
    const user = await browserOrReject(req, reply)
    if (!('id' in user)) return

    const items = await prisma.clubShiftRecord.findMany({
      where: { clubId: user.id },
      orderBy: { startTime: 'desc' },
      take: 50,
    })

    const response: ClubShiftsResponse = {
      shifts: items.map((s) => ({
        id: s.id,
        externalId: s.externalId,
        operatorId: s.operatorId,
        operatorName: s.operatorName,
        startTime: s.startTime.toISOString(),
        endTime: s.endTime?.toISOString() ?? null,
        isActive: s.isActive,
        totalRevenue: s.totalRevenue,
        tableRevenue: s.tableRevenue,
        barRevenue: s.barRevenue,
        sessionsCount: s.sessionsCount,
      })),
    }
    return reply.send(response)
  })

  // ---- GET /club/status ----
  // Browser-дашборд читает последний снимок + статус подключения.
  app.get('/club/status', async (req, reply) => {
    const user = await browserOrReject(req, reply)
    if (!('id' in user)) return

    const snap = await prisma.clubSyncSnapshot.findUnique({ where: { clubId: user.id } })

    const isOnline = snap
      ? Date.now() - snap.syncedAt.getTime() < env.ONLINE_THRESHOLD_SECONDS * 1000
      : false

    const response: ClubStatusSnapshot = {
      clubId: user.id,
      clubName: user.name,
      isOnline,
      lastSyncAt: snap?.syncedAt.toISOString() ?? null,
      tables: (snap?.tables as unknown as TableSnapshot[]) ?? [],
      todayRevenue: (snap?.revenue as unknown as ClubRevenue) ?? { table: 0, bar: 0, total: 0, sessionsCount: 0 },
    }
    return reply.send(response)
  })

  // ---- GET /club/sessions ----
  // Browser-отчёты: список сессий с фильтрами.
  app.get<{
    Querystring: { date?: string; from?: string; to?: string; tableId?: string; shiftId?: string }
  }>('/club/sessions', async (req, reply) => {
    const user = await browserOrReject(req, reply)
    if (!('id' in user)) return

    const { date, from, to, tableId, shiftId } = req.query

    const where: Prisma.ClubSessionRecordWhereInput = { clubId: user.id }
    if (date) {
      if (!ISO_DATE_RE.test(date)) {
        return reply.code(400).send({ code: 'BAD_DATE', message: 'date должна быть YYYY-MM-DD' })
      }
      where.date = date
    } else if (from || to) {
      const dateFilter: Prisma.StringFilter = {}
      if (from) {
        if (!ISO_DATE_RE.test(from)) return reply.code(400).send({ code: 'BAD_DATE' })
        dateFilter.gte = from
      }
      if (to) {
        if (!ISO_DATE_RE.test(to)) return reply.code(400).send({ code: 'BAD_DATE' })
        dateFilter.lte = to
      }
      where.date = dateFilter
    }
    if (tableId) {
      const id = Number(tableId)
      if (!Number.isInteger(id)) return reply.code(400).send({ code: 'BAD_TABLE_ID' })
      where.tableId = id
    }
    if (shiftId) where.shiftId = shiftId

    const items = await prisma.clubSessionRecord.findMany({
      where,
      orderBy: { startTime: 'desc' },
      take: 500,
    })

    const totals = items.reduce(
      (acc, s) => ({
        table: acc.table + s.tableCost,
        bar: acc.bar + s.barCost,
        total: acc.total + s.totalCost,
        count: acc.count + 1,
      }),
      { table: 0, bar: 0, total: 0, count: 0 },
    )

    const response: ClubSessionsResponse = {
      sessions: items.map((s) => ({
        id: s.id,
        tableId: s.tableId,
        tableName: s.tableName,
        mode: s.mode as 'time' | 'amount' | 'unlimited',
        tariffName: s.tariffName ?? null,
        startTime: s.startTime.toISOString(),
        endTime: s.endTime.toISOString(),
        duration: s.duration,
        tableCost: s.tableCost,
        barCost: s.barCost,
        totalCost: s.totalCost,
        barOrders: (s.barOrders as unknown as ClubSessionsResponse['sessions'][number]['barOrders']) ?? undefined,
        date: s.date,
        shiftId: s.shiftId ?? null,
      })),
      totals,
    }
    return reply.send(response)
  })

  // ---- GET /club/sessions/summary ----
  // Browser-отчёты: агрегация по дням или месяцам.
  app.get<{
    Querystring: { groupBy?: 'day' | 'month'; from?: string; to?: string }
  }>('/club/sessions/summary', async (req, reply) => {
    const user = await browserOrReject(req, reply)
    if (!('id' in user)) return

    const groupBy = req.query.groupBy === 'month' ? 'month' : 'day'
    const where: Prisma.ClubSessionRecordWhereInput = { clubId: user.id }
    const dateFilter: Prisma.StringFilter = {}
    if (req.query.from) {
      if (!ISO_DATE_RE.test(req.query.from)) return reply.code(400).send({ code: 'BAD_DATE' })
      dateFilter.gte = req.query.from
    }
    if (req.query.to) {
      if (!ISO_DATE_RE.test(req.query.to)) return reply.code(400).send({ code: 'BAD_DATE' })
      dateFilter.lte = req.query.to
    }
    if (dateFilter.gte || dateFilter.lte) where.date = dateFilter

    const items = await prisma.clubSessionRecord.findMany({
      where,
      select: { date: true, tableCost: true, barCost: true, totalCost: true },
    })

    // Простая in-memory агрегация — дёшево и без вендорных GROUP BY-приколов Postgres.
    // При росте нагрузки переезжаем на raw query с date_trunc.
    const acc = new Map<string, ClubSessionsSummaryRow>()
    for (const it of items) {
      const period = groupBy === 'month' ? it.date.slice(0, 7) : it.date
      const row = acc.get(period) ?? { period, table: 0, bar: 0, total: 0, sessions: 0 }
      row.table += it.tableCost
      row.bar += it.barCost
      row.total += it.totalCost
      row.sessions += 1
      acc.set(period, row)
    }
    const rows = Array.from(acc.values()).sort((a, b) => (a.period < b.period ? -1 : 1))
    return reply.send({ rows })
  })
}
