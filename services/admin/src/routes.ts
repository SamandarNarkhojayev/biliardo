import type { FastifyInstance, FastifyRequest } from 'fastify'
import { timingSafeEqual } from 'node:crypto'
import { z } from 'zod'
import type {
  AdminOverview,
  AdminHealth,
  AdminSqlResult,
} from '@billiard/shared'
import { prisma } from './db.js'
import { env, isSuperAdmin } from './config.js'
import { requireAdmin, requireSuperAdmin, type AuthContext } from './auth-context.js'
import { q, exec, runSql, buildUpdate, type ColSpec } from './sql.js'
import { notifyAdmins } from './alerts.js'
import { exportDatabase } from './export.js'
import { healthHistory } from './health-history.js'
import { pingAll } from './pings.js'
import {
  spawnPgDump, runBackupToFile, listBackups, backupFilePath, openBackupForRead,
} from './backup.js'
import { existsSync } from 'node:fs'

function safeEqualInternalSecret(presented: unknown): boolean {
  if (typeof presented !== 'string') return false
  const a = Buffer.from(presented)
  const b = Buffer.from(env.INTERNAL_SECRET)
  if (a.length !== b.length) return false
  return timingSafeEqual(a, b)
}

function one<T>(rows: T[], fallback: T): T {
  return rows.length > 0 ? rows[0] : fallback
}

const pageQuery = z.object({
  search: z.string().trim().max(120).default(''),
  limit: z.coerce.number().int().min(1).max(500).default(50),
  offset: z.coerce.number().int().min(0).default(0),
})

const sqlBody = z.object({
  sql: z.string().min(1).max(50_000),
})

const alertBody = z.object({
  level: z.enum(['info', 'warning', 'error', 'critical']).default('error'),
  source: z.string().min(1).max(80).default('manual'),
  title: z.string().min(1).max(200),
  message: z.string().min(1).max(4000),
  context: z.unknown().optional(),
})

const activityIngest = z.object({
  userId: z.string().nullable().optional(),
  userName: z.string().nullable().optional(),
  role: z.string().nullable().optional(),
  method: z.string().max(10),
  path: z.string().max(500),
  statusCode: z.number().int().nullable().optional(),
  ip: z.string().max(64).nullable().optional(),
  userAgent: z.string().max(500).nullable().optional(),
  durationMs: z.number().int().nullable().optional(),
})

// Белые списки колонок для структурного редактирования (имена НЕ из пользовательского ввода).
const USER_COLS: Record<string, ColSpec> = {
  name: {},
  role: { cast: '"auth"."UserRole"' },
  accountType: { cast: '"auth"."AccountType"' },
  clubName: {},
}
const TOURNAMENT_COLS: Record<string, ColSpec> = {
  name: {},
  status: { cast: '"tournament"."TournamentStatus"' },
  maxParticipants: { cast: 'int' },
  isPublic: { cast: 'boolean' },
  city: {},
  entryFee: { cast: 'int' },
  prizeFund: { cast: 'int' },
}
const PAYMENT_COLS: Record<string, ColSpec> = {
  status: { cast: '"payment"."PaymentStatus"' },
}

const userPatch = z.object({
  name: z.string().trim().min(1).max(120).optional(),
  role: z.enum(['PLAYER', 'ORGANIZER', 'ADMIN']).optional(),
  accountType: z.enum(['PLAYER', 'CLUB']).optional(),
  clubName: z.string().trim().max(120).nullable().optional(),
})
const tournamentPatch = z.object({
  name: z.string().trim().min(1).max(120).optional(),
  status: z.enum(['DRAFT', 'REGISTRATION', 'ACTIVE', 'COMPLETED', 'CANCELLED']).optional(),
  maxParticipants: z.number().int().min(2).max(1000).optional(),
  isPublic: z.boolean().optional(),
  city: z.string().trim().max(120).nullable().optional(),
  entryFee: z.number().int().min(0).nullable().optional(),
  prizeFund: z.number().int().min(0).nullable().optional(),
})
const paymentPatch = z.object({
  status: z.enum(['PENDING', 'COMPLETED', 'FAILED', 'EXPIRED', 'REFUNDED']),
})

// IPv4 (xxx.xxx.xxx.xxx) или IPv6 (упрощённая проверка: hex+двоеточия). Длина <=45.
const ipPattern = /^(?:\d{1,3}\.){3}\d{1,3}$|^[0-9a-fA-F:]+$/
const ipBanCreate = z.object({
  ip: z.string().trim().min(3).max(45).regex(ipPattern, 'Неверный формат IP'),
  reason: z.string().trim().max(500).optional(),
  // null/undefined = бессрочно
  until: z.string().datetime().nullable().optional(),
})
const metricsQuery = z.object({ days: z.coerce.number().int().min(1).max(365).default(30) })

