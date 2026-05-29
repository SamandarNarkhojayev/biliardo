import type { Match, Participant } from '../types.js'
import { cuid } from '../utils.js'
import { sortBySeed } from './common.js'

/**
 * Page-playoff на 4 игрока:
 *   M1: seed1 vs seed2     (qualifier 1)
 *   M2: seed3 vs seed4     (qualifier 2)
 *   M3: победитель M1 vs победитель M2  (финал)
 *   M4: проигравший M1 vs проигравший M2  (за 3-е место)
 */
export function generatePagePlayoff(
  tournamentId: string,
  participants: Participant[],
): Match[] {
  if (participants.length < 4) return []
  const top = sortBySeed(participants).slice(0, 4)

  return [
    {
      id: cuid(), tournamentId, round: 1, matchNumber: 1, status: 'pending',
      stage: 'main',
      participant1Id: top[0].id, participant2Id: top[1].id,
    },
    {
      id: cuid(), tournamentId, round: 1, matchNumber: 2, status: 'pending',
      stage: 'main',
      participant1Id: top[2].id, participant2Id: top[3].id,
    },
    {
      id: cuid(), tournamentId, round: 2, matchNumber: 3, status: 'pending',
      stage: 'final',
    },
    {
      id: cuid(), tournamentId, round: 2, matchNumber: 4, status: 'pending',
      stage: 'third-place',
    },
  ]
}

export function applyPagePlayoffResult(
  matches: Match[],
  matchId: string,
  score1: number,
  score2: number,
): Match[] {
  if (score1 === score2) return matches

  const next = matches.map((m) => ({ ...m }))
  const m = next.find((x) => x.id === matchId)
  if (!m) return matches

  m.score1 = score1
  m.score2 = score2
  m.status = 'completed'
  m.winnerId = score1 > score2 ? m.participant1Id : m.participant2Id
  const loserId = score1 > score2 ? m.participant2Id : m.participant1Id

  // Раунд 1 → продвинуть в финал и матч за 3-е
  if (m.round === 1) {
    const finalMatch = next.find((x) => x.stage === 'final')
    const thirdPlace = next.find((x) => x.stage === 'third-place')
    if (m.matchNumber === 1) {
      if (finalMatch) finalMatch.participant1Id = m.winnerId
      if (thirdPlace) thirdPlace.participant1Id = loserId
    } else if (m.matchNumber === 2) {
      if (finalMatch) finalMatch.participant2Id = m.winnerId
      if (thirdPlace) thirdPlace.participant2Id = loserId
    }
  }
  return next
}
