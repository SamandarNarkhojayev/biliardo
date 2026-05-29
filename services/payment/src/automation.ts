import { env } from './config.js'

/**
 * Спрашивает у auth-сервиса, есть ли у пользователя активная автоматизация
 * (= аккаунт CLUB с установленным API-паролем). Если да — турниры этого клуба
 * становятся бесплатными (см. payment routes).
 *
 * Лёгкий кэш на 60 секунд: автоматизация меняется редко, а вызов делается
 * на каждом POST /payments — спамить auth не нужно.
 */

interface AutomationStatus {
  accountType: 'PLAYER' | 'CLUB'
  hasApiPassword: boolean
  automationActive: boolean
}

const CACHE_TTL_MS = 60_000
const cache = new Map<string, { value: AutomationStatus; expiresAt: number }>()

export async function checkAutomation(userId: string): Promise<AutomationStatus> {
  const cached = cache.get(userId)
  if (cached && cached.expiresAt > Date.now()) return cached.value

  const url = `${env.AUTH_SERVICE_URL.replace(/\/$/, '')}/auth/internal/automation/${userId}`
  const res = await fetch(url, {
    headers: { 'x-internal-secret': env.INTERNAL_SECRET },
  })
  if (!res.ok) {
    // На ошибке считаем «автоматизация выключена» — лучше брать деньги, чем простить
    return { accountType: 'PLAYER', hasApiPassword: false, automationActive: false }
  }
  const value = (await res.json()) as AutomationStatus
  cache.set(userId, { value, expiresAt: Date.now() + CACHE_TTL_MS })
  return value
}

/** Сбросить кэш для конкретного userId — пригодится после установки/удаления API-пароля. */
export function invalidateAutomationCache(userId: string): void {
  cache.delete(userId)
}
