import type { FastifyReply, FastifyRequest } from 'fastify'
import { isSuperAdmin } from './config.js'

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

/**
 * Гард: пускает только ADMIN. Gateway уже проверяет роль для /api/admin/*,
 * но дублируем здесь — defense in depth (сервис не должен доверять только сети).
 * Возвращает AuthContext или null (и уже отправляет ответ-ошибку).
 */
export function requireAdmin(req: FastifyRequest, reply: FastifyReply): AuthContext | null {
  const user = getUser(req)
  if (!user) {
    void reply.code(401).send({ code: 'UNAUTHORIZED', message: 'Требуется авторизация' })
    return null
  }
  if (user.role !== 'ADMIN') {
    void reply.code(403).send({ code: 'FORBIDDEN', message: 'Только для администратора' })
    return null
  }
  return user
}

/**
 * Гард для опасных операций (SQL-запись, удаление, дамп БД, очистка аудита):
 * пускает только супер-админов (см. ADMIN_SUPERUSER_IDS).
 */
export function requireSuperAdmin(req: FastifyRequest, reply: FastifyReply): AuthContext | null {
  const user = requireAdmin(req, reply)
  if (!user) return null
  if (!isSuperAdmin(user.id)) {
    void reply.code(403).send({ code: 'FORBIDDEN_READONLY', message: 'Недостаточно прав: только просмотр' })
    return null
  }
  return user
}
