import type { FastifyRequest } from 'fastify'

export interface AuthContext {
  id: string
  role: 'PLAYER' | 'ORGANIZER' | 'ADMIN'
  name: string
  accountType: 'PLAYER' | 'CLUB'
}

/**
 * Достаёт пользователя из заголовков, которые проставил gateway после JWT-валидации.
 * Downstream-сервисы доверяют x-user-* — это network boundary.
 */
export function getUser(req: FastifyRequest): AuthContext | null {
  const id = req.headers['x-user-id']
  const role = req.headers['x-user-role']
  const name = req.headers['x-user-name']
  const accountType = req.headers['x-user-account-type']
  if (typeof id !== 'string' || typeof role !== 'string' || typeof name !== 'string') return null
  if (role !== 'PLAYER' && role !== 'ORGANIZER' && role !== 'ADMIN') return null
  const at = accountType === 'CLUB' ? 'CLUB' : 'PLAYER'
  return { id, role, name: decodeURIComponent(name), accountType: at }
}

export function requireUser(req: FastifyRequest): AuthContext {
  const u = getUser(req)
  if (!u) throw new Error('UNAUTHORIZED')
  return u
}
