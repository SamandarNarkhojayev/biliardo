import { env } from './config.js'

/**
 * Internal-клиент к auth-сервису. Все вызовы идут с x-internal-secret и не проксируются
 * через gateway — по соглашению FORBIDDEN_PUBLIC_PREFIXES.
 */

function authUrl(path: string): string {
  return `${env.AUTH_SERVICE_URL.replace(/\/$/, '')}${path}`
}

export interface ConsumeResult {
  ok: true
  userId: string
}
export interface ConsumeError {
  ok: false
  code: 'TOKEN_NOT_FOUND' | 'TOKEN_USED' | 'TOKEN_EXPIRED' | 'CHAT_ALREADY_LINKED' | 'OTHER'
  status: number
}

export async function consumeLinkToken(input: {
  token: string
  chatId: number
  username: string | null
}): Promise<ConsumeResult | ConsumeError> {
  try {
    const res = await fetch(authUrl('/auth/internal/telegram/consume'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-internal-secret': env.INTERNAL_SECRET,
      },
      body: JSON.stringify(input),
    })
    if (res.ok) {
      const data = (await res.json()) as { userId: string }
      return { ok: true, userId: data.userId }
    }
    let code: ConsumeError['code'] = 'OTHER'
    try {
      const data = (await res.json()) as { code?: string }
      if (data.code === 'TOKEN_NOT_FOUND') code = 'TOKEN_NOT_FOUND'
      else if (data.code === 'TOKEN_USED') code = 'TOKEN_USED'
      else if (data.code === 'TOKEN_EXPIRED') code = 'TOKEN_EXPIRED'
      else if (data.code === 'CHAT_ALREADY_LINKED') code = 'CHAT_ALREADY_LINKED'
    } catch { /* ignore */ }
    return { ok: false, code, status: res.status }
  } catch {
    return { ok: false, code: 'OTHER', status: 0 }
  }
}

export interface ResolvedRecipient {
  userId: string
  chatId: number | null
  telegramUsername: string | null
  name: string
  avatar: string | null
}

export async function resolveRecipients(userIds: string[]): Promise<ResolvedRecipient[]> {
  if (userIds.length === 0) return []
  const res = await fetch(authUrl('/auth/internal/telegram/resolve'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-internal-secret': env.INTERNAL_SECRET,
    },
    body: JSON.stringify({ userIds }),
  })
  if (!res.ok) return []
  const data = (await res.json()) as { items: ResolvedRecipient[] }
  return data.items
}
