import type { FastifyInstance } from 'fastify'
import { timingSafeEqual } from 'node:crypto'
import { z } from 'zod'
import type { Telegraf } from 'telegraf'
import { env } from './config.js'
import { resolveRecipients } from './auth-client.js'
import {
  tournamentStartedMessage,
  matchReadyMessage,
  matchCompletedMessage,
  tournamentCompletedMessage,
  participantRegisteredMessage,
  tournamentReminderMessage,
  adminAlertMessage,
} from './templates.js'

function safeEqualInternalSecret(presented: unknown): boolean {
  if (typeof presented !== 'string') return false
  const a = Buffer.from(presented)
  const b = Buffer.from(env.INTERNAL_SECRET)
  if (a.length !== b.length) return false
  return timingSafeEqual(a, b)
}

const notifyEventSchema = z.discriminatedUnion('event', [
  z.object({
    event: z.literal('tournament_started'),
    userIds: z.array(z.string()),
    data: z.object({
      tournamentId: z.string(),
      tournamentName: z.string(),
      bracketType: z.string(),
      url: z.string().url(),
    }),
  }),
  z.object({
    event: z.literal('match_ready'),
    userIds: z.array(z.string()),
    data: z.object({
      tournamentId: z.string(),
      tournamentName: z.string(),
      matchId: z.string(),
      round: z.number().int().min(1),
      tableLabel: z.string().nullable().optional(),
      opponentByUserId: z.record(z.string(), z.object({
        name: z.string(),
        avatar: z.string().nullable().optional(),
      })),
      url: z.string().url(),
    }),
  }),
  z.object({
    event: z.literal('match_completed'),
    userIds: z.array(z.string()),
    data: z.object({
      tournamentId: z.string(),
      tournamentName: z.string(),
      matchId: z.string(),
      score1: z.number().int().min(0),
      score2: z.number().int().min(0),
    }),
  }),
  z.object({
    event: z.literal('tournament_completed'),
    userIds: z.array(z.string()),
    data: z.object({
      tournamentId: z.string(),
      tournamentName: z.string(),
      url: z.string().url(),
    }),
  }),
  z.object({
    event: z.literal('participant_registered'),
    userIds: z.array(z.string()),
    data: z.object({
      tournamentId: z.string(),
      tournamentName: z.string(),
      participantName: z.string(),
      participantPhone: z.string().nullable().optional(),
      registeredCount: z.number().int().min(0),
      maxParticipants: z.number().int().min(0),
      remainingSlots: z.number().int().min(0),
      url: z.string().url(),
    }),
  }),
  z.object({
    event: z.literal('tournament_reminder'),
    userIds: z.array(z.string()),
    data: z.object({
      tournamentId: z.string(),
      tournamentName: z.string(),
      scheduledAt: z.string().nullable().optional(),
      location: z.string().nullable().optional(),
      url: z.string().url(),
    }),
  }),
  z.object({
    event: z.literal('admin_alert'),
    userIds: z.array(z.string()),
    data: z.object({
      level: z.string(),
      source: z.string(),
      title: z.string(),
      message: z.string(),
    }),
  }),
])

export async function registerRoutes(app: FastifyInstance, bot: Telegraf): Promise<void> {
  app.get('/health', async () => ({ status: 'ok', service: 'bot', time: new Date().toISOString() }))

  app.post('/internal/notify', async (req, reply) => {
    if (!safeEqualInternalSecret(req.headers['x-internal-secret'])) {
      return reply.code(401).send({ code: 'INVALID_INTERNAL_SECRET' })
    }
    const parsed = notifyEventSchema.safeParse(req.body)
    if (!parsed.success) {
      return reply.code(400).send({ code: 'VALIDATION_ERROR', details: parsed.error.flatten() })
    }
    const payload = parsed.data

    const recipients = await resolveRecipients(payload.userIds)
    let sent = 0
    let skipped = 0
    for (const r of recipients) {
      if (!r.chatId) { skipped++; continue }
      try {
        const text = renderMessageFor(payload, r.userId)
        await bot.telegram.sendMessage(r.chatId, text, { parse_mode: 'HTML', link_preview_options: { is_disabled: true } })
        sent++
      } catch (err) {
        req.log.warn({ err: (err as Error).message, chatId: r.chatId }, 'failed to send message')
        skipped++
      }
    }
    return reply.send({ sent, skipped, totalResolved: recipients.length })
  })
}

function renderMessageFor(
  payload: z.infer<typeof notifyEventSchema>,
  userId: string,
): string {
  switch (payload.event) {
    case 'tournament_started':
      return tournamentStartedMessage(payload.data)
    case 'match_ready': {
      const opp = payload.data.opponentByUserId[userId]
      return matchReadyMessage({
        tournamentName: payload.data.tournamentName,
        round: payload.data.round,
        tableLabel: payload.data.tableLabel ?? null,
        opponentName: opp?.name ?? 'соперник',
        url: payload.data.url,
      })
    }
    case 'match_completed':
      return matchCompletedMessage(payload.data)
    case 'tournament_completed':
      return tournamentCompletedMessage(payload.data)
    case 'participant_registered':
      return participantRegisteredMessage({
        tournamentName: payload.data.tournamentName,
        participantName: payload.data.participantName,
        participantPhone: payload.data.participantPhone ?? null,
        registeredCount: payload.data.registeredCount,
        maxParticipants: payload.data.maxParticipants,
        remainingSlots: payload.data.remainingSlots,
      })
    case 'tournament_reminder':
      return tournamentReminderMessage({
        tournamentName: payload.data.tournamentName,
        scheduledAt: payload.data.scheduledAt ?? null,
        location: payload.data.location ?? null,
        url: payload.data.url,
      })
    case 'admin_alert':
      return adminAlertMessage(payload.data)
  }
}
