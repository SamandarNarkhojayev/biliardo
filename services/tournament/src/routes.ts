import type { FastifyInstance, FastifyRequest } from 'fastify'
import { z } from 'zod'
import {
  generateBracket as buildBracket,
  applyMatchResult,
  minParticipantsFor,
  type Participant as ApiParticipant,
  type Match as ApiMatch,
  type Tournament as ApiTournament,
} from '@billiard/shared'
import { prisma } from './db.js'
import { authenticate, type AuthUser } from './auth.js'
import { notifyBot } from './notify.js'
import { pickAssignments } from './table-assign.js'
import {
  API_TO_DB_BRACKET,
  API_TO_DB_MATCH_STATUS,
  DB_TO_API_BRACKET,
  dbTournamentToApi,
  type FullDbTournament,
} from './mapping.js'
import type { TournamentStatus as DbStatus, Match as DbMatch, Participant as DbParticipant } from './_prisma/index.js'

const FULL_INCLUDE = { prizePlaces: true, participants: true, matches: true } as const

async function loadFull(id: string): Promise<FullDbTournament | null> {
  return prisma.tournament.findUnique({ where: { id }, include: FULL_INCLUDE })
}

async function requireAuth(req: FastifyRequest): Promise<AuthUser | null> {
  return authenticate(req)
}

function isUnauthorizedOrganizer(t: { organizerId: string }, user: AuthUser): boolean {
  return t.organizerId !== user.id
}

/** Стандартное распределение столов: один UPDATE на матч. Возвращает обновлённый list. */
async function reassignTables(tournamentId: string): Promise<void> {
  const t = await prisma.tournament.findUnique({
    where: { id: tournamentId },
    include: { matches: true },
  })
  if (!t) return
  const ops = pickAssignments(t.matches, t.tables)
  if (ops.length === 0) return
  await prisma.$transaction(
    ops.map((o) => prisma.match.update({ where: { id: o.matchId }, data: { tableLabel: o.tableLabel } })),
  )
}

// ---- Schemas ----

const prizePlaceSchema = z.object({ place: z.number().int().min(1), prize: z.string().min(1).max(200) })

const tablesSchema = z.array(z.number().int().min(1).max(999)).max(50).optional()

const bracketTypeSchema = z.enum([
  'single-elimination', 'double-elimination', 'round-robin', 'swiss', 'group-playoff', 'page-playoff',
])

const createTournamentSchema = z.object({
  name: z.string().trim().min(3).max(100),
  description: z.string().trim().max(2000).optional(),
  bracketType: bracketTypeSchema,
  maxParticipants: z.number().int().min(2).max(500),
  isPublic: z.boolean().default(true),
  scheduledAt: z.string().datetime().optional(),
  location: z.string().trim().max(200).optional(),
  city: z.string().trim().max(100).optional(),
  tables: tablesSchema,
  prizeFund: z.number().int().min(0).optional(),
  entryFee: z.number().int().min(0).optional(),
  coverGradient: z.string().max(200).optional(),
  prizePlaces: z.array(prizePlaceSchema).max(20).default([]),
})

const updateTournamentSchema = createTournamentSchema.partial()

const registerParticipantSchema = z.object({
  name: z.string().trim().min(2).max(80),
  phone: z.string().regex(/^\+7\d{10}$/).optional(),
  avatar: z.string().url().nullable().optional(),
  userId: z.string().min(1).optional(),
})

const setScoreSchema = z.object({
  score1: z.number().int().min(0).max(99),
  score2: z.number().int().min(0).max(99),
}).refine((d) => d.score1 !== d.score2, { message: 'Ничьи не допускаются' })

const listQuerySchema = z.object({
  status: z.enum(['DRAFT', 'REGISTRATION', 'ACTIVE', 'COMPLETED', 'CANCELLED']).optional(),
  city: z.string().min(1).max(64).optional(),
  organizerId: z.string().min(1).optional(),
  publicOnly: z.coerce.boolean().default(true),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sort: z.enum(['upcoming', 'recent']).default('upcoming'),
})

// ---- Helpers ----

