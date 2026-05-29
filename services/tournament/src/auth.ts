import type { FastifyRequest } from 'fastify'
import { jwtVerify, importSPKI, type KeyLike } from 'jose'
import { env } from './config.js'

/**
 * Идентификация запроса:
 *   1) Сначала смотрим x-user-* headers, которые проставляет gateway после верификации JWT —
 *      это быстрый happy-path для запросов от браузера.
 *   2) Если их нет (например, сервис вызван напрямую, минуя gateway, или это тест) —
 *      сами проверяем Bearer-токен по публичному ключу auth-сервиса.
 *
 * Возвращает null, если запрос анонимный.
 */

const ALG = 'RS256'
const ISSUER = 'billiard.auth'
const AUDIENCE = 'billiard.api'

let publicKey: KeyLike | null = null
let lastFetched = 0
const REFRESH_INTERVAL_MS = 60 * 60 * 1000

async function fetchPublicKey(): Promise<KeyLike> {
  const res = await fetch(`${env.AUTH_SERVICE_URL.replace(/\/$/, '')}/auth/public-key`)
  if (!res.ok) throw new Error(`Failed to fetch public key: ${res.status}`)
  const data = (await res.json()) as { alg: string; publicKey: string }
  return importSPKI(data.publicKey, ALG)
}

async function getPublicKey(): Promise<KeyLike> {
  const now = Date.now()
  if (!publicKey || now - lastFetched > REFRESH_INTERVAL_MS) {
    publicKey = await fetchPublicKey()
    lastFetched = now
  }
  return publicKey
}

export async function warmupPublicKey(): Promise<void> {
  try { await getPublicKey() } catch (err) {
    console.warn('tournament: failed to warm up auth public key:', (err as Error).message)
  }
}

export interface AuthUser {
  id: string
  role: string
  name: string
  accountType: 'PLAYER' | 'CLUB'
}

function fromHeaders(req: FastifyRequest): AuthUser | null {
  const id = req.headers['x-user-id']
  const role = req.headers['x-user-role']
  const name = req.headers['x-user-name']
  const accountType = req.headers['x-user-account-type']
  if (typeof id !== 'string' || typeof role !== 'string' || typeof accountType !== 'string') return null
  return {
    id,
    role,
    name: typeof name === 'string' ? decodeURIComponent(name) : '',
    accountType: accountType === 'CLUB' ? 'CLUB' : 'PLAYER',
  }
}

async function fromBearer(req: FastifyRequest): Promise<AuthUser | null> {
  const auth = req.headers.authorization
  if (!auth?.startsWith('Bearer ')) return null
  try {
    const key = await getPublicKey()
    const { payload } = await jwtVerify(auth.slice(7), key, {
      issuer: ISSUER,
      audience: AUDIENCE,
      algorithms: [ALG],
    })
    if (payload.client === 'desktop') return null
    return {
      id: payload.sub as string,
      role: (payload.role as string) ?? 'PLAYER',
      name: (payload.name as string) ?? '',
      accountType: (payload.accountType as 'PLAYER' | 'CLUB') ?? 'PLAYER',
    }
  } catch {
    return null
  }
}

export async function authenticate(req: FastifyRequest): Promise<AuthUser | null> {
  return fromHeaders(req) ?? await fromBearer(req)
}
