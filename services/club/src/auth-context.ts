import type { FastifyRequest } from 'fastify'
import { verifyDesktopToken } from './jwt-verifier.js'

/**
 * Клубный сервис принимает запросы двух типов клиентов:
 *
 *  1. Browser: запросы идут через gateway, который проставляет x-user-id/role/name/account-type.
 *     Используется для GET /club/status, /club/sessions, /club/sessions/summary.
 *
 *  2. Desktop: запросы идут НАПРЯМУЮ (минуя gateway) с `Authorization: Bearer <90d-token>`.
 *     Используется для POST /club/sync и /club/session — горячий путь, синхронизация каждые 30s.
 *     Здесь же проверяем JWT и достаём clubId.
 */

export interface BrowserUser {
  kind: 'browser'
  id: string
  role: 'PLAYER' | 'ORGANIZER' | 'ADMIN'
  name: string
  accountType: 'PLAYER' | 'CLUB'
}

export interface DesktopClient {
  kind: 'desktop'
  /** user.id владельца клуба */
  id: string
  clubId: string
  clubName: string
}

export function getBrowserUser(req: FastifyRequest): BrowserUser | null {
  const id = req.headers['x-user-id']
  const role = req.headers['x-user-role']
  const name = req.headers['x-user-name']
  const at = req.headers['x-user-account-type']
  if (typeof id !== 'string' || typeof role !== 'string' || typeof name !== 'string') return null
  if (role !== 'PLAYER' && role !== 'ORGANIZER' && role !== 'ADMIN') return null
  const accountType = at === 'CLUB' ? 'CLUB' : 'PLAYER'
  return { kind: 'browser', id, role, name: decodeURIComponent(name), accountType }
}

export async function getDesktopClient(req: FastifyRequest): Promise<DesktopClient | null> {
  const auth = req.headers.authorization
  if (!auth?.startsWith('Bearer ')) return null
  const payload = await verifyDesktopToken(auth.slice(7))
  if (!payload) return null
  return {
    kind: 'desktop',
    id: payload.sub,
    clubId: payload.clubId,
    clubName: payload.clubName,
  }
}