function apiMatchesToDbCreates(tournamentId: string, apiMatches: ApiMatch[]): Array<{
  id: string
  round: number
  matchNumber: number
  participant1Id: string | null
  participant2Id: string | null
  winnerId: string | null
  score1: number | null
  score2: number | null
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'BYE'
  stage: string
  tournamentId: string
  notifiedReady?: boolean
}> {
  return apiMatches.map((m) => ({
    id: m.id,
    tournamentId,
    round: m.round,
    matchNumber: m.matchNumber,
    participant1Id: m.participant1Id ?? null,
    participant2Id: m.participant2Id ?? null,
    winnerId: m.winnerId ?? null,
    score1: m.score1 ?? null,
    score2: m.score2 ?? null,
    status: API_TO_DB_MATCH_STATUS[m.status],
    stage: (m.stage ?? 'main') as string,
  }))
}

function dbMatchToApiMatchForEngine(m: DbMatch): ApiMatch {
  return {
    id: m.id,
    tournamentId: m.tournamentId,
    round: m.round,
    matchNumber: m.matchNumber,
    participant1Id: m.participant1Id ?? undefined,
    participant2Id: m.participant2Id ?? undefined,
    winnerId: m.winnerId ?? undefined,
    score1: m.score1 ?? undefined,
    score2: m.score2 ?? undefined,
    status: m.status === 'PENDING' ? 'pending' :
            m.status === 'IN_PROGRESS' ? 'in-progress' :
            m.status === 'COMPLETED' ? 'completed' : 'bye',
    tableLabel: m.tableLabel ?? undefined,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    stage: (m.stage ?? 'main') as any,
  }
}

function dbParticipantToApiForEngine(p: DbParticipant): ApiParticipant {
  return {
    id: p.id,
    tournamentId: p.tournamentId,
    userId: p.userId ?? undefined,
    name: p.name,
    phone: p.phone ?? undefined,
    avatar: p.avatar ?? undefined,
    seed: p.seed ?? null,
    registeredAt: p.registeredAt.toISOString(),
    checkedIn: p.checkedIn,
    paid: p.paid,
    position: p.position,
  }
}

// ---- Routes ----

