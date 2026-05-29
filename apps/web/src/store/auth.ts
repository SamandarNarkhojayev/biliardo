import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { AccountType, User } from '@billiard/shared'
import { normalizePhone } from '@/utils/phone'
import { authApi } from '@/api/auth'
import { ApiException, configureApiClient } from '@/api/client'

export type AuthError =
  | 'INVALID_CREDENTIALS'
  | 'USER_EXISTS'
  | 'USER_NOT_FOUND'
  | 'WEAK_PASSWORD'
  | 'NETWORK'

export interface RegisterPayload {
  name: string
  phone: string
  password: string
  accountType: AccountType
  clubName?: string
}

interface AuthState {
  user: User | null
  accessToken: string | null
  bootstrapped: boolean
  login: (phone: string, password: string) => Promise<{ ok: true; user: User } | { ok: false; error: AuthError }>
  register: (input: RegisterPayload) => Promise<{ ok: true; user: User } | { ok: false; error: AuthError }>
  logout: () => Promise<void>
  updateProfile: (patch: { name?: string; phone?: string; avatar?: string | null; clubName?: string }) => Promise<void>
  setApiPassword: (password: string) => Promise<void>
  removeApiPassword: () => Promise<void>
  refreshMe: () => Promise<void>
  bootstrap: () => Promise<void>
  _setToken: (t: string | null) => void
}

function mapApiErrorCode(code: string): AuthError {
  switch (code) {
    case 'USER_EXISTS': return 'USER_EXISTS'
    case 'INVALID_CREDENTIALS': return 'INVALID_CREDENTIALS'
    case 'VALIDATION_ERROR': return 'WEAK_PASSWORD'
    default: return 'NETWORK'
  }
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,    // в памяти, НЕ persist
      bootstrapped: false,

      _setToken: (t) => set({ accessToken: t }),

      login: async (phoneRaw, password) => {
        const phone = normalizePhone(phoneRaw)
        try {
          const res = await authApi.login({ phone, password })
          set({ user: res.user, accessToken: res.accessToken })
          return { ok: true, user: res.user }
        } catch (err) {
          if (err instanceof ApiException) {
            // Backend пока не различает "не найден" и "неверный пароль" (security)
            // → маппим оба в INVALID_CREDENTIALS, UI всё равно показывает один тост
            return { ok: false, error: mapApiErrorCode(err.code) }
          }
          return { ok: false, error: 'NETWORK' }
        }
      },

      register: async (input) => {
        const phone = normalizePhone(input.phone)
        try {
          const res = await authApi.register({
            name: input.name.trim(),
            phone,
            password: input.password,
            accountType: input.accountType,
            clubName: input.accountType === 'CLUB' ? input.clubName?.trim() : undefined,
          })
          set({ user: res.user, accessToken: res.accessToken })
          return { ok: true, user: res.user }
        } catch (err) {
          if (err instanceof ApiException) {
            return { ok: false, error: mapApiErrorCode(err.code) }
          }
          return { ok: false, error: 'NETWORK' }
        }
      },

      logout: async () => {
        try { await authApi.logout() } catch { /* и без сервера чистим */ }
        set({ user: null, accessToken: null })
      },

      updateProfile: async (patch) => {
        const normalized = patch.phone ? { ...patch, phone: normalizePhone(patch.phone) } : patch
        const updated = await authApi.updateProfile(normalized)
        set({ user: updated })
      },

      setApiPassword: async (password) => {
        await authApi.setApiPassword({ password })
        await get().refreshMe()
      },

      removeApiPassword: async () => {
        await authApi.removeApiPassword()
        await get().refreshMe()
      },

      refreshMe: async () => {
        try {
          const me = await authApi.me()
          set({ user: me })
        } catch {
          // если 401 — клиент сам инициирует refresh, иначе игнорируем
        }
      },

      /**
       * Вызывается один раз при старте приложения. Пытается восстановить сессию
       * через refresh-cookie. Если успех — у нас новый accessToken и актуальный user.
       * Если нет — чистим persisted user.
       *
       * Пропускаем refresh, если в localStorage нет persisted user — иначе
       * анонимные посетители лендинга видят 401 в консоли при каждом заходе.
       */
      bootstrap: async () => {
        if (get().bootstrapped) return
        if (!get().user) {
          set({ bootstrapped: true })
          return
        }
        try {
          const res = await authApi.refresh()
          set({ accessToken: res.accessToken, user: res.user, bootstrapped: true })
        } catch {
          set({ accessToken: null, user: null, bootstrapped: true })
        }
      },
    }),
    {
      name: 'billiard.auth',
      storage: createJSONStorage(() => localStorage),
      // Persist ТОЛЬКО user (для мгновенного UI). Токен — в памяти.
      partialize: (s) => ({ user: s.user }),
    },
  ),
)

export const useIsAuthenticated = () => useAuthStore((s) => s.user !== null && s.accessToken !== null)

// Подключаем API-клиент к store: он будет брать токен и обрабатывать refresh.
configureApiClient({
  getAccessToken: () => useAuthStore.getState().accessToken,
  onTokenRefreshed: (t) => useAuthStore.getState()._setToken(t),
  onAuthExpired: () => {
    useAuthStore.setState({ user: null, accessToken: null })
  },
})
