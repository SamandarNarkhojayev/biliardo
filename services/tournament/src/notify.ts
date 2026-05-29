import { env } from './config.js'

/**
 * Отправляет событие на bot-сервис. Бот сам найдёт telegramChatId по userId
 * (или найдёт несколько userIds для broadcast-событий) и пошлёт сообщение.
 *
 * Все вызовы fire-and-forget — ошибка отправки не должна валить основной запрос.
 * Если BOT_SERVICE_URL не задан, функция тихо возвращает true (нет бота — нет уведомлений).
 */
export interface NotifyPayload {
  /** Тип события — bot решает, как форматировать сообщение. */
  event:
    | 'tournament_started'
    | 'match_ready'
    | 'match_completed'
    | 'tournament_completed'
    | 'participant_registered'
    | 'tournament_reminder'
  /** Целевые user.id. Если пусто — broadcast не делается. */
  userIds: string[]
  /** Произвольные данные для шаблона. */
  data: Record<string, unknown>
}

export async function notifyBot(payload: NotifyPayload, log?: { warn: (o: unknown, m?: string) => void }): Promise<void> {
  if (!env.BOT_SERVICE_URL) return
  if (payload.userIds.length === 0) return
  try {
    const res = await fetch(`${env.BOT_SERVICE_URL.replace(/\/$/, '')}/internal/notify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-internal-secret': env.INTERNAL_SECRET,
      },
      body: JSON.stringify(payload),
    })
    if (!res.ok) {
      log?.warn?.({ status: res.status, event: payload.event }, 'bot notify failed')
    }
  } catch (err) {
    log?.warn?.({ err: (err as Error).message, event: payload.event }, 'bot notify exception')
  }
}
