/**
 * Шаблоны сообщений. Markdown V2 в Telegraf требует экранирования спецсимволов —
 * для простоты используем HTML-режим, экранируем только < > &.
 */

export function escapeHtml(s: string | null | undefined): string {
  if (!s) return ''
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

const DIVIDER = '➖➖➖➖➖➖➖➖'

/** Человекочитаемые дата+время в часовом поясе Казахстана. */
function formatDateTime(iso: string | null | undefined): string | null {
  if (!iso) return null
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return null
  return new Intl.DateTimeFormat('ru-RU', {
    day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit',
    timeZone: 'Asia/Almaty',
  }).format(d)
}

export function tournamentStartedMessage(data: { tournamentName: string; bracketType: string; url: string }): string {
  return [
    `🎱 <b>Турнир стартовал!</b>`,
    DIVIDER,
    `🏆 <b>${escapeHtml(data.tournamentName)}</b>`,
    `🗂 Формат: ${escapeHtml(data.bracketType)}`,
    ``,
    `Сетка уже сформирована — желаем точного кия! 🎯`,
    `👉 <a href="${escapeHtml(data.url)}">Открыть сетку турнира</a>`,
  ].join('\n')
}

export function matchReadyMessage(data: {
  tournamentName: string
  round: number
  tableLabel: string | null
  opponentName: string
  url: string
}): string {
  const lines = [
    `🥁 <b>Ваш матч готов — на стол!</b>`,
    DIVIDER,
    `🏆 ${escapeHtml(data.tournamentName)}`,
    `🔄 Раунд ${data.round}`,
    `🆚 Соперник: <b>${escapeHtml(data.opponentName)}</b>`,
  ]
  if (data.tableLabel) lines.push(`📍 ${escapeHtml(data.tableLabel)}`)
  lines.push(``, `Ни пуха! 🍀`, `👉 <a href="${escapeHtml(data.url)}">Открыть матч</a>`)
  return lines.join('\n')
}

export function matchCompletedMessage(data: {
  tournamentName: string
  score1: number
  score2: number
}): string {
  return [
    `📊 <b>Результат матча сохранён</b>`,
    DIVIDER,
    `🏆 ${escapeHtml(data.tournamentName)}`,
    `🔢 Счёт: <b>${data.score1} : ${data.score2}</b>`,
  ].join('\n')
}

export function tournamentCompletedMessage(data: { tournamentName: string; url: string }): string {
  return [
    `🏆 <b>Турнир завершён!</b>`,
    DIVIDER,
    `🎱 ${escapeHtml(data.tournamentName)}`,
    ``,
    `Спасибо за игру! Итоги и финальная сетка:`,
    `👉 <a href="${escapeHtml(data.url)}">Смотреть результаты</a>`,
  ].join('\n')
}

/** Организатору: кто-то зарегистрировался на его турнир. */
export function participantRegisteredMessage(data: {
  tournamentName: string
  participantName: string
  participantPhone: string | null
  registeredCount: number
  maxParticipants: number
  remainingSlots: number
}): string {
  const lines = [
    `🟢 <b>Новая регистрация на турнир</b>`,
    DIVIDER,
    `🏆 <b>${escapeHtml(data.tournamentName)}</b>`,
    ``,
    `👤 <b>${escapeHtml(data.participantName)}</b>`,
  ]
  if (data.participantPhone) lines.push(`📞 ${escapeHtml(data.participantPhone)}`)
  lines.push(``, `👥 Записано: <b>${data.registeredCount}</b> из ${data.maxParticipants}`)
  if (data.remainingSlots > 0) {
    lines.push(`🪑 Свободно мест: <b>${data.remainingSlots}</b>`)
  } else {
    lines.push(`🎉 <b>Мест больше нет — турнир набран!</b>`)
  }
  return lines.join('\n')
}

/** Супер-админу: алерт об ошибке/аномалии/падении. */
export function adminAlertMessage(data: {
  level: string
  source: string
  title: string
  message: string
}): string {
  const icon =
    data.level === 'critical' ? '🚨' :
    data.level === 'error' ? '🔴' :
    data.level === 'warning' ? '🟡' : 'ℹ️'
  return [
    `${icon} <b>${escapeHtml(data.title)}</b>`,
    DIVIDER,
    `⚙️ Источник: <b>${escapeHtml(data.source)}</b>`,
    `📊 Уровень: <b>${escapeHtml(data.level)}</b>`,
    ``,
    escapeHtml(data.message),
  ].join('\n')
}

/** Участнику: за 2 часа до старта — напоминание, что его ждут. */
export function tournamentReminderMessage(data: {
  tournamentName: string
  scheduledAt: string | null
  location: string | null
  url: string
}): string {
  const when = formatDateTime(data.scheduledAt)
  const lines = [
    `⏰ <b>Турнир уже совсем скоро!</b>`,
    DIVIDER,
    `🎱 <b>${escapeHtml(data.tournamentName)}</b>`,
  ]
  if (when) lines.push(`🕒 Начало: <b>${escapeHtml(when)}</b>`)
  if (data.location) lines.push(`📍 ${escapeHtml(data.location)}`)
  lines.push(
    ``,
    `Вы зарегистрированы — и вас уже ждут! 🤝`,
    `Приходите заранее, чтобы спокойно отметиться у организатора и размяться.`,
    ``,
    `Удачной игры! 🍀`,
    `👉 <a href="${escapeHtml(data.url)}">Детали турнира</a>`,
  )
  return lines.join('\n')
}
