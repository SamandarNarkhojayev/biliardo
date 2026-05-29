import { prisma } from './db.js'
import { notifyBot } from './notify.js'
import { tournamentPublicUrl } from './routes.js'

/**
 * Планировщик напоминаний «турнир скоро».
 *
 * Раз в минуту ищет турниры, которые стартуют в ближайшие REMINDER_LEAD_MS (по умолчанию 2 часа)
 * и которым ещё не слали напоминание (startReminderSentAt = null). Рассылает всем участникам с
 * привязанным Telegram сообщение «вы зарегистрированы, вас ждут» и помечает турнир как
 * «напомнили», чтобы не дублировать.
 *
 * In-process setInterval — для single-instance dev/small-prod достаточно. Для горизонтального
 * масштабирования сюда нужен distributed lock, но это вне текущего объёма.
 */

const TICK_MS = 60_000
const REMINDER_LEAD_MS = 2 * 60 * 60 * 1000 // 2 часа

type Logger = {
  info: (o: unknown, m?: string) => void
  warn: (o: unknown, m?: string) => void
}

let timer: ReturnType<typeof setInterval> | null = null
let running = false

export function startReminderScheduler(log: Logger): void {
  if (timer) return
  // Первый прогон — сразу после старта (на случай рестарта рядом со временем турнира).
  void tick(log)
  timer = setInterval(() => void tick(log), TICK_MS)
  log.info({ tickMs: TICK_MS, leadMs: REMINDER_LEAD_MS }, 'reminder scheduler started')
}

export function stopReminderScheduler(): void {
  if (timer) {
    clearInterval(timer)
    timer = null
  }
}

async function tick(log: Logger): Promise<void> {
  if (running) return // не накладываем прогоны друг на друга
  running = true
  try {
    const now = new Date()
    const cutoff = new Date(now.getTime() + REMINDER_LEAD_MS)

    // Турниры, которые ещё не прошли, стартуют в пределах окна и которым не слали напоминание.
    const due = await prisma.tournament.findMany({
      where: {
        status: { in: ['REGISTRATION', 'ACTIVE'] },
        startReminderSentAt: null,
        scheduledAt: { not: null, gt: now, lte: cutoff },
      },
      include: { participants: true },
    })
    if (due.length === 0) return

    for (const t of due) {
      const userIds = t.participants.map((p) => p.userId).filter((x): x is string => !!x)
      // Помечаем сразу — даже если получателей нет, повторно проверять смысла нет.
      await prisma.tournament.update({
        where: { id: t.id },
        data: { startReminderSentAt: now },
      })
      if (userIds.length === 0) continue
      void notifyBot({
        event: 'tournament_reminder',
        userIds,
        data: {
          tournamentId: t.id,
          tournamentName: t.name,
          scheduledAt: t.scheduledAt?.toISOString() ?? null,
          location: t.location ?? null,
          url: tournamentPublicUrl(t),
        },
      }, log)
      log.info({ tournamentId: t.id, recipients: userIds.length }, 'sent start reminder')
    }
  } catch (err) {
    log.warn({ err: (err as Error).message }, 'reminder scheduler tick failed')
  } finally {
    running = false
  }
}
