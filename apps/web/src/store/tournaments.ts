import { create } from 'zustand'
import type { PlanCheck, Tournament } from '@billiard/shared'
import { tournamentsApi, type CreateTournamentDto, type RegisterParticipantDto, type UpdateTournamentDto } from '@/api/tournaments'
import { FREE_TOURNAMENTS } from '@/config/flags'

/**
 * Stores tournaments fetched from backend. Не persist (источник правды — БД).
 * UI вызывает fetch-методы для прогрева кэша; мутации обновляют кэш по ответу сервера.
 */

interface State {
  tournaments: Tournament[]
  loading: boolean
  lastFetchedCatalogAt: number
  lastFetchedMineAt: number

  // Реализованы синхронно — читают из кэша.
  byId: (id: string) => Tournament | undefined
  byInvite: (code: string) => Tournament | undefined
  byOrganizer: (organizerId: string) => Tournament[]

  // Прогрев кэша.
  fetchCatalog: (opts?: { force?: boolean }) => Promise<void>
  fetchMine: (opts?: { force?: boolean }) => Promise<void>
  fetchById: (id: string) => Promise<Tournament | null>
  fetchByInvite: (code: string) => Promise<Tournament | null>

  // Мутации (организатор).
  create: (input: CreateTournamentDto) => Promise<Tournament>
  update: (id: string, patch: UpdateTournamentDto) => Promise<Tournament>
  remove: (id: string) => Promise<void>
  start: (id: string) => Promise<Tournament>
  complete: (id: string) => Promise<Tournament>
  setMatchScore: (id: string, matchId: string, score1: number, score2: number) => Promise<Tournament>

  registerParticipant: (id: string, input: RegisterParticipantDto) => Promise<void>
  toggleCheckin: (id: string, participantId: string) => Promise<void>
  togglePaid: (id: string, participantId: string) => Promise<void>
  removeParticipant: (id: string, participantId: string) => Promise<void>

  // Утилита для тестов / ручного апдейта (используется редко).
  _upsert: (t: Tournament) => void
  _remove: (id: string) => void
}

const CACHE_TTL_MS = 30_000

export const useTournamentsStore = create<State>((set, get) => ({
  tournaments: [],
  loading: false,
  lastFetchedCatalogAt: 0,
  lastFetchedMineAt: 0,

  byId: (id) => get().tournaments.find((t) => t.id === id),
  byInvite: (code) => get().tournaments.find((t) => t.inviteCode === code),
  byOrganizer: (organizerId) => get().tournaments.filter((t) => t.organizerId === organizerId),

  fetchCatalog: async (opts) => {
    const now = Date.now()
    if (!opts?.force && now - get().lastFetchedCatalogAt < CACHE_TTL_MS) return
    set({ loading: true })
    try {
      const { tournaments } = await tournamentsApi.list({ publicOnly: true, limit: 50 })
      mergeMany(set, get, tournaments)
      set({ lastFetchedCatalogAt: now })
    } finally {
      set({ loading: false })
    }
  },

  fetchMine: async (opts) => {
    const now = Date.now()
    if (!opts?.force && now - get().lastFetchedMineAt < CACHE_TTL_MS) return
    set({ loading: true })
    try {
      const { tournaments } = await tournamentsApi.mine()
      mergeMany(set, get, tournaments)
      set({ lastFetchedMineAt: now })
    } finally {
      set({ loading: false })
    }
  },

  fetchById: async (id) => {
    try {
      const { tournament } = await tournamentsApi.byId(id)
      mergeOne(set, get, tournament)
      return tournament
    } catch {
      return null
    }
  },

  fetchByInvite: async (code) => {
    try {
      const { tournament } = await tournamentsApi.byInvite(code)
      mergeOne(set, get, tournament)
      return tournament
    } catch {
      return null
    }
  },

  create: async (input) => {
    const { tournament } = await tournamentsApi.create(input)
    mergeOne(set, get, tournament)
    return tournament
  },

  update: async (id, patch) => {
    const { tournament } = await tournamentsApi.update(id, patch)
    mergeOne(set, get, tournament)
    return tournament
  },

  remove: async (id) => {
    await tournamentsApi.remove(id)
    set({ tournaments: get().tournaments.filter((t) => t.id !== id) })
  },

  start: async (id) => {
    const { tournament } = await tournamentsApi.start(id)
    mergeOne(set, get, tournament)
    return tournament
  },

  complete: async (id) => {
    const { tournament } = await tournamentsApi.complete(id)
    mergeOne(set, get, tournament)
    return tournament
  },

  setMatchScore: async (id, matchId, score1, score2) => {
    const { tournament } = await tournamentsApi.setMatchScore(id, matchId, score1, score2)
    mergeOne(set, get, tournament)
    return tournament
  },

  registerParticipant: async (id, input) => {
    await tournamentsApi.registerParticipant(id, input)
    // Перезапрашиваем турнир целиком — изменился список участников и счётчик.
    const { tournament } = await tournamentsApi.byId(id)
    mergeOne(set, get, tournament)
  },

  toggleCheckin: async (id, participantId) => {
    await tournamentsApi.toggleCheckin(id, participantId)
    const { tournament } = await tournamentsApi.byId(id)
    mergeOne(set, get, tournament)
  },

  togglePaid: async (id, participantId) => {
    await tournamentsApi.togglePaid(id, participantId)
    const { tournament } = await tournamentsApi.byId(id)
    mergeOne(set, get, tournament)
  },

  removeParticipant: async (id, participantId) => {
    await tournamentsApi.removeParticipant(id, participantId)
    const { tournament } = await tournamentsApi.byId(id)
    mergeOne(set, get, tournament)
  },

  _upsert: (t) => mergeOne(set, get, t),
  _remove: (id) => set({ tournaments: get().tournaments.filter((x) => x.id !== id) }),
}))

function mergeOne(
  set: (partial: Partial<State>) => void,
  get: () => State,
  t: Tournament,
): void {
  const idx = get().tournaments.findIndex((x) => x.id === t.id)
  if (idx === -1) set({ tournaments: [t, ...get().tournaments] })
  else {
    const next = get().tournaments.slice()
    next[idx] = t
    set({ tournaments: next })
  }
}

function mergeMany(
  set: (partial: Partial<State>) => void,
  get: () => State,
  arr: Tournament[],
): void {
  const map = new Map(get().tournaments.map((t) => [t.id, t]))
  for (const t of arr) map.set(t.id, t)
  set({ tournaments: Array.from(map.values()) })
}

/** Расчёт необходимого тарифа по числу участников. */
export function checkPlan(maxParticipants: number): PlanCheck {
  // Промо: пока FREE_TOURNAMENTS включён — турнир любого размера бесплатен.
  if (FREE_TOURNAMENTS) return { allowed: true, plan: 'FREE', price: 0 }
  if (maxParticipants <= 6) return { allowed: true, plan: 'FREE', price: 0 }
  if (maxParticipants <= 50) return { allowed: false, plan: 'STANDARD', price: 10_000 }
  if (maxParticipants <= 100) return { allowed: false, plan: 'PRO', price: 20_000 }
  if (maxParticipants <= 200) return { allowed: false, plan: 'BUSINESS', price: 35_000 }
  return { allowed: false, plan: 'ENTERPRISE', price: 50_000 }
}