/** Пишет действие админа в аудит (отдельно от gateway-аудита). */
async function logAction(user: AuthContext, method: string, path: string, ip: string): Promise<void> {
  await prisma.activityLog.create({
    data: {
      userId: user.id, userName: user.name, role: user.role,
      method, path, statusCode: null, ip, userAgent: 'admin-action', durationMs: null,
    },
  }).catch(() => undefined)
}

function paramId(req: FastifyRequest): string {
  return (req.params as { id: string }).id
}

export async function registerRoutes(app: FastifyInstance): Promise<void> {
  app.get('/health', async () => ({ status: 'ok', service: 'admin', time: new Date().toISOString() }))

  // Кто я и что мне можно (для гейтинга UI).
  app.get('/admin/me', async (req, reply) => {
    const user = requireAdmin(req, reply)
    if (!user) return
    return { id: user.id, name: user.name, role: user.role, isSuper: isSuperAdmin(user.id) }
  })

  // ---- Сводка ----
  app.get('/admin/overview', async (req, reply) => {
    if (!requireAdmin(req, reply)) return
    const [users, tournaments, participants, payments, subs, clubsOnline, activity, alerts] = await Promise.all([
      q<{ total: number; players: number; clubs: number; admins: number; newToday: number }>(
        `SELECT count(*)::int total,
          count(*) FILTER (WHERE "accountType"='PLAYER')::int players,
          count(*) FILTER (WHERE "accountType"='CLUB')::int clubs,
          count(*) FILTER (WHERE role='ADMIN')::int admins,
          count(*) FILTER (WHERE "createdAt" >= now() - interval '1 day')::int "newToday"
        FROM auth."User"`,
      ),
      q<{ total: number; active: number; registration: number; completed: number }>(
        `SELECT count(*)::int total,
          count(*) FILTER (WHERE status='ACTIVE')::int active,
          count(*) FILTER (WHERE status='REGISTRATION')::int registration,
          count(*) FILTER (WHERE status='COMPLETED')::int completed
        FROM tournament."Tournament"`,
      ),
      q<{ total: number }>(`SELECT count(*)::int total FROM tournament."Participant"`),
      q<{ total: number; completed: number; pending: number; revenueKzt: number }>(
        `SELECT count(*)::int total,
          count(*) FILTER (WHERE status='COMPLETED')::int completed,
          count(*) FILTER (WHERE status='PENDING')::int pending,
          coalesce(sum("amountKzt") FILTER (WHERE status='COMPLETED'), 0)::bigint "revenueKzt"
        FROM payment."Payment"`,
      ),
      q<{ active: number }>(
        `SELECT count(*)::int active FROM payment."Subscription" WHERE status='ACTIVE' AND "endsAt" > now()`,
      ),
      q<{ online: number }>(
        `SELECT count(*)::int online FROM club."ClubSyncSnapshot" WHERE "syncedAt" > now() - interval '60 seconds'`,
      ),
      q<{ last24h: number; uniqueUsers24h: number }>(
        `SELECT count(*)::int last24h, count(DISTINCT "userId")::int "uniqueUsers24h"
        FROM admin.activity_log WHERE "createdAt" > now() - interval '1 day'`,
      ),
      q<{ last24h: number }>(
        `SELECT count(*)::int last24h FROM admin.alert_log WHERE "createdAt" > now() - interval '1 day'`,
      ),
    ])

    const u = one(users, { total: 0, players: 0, clubs: 0, admins: 0, newToday: 0 })
    const t = one(tournaments, { total: 0, active: 0, registration: 0, completed: 0 })
    const p = one(payments, { total: 0, completed: 0, pending: 0, revenueKzt: 0 })
    const a = one(activity, { last24h: 0, uniqueUsers24h: 0 })

    const result: AdminOverview = {
      users: u,
      tournaments: t,
      participants: one(participants, { total: 0 }),
      payments: p,
      subscriptions: { active: one(subs, { active: 0 }).active },
      clubs: { total: u.clubs, online: one(clubsOnline, { online: 0 }).online },
      activity: a,
      alerts: { last24h: one(alerts, { last24h: 0 }).last24h },
    }
    return result
  })

  // ---- Пользователи ----
  app.get('/admin/users', async (req, reply) => {
    if (!requireAdmin(req, reply)) return
    const { search, limit, offset } = pageQuery.parse(req.query)
    const rows = await q(
      `SELECT u.id, u.phone, u.name, u.role, u."accountType", u."clubName", u."telegramUsername",
        (u."telegramChatId" IS NOT NULL) AS "telegramLinked", u."createdAt",
        (SELECT count(*)::int FROM tournament."Tournament" t WHERE t."organizerId" = u.id) AS "tournamentsCount",
        (SELECT count(*)::int FROM payment."Payment" pm WHERE pm."userId" = u.id) AS "paymentsCount"
      FROM auth."User" u
      WHERE ($1 = '' OR u.name ILIKE '%' || $1 || '%' OR u.phone ILIKE '%' || $1 || '%')
      ORDER BY u."createdAt" DESC
      LIMIT $2 OFFSET $3`,
      search, limit, offset,
    )
    return { users: rows }
  })

  // ---- Турниры ----
  app.get('/admin/tournaments', async (req, reply) => {
    if (!requireAdmin(req, reply)) return
    const { search, limit, offset } = pageQuery.parse(req.query)
    const rows = await q(
      `SELECT id, name, status, "bracketType", "organizerId", "organizerName",
        "maxParticipants", "participantCount", "isPublic", city, "entryFee", "prizeFund",
        "scheduledAt", "createdAt"
      FROM tournament."Tournament"
      WHERE ($1 = '' OR name ILIKE '%' || $1 || '%' OR coalesce(city,'') ILIKE '%' || $1 || '%')
      ORDER BY "createdAt" DESC
      LIMIT $2 OFFSET $3`,
      search, limit, offset,
    )
    return { tournaments: rows }
  })

  // ---- Платежи ----
  app.get('/admin/payments', async (req, reply) => {
    if (!requireAdmin(req, reply)) return
    const { search, limit, offset } = pageQuery.parse(req.query)
    const rows = await q(
      `SELECT p.id, p."userId", u.name AS "userName", u.phone AS "userPhone",
        p."planCode", p."amountKzt", p.status, p.provider, p."targetType",
        p."tournamentId", p."externalId", p."createdAt", p."completedAt"
      FROM payment."Payment" p
      LEFT JOIN auth."User" u ON u.id = p."userId"
      WHERE ($1 = '' OR u.name ILIKE '%' || $1 || '%' OR p."planCode" ILIKE '%' || $1 || '%' OR p.status::text ILIKE '%' || $1 || '%')
      ORDER BY p."createdAt" DESC
      LIMIT $2 OFFSET $3`,
      search, limit, offset,
    )
    return { payments: rows }
  })

  // ---- Клубы (CLUB-аккаунты + последний sync) ----
  app.get('/admin/clubs', async (req, reply) => {
    if (!requireAdmin(req, reply)) return
    const rows = await q(
      `SELECT u.id, u.name, u."clubName", u.phone, u."createdAt",
        s."syncedAt", (s."syncedAt" > now() - interval '60 seconds') AS online, s.revenue
      FROM auth."User" u
      LEFT JOIN club."ClubSyncSnapshot" s ON s."clubId" = u.id
      WHERE u."accountType" = 'CLUB'
      ORDER BY u."createdAt" DESC`,
    )
    return { clubs: rows }
  })

  // ---- Участники турнира ----
  app.get('/admin/tournaments/:id/participants', async (req, reply) => {
    if (!requireAdmin(req, reply)) return
    const id = (req.params as { id: string }).id
    const rows = await q(
      `SELECT id, name, phone, "userId", seed, "checkedIn", paid, position, "registeredAt"
       FROM tournament."Participant" WHERE "tournamentId" = $1 ORDER BY position ASC`,
      id,
    )
    return { participants: rows }
  })

  // ---- Активность (аудит) ----
  app.get('/admin/activity', async (req, reply) => {
    if (!requireAdmin(req, reply)) return
    const { search, limit, offset } = pageQuery.parse(req.query)
    const rows = await q(
      `SELECT id, "userId", "userName", role, method, path, "statusCode", ip, "userAgent", "durationMs", "createdAt"
      FROM admin.activity_log
      WHERE ($1 = '' OR "userId" = $1 OR path ILIKE '%' || $1 || '%' OR coalesce("userName",'') ILIKE '%' || $1 || '%')
      ORDER BY "createdAt" DESC
      LIMIT $2 OFFSET $3`,
      search, limit, offset,
    )
    return { activity: rows }
  })

  // ---- Сессии: склейка активности по таймауту бездействия (30 мин) ----
  app.get('/admin/activity/sessions', async (req, reply) => {
    if (!requireAdmin(req, reply)) return
    const limit = pageQuery.parse(req.query).limit
    const rows = await q(
      `WITH ordered AS (
        SELECT "userId", "userName", "createdAt",
          LAG("createdAt") OVER (PARTITION BY "userId" ORDER BY "createdAt") AS prev
        FROM admin.activity_log
        WHERE "userId" IS NOT NULL AND "createdAt" > now() - interval '7 days'
      ),
      marked AS (
        SELECT *, CASE WHEN prev IS NULL OR "createdAt" - prev > interval '30 minutes' THEN 1 ELSE 0 END AS new_session
        FROM ordered
      ),
      grouped AS (
        SELECT *, SUM(new_session) OVER (PARTITION BY "userId" ORDER BY "createdAt") AS grp
        FROM marked
      )
      SELECT "userId", max("userName") AS "userName",
        min("createdAt") AS "startedAt", max("createdAt") AS "lastSeenAt",
        EXTRACT(EPOCH FROM (max("createdAt") - min("createdAt")))::int AS "durationSec",
        count(*)::int AS requests
      FROM grouped
      GROUP BY "userId", grp
      ORDER BY "startedAt" DESC
      LIMIT $1`,
      limit,
    )
    return { sessions: rows }
  })

  // ---- Алерты (журнал) ----
  app.get('/admin/alerts', async (req, reply) => {
    if (!requireAdmin(req, reply)) return
    const { limit, offset } = pageQuery.parse(req.query)
    const rows = await q(
      `SELECT id, level, source, title, message, context, notified, "createdAt"
       FROM admin.alert_log ORDER BY "createdAt" DESC LIMIT $1 OFFSET $2`,
      limit, offset,
    )
    return { alerts: rows }
  })

  // Тестовый алерт — проверить, что Telegram доходит.
  app.post('/admin/alerts/test', async (req, reply) => {
    const user = requireAdmin(req, reply)
    if (!user) return
    const res = await notifyAdmins({
      level: 'info',
      source: 'admin',
      title: 'Тестовый алерт',
      message: `Проверка связи. Инициатор: ${user.name}.`,
    }, req.log)
    return res
  })

  // ---- Здоровье сервера / БД ----
  app.get('/admin/health', async (req, reply) => {
    if (!requireAdmin(req, reply)) return
    const [services, dbSize, conns, tables] = await Promise.all([
      pingAll(),
      q<{ size: number }>(`SELECT pg_database_size(current_database())::bigint AS size`),
      q<{ c: number }>(`SELECT count(*)::int c FROM pg_stat_activity WHERE datname = current_database()`),
      q<{ schema: string; table: string; rows: number }>(
        `SELECT schemaname AS schema, relname AS "table", n_live_tup::int AS rows
         FROM pg_stat_user_tables ORDER BY n_live_tup DESC LIMIT 100`,
      ),
    ])

    const result: AdminHealth = {
      services,
      db: {
        sizeBytes: one(dbSize, { size: 0 }).size,
        connections: one(conns, { c: 0 }).c,
        tables,
      },
    }
    return result
  })

  // ---- SQL-консоль (чтение + запись) ----
  app.post('/admin/sql', async (req, reply) => {
    const user = requireSuperAdmin(req, reply)
    if (!user) return
    const parsed = sqlBody.safeParse(req.body)
    if (!parsed.success) return reply.code(400).send({ code: 'VALIDATION_ERROR', details: parsed.error.flatten() })
    // Аудит: пишем сам факт выполнения запроса (отдельно от gateway-аудита).
    await prisma.activityLog.create({
      data: {
        userId: user.id, userName: user.name, role: user.role,
        method: 'SQL', path: parsed.data.sql.slice(0, 500), statusCode: null,
        ip: req.ip, userAgent: 'admin-console', durationMs: null,
      },
    }).catch(() => undefined)
    try {
      const result: AdminSqlResult = await runSql(parsed.data.sql)
      return result
    } catch (err) {
      return reply.code(400).send({ code: 'SQL_ERROR', message: (err as Error).message })
    }
  })

  // ---- Карточка пользователя ----
  app.get('/admin/users/:id', async (req, reply) => {
    if (!requireAdmin(req, reply)) return
    const id = paramId(req)
    const [user] = await q(
      `SELECT id, phone, name, role, "accountType", "clubName", avatar, "telegramUsername",
        ("telegramChatId" IS NOT NULL) AS "telegramLinked", "createdAt", "updatedAt"
       FROM auth."User" WHERE id = $1`, id,
    )
    if (!user) return reply.code(404).send({ code: 'NOT_FOUND' })
    const [tournaments, payments, participations, recentActivity] = await Promise.all([
      q(`SELECT id, name, status, "participantCount", "maxParticipants", "createdAt"
         FROM tournament."Tournament" WHERE "organizerId" = $1 ORDER BY "createdAt" DESC LIMIT 100`, id),
      q(`SELECT id, "planCode", "amountKzt", status, "targetType", "createdAt"
         FROM payment."Payment" WHERE "userId" = $1 ORDER BY "createdAt" DESC LIMIT 100`, id),
      q(`SELECT t.id AS "tournamentId", t.name, p."registeredAt", p.position, p."checkedIn"
         FROM tournament."Participant" p JOIN tournament."Tournament" t ON t.id = p."tournamentId"
         WHERE p."userId" = $1 ORDER BY p."registeredAt" DESC LIMIT 100`, id),
      q(`SELECT method, path, "statusCode", ip, "createdAt"
         FROM admin.activity_log WHERE "userId" = $1 ORDER BY "createdAt" DESC LIMIT 50`, id),
    ])
    return { user, tournaments, payments, participations, recentActivity }
  })

  app.patch('/admin/users/:id', async (req, reply) => {
    const admin = requireSuperAdmin(req, reply)
    if (!admin) return
    const id = paramId(req)
    const parsed = userPatch.safeParse(req.body)
    if (!parsed.success) return reply.code(400).send({ code: 'VALIDATION_ERROR', details: parsed.error.flatten() })
    const built = buildUpdate({ schema: 'auth', table: 'User', allowed: USER_COLS, patch: parsed.data, idValue: id, touchUpdatedAt: true })
    if (!built) return reply.code(400).send({ code: 'NO_FIELDS' })
    const count = await exec(built.sql, ...built.params)
    if (count === 0) return reply.code(404).send({ code: 'NOT_FOUND' })
    await logAction(admin, 'PATCH', `/admin/users/${id}`, req.ip)
    const [user] = await q(`SELECT id, phone, name, role, "accountType", "clubName" FROM auth."User" WHERE id = $1`, id)
    return { user }
  })

  app.delete('/admin/users/:id', async (req, reply) => {
    const admin = requireSuperAdmin(req, reply)
    if (!admin) return
    const id = paramId(req)
    if (id === admin.id) return reply.code(400).send({ code: 'SELF_DELETE', message: 'Нельзя удалить свой аккаунт' })
    const count = await exec(`DELETE FROM auth."User" WHERE id = $1`, id)
    if (count === 0) return reply.code(404).send({ code: 'NOT_FOUND' })
    await logAction(admin, 'DELETE', `/admin/users/${id}`, req.ip)
    return reply.code(204).send()
  })

  // ---- Карточка турнира ----
  app.get('/admin/tournaments/:id', async (req, reply) => {
    if (!requireAdmin(req, reply)) return
    const id = paramId(req)
    const [tournament] = await q(`SELECT * FROM tournament."Tournament" WHERE id = $1`, id)
    if (!tournament) return reply.code(404).send({ code: 'NOT_FOUND' })
    const [participants, matches, prizes, payments] = await Promise.all([
      q(`SELECT id, name, phone, "userId", seed, "checkedIn", paid, position, "registeredAt"
         FROM tournament."Participant" WHERE "tournamentId" = $1 ORDER BY position`, id),
      q(`SELECT id, round, "matchNumber", "participant1Id", "participant2Id", "winnerId", score1, score2, status, "tableLabel", stage
         FROM tournament."Match" WHERE "tournamentId" = $1 ORDER BY round, "matchNumber"`, id),
      q(`SELECT place, prize FROM tournament."PrizePlace" WHERE "tournamentId" = $1 ORDER BY place`, id),
      q(`SELECT id, "userId", "amountKzt", status, "createdAt" FROM payment."Payment" WHERE "tournamentId" = $1 ORDER BY "createdAt" DESC`, id),
    ])
    return { tournament, participants, matches, prizes, payments }
  })

  app.patch('/admin/tournaments/:id', async (req, reply) => {
    const admin = requireSuperAdmin(req, reply)
    if (!admin) return
    const id = paramId(req)
    const parsed = tournamentPatch.safeParse(req.body)
    if (!parsed.success) return reply.code(400).send({ code: 'VALIDATION_ERROR', details: parsed.error.flatten() })
    const built = buildUpdate({ schema: 'tournament', table: 'Tournament', allowed: TOURNAMENT_COLS, patch: parsed.data, idValue: id, touchUpdatedAt: true })
    if (!built) return reply.code(400).send({ code: 'NO_FIELDS' })
    const count = await exec(built.sql, ...built.params)
    if (count === 0) return reply.code(404).send({ code: 'NOT_FOUND' })
    await logAction(admin, 'PATCH', `/admin/tournaments/${id}`, req.ip)
    const [tournament] = await q(`SELECT id, name, status, "maxParticipants", "isPublic", city, "entryFee", "prizeFund" FROM tournament."Tournament" WHERE id = $1`, id)
    return { tournament }
  })

  app.delete('/admin/tournaments/:id', async (req, reply) => {
    const admin = requireSuperAdmin(req, reply)
    if (!admin) return
    const id = paramId(req)
    const count = await exec(`DELETE FROM tournament."Tournament" WHERE id = $1`, id)
    if (count === 0) return reply.code(404).send({ code: 'NOT_FOUND' })
    await logAction(admin, 'DELETE', `/admin/tournaments/${id}`, req.ip)
    return reply.code(204).send()
  })

  // ---- Карточка платежа ----
  app.get('/admin/payments/:id', async (req, reply) => {
    if (!requireAdmin(req, reply)) return
    const id = paramId(req)
    const [payment] = await q(
      `SELECT p.*, u.name AS "userName", u.phone AS "userPhone"
       FROM payment."Payment" p LEFT JOIN auth."User" u ON u.id = p."userId" WHERE p.id = $1`, id,
    )
    if (!payment) return reply.code(404).send({ code: 'NOT_FOUND' })
    return { payment }
  })

  app.patch('/admin/payments/:id', async (req, reply) => {
    const admin = requireSuperAdmin(req, reply)
    if (!admin) return
    const id = paramId(req)
    const parsed = paymentPatch.safeParse(req.body)
    if (!parsed.success) return reply.code(400).send({ code: 'VALIDATION_ERROR', details: parsed.error.flatten() })
    const built = buildUpdate({ schema: 'payment', table: 'Payment', allowed: PAYMENT_COLS, patch: parsed.data, idValue: id })
    if (!built) return reply.code(400).send({ code: 'NO_FIELDS' })
    const count = await exec(built.sql, ...built.params)
    if (count === 0) return reply.code(404).send({ code: 'NOT_FOUND' })
    await logAction(admin, 'PATCH', `/admin/payments/${id}`, req.ip)
    const [payment] = await q(`SELECT id, status, "amountKzt", "planCode" FROM payment."Payment" WHERE id = $1`, id)
    return { payment }
  })

  app.delete('/admin/payments/:id', async (req, reply) => {
    const admin = requireSuperAdmin(req, reply)
    if (!admin) return
    const id = paramId(req)
    // Сначала удаляем связанную подписку (FK), затем платёж — в одной транзакции.
    const res = await prisma.$transaction([
      prisma.$executeRawUnsafe(`DELETE FROM payment."Subscription" WHERE "paymentId" = $1`, id),
      prisma.$executeRawUnsafe(`DELETE FROM payment."Payment" WHERE id = $1`, id),
    ])
    if (res[1] === 0) return reply.code(404).send({ code: 'NOT_FOUND' })
    await logAction(admin, 'DELETE', `/admin/payments/${id}`, req.ip)
    return reply.code(204).send()
  })

  // ---- Карточка клуба ----
  app.get('/admin/clubs/:id', async (req, reply) => {
    if (!requireAdmin(req, reply)) return
    const id = paramId(req)
    const [club] = await q(
      `SELECT u.id, u.name, u."clubName", u.phone, u."createdAt", u."telegramUsername",
        ("telegramChatId" IS NOT NULL) AS "telegramLinked"
       FROM auth."User" u WHERE u.id = $1 AND u."accountType" = 'CLUB'`, id,
    )
    if (!club) return reply.code(404).send({ code: 'NOT_FOUND' })
    const [snapshotRows, sessions, summaryRows] = await Promise.all([
      q(`SELECT tables, revenue, "syncedAt", ("syncedAt" > now() - interval '60 seconds') AS online
         FROM club."ClubSyncSnapshot" WHERE "clubId" = $1`, id),
      q(`SELECT id, "tableId", "tableName", mode, "startTime", "endTime", duration, "tableCost", "barCost", "totalCost", date
         FROM club."ClubSessionRecord" WHERE "clubId" = $1 ORDER BY "startTime" DESC LIMIT 100`, id),
      q(`SELECT count(*)::int sessions, coalesce(sum("totalCost"),0)::bigint revenue FROM club."ClubSessionRecord" WHERE "clubId" = $1`, id),
    ])
    return { club, snapshot: snapshotRows[0] ?? null, sessions, summary: one(summaryRows, { sessions: 0, revenue: 0 }) }
  })

  // ---- Временной ряд для графиков ----
  app.get('/admin/metrics/timeseries', async (req, reply) => {
    if (!requireAdmin(req, reply)) return
    const { days } = metricsQuery.parse(req.query)
    const points = await q(
      `WITH days AS (
        SELECT generate_series((now()::date - ($1::int - 1)), now()::date, interval '1 day')::date AS d
      )
      SELECT to_char(d, 'YYYY-MM-DD') AS date,
        (SELECT count(*)::int FROM auth."User" u WHERE u."createdAt"::date = d) AS users,
        (SELECT count(*)::int FROM tournament."Tournament" t WHERE t."createdAt"::date = d) AS tournaments,
        (SELECT count(*)::int FROM payment."Payment" p WHERE p."createdAt"::date = d) AS payments,
        (SELECT coalesce(sum("amountKzt"),0)::bigint FROM payment."Payment" p WHERE p.status='COMPLETED' AND p."completedAt"::date = d) AS revenue,
        (SELECT count(*)::int FROM admin.activity_log a WHERE a."createdAt"::date = d) AS activity
      FROM days ORDER BY d`,
      days,
    )
    return { points }
  })

  // ---- Ручная очистка аудита ----
  app.post('/admin/activity/purge', async (req, reply) => {
    const admin = requireSuperAdmin(req, reply)
    if (!admin) return
    const res = await prisma.activityLog.deleteMany({
      where: { createdAt: { lt: new Date(Date.now() - env.ACTIVITY_RETENTION_DAYS * 24 * 60 * 60 * 1000) } },
    })
    await logAction(admin, 'POST', '/admin/activity/purge', req.ip)
    return { deleted: res.count, retentionDays: env.ACTIVITY_RETENTION_DAYS }
  })

  // ---- Дамп всей БД (JSON) ----
  app.get('/admin/export', async (req, reply) => {
    const admin = requireSuperAdmin(req, reply)
    if (!admin) return
    const dump = await exportDatabase()
    await logAction(admin, 'GET', '/admin/export', req.ip)
    void reply.header('Content-Disposition', `attachment; filename="billiard-dump-${new Date().toISOString().slice(0, 10)}.json"`)
    return dump
  })

  // ---- Настоящий бэкап (pg_dump → .sql, стримом) ----
  app.get('/admin/backup', async (req, reply) => {
    const admin = requireSuperAdmin(req, reply)
    if (!admin) return
    const child = spawnPgDump()

    // Если бинарник не найден / упал на старте — ответим JSON-ошибкой.
    const spawnErr = await new Promise<Error | null>((resolve) => {
      const ok = () => resolve(null)
      const err = (e: Error) => resolve(e)
      child.once('spawn', ok)
      child.once('error', err)
      setTimeout(() => resolve(null), 200) // если за 200мс не упал — считаем, что стартанул
    })
    if (spawnErr) {
      return reply.code(500).send({ code: 'PG_DUMP_UNAVAILABLE', message: `pg_dump не найден: ${spawnErr.message}` })
    }

    child.stderr.on('data', (chunk: Buffer) => {
      req.log.warn({ pg_dump: chunk.toString().slice(0, 200) })
    })
    child.on('close', (code) => {
      if (code !== 0) req.log.warn({ code }, 'pg_dump exited with non-zero (response may be truncated)')
    })

    await logAction(admin, 'GET', '/admin/backup', req.ip)
    void reply.header('Content-Type', 'application/sql; charset=utf-8')
    void reply.header('Content-Disposition', `attachment; filename="billiard-${new Date().toISOString().slice(0, 10)}.sql"`)
    return reply.send(child.stdout)
  })

  // ---- Список файловых бэкапов (фоновых + ручных) ----
  app.get('/admin/backups', async (req, reply) => {
    if (!requireSuperAdmin(req, reply)) return
    return {
      files: listBackups(),
      intervalHours: env.BACKUP_INTERVAL_HOURS,
      retentionDays: env.BACKUP_RETENTION_DAYS,
    }
  })

  // ---- Запустить бэкап в файл вручную ----
  app.post('/admin/backups', async (req, reply) => {
    const admin = requireSuperAdmin(req, reply)
    if (!admin) return
    await logAction(admin, 'POST', '/admin/backups', req.ip)
    const result = await runBackupToFile(req.log)
    if (!result) return reply.code(500).send({ code: 'BACKUP_FAILED', message: 'pg_dump не отработал (см. логи сервиса)' })
    return result
  })

  // ---- Скачать конкретный файл бэкапа ----
  app.get('/admin/backups/:name', async (req, reply) => {
    const admin = requireSuperAdmin(req, reply)
    if (!admin) return
    const name = (req.params as { name: string }).name
    const filePath = backupFilePath(name)
    if (!filePath) return reply.code(400).send({ code: 'BAD_NAME' })
    if (!existsSync(filePath)) return reply.code(404).send({ code: 'NOT_FOUND' })
    await logAction(admin, 'GET', `/admin/backups/${name}`, req.ip)
    void reply.header('Content-Type', name.endsWith('.gz') ? 'application/gzip' : 'application/sql')
    void reply.header('Content-Disposition', `attachment; filename="${name}"`)
    return reply.send(openBackupForRead(filePath))
  })

  // ---- История латентности сервисов (для графиков) ----
  app.get('/admin/health/history', async (req, reply) => {
    if (!requireAdmin(req, reply)) return
    const minutes = Math.min(Math.max(Number((req.query as { minutes?: string }).minutes) || 60, 5), 1440)
    return { series: await healthHistory(minutes) }
  })

  // ---- IP-баны ----
  // Источник истины — таблица admin.ip_ban. Gateway держит in-memory копию,
  // ресинкается раз в минуту через /internal/ipbans.
  app.get('/admin/ipbans', async (req, reply) => {
    if (!requireAdmin(req, reply)) return
    const bans = await prisma.ipBan.findMany({ orderBy: { createdAt: 'desc' }, take: 500 })
    return { bans }
  })

  app.post('/admin/ipbans', async (req, reply) => {
    const admin = requireSuperAdmin(req, reply)
    if (!admin) return
    const parsed = ipBanCreate.safeParse(req.body)
    if (!parsed.success) return reply.code(400).send({ code: 'VALIDATION_ERROR', details: parsed.error.flatten() })
    const { ip, reason, until } = parsed.data
    const ban = await prisma.ipBan.upsert({
      where: { ip },
      create: { ip, reason: reason ?? null, until: until ? new Date(until) : null, createdBy: admin.id },
      update: { reason: reason ?? null, until: until ? new Date(until) : null, createdBy: admin.id },
    })
    await logAction(admin, 'POST', `/admin/ipbans (${ip})`, req.ip)
    return { ban }
  })

  app.delete('/admin/ipbans/:id', async (req, reply) => {
    const admin = requireSuperAdmin(req, reply)
    if (!admin) return
    const id = paramId(req)
    const ban = await prisma.ipBan.findUnique({ where: { id } })
    if (!ban) return reply.code(404).send({ code: 'NOT_FOUND' })
    await prisma.ipBan.delete({ where: { id } })
    await logAction(admin, 'DELETE', `/admin/ipbans/${ban.ip}`, req.ip)
    return reply.code(204).send()
  })

  // ============ INTERNAL (service-to-service, x-internal-secret) ============

  // Приём аудита от gateway.
  app.post('/internal/activity', async (req: FastifyRequest, reply) => {
    if (!safeEqualInternalSecret(req.headers['x-internal-secret'])) {
      return reply.code(401).send({ code: 'INVALID_INTERNAL_SECRET' })
    }
    const parsed = activityIngest.safeParse(req.body)
    if (!parsed.success) return reply.code(400).send({ code: 'VALIDATION_ERROR' })
    const d = parsed.data
    await prisma.activityLog.create({
      data: {
        userId: d.userId ?? null,
        userName: d.userName ?? null,
        role: d.role ?? null,
        method: d.method,
        path: d.path,
        statusCode: d.statusCode ?? null,
        ip: d.ip ?? null,
        userAgent: d.userAgent ?? null,
        durationMs: d.durationMs ?? null,
      },
    }).catch(() => undefined)
    return reply.code(204).send()
  })

  // Приём алертов от других сервисов.
  app.post('/internal/alert', async (req: FastifyRequest, reply) => {
    if (!safeEqualInternalSecret(req.headers['x-internal-secret'])) {
      return reply.code(401).send({ code: 'INVALID_INTERNAL_SECRET' })
    }
    const parsed = alertBody.safeParse(req.body)
    if (!parsed.success) return reply.code(400).send({ code: 'VALIDATION_ERROR', details: parsed.error.flatten() })
    const res = await notifyAdmins(parsed.data, req.log)
    return reply.send(res)
  })

  // Sync для gateway: отдаём только активные баны (until == null или until > now).
  // Gateway pull-ит каждые 60 сек и держит in-memory копию.
  app.get('/internal/ipbans', async (req: FastifyRequest, reply) => {
    if (!safeEqualInternalSecret(req.headers['x-internal-secret'])) {
      return reply.code(401).send({ code: 'INVALID_INTERNAL_SECRET' })
    }
    const now = new Date()
    const rows = await prisma.ipBan.findMany({
      where: { OR: [{ until: null }, { until: { gt: now } }] },
      select: { ip: true, until: true },
    })
    return { bans: rows.map((r) => ({ ip: r.ip, until: r.until?.toISOString() ?? null })) }
  })
}
