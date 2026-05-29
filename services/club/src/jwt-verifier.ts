import { jwtVerify, importSPKI, type KeyLike } from 'jose'
import { env } from './config.js'

/**
 * Проверка JWT, выпущенных auth-сервисом.
 * Получаем публичный ключ через /auth/public-key с кэшем 1 час.
 *
 * Поддерживаем оба типа клиентов:
 *  - browser  (короткий access-токен, обычные пользователи)
 *  - desktop  (90-дневный токен для billiard-client, client='desktop')
 *
 * Browser-токены приходят сюда через gateway (gateway уже верифицирует и проставляет
 * x-user-* headers). Desktop-токены приходят прямо к нам — gateway их не понимает,
 * чтобы не возиться с двумя классами токенов в одном слое.
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

export interface DesktopTokenPayload {
  /** user.id владельца клуба */
  sub: string
  clubId: string
  clubName: string
  client: 'desktop'
}

/** Верифицирует desktop-токен. Возвращает null если невалиден или это не desktop. */
export async function verifyDesktopToken(token: string): Promise<DesktopTokenPayload | null> {
  try {
    const key = await getPublicKey()
    const { payload } = await jwtVerify(token, key, {
      issuer: ISSUER,
      audience: AUDIENCE,
      algorithms: [ALG],
    })
    if (payload.client !== 'desktop') return null
    return {
      sub: payload.sub as string,
      clubId: payload.clubId as string,
      clubName: payload.name as string,
      client: 'desktop',
    }
  } catch {
    return null
  }
}

export interface AnyVerifiedToken {
  /** browser — короткий токен пользователя; desktop — 90d токен приложения */
  kind: 'browser' | 'desktop'
  /** Для browser: user.id; для desktop: user.id (он же владелец клуба) */
  userId: string
  /** Логический id клуба. Для browser CLUB-аккаунта — равен userId. */
  clubId: string
  name: string
  /** Только для browser-токенов */
  accountType?: 'PLAYER' | 'CLUB'
}

/**
 * Универсальный verify — для WebSocket-хендшейка, где приходит любой тип токена
 * через `?token=` query-параметр. Browser-CLUB и desktop оба разрешены; browser-PLAYER
 * отшивается выше по стеку.
 */
export async function verifyAnyToken(token: string): Promise<AnyVerifiedToken | null> {
  try {
    const key = await getPublicKey()
    const { payload } = await jwtVerify(token, key, {
      issuer: ISSUER,
      audience: AUDIENCE,
      algorithms: [ALG],
    })
    const client = payload.client as string | undefined
    if (client === 'desktop') {
      return {
        kind: 'desktop',
        userId: payload.sub as string,
        clubId: payload.clubId as string,
        name: payload.name as string,
      }
    }
    // browser (или legacy без client поля — считаем browser)
    return {
      kind: 'browser',
      userId: payload.sub as string,
      clubId: payload.sub as string, // CLUB-аккаунт: user.id = clubId
      name: payload.name as string,
      accountType: (payload.accountType as 'PLAYER' | 'CLUB') ?? 'PLAYER',
    }
  } catch {
    return null
  }
}

export async function warmupPublicKey(): Promise<void> {
  try {
    await getPublicKey()
  } catch (err) {
    console.warn('club: failed to warm up auth public key:', (err as Error).message)
  }
}
