import type { Match, Participant } from '../types.js'
import { cuid } from '../utils.js'
import { computeStandings } from './standings.js'

/**
 * Swiss-турниры: фиксированное число раундов без выбывания.
 * После каждого раунда игроки сортируются по очкам и формируются пары
 * "топ играет с топом из тех, с кем ещё не играл".
 *
 * generateSwiss создаёт ТОЛЬКО первый раунд. Последующие генерируются
 * автоматически через generateNextSwissRound после завершения предыдущего.
 *
 * Рекомендуемое число раундов: ceil(log2(N)).
 */
export function recommendedSwissRounds(n: number): number {
  return Math.max(3, Math.ceil(Math.log2(Math.max(2, n))))
}

export function generateSwiss(
  tournamentId: string,
  participants: Participant[],
): Match[] {
  if (participants.length < 2) return []
  return generateRoundPairings(tournamentId, participants, [], 1)
}

/**
 * Если все матчи текущего раунда сыграны и раундов меньше recommended,
 * генерирует пары следующего раунда. Возвращает обновлённый массив матчей
 * (или исходный, если не нужно).
 */
export function maybeGenerateNextSwissRound(
  tournamentId: string,
  matches: Match[],
  participants: Participant[],
  totalRounds = recommendedSwissRounds(participants.length),
): Match[] {
  if (matches.length === 0) return matches
  const maxRound = matches.reduce((acc, m) => Math.max(acc, m.round), 0)
  if (maxRound >= totalRounds) return matches
  const currentRoundComplete = matches
    .filter((m) => m.round === maxRound)
    .every((m) => m.status === 'completed' || m.status === 'bye')
  if (!currentRoundComplete) return matches

  const nextMatches = generateRoundPairings(tournamentId, participants, matches, maxRound + 1)
  return [...matches, ...nextMatches]
}

/**
 * Формирует пары для раунда: сортируем игроков по standings, идём сверху,
 * пытаемся не повторять прошлые встречи.
 */
function generateRoundPairings(
  tournamentId: string,
  participants: Participant[],
  pastMatches: Match[],
  round: number,
): Match[] {
  const standings = computeStandings(participants, pastMatches)
  // Уже игравшие пары
  const playedSet = new Set<string>()
  for (const m of pastMatches) {
    if (m.participant1Id && m.participant2Id) {
      playedSet.add(pairKey(m.participant1Id, m.participant2Id))
    }
  }

  const pool = standings.map((s) => s.participant.id)
  const used = new Set<string>()
  const newMatches: Match[] = []
  let matchNumber = pastMatches.length + 1

  for (let i = 0; i < pool.length; i++) {
    const a = pool[i]
    if (used.has(a)) continue
    let pairedWith: string | null = null
    for (let j = i + 1; j < pool.length; j++) {
      const b = pool[j]
      if (used.has(b)) continue
      if (playedSet.has(pairKey(a, b))) continue
      pairedWith = b
      break
    }
    // Если все доступные кандидаты уже игрались — берём первого незанятого (повтор)
    if (!pairedWith) {
      for (let j = i + 1; j < pool.length; j++) {
        const b = pool[j]
        if (!used.has(b)) { pairedWith = b; break }
      }
    }
    if (pairedWith) {
      used.add(a); used.add(pairedWith)
      newMatches.push({
        id: cuid(), tournamentId, round, matchNumber: matchNumber++,
        stage: 'main', status: 'pending',
        participant1Id: a, participant2Id: pairedWith,
      })
    } else {
      // BYE — нечётное число
      used.add(a)
      newMatches.push({
        id: cuid(), tournamentId, round, matchNumber: matchNumber++,
        stage: 'main', status: 'bye',
        participant1Id: a, winnerId: a,
      })
    }
  }
  return newMatches
}

function pairKey(a: string, b: string): string {
  return a < b ? `${a}|${b}` : `${b}|${a}`
}

export function applySwissResult(
  matches: Match[],
  matchId: string,
  score1: number,
  score2: number,
): Match[] {
  if (score1 === score2) return matches
  return matches.map((m) => {
    if (m.id !== matchId) return m
    return {
      ...m,
      score1, score2,
      status: 'completed',
      winnerId: score1 > score2 ? m.participant1Id : m.participant2Id,
    }
  })
}
