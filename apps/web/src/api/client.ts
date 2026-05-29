import type { ApiError } from '@billiard/shared'

/**
 * Лёгкий fetch-обёртка с:
 *  - автоподстановкой Bearer токена
 *  - отправкой credentials (httpOnly refresh-cookie)
 *  - автоматическим refresh при 401
 *  - типизированным ответом и ошибками
 */

const BASE = (import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api').replace(/\/$/, '')

let accessTokenGetter: () => string | null = () => null
let onTokenRefreshed: (token: string) => void = () => {}
let onAuthExpired: () => void = () => {}

export function configureApiClient(opts: {
  getAccessToken: () => string | null
  onTokenRefreshed: (token: string) => void
  onAuthExpired: () => void
}): void {
  accessTokenGetter = opts.getAccessToken
  onTokenRefreshed = opts.onTokenRefreshed
  onAuthExpired = opts.onAuthExpired
}

export class ApiException extends Error {
  status: number
  code: string
  details?: unknown
  constructor(error: ApiError, status: number) {
    super(error.message)
    this.name = 'ApiException'
    this.status = status
    this.code = error.code
    this.details = error.details
  }
}

interface RequestOpts extends Omit<RequestInit, 'body'> {
  body?: unknown
  /** Не пытаться сделать refresh при 401 (используется в самом refresh-вызове) */
  skipRefresh?: boolean
}

let refreshInflight: Promise<string | null> | null = null

async function tryRefresh(): Promise<string | null> {
  if (refreshInflight) return refreshInflight
  refreshInflight = (async () => {
    try {
      const res = await fetch(`${BASE}/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
      })
      if (!res.ok) return null
      const data = await res.json() as { accessToken: string }
      onTokenRefreshed(data.accessToken)
      return data.accessToken
    } catch {
      return null
    } finally {
      refreshInflight = null
    }
  })()
  return refreshInflight
}

export async function apiRequest<T>(path: string, opts: RequestOpts = {}): Promise<T> {
  const url = `${BASE}${path}`
  const headers = new Headers(opts.headers as HeadersInit | undefined)
  // Content-Type выставляем ТОЛЬКО когда реально есть тело. Иначе Fastify v5
  // отвечает 400 FST_ERR_CTP_EMPTY_JSON_BODY на пустой POST (refresh, logout и т.п.).
  const hasBody = opts.body !== undefined
  if (hasBody) headers.set('Content-Type', 'application/json')
  const token = accessTokenGetter()
  if (token) headers.set('Authorization', `Bearer ${token}`)

  const init: RequestInit = {
    ...opts,
    headers,
    credentials: 'include',
    body: hasBody ? JSON.stringify(opts.body) : undefined,
  }

  let res = await fetch(url, init)

  // Авто-refresh при 401, кроме самого refresh-эндпоинта
  if (res.status === 401 && !opts.skipRefresh && !path.startsWith('/auth/refresh')) {
    const newToken = await tryRefresh()
    if (newToken) {
      headers.set('Authorization', `Bearer ${newToken}`)
      res = await fetch(url, { ...init, headers })
    } else {
      onAuthExpired()
    }
  }

  if (res.status === 204) return undefined as T

  let body: unknown
  try { body = await res.json() } catch { body = null }

  if (!res.ok) {
    const err = (body && typeof body === 'object' ? body as ApiError : { code: 'UNKNOWN', message: res.statusText })
    throw new ApiException(err, res.status)
  }
  return body as T
}

export const api = {
  get: <T>(path: string, opts?: RequestOpts) => apiRequest<T>(path, { ...opts, method: 'GET' }),
  post: <T>(path: string, body?: unknown, opts?: RequestOpts) =>
    apiRequest<T>(path, { ...opts, method: 'POST', body }),
  patch: <T>(path: string, body?: unknown, opts?: RequestOpts) =>
    apiRequest<T>(path, { ...opts, method: 'PATCH', body }),
  delete: <T>(path: string, opts?: RequestOpts) => apiRequest<T>(path, { ...opts, method: 'DELETE' }),
}