export async function registerRoutes(app: FastifyInstance): Promise<void> {
  app.get('/health', async () => ({ status: 'ok', service: 'tournament', time: new Date().toISOString() }))

  // GET /tournaments — публичный каталог.
  app.get('/tournaments', async (req, reply) => {
    const parsed = listQuerySchema.safeParse(req.query)
    if (!parsed.success) return reply.code(400).send({ code: 'VALIDATION_ERROR', details: parsed.error.flatten() })
    const q = parsed.data
    const items = await prisma.tournament.findMany({
      where: {
        ...(q.publicOnly ? { isPublic: true } : {}),
        ...(q.status ? { status: q.status as DbStatus } : { status: { in: ['REGISTRATION', 'ACTIVE'] } }),
        ...(q.city ? { city: q.city } : {}),
        ...(q.organizerId ? { organizerId: q.organizerId } : {}),
      },
      include: FULL_INCLUDE,
      orderBy: q.sort === 'upcoming'
        ? [{ scheduledAt: 'asc' }, { createdAt: 'desc' }]
        : [{ createdAt: 'desc' }],
      take: q.limit,
    })
    return { tournaments: items.map(dbTournamentToApi) }
  })

  // GET /tournaments/:id — публичный просмотр.
  app.get<{ Params: { id: string } }>('/tournaments/:id', async (req, reply) => {
    const t = await loadFull(req.params.id)
    if (!t) return reply.code(404).send({ code: 'NOT_FOUND' })
    // Приватный турнир показываем только организатору.
    if (!t.isPublic) {
      const user = await authenticate(req)
      if (!user || isUnauthorizedOrganizer(t, user)) {
        return reply.code(403).send({ code: 'NOT_PUBLIC' })
      }
    }
    return { tournament: dbTournamentToApi(t) }
  })

  // GET /tournaments/by-invite/:code — поиск приватного по invite-коду.
  app.get<{ Params: { code: string } }>('/tournaments/by-invite/:code', async (req, reply) => {
    const t = await prisma.tournament.findUnique({ where: { inviteCode: req.params.code }, include: FULL_INCLUDE })
    if (!t) return reply.code(404).send({ code: 'NOT_FOUND' })
    return { tournament: dbTournamentToApi(t) }
  })

  // GET /organizer/tournaments — список «моих» турниров (организатор).
  app.get('/organizer/tournaments', async (req, reply) => {
    const user = await requireAuth(req)
    if (!user) return reply.code(401).send({ code: 'UNAUTHORIZED' })
    const items = await prisma.tournament.findMany({
      where: { organizerId: user.id },
      include: FULL_INCLUDE,
      orderBy: [{ createdAt: 'desc' }],
    })
    return { tournaments: items.map(dbTournamentToApi) }
  })

  // POST /organizer/tournaments — создание.
  app.post('/organizer/tournaments', async (req, reply) => {
    const user = await requireAuth(req)
    if (!user) return reply.code(401).send({ code: 'UNAUTHORIZED' })
    const parsed = createTournamentSchema.safeParse(req.body)
    if (!parsed.success) return reply.code(400).send({ code: 'VALIDATION_ERROR', details: parsed.error.flatten() })
    const d = parsed.data
    const created = await prisma.tournament.create({
      data: {
        name: d.name,
        description: d.description,
        organizerId: user.id,
        organizerName: user.name,
        status: d.isPublic ? 'REGISTRATION' : 'DRAFT',
        bracketType: API_TO_DB_BRACKET[d.bracketType],
        maxParticipants: d.maxParticipants,
        isPublic: d.isPublic,
        scheduledAt: d.scheduledAt ? new Date(d.scheduledAt) : null,
        prizeFund: d.prizeFund ?? null,
        entryFee: d.entryFee ?? null,
        location: d.location ?? null,
        city: d.city ?? null,
        tables: d.tables ?? [],
        coverGradient: d.coverGradient ?? null,
        prizePlaces: { create: d.prizePlaces },
      },
      include: FULL_INCLUDE,
    })
    return reply.code(201).send({ tournament: dbTournamentToApi(created) })
  })

  // PATCH /organizer/tournaments/:id — изменение свойств (только REGISTRATION/DRAFT).
  app.patch<{ Params: { id: string } }>('/organizer/tournaments/:id', async (req, reply) => {
    const user = await requireAuth(req)
    if (!user) return reply.code(401).send({ code: 'UNAUTHORIZED' })
    const t = await prisma.tournament.findUnique({ where: { id: req.params.id } })
    if (!t) return reply.code(404).send({ code: 'NOT_FOUND' })
    if (isUnauthorizedOrganizer(t, user)) return reply.code(403).send({ code: 'FORBIDDEN' })
    if (t.status === 'ACTIVE' || t.status === 'COMPLETED') {
      return reply.code(409).send({ code: 'IMMUTABLE_STATE', message: 'Турнир уже идёт или завершён' })
    }
    const parsed = updateTournamentSchema.safeParse(req.body)
    if (!parsed.success) return reply.code(400).send({ code: 'VALIDATION_ERROR', details: parsed.error.flatten() })
    const d = parsed.data
    // prizePlaces — replace-all
    if (d.prizePlaces) {
      await prisma.prizePlace.deleteMany({ where: { tournamentId: t.id } })
    }
    const updated = await prisma.tournament.update({
      where: { id: t.id },
      data: {
        ...(d.name !== undefined && { name: d.name }),
        ...(d.description !== undefined && { description: d.description ?? null }),
        ...(d.bracketType !== undefined && { bracketType: API_TO_DB_BRACKET[d.bracketType] }),
        ...(d.maxParticipants !== undefined && { maxParticipants: d.maxParticipants }),
        ...(d.isPublic !== undefined && { isPublic: d.isPublic }),
        ...(d.scheduledAt !== undefined && { scheduledAt: d.scheduledAt ? new Date(d.scheduledAt) : null }),
        ...(d.location !== undefined && { location: d.location ?? null }),
        ...(d.city !== undefined && { city: d.city ?? null }),
        ...(d.tables !== undefined && { tables: d.tables ?? [] }),
        ...(d.prizeFund !== undefined && { prizeFund: d.prizeFund ?? null }),
        ...(d.entryFee !== undefined && { entryFee: d.entryFee ?? null }),
        ...(d.coverGradient !== undefined && { coverGradient: d.coverGradient ?? null }),
        ...(d.prizePlaces !== undefined && { prizePlaces: { create: d.prizePlaces } }),
      },
      include: FULL_INCLUDE,
    })
    return { tournament: dbTournamentToApi(updated) }
  })

  // DELETE /organizer/tournaments/:id
  app.delete<{ Params: { id: string } }>('/organizer/tournaments/:id', async (req, reply) => {
    const user = await requireAuth(req)
    if (!user) return reply.code(401).send({ code: 'UNAUTHORIZED' })
    const t = await prisma.tournament.findUnique({ where: { id: req.params.id } })
    if (!t) return reply.code(404).send({ code: 'NOT_FOUND' })
    if (isUnauthorizedOrganizer(t, user)) return reply.code(403).send({ code: 'FORBIDDEN' })
    await prisma.tournament.delete({ where: { id: t.id } })
    return reply.code(204).send()
  })

  // POST /tournaments/:id/participants — регистрация участника.
  // Право регистрации:
  //   — авторизованный пользователь регистрирует себя (auth.id = userId),
  //   — организатор турнира регистрирует кого угодно (с userId по lookup или без).
  app.post<{ Params: { id: string } }>('/tournaments/:id/participants', async (req, reply) => {
    const user = await requireAuth(req)
    if (!user) return reply.code(401).send({ code: 'UNAUTHORIZED' })
    const t = await loadFull(req.params.id)
    if (!t) return reply.code(404).send({ code: 'NOT_FOUND' })
    if (t.status !== 'REGISTRATION' && t.status !== 'DRAFT') {
      return reply.code(409).send({ code: 'NOT_REGISTERING', message: 'Регистрация на турнир закрыта' })
    }
    if (t.participants.length >= t.maxParticipants) {
      return reply.code(409).send({ code: 'FULL', message: 'Свободных мест нет' })
    }
    const parsed = registerParticipantSchema.safeParse(req.body)
    if (!parsed.success) return reply.code(400).send({ code: 'VALIDATION_ERROR', details: parsed.error.flatten() })
    const d = parsed.data
    const isOrganizer = t.organizerId === user.id
    // Если запрашивающий — не организатор, он может зарегистрировать только себя.
    if (!isOrganizer) {
      if (d.userId && d.userId !== user.id) {
        return reply.code(403).send({ code: 'FORBIDDEN_SELF_ONLY' })
      }
      d.userId = user.id
    }
    // Дедуп по phone/userId — на уровне БД unique индексы, но даём понятную ошибку до удара в БД.
    if (d.phone && t.participants.some((p) => p.phone === d.phone)) {
      return reply.code(409).send({ code: 'DUPLICATE_PHONE' })
    }
    if (d.userId && t.participants.some((p) => p.userId === d.userId)) {
      return reply.code(409).send({ code: 'DUPLICATE_USER' })
    }
    try {
      const created = await prisma.participant.create({
        data: {
          tournamentId: t.id,
          userId: d.userId ?? null,
          name: d.name,
          phone: d.phone ?? null,
          avatar: d.avatar ?? null,
          seed: t.participants.length + 1,
          position: t.participants.length,
        },
      })
      await prisma.tournament.update({
        where: { id: t.id },
        data: { participantCount: { increment: 1 } },
      })
      // Уведомляем организатора о новой регистрации (если у него привязан Telegram).
      // Самому себе уведомление не шлём (организатор добавил участника вручную и так это видит,
      // но если организатор регистрирует себя как игрока — тоже без смысла дублировать).
      const newCount = t.participants.length + 1
      if (t.organizerId !== created.userId) {
        void notifyBot({
          event: 'participant_registered',
          userIds: [t.organizerId],
          data: {
            tournamentId: t.id,
            tournamentName: t.name,
            participantName: created.name,
            participantPhone: created.phone ?? null,
            registeredCount: newCount,
            maxParticipants: t.maxParticipants,
            remainingSlots: Math.max(0, t.maxParticipants - newCount),
            url: tournamentPublicUrl(t),
          },
        }, req.log)
      }
      return reply.code(201).send({ participant: { ...created, registeredAt: created.registeredAt.toISOString() } })
    } catch (err) {
      if (typeof err === 'object' && err !== null && 'code' in err && (err as { code?: unknown }).code === 'P2002') {
        return reply.code(409).send({ code: 'DUPLICATE' })
      }
      throw err
    }
  })

  // PATCH /tournaments/:id/participants/:pid — toggle checkin (организатор).
  app.patch<{ Params: { id: string; pid: string } }>('/tournaments/:id/participants/:pid', async (req, reply) => {
    const user = await requireAuth(req)
    if (!user) return reply.code(401).send({ code: 'UNAUTHORIZED' })
    const t = await prisma.tournament.findUnique({ where: { id: req.params.id } })
    if (!t) return reply.code(404).send({ code: 'NOT_FOUND' })
    if (isUnauthorizedOrganizer(t, user)) return reply.code(403).send({ code: 'FORBIDDEN' })
    const p = await prisma.participant.findUnique({ where: { id: req.params.pid } })
    if (!p || p.tournamentId !== t.id) return reply.code(404).send({ code: 'PARTICIPANT_NOT_FOUND' })
    const updated = await prisma.participant.update({
      where: { id: p.id },
      data: { checkedIn: !p.checkedIn },
    })
    return { participant: { ...updated, registeredAt: updated.registeredAt.toISOString() } }
  })

  // PATCH /tournaments/:id/participants/:pid/paid — toggle оплаты взноса (организатор).
  app.patch<{ Params: { id: string; pid: string } }>('/tournaments/:id/participants/:pid/paid', async (req, reply) => {
    const user = await requireAuth(req)
    if (!user) return reply.code(401).send({ code: 'UNAUTHORIZED' })
    const t = await prisma.tournament.findUnique({ where: { id: req.params.id } })
    if (!t) return reply.code(404).send({ code: 'NOT_FOUND' })
    if (isUnauthorizedOrganizer(t, user)) return reply.code(403).send({ code: 'FORBIDDEN' })
    const p = await prisma.participant.findUnique({ where: { id: req.params.pid } })
    if (!p || p.tournamentId !== t.id) return reply.code(404).send({ code: 'PARTICIPANT_NOT_FOUND' })
    const updated = await prisma.participant.update({
      where: { id: p.id },
      data: { paid: !p.paid },
    })
    return { participant: { ...updated, registeredAt: updated.registeredAt.toISOString() } }
  })

  // DELETE /tournaments/:id/participants/:pid — снять регистрацию.
  app.delete<{ Params: { id: string; pid: string } }>('/tournaments/:id/participants/:pid', async (req, reply) => {
    const user = await requireAuth(req)
    if (!user) return reply.code(401).send({ code: 'UNAUTHORIZED' })
    const t = await prisma.tournament.findUnique({ where: { id: req.params.id } })
    if (!t) return reply.code(404).send({ code: 'NOT_FOUND' })
    const p = await prisma.participant.findUnique({ where: { id: req.params.pid } })
    if (!p || p.tournamentId !== t.id) return reply.code(404).send({ code: 'PARTICIPANT_NOT_FOUND' })
    const isOrganizer = t.organizerId === user.id
    const isSelf = !!p.userId && p.userId === user.id
    if (!isOrganizer && !isSelf) return reply.code(403).send({ code: 'FORBIDDEN' })
    if (t.status !== 'REGISTRATION' && t.status !== 'DRAFT') {
      return reply.code(409).send({ code: 'IMMUTABLE_STATE' })
    }
    await prisma.participant.delete({ where: { id: p.id } })
    await prisma.tournament.update({ where: { id: t.id }, data: { participantCount: { decrement: 1 } } })
    return reply.code(204).send()
  })

  // POST /organizer/tournaments/:id/start — запуск турнира: генерируем сетку, ставим ACTIVE.
  app.post<{ Params: { id: string } }>('/organizer/tournaments/:id/start', async (req, reply) => {
    const user = await requireAuth(req)
    if (!user) return reply.code(401).send({ code: 'UNAUTHORIZED' })
    const t = await loadFull(req.params.id)
    if (!t) return reply.code(404).send({ code: 'NOT_FOUND' })
    if (isUnauthorizedOrganizer(t, user)) return reply.code(403).send({ code: 'FORBIDDEN' })
    if (t.status === 'ACTIVE' || t.status === 'COMPLETED') {
      return reply.code(409).send({ code: 'ALREADY_STARTED' })
    }
    const apiType = DB_TO_API_BRACKET[t.bracketType]
    const min = minParticipantsFor(apiType)
    if (t.participants.length < min) {
      return reply.code(400).send({ code: 'NOT_ENOUGH_PARTICIPANTS', min, current: t.participants.length })
    }
    // Используем shared-генератор. Он работает с API-типами.
    const apiParticipants = t.participants.sort((a, b) => a.position - b.position).map(dbParticipantToApiForEngine)
    const apiMatches = buildBracket(apiType, t.id, apiParticipants)
    const dbCreates = apiMatchesToDbCreates(t.id, apiMatches)

    await prisma.$transaction([
      prisma.match.deleteMany({ where: { tournamentId: t.id } }),
      prisma.match.createMany({ data: dbCreates }),
      prisma.tournament.update({ where: { id: t.id }, data: { status: 'ACTIVE' } }),
    ])
    await reassignTables(t.id)

    const fresh = await loadFull(t.id)
    if (!fresh) return reply.code(500).send({ code: 'RACE_CONDITION' })

    // Notify: всем участникам — "турнир стартовал"; готовым игрокам — "ваш матч готов".
    const allUserIds = fresh.participants.map((p) => p.userId).filter((x): x is string => !!x)
    void notifyBot({
      event: 'tournament_started',
      userIds: allUserIds,
      data: {
        tournamentId: fresh.id,
        tournamentName: fresh.name,
        bracketType: apiType,
        url: tournamentPublicUrl(fresh),
      },
    }, req.log)
    await dispatchMatchReadyNotifications(fresh, req.log)
    return { tournament: dbTournamentToApi(fresh) }
  })

  // POST /organizer/tournaments/:id/complete — завершить.
  app.post<{ Params: { id: string } }>('/organizer/tournaments/:id/complete', async (req, reply) => {
    const user = await requireAuth(req)
    if (!user) return reply.code(401).send({ code: 'UNAUTHORIZED' })
    const t = await loadFull(req.params.id)
    if (!t) return reply.code(404).send({ code: 'NOT_FOUND' })
    if (isUnauthorizedOrganizer(t, user)) return reply.code(403).send({ code: 'FORBIDDEN' })
    if (t.status === 'COMPLETED') return { tournament: dbTournamentToApi(t) }
    await prisma.tournament.update({ where: { id: t.id }, data: { status: 'COMPLETED' } })
    const fresh = await loadFull(t.id)
    if (!fresh) return reply.code(500).send({ code: 'RACE_CONDITION' })
    const allUserIds = fresh.participants.map((p) => p.userId).filter((x): x is string => !!x)
    void notifyBot({
      event: 'tournament_completed',
      userIds: allUserIds,
      data: { tournamentId: fresh.id, tournamentName: fresh.name, url: tournamentPublicUrl(fresh) },
    }, req.log)
    return { tournament: dbTournamentToApi(fresh) }
  })

  // POST /organizer/tournaments/:id/matches/:matchId/score — выставить счёт.
  app.post<{ Params: { id: string; matchId: string } }>(
    '/organizer/tournaments/:id/matches/:matchId/score',
    async (req, reply) => {
      const user = await requireAuth(req)
      if (!user) return reply.code(401).send({ code: 'UNAUTHORIZED' })
      const t = await loadFull(req.params.id)
      if (!t) return reply.code(404).send({ code: 'NOT_FOUND' })
      if (isUnauthorizedOrganizer(t, user)) return reply.code(403).send({ code: 'FORBIDDEN' })
      if (t.status === 'COMPLETED') return reply.code(409).send({ code: 'TOURNAMENT_COMPLETED' })
      const parsed = setScoreSchema.safeParse(req.body)
      if (!parsed.success) return reply.code(400).send({ code: 'VALIDATION_ERROR', details: parsed.error.flatten() })
      const match = t.matches.find((m) => m.id === req.params.matchId)
      if (!match) return reply.code(404).send({ code: 'MATCH_NOT_FOUND' })

      // Прогоняем через shared-движок: он применит результат + пробросит победителя дальше.
      const apiType = DB_TO_API_BRACKET[t.bracketType]
      const apiMatches = t.matches.map(dbMatchToApiMatchForEngine)
      const apiParticipants = t.participants.sort((a, b) => a.position - b.position).map(dbParticipantToApiForEngine)
      const newApiMatches = applyMatchResult(
        apiType, t.id, apiMatches, match.id, parsed.data.score1, parsed.data.score2, apiParticipants,
      )

      // Применяем дифф. Полная замена — проще и атомарно.
      const dbCreates = apiMatchesToDbCreates(t.id, newApiMatches)
      await prisma.$transaction([
        prisma.match.deleteMany({ where: { tournamentId: t.id } }),
        prisma.match.createMany({ data: dbCreates }),
      ])
      await reassignTables(t.id)

      const fresh = await loadFull(t.id)
      if (!fresh) return reply.code(500).send({ code: 'RACE_CONDITION' })
      void notifyBot({
        event: 'match_completed',
        userIds: [match.participant1Id, match.participant2Id]
          .map((pid) => pid ? fresh.participants.find((p) => p.id === pid)?.userId : null)
          .filter((x): x is string => !!x),
        data: {
          tournamentId: fresh.id,
          tournamentName: fresh.name,
          matchId: match.id,
          score1: parsed.data.score1,
          score2: parsed.data.score2,
        },
      }, req.log)
      await dispatchMatchReadyNotifications(fresh, req.log)
      return { tournament: dbTournamentToApi(fresh) }
    },
  )
}

