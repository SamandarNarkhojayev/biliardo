import type { Match, Participant } from '../types.js'
import { cuid } from '../utils.js'

/**
 * Round-Robin (круговой) — каждый играет с каждым ровно один раз.
 * Использует "circle method": один игрок фиксирован, остальные сдвигаются по кругу.
 * Если число участников нечётное — добавляется виртуальный BYE-слот.
 *
 * Раундов: N-1 (или N если был BYE).
 * Матчей в раунде: floor(N/2).
 */
export function generateRoundRobin(
  tournamentId: string,
  participants: Participant[],
): Match[] {
  if (participants.length < 2) return []

  // Сортируем по seed для воспроизводимости
  const sorted = [...participants].sort((a, b) => (a.seed ?? 999) - (b.seed ?? 999))
  const ids: (string | null)[] = sorted.map((p) => p.id)
  const isOdd = ids.length % 2 === 1
  if (isOdd) ids.push(null) // BYE

  const n = ids.length
  const rounds = n - 1
  const halfN = n / 2
  const matches: Match[] = []
  let matchNumber = 1

  // Circle method: позиция 0 фиксирована, остальные ротируются
  let positions = ids.slice() // текущая расстановка по местам стола

  for (let round = 1; round <= rounds; round++) {
    for (let i = 0; i < halfN; i++) {
      const a = positions[i]
      const b = positions[n - 1 - i]
      // Скип BYE-пары (один из участников null)
      if (a == null || b == null) {
        const realId = a ?? b ?? undefined
        matches.push({
          id: cuid(), tournamentId, round, matchNumber: matchNumber++,
          stage: 'main', status: 'bye',
          participant1Id: realId, winnerId: realId,
        })
      } else {
        matches.push({
          id: cuid(), tournamentId, round, matchNumber: matchNumber++,
          stage: 'main', status: 'pending',
          participant1Id: a, participant2Id: b,
        })
      }
    }
    // Ротируем: фиксируем positions[0], остальные сдвигаем по часовой
    positions = [positions[0], positions[n - 1], ...positions.slice(1, n - 1)]
  }
  return matches
}

export function applyRoundRobinResult(
  matches: Match[],
  matchId: string,
  score1: number,
  score2: number,
): Match[] {
  if (score1 === score2) {
    // Round-robin может допускать ничьи. Но для бильярда обычно нет.
    // Сохраняем как completed без winner — вызывающий код отвергает ничью.
    return matches
  }
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
