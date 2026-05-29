import type { BracketType, PrizePlace, Tournament } from '@billiard/shared'
import { api } from './client'

export interface CreateTournamentDto {
  name: string
  description?: string
  bracketType: BracketType
  maxParticipants: number
  isPublic: boolean
  scheduledAt?: string
  location?: string
  city?: string
  tables?: number[]
  prizeFund?: number
  entryFee?: number
  coverGradient?: string
  prizePlaces: PrizePlace[]
}

export type UpdateTournamentDto = Partial<CreateTournamentDto>

export interface RegisterParticipantDto {
  name: string
  phone?: string
  avatar?: string | null
  userId?: string
}

export const tournamentsApi = {
  // Публичный каталог.
  list: (params: { status?: string; city?: string; organizerId?: string; publicOnly?: boolean; limit?: number; sort?: 'upcoming' | 'recent' } = {}) => {
    const search = new URLSearchParams()
    if (params.status) search.set('status', params.status)
    if (params.city) search.set('city', params.city)
    if (params.organizerId) search.set('organizerId', params.organizerId)
    if (params.publicOnly === false) search.set('publicOnly', 'false')
    if (params.limit) search.set('limit', String(params.limit))
    if (params.sort) search.set('sort', params.sort)
    const q = search.toString()
    return api.get<{ tournaments: Tournament[] }>(`/tournaments${q ? '?' + q : ''}`)
  },

  byId: (id: string) =>
    api.get<{ tournament: Tournament }>(`/tournaments/${encodeURIComponent(id)}`),

  byInvite: (code: string) =>
    api.get<{ tournament: Tournament }>(`/tournaments/by-invite/${encodeURIComponent(code)}`),

  // Организаторские маршруты.
  mine: () =>
    api.get<{ tournaments: Tournament[] }>('/organizer/tournaments'),

  create: (input: CreateTournamentDto) =>
    api.post<{ tournament: Tournament }>('/organizer/tournaments', input),

  update: (id: string, patch: UpdateTournamentDto) =>
    api.patch<{ tournament: Tournament }>(`/organizer/tournaments/${encodeURIComponent(id)}`, patch),

  remove: (id: string) =>
    api.delete<void>(`/organizer/tournaments/${encodeURIComponent(id)}`),

  start: (id: string) =>
    api.post<{ tournament: Tournament }>(`/organizer/tournaments/${encodeURIComponent(id)}/start`, undefined),

  complete: (id: string) =>
    api.post<{ tournament: Tournament }>(`/organizer/tournaments/${encodeURIComponent(id)}/complete`, undefined),

  setMatchScore: (tournamentId: string, matchId: string, score1: number, score2: number) =>
    api.post<{ tournament: Tournament }>(
      `/organizer/tournaments/${encodeURIComponent(tournamentId)}/matches/${encodeURIComponent(matchId)}/score`,
      { score1, score2 },
    ),

  // Регистрация участника. Доступно: организатор (с userId или без) и сам пользователь (себя).
  registerParticipant: (tournamentId: string, input: RegisterParticipantDto) =>
    api.post<{ participant: { id: string } }>(
      `/tournaments/${encodeURIComponent(tournamentId)}/participants`,
      input,
    ),

  toggleCheckin: (tournamentId: string, participantId: string) =>
    api.patch<{ participant: { id: string; checkedIn: boolean } }>(
      `/tournaments/${encodeURIComponent(tournamentId)}/participants/${encodeURIComponent(participantId)}`,
      undefined,
    ),

  togglePaid: (tournamentId: string, participantId: string) =>
    api.patch<{ participant: { id: string; paid: boolean } }>(
      `/tournaments/${encodeURIComponent(tournamentId)}/participants/${encodeURIComponent(participantId)}/paid`,
      undefined,
    ),

  removeParticipant: (tournamentId: string, participantId: string) =>
    api.delete<void>(
      `/tournaments/${encodeURIComponent(tournamentId)}/participants/${encodeURIComponent(participantId)}`,
    ),
}
