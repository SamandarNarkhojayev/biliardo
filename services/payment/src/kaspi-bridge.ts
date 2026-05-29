import crypto from 'node:crypto'
import { env } from './config.js'

/**
 * Логика «моста» над Kaspi Gold: разбор текста уведомления о входящем переводе,
 * проверка секрета notify-эндпоинта и дедуп повторных уведомлений.
 *
 * Уведомление приходит с телефона (форвардер пушей: MacroDroid/Tasker/Automate),
 * который шлёт текст пуша Kaspi на наш эндпоинт. Мы сопоставляем сумму с PENDING-
 * платежом по ТОЧНОМУ совпадению (суммы делаются уникальными при создании).
 */

// Слова, по которым отличаем входящее пополнение/перевод от прочих пушей.
const CREDIT_KEYWORDS = [
  'перевел',
  'перевёл',
  'перевели',
  'пополнен',
  'поступил',
  'поступлен',
  'зачислен',
  'получен',
  'попълнен',
]

/** Проверка секрета моста (timing-safe). */
export function verifyBridgeSecret(provided: string | undefined): boolean {
  const secret = env.KASPI_BRIDGE_SECRET
  if (!secret || !provided) return false
  const a = Buffer.from(secret)
  const b = Buffer.from(provided)
  if (a.length !== b.length) return false
  return crypto.timingSafeEqual(a, b)
}

/** Похоже ли уведомление на входящее зачисление (а не списание/прочее). */
export function isCreditNotification(text: string): boolean {
  const lower = text.toLowerCase()
  return CREDIT_KEYWORDS.some((k) => lower.includes(k))
}

/**
 * Достаёт сумму в целых тенге из текста уведомления Kaspi.
 * Берёт первое число перед знаком валюты (₸ / тг / тенге / KZT).
 * Возвращает целые тенге или null. Дробную часть (",00") отбрасываем.
 */
export function parseKaspiAmount(text: string): number | null {
  const normalized = text.replace(/ /g, ' ')
  const re = /([\d][\d\s.,]*\d|\d)\s*(?:₸|тенге|тг|kzt)/gi
  let m: RegExpExecArray | null
  while ((m = re.exec(normalized)) !== null) {
    let s = m[1].replace(/\s/g, '')
    s = s.replace(/[.,]\d{1,2}$/, '') // отбрасываем дробную часть
    s = s.replace(/[.,]/g, '') // убираем разделители тысяч
    const n = Number.parseInt(s, 10)
    if (Number.isFinite(n) && n > 0) return n
  }
  return null
}

/** Контент-хэш уведомления для дедупа повторных доставок. */
export function notificationHash(text: string): string {
  return crypto.createHash('sha256').update(text.trim()).digest('hex')
}

/** In-memory дедуп уведомлений (TTL). Защищает от повторной доставки форвардером. */
const DEDUPE_TTL_MS = 24 * 60 * 60 * 1000
const seen = new Map<string, number>()

export function isDuplicateNotification(hash: string): boolean {
  const now = Date.now()
  // лёгкая чистка протухших записей
  if (seen.size > 5000) {
    for (const [h, ts] of seen) if (now - ts > DEDUPE_TTL_MS) seen.delete(h)
  }
  const prev = seen.get(hash)
  if (prev && now - prev < DEDUPE_TTL_MS) return true
  seen.set(hash, now)
  return false
}
