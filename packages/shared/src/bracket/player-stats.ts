import type { Match, Participant, Tournament } from '../types.js'
import { computeStandings } from './standings.js'

export interface PlayerTournamentStats {
  tournamentId: string
  tournamentName: string
  scheduledAt: string | null
  status: Tournament['status']
  /** Финальное место (1 = чемпион). null если турнир не завершён или участник не доиграл. */
  place: number | null
  /** Сколько матчей сыграно (без bye). */
  played: number
  wins: number
  losses: number
  /** Сумма score (= шары по договорённости) забитых игроком. */
  ballsPotted: number
  ballsConceded: number
}

/**
 * Универсальный расчёт места участников по результатам матчей. Работает для всех
 * 6 типов сеток. Принцип: ранжируем по «как поздно ты выбыл» + tie-break по wins/diff.
 *
 * exitRound = round последнего поражения. Для победителя турнира — Infinity
 * (если он вообще проиграл, это не должно быть, но защищаемся).
 *
 * Чемпион сетки = тот, кто выиграл последний матч (max round) и не проигрывал
 * после этого.
 */
export function computePlacements(participants: Participant[], matches: Match[]): Map<string, number> {
  const result = new Map<string, number>()
  if (participants.length === 0) return result

  // Если все матчи в round-robin / swiss (нет «финала» по структуре) — используем standings.
  // Эвристика: если max round == 1 и >1 матчей на пару участников, это round-robin/swiss.
  const completedOrBye = matches.filter((m) => m.status === 'completed' || m.status === 'bye')
  const hasAnyResult = completedOrBye.length > 0

  if (!hasAnyResult) return result

  // exitRound[pid] = round, где участник проиграл последний раз. Если не проигрывал — Infinity.
  const exitRound = new Map<string, number>()
  const wins = new Map<string, number>()
  const losses = new Map<string, number>()
  const diff = new Map<string, number>()

  for (const p of participants) {
    exitRound.set(p.id, Number.POSITIVE_INFINITY)
    wins.set(p.id, 0)
    losses.set(p.id, 0)
    diff.set(p.id, 0)
  }

  for (const m of completedOrBye) {
    if (m.status === 'bye') continue
    if (m.score1 == null || m.score2 == null) continue
    const p1 = m.participant1Id
    const p2 = m.participant2Id
    if (!p1 || !p2) continue

    diff.set(p1, (diff.get(p1) ?? 0) + (m.score1 - m.score2))
    diff.set(p2, (diff.get(p2) ?? 0) + (m.score2 - m.score1))

    if (m.winnerId === p1) {
      wins.set(p1, (wins.get(p1) ?? 0) + 1)
      losses.set(p2, (losses.get(p2) ?? 0) + 1)
      exitRound.set(p2, Math.max(exitRound.get(p2) ?? 0, m.round))
    } else if (m.winnerId === p2) {
      wins.set(p2, (wins.get(p2) ?? 0) + 1)
      losses.set(p1, (losses.get(p1) ?? 0) + 1)
      exitRound.set(p1, Math.max(exitRound.get(p1) ?? 0, m.round))
    }
  }

  const ranked = [...participants].sort((a, b) => {
    const ea = exitRound.get(a.id) ?? 0
    const eb = exitRound.get(b.id) ?? 0
    if (ea !== eb) return eb - ea
    const wa = wins.get(a.id) ?? 0
    const wb = wins.get(b.id) ?? 0
    if (wa !== wb) return wb - wa
    const da = diff.get(a.id) ?? 0
    const db = diff.get(b.id) ?? 0
    if (da !== db) return db - da
    return (a.seed ?? 999) - (b.seed ?? 999)
  })

  ranked.forEach((p, i) => result.set(p.id, i + 1))
  return result
}

/**
 * Возвращает место конкретного участника в турнире. null если игрок не участвовал
 * или сетка ещё пустая.
 */
export function placeOf(participantId: string, participants: Participant[], matches: Match[]): number | null {
  const placements = computePlacements(participants, matches)
  return placements.get(participantId) ?? null
}

/**
 * Стата игрока в одном турнире. Использует существующую computeStandings для
 * подсчёта played/wins/losses/balls — она уже корректно обрабатывает score1/score2.
 *
 * place берётся из computePlacements. Для round-robin/swiss это совпадает со
 * стандартным рангом по очкам; для bracket — по exit-round.
 */
export function playerStatsForTournament(tournament: Tournament, userId: string): PlayerTournamentStats | null {
  const participant = tournament.participants.find((p) => p.userId === userId)
  if (!participant) return null

  const standings = computeStandings(tournament.participants, tournament.matches)
  const row = standings.find((r) => r.participant.id === participant.id)
  const placements = computePlacements(tournament.participants, tournament.matches)
  const place = tournament.status === 'COMPLETED' ? placements.get(participant.id) ?? null : null

  return {
    tournamentId: tournament.id,
    tournamentName: tournament.name,
    scheduledAt: tournament.scheduledAt ?? null,
    status: tournament.status,
    place,
    played: row?.played ?? 0,
    wins: row?.wins ?? 0,
    losses: row?.losses ?? 0,
    ballsPotted: row?.pointsFor ?? 0,
    ballsConceded: row?.pointsAgainst ?? 0,
  }
}
