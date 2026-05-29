import { jwtVerify, importSPKI, type KeyLike } from 'jose'
import { env } from './config.js'

/**
 * Gateway получает публичный ключ от auth-сервиса (один раз при старте + по cron),
 * валидирует JWT локально без сетевого запроса на каждый request.
 */

const ALG = 'RS256'
const ISSUER = 'billiard.auth'
const AUDIENCE = 'billiard.api'

let publicKey: KeyLike | null = null
let lastFetched = 0
const REFRESH_INTERVAL_MS = 60 * 60 * 1000 // 1 час

async function fetchPublicKey(): Promise<KeyLike> {
  const res = await fetch(`${env.AUTH_SERVICE_URL}/auth/public-key`)
  if (!res.ok) throw new Error(`Failed to fetch public key: ${res.status}`)
  const data = await res.json() as { alg: string; publicKey: string }
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

export interface VerifiedUser {
  id: string
  role: string
  name: string
  accountType: 'PLAYER' | 'CLUB'
}

export async function verifyToken(token: string): Promise<VerifiedUser | null> {
  try {
    const key = await getPublicKey()
    const { payload } = await jwtVerify(token, key, {
      issuer: ISSUER,
      audience: AUDIENCE,
      algorithms: [ALG],
    })
    return {
      id: payload.sub as string,
      role: payload.role as string,
      name: payload.name as string,
      accountType: (payload.accountType as 'PLAYER' | 'CLUB') ?? 'PLAYER',
    }
  } catch {
    return null
  }
}

/** Прогревает кэш ключа при старте (опционально). */
export async function warmupPublicKey(): Promise<void> {
  try {
    await getPublicKey()
  } catch (err) {
    // не падаем — попробуем при первом запросе
    console.warn('Failed to warm up auth public key:', (err as Error).message)
  }
}
