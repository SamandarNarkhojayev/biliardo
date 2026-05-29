import type {
  User, LoginResponse, RegisterInput, LoginInput, UpdateProfileInput, SetApiPasswordInput, AccountType,
} from '@billiard/shared'
import { api } from './client'

export interface LookupUser {
  id: string
  phone: string
  name: string
  avatar: string | null
  accountType: AccountType
}

export const authApi = {
  register: (input: RegisterInput) => api.post<LoginResponse>('/auth/register', input),
  login: (input: LoginInput) => api.post<LoginResponse>('/auth/login', input),
  refresh: () => api.post<{ accessToken: string; user: User }>('/auth/refresh', undefined, { skipRefresh: true }),
  logout: () => api.delete<void>('/auth/logout'),
  me: () => api.get<User>('/auth/me'),
  updateProfile: (patch: UpdateProfileInput) => api.patch<User>('/auth/me', patch),
  setApiPassword: (input: SetApiPasswordInput) => api.post<{ ok: true }>('/auth/me/api-password', input),
  removeApiPassword: () => api.delete<{ ok: true }>('/auth/me/api-password'),
  presignAvatarUpload: (input: { contentType: string; size: number }) =>
    api.post<{ uploadUrl: string; publicUrl: string; key: string }>('/auth/me/avatar/upload-url', input),
  lookupByPhone: (phone: string) => api.post<{ user: LookupUser }>('/auth/lookup-by-phone', { phone }),

  // ---- Telegram ----
  telegramStatus: () =>
    api.get<{ connected: boolean; username: string | null }>('/auth/me/telegram'),
  telegramLinkToken: () =>
    api.post<{ token: string; expiresAt: string; deepLink: string | null }>('/auth/me/telegram/link-token', undefined),
  telegramUnlink: () =>
    api.delete<void>('/auth/me/telegram'),
}
