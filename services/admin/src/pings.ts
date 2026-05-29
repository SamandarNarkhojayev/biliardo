import type { AdminServiceHealth } from '@billiard/shared'
import { env } from './config.js'

/** Список сервисов для health-пингов. bot — опционально (если задан URL). */
export function serviceList(): { name: string; url: string }[] {
  return [
    { name: 'auth', url: env.AUTH_SERVICE_URL },
    { name: 'tournament', url: env.TOURNAMENT_SERVICE_URL },
    { name: 'payment', url: env.PAYMENT_SERVICE_URL },
    { name: 'club', url: env.CLUB_SERVICE_URL },
    ...(env.BOT_SERVICE_URL ? [{ name: 'bot', url: env.BOT_SERVICE_URL }] : []),
  ]
}

export async function pingService(name: string, url: string): Promise<AdminServiceHealth> {
  const startedAt = Date.now()
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), 3000)
  try {
    const res = await fetch(`${url.replace(/\/$/, '')}/health`, { signal: ctrl.signal })
    const latencyMs = Date.now() - startedAt
    let body: unknown = null
    try { body = await res.json() } catch { /* ignore non-json */ }
    return { name, url, ok: res.ok, status: res.status, latencyMs, body }
  } catch {
    return { name, url, ok: false, status: null, latencyMs: Date.now() - startedAt }
  } finally {
    clearTimeout(timer)
  }
}

export async function pingAll(): Promise<AdminServiceHealth[]> {
  return Promise.all(serviceList().map((s) => pingService(s.name, s.url)))
}
