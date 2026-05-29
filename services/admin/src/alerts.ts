import type { AlertLevel } from '@billiard/shared'
import { prisma } from './db.js'
import { q } from './sql.js'
import { env } from './config.js'

export interface AlertInput {
  level: AlertLevel
  source: string
  title: string
  message: string
  context?: unknown
}

interface Logger {
  warn: (o: unknown, m?: string) => void
}

/**
 * Регистрирует алерт: пишет в admin.alert_log и шлёт в Telegram всем ADMIN-ам,
 * у кого привязан telegramChatId (через bot-сервис, событие admin_alert).
 * Fire-and-forget по части Telegram — ошибка отправки не должна валить запрос.
 */
export async function notifyAdmins(input: AlertInput, log?: Logger): Promise<{ logged: true; notified: boolean }> {
  const created = await prisma.alertLog.create({
    data: {
      level: input.level,
      source: input.source,
      title: input.title,
      message: input.message,
      context: (input.context ?? undefined) as never,
    },
  })

  let notified = false
  try {
    notified = await sendTelegram(input)
    if (notified) {
      await prisma.alertLog.update({ where: { id: created.id }, data: { notified: true } })
    }
  } catch (err) {
    log?.warn?.({ err: (err as Error).message }, 'admin alert telegram send failed')
  }

  return { logged: true, notified }
}

async function sendTelegram(input: AlertInput): Promise<boolean> {
  if (!env.BOT_SERVICE_URL) return false
  // ADMIN-ы с привязанным Telegram — читаем напрямую из auth-схемы.
  const admins = await q<{ id: string }>(
    `SELECT id FROM auth."User" WHERE role = 'ADMIN' AND "telegramChatId" IS NOT NULL`,
  )
  const userIds = admins.map((a) => a.id)
  if (userIds.length === 0) return false

  const res = await fetch(`${env.BOT_SERVICE_URL.replace(/\/$/, '')}/internal/notify`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-internal-secret': env.INTERNAL_SECRET,
    },
    body: JSON.stringify({
      event: 'admin_alert',
      userIds,
      data: {
        level: input.level,
        source: input.source,
        title: input.title,
        message: input.message,
      },
    }),
  })
  return res.ok
}
