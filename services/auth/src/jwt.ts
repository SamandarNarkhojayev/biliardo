import { generateKeyPair, SignJWT, jwtVerify, importPKCS8, importSPKI, type KeyLike } from 'jose'
import { env } from './config.js'

/**
 * RS256-based JWT.
 * - Auth-сервис подписывает access-токены приватным ключом
 * - Gateway/другие сервисы верифицируют публичным
 *
 * В dev: если ключи не заданы в env, генерируем эфемерную пару при старте.
 * В production: ключи ОБЯЗАТЕЛЬНО задавать через env (PEM-строки), иначе при
 * каждом рестарте все токены инвалидируются.
 */

const ALG = 'RS256'
const ISSUER = 'billiard.auth'
const AUDIENCE = 'billiard.api'

let privateKey: KeyLike
let publicKey: KeyLike
let publicKeyPem: string

export async function initJwt(): Promise<void> {
  if (env.JWT_PRIVATE_KEY && env.JWT_PUBLIC_KEY) {
    privateKey = await importPKCS8(env.JWT_PRIVATE_KEY, ALG)
    publicKey = await importSPKI(env.JWT_PUBLIC_KEY, ALG)
    publicKeyPem = env.JWT_PUBLIC_KEY
  } else {
    if (env.NODE_ENV === 'production') {
      throw new Error('JWT_PRIVATE_KEY и JWT_PUBLIC_KEY обязательны в production')
    }
    const pair = await generateKeyPair(ALG, { extractable: true })
    privateKey = pair.privateKey
    publicKey = pair.publicKey
    // Экспортируем PUBLIC для отладки
    const { exportSPKI } = await import('jose')
    publicKeyPem = await exportSPKI(publicKey)
    console.warn('⚠️  Сгенерирована эфемерная RS256 пара (dev only). Все токены инвалидируются при рестарте.')
  }
}

export interface AccessTokenPayload {
  sub: string        // user.id
  role: string       // 'PLAYER' | 'ORGANIZER' | 'ADMIN'
  name: string       // для UI без лишних запросов
  accountType: 'PLAYER' | 'CLUB'
}

export async function signAccessToken(payload: AccessTokenPayload): Promise<string> {
  return new SignJWT({ ...payload, client: 'browser' })
    .setProtectedHeader({ alg: ALG })
    .setIssuer(ISSUER)
    .setAudience(AUDIENCE)
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime(env.ACCESS_TOKEN_TTL)
    .sign(privateKey)
}

export async function verifyAccessToken(token: string): Promise<AccessTokenPayload> {
  const { payload } = await jwtVerify(token, publicKey, {
    issuer: ISSUER,
    audience: AUDIENCE,
    algorithms: [ALG],
  })
  return {
    sub: payload.sub as string,
    role: payload.role as string,
    name: payload.name as string,
    accountType: (payload.accountType as 'PLAYER' | 'CLUB') ?? 'PLAYER',
  }
}

/**
 * Long-lived JWT для desktop-клиента (90 дней).
 * Payload помечен `client: 'desktop'` — gateway различает его от browser-токенов
 * и не пускает в обычные API-эндпоинты.
 */
export async function signDesktopToken(payload: { sub: string; clubId: string; clubName: string }): Promise<string> {
  return new SignJWT({
    sub: payload.sub,
    role: 'ORGANIZER',
    name: payload.clubName,
    accountType: 'CLUB',
    clubId: payload.clubId,
    client: 'desktop',
  })
    .setProtectedHeader({ alg: ALG })
    .setIssuer(ISSUER)
    .setAudience(AUDIENCE)
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime('90d')
    .sign(privateKey)
}

/** Возвращает PEM публичного ключа — используется gateway для верификации. */
export function getPublicKeyPem(): string {
  return publicKeyPem
}
