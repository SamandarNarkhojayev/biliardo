import type { Match, Participant } from '../types.js'
import { cuid } from '../utils.js'
import { groupByRound, nextPow2, snakeSeed, sortBySeed } from './common.js'

/**
 * Single Elimination генератор. Дополняет до степени 2 BYE-матчами,
 * автоматически продвигает BYE-победителей в следующий раунд.
 */
export function generateSingleElimination(
  tournamentId: string,
  participants: Participant[],
): Match[] {
  if (participants.length < 2) return []

  const size = nextPow2(participants.length)
  const totalRounds = Math.log2(size)
  const seeded = snakeSeed(sortBySeed(participants), size)

  const matches: Match[] = []
  let matchNumber = 1

  // Первый раунд из реальных пар + BYE
  const firstRoundCount = size / 2
  for (let i = 0; i < firstRoundCount; i++) {
    const p1 = seeded[i * 2]
    const p2 = seeded[i * 2 + 1]
    const isBye = !p1 || !p2
    matches.push({
      id: cuid(),
      tournamentId,
      round: 1,
      matchNumber: matchNumber++,
      participant1Id: p1?.id,
      participant2Id: p2?.id,
      winnerId: isBye ? (p1?.id ?? p2?.id) : undefined,
      status: isBye ? 'bye' : 'pending',
      stage: 'main',
    })
  }

  // Пустые матчи последующих раундов
  for (let round = 2; round <= totalRounds; round++) {
    const count = size / Math.pow(2, round)
    for (let i = 0; i < count; i++) {
      matches.push({
        id: cuid(),
        tournamentId,
        round,
        matchNumber: matchNumber++,
        status: 'pending',
        stage: 'main',
      })
    }
  }

  return advanceByes(matches)
}

function advanceByes(matches: Match[]): Match[] {
  const byRound = groupByRound(matches)
  const rounds = Array.from(byRound.keys()).sort((a, b) => a - b)

  for (let i = 0; i < rounds.length - 1; i++) {
    const cur = byRound.get(rounds[i])!
    const next = byRound.get(rounds[i + 1])!
    cur.forEach((m, idx) => {
      if (!m.winnerId) return
      const target = next[Math.floor(idx / 2)]
      if (!target) return
      if (idx % 2 === 0) target.participant1Id = m.winnerId
      else target.participant2Id = m.winnerId
    })
  }
  return matches
}

/**
 * Применяет результат матча single-elimination, продвигает победителя в следующий раунд.
 */
export function applySingleElimResult(
  matches: Match[],
  matchId: string,
  score1: number,
  score2: number,
): Match[] {
  if (score1 === score2) return matches

  const next = matches.map((m) => ({ ...m }))
  const idx = next.findIndex((m) => m.id === matchId)
  if (idx === -1) return matches
  const m = next[idx]
  m.score1 = score1
  m.score2 = score2
  m.status = 'completed'
  m.winnerId = score1 > score2 ? m.participant1Id : m.participant2Id

  const sameRound = next
    .filter((x) => x.round === m.round && x.stage === m.stage)
    .sort((a, b) => a.matchNumber - b.matchNumber)
  const positionInRound = sameRound.findIndex((x) => x.id === m.id)
  const nextRound = next
    .filter((x) => x.round === m.round + 1 && x.stage === m.stage)
    .sort((a, b) => a.matchNumber - b.matchNumber)
  const target = nextRound[Math.floor(positionInRound / 2)]
  if (target) {
    if (positionInRound % 2 === 0) target.participant1Id = m.winnerId
    else target.participant2Id = m.winnerId
  }
  return next
}