/** Возвращает публичный URL турнира из env PUBLIC_APP_URL — bot форматирует красивые ссылки. */
export function tournamentPublicUrl(t: { id: string }): string {
  const base = process.env.PUBLIC_APP_URL ?? 'http://localhost:5173'
  return `${base.replace(/\/$/, '')}/tournaments/${t.id}`
}

/**
 * Рассылает «ваш матч готов» по всем матчам, которые сейчас «готовы к игре» и ещё не отправляли.
 * После отправки — выставляем notifiedReady=true, чтобы не дублировать.
 */
async function dispatchMatchReadyNotifications(
  t: FullDbTournament,
  log: { warn: (o: unknown, m?: string) => void },
): Promise<void> {
  const participantById = new Map(t.participants.map((p) => [p.id, p]))
  const ready = t.matches.filter((m) =>
    m.status !== 'COMPLETED' && m.status !== 'BYE' &&
    m.participant1Id && m.participant2Id && !m.notifiedReady,
  )
  if (ready.length === 0) return

  for (const m of ready) {
    const p1 = m.participant1Id ? participantById.get(m.participant1Id) : null
    const p2 = m.participant2Id ? participantById.get(m.participant2Id) : null
    const userIds = [p1?.userId, p2?.userId].filter((x): x is string => !!x)
    if (userIds.length === 0) continue
    await notifyBot({
      event: 'match_ready',
      userIds,
      data: {
        tournamentId: t.id,
        tournamentName: t.name,
        matchId: m.id,
        round: m.round,
        tableLabel: m.tableLabel,
        opponentByUserId: Object.fromEntries(
          [
            p1?.userId ? [p1.userId, { name: p2?.name ?? '—', avatar: p2?.avatar ?? null }] : null,
            p2?.userId ? [p2.userId, { name: p1?.name ?? '—', avatar: p1?.avatar ?? null }] : null,
          ].filter((x): x is [string, { name: string; avatar: string | null }] => !!x),
        ),
        url: tournamentPublicUrl(t),
      },
    }, log)
  }

  await prisma.match.updateMany({
    where: { id: { in: ready.map((m) => m.id) } },
    data: { notifiedReady: true },
  })
}

// Используется в тестах
export type { ApiTournament }
