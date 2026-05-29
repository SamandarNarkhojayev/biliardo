import { randomBytes, createHash } from 'node:crypto'
import { env } from './config.js'
import { prisma } from './prisma.js'

/**
 * Refresh-токены — random opaque строки, в БД храним только sha256-хэш.
 * Это даёт возможность отозвать конкретную сессию и аудит, без хранения plaintext.
 */
export const REFRESH_BYTES = 48 // 384 бита энтропии
const HASH_ALG = 'sha256'

function hashToken(token: string): string {
  return createHash(HASH_ALG).update(token).digest('hex')
}

export interface IssueRefreshOptions {
  userId: string
  userAgent?: string | null
  ip?: string | null
}

export async function issueRefreshToken({
  userId, userAgent, ip,
}: IssueRefreshOptions): Promise<{ token: string; expiresAt: Date }> {
  const raw = randomBytes(REFRESH_BYTES).toString('base64url')
  const expiresAt = new Date(Date.now() + env.REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000)

  await prisma.refreshToken.create({
    data: {
      userId,
      tokenHash: hashToken(raw),
      userAgent: userAgent ?? null,
      ip: ip ?? null,
      expiresAt,
    },
  })
  return { token: raw, expiresAt }
}

/**
 * Атомарно валидирует refresh + ротирует (отзывает старый, выдаёт новый).
 * Защита от replay-атаки: если кто-то использует уже отозванный токен — все
 * сессии этого пользователя инвалидируются (security best-practice).
 */
export async function rotateRefreshToken(
  presented: string,
  meta: { userAgent?: string | null; ip?: string | null },
): Promise<{ userId: string; newToken: string; newExpiresAt: Date } | null> {
  const tokenHash = hashToken(presented)
  const found = await prisma.refreshToken.findUnique({
    where: { tokenHash },
    include: { user: true },
  })
  if (!found) return null

  // Уже использован/отозван → потенциальная replay-атака. Отзываем все токены пользователя.
  if (found.revokedAt) {
    await prisma.refreshToken.updateMany({
      where: { userId: found.userId, revokedAt: null },
      data: { revokedAt: new Date() },
    })
    return null
  }

  if (found.expiresAt < new Date()) return null

  // Отзываем текущий, выдаём новый — в одной транзакции
  const newRaw = randomBytes(REFRESH_BYTES).toString('base64url')
  const newExpiresAt = new Date(Date.now() + env.REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000)

  await prisma.$transaction([
    prisma.refreshToken.update({
      where: { id: found.id },
      data: { revokedAt: new Date() },
    }),
    prisma.refreshToken.create({
      data: {
        userId: found.userId,
        tokenHash: hashToken(newRaw),
        userAgent: meta.userAgent ?? null,
        ip: meta.ip ?? null,
        expiresAt: newExpiresAt,
      },
    }),
  ])

  return { userId: found.userId, newToken: newRaw, newExpiresAt }
}

export async function revokeRefreshToken(presented: string): Promise<void> {
  const tokenHash = hashToken(presented)
  await prisma.refreshToken.updateMany({
    where: { tokenHash, revokedAt: null },
    data: { revokedAt: new Date() },
  })
}

export async function revokeAllForUser(userId: string): Promise<void> {
  await prisma.refreshToken.updateMany({
    where: { userId, revokedAt: null },
    data: { revokedAt: new Date() },
  })
}
