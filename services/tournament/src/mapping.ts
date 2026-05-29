import type {
  Tournament as ApiTournament,
  TournamentStatus as ApiStatus,
  BracketType as ApiBracketType,
  MatchStatus as ApiMatchStatus,
  MatchStage as ApiMatchStage,
  Participant as ApiParticipant,
  Match as ApiMatch,
} from '@billiard/shared'
import type {
  Tournament as DbTournament,
  Participant as DbParticipant,
  Match as DbMatch,
  PrizePlace as DbPrizePlace,
  TournamentStatus as DbStatus,
  BracketType as DbBracketType,
  MatchStatus as DbMatchStatus,
} from './_prisma/index.js'

export const DB_TO_API_STATUS: Record<DbStatus, ApiStatus> = {
  DRAFT: 'DRAFT',
  REGISTRATION: 'REGISTRATION',
  ACTIVE: 'ACTIVE',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
}

export const API_TO_DB_STATUS: Record<ApiStatus, DbStatus> = {
  DRAFT: 'DRAFT',
  REGISTRATION: 'REGISTRATION',
  ACTIVE: 'ACTIVE',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
}

export const DB_TO_API_BRACKET: Record<DbBracketType, ApiBracketType> = {
  SINGLE_ELIMINATION: 'single-elimination',
  DOUBLE_ELIMINATION: 'double-elimination',
  ROUND_ROBIN: 'round-robin',
  SWISS: 'swiss',
  GROUP_PLAYOFF: 'group-playoff',
  PAGE_PLAYOFF: 'page-playoff',
}

export const API_TO_DB_BRACKET: Record<ApiBracketType, DbBracketType> = {
  'single-elimination': 'SINGLE_ELIMINATION',
  'double-elimination': 'DOUBLE_ELIMINATION',
  'round-robin': 'ROUND_ROBIN',
  'swiss': 'SWISS',
  'group-playoff': 'GROUP_PLAYOFF',
  'page-playoff': 'PAGE_PLAYOFF',
}

export const DB_TO_API_MATCH_STATUS: Record<DbMatchStatus, ApiMatchStatus> = {
  PENDING: 'pending',
  IN_PROGRESS: 'in-progress',
  COMPLETED: 'completed',
  BYE: 'bye',
}

export const API_TO_DB_MATCH_STATUS: Record<ApiMatchStatus, DbMatchStatus> = {
  pending: 'PENDING',
  'in-progress': 'IN_PROGRESS',
  completed: 'COMPLETED',
  bye: 'BYE',
}

export function dbParticipantToApi(p: DbParticipant): ApiParticipant {
  return {
    id: p.id,
    tournamentId: p.tournamentId,
    userId: p.userId,
    name: p.name,
    phone: p.phone,
    avatar: p.avatar,
    seed: p.seed,
    registeredAt: p.registeredAt.toISOString(),
    checkedIn: p.checkedIn,
    paid: p.paid,
    position: p.position,
  }
}

export function dbMatchToApi(m: DbMatch): ApiMatch {
  return {
    id: m.id,
    tournamentId: m.tournamentId,
    round: m.round,
    matchNumber: m.matchNumber,
    participant1Id: m.participant1Id ?? undefined,
    participant2Id: m.participant2Id ?? undefined,
    winnerId: m.winnerId ?? undefined,
    score1: m.score1 ?? undefined,
    score2: m.score2 ?? undefined,
    status: DB_TO_API_MATCH_STATUS[m.status],
    tableLabel: m.tableLabel ?? undefined,
    stage: (m.stage as ApiMatchStage) ?? 'main',
  }
}

export interface FullDbTournament extends DbTournament {
  prizePlaces: DbPrizePlace[]
  participants: DbParticipant[]
  matches: DbMatch[]
}

export function dbTournamentToApi(t: FullDbTournament): ApiTournament {
  return {
    id: t.id,
    name: t.name,
    description: t.description,
    organizerId: t.organizerId,
    organizerName: t.organizerName,
    status: DB_TO_API_STATUS[t.status],
    bracketType: DB_TO_API_BRACKET[t.bracketType],
    maxParticipants: t.maxParticipants,
    participantCount: t.participantCount,
    isPublic: t.isPublic,
    inviteCode: t.inviteCode,
    scheduledAt: t.scheduledAt?.toISOString() ?? null,
    prizeFund: t.prizeFund,
    entryFee: t.entryFee,
    location: t.location,
    city: t.city,
    tables: t.tables.length > 0 ? t.tables : null,
    coverGradient: t.coverGradient,
    prizePlaces: t.prizePlaces.sort((a, b) => a.place - b.place).map((p) => ({ place: p.place, prize: p.prize })),
    participants: t.participants.sort((a, b) => a.position - b.position).map(dbParticipantToApi),
    matches: t.matches.map(dbMatchToApi),
    createdAt: t.createdAt.toISOString(),
    updatedAt: t.updatedAt.toISOString(),
  }
}
