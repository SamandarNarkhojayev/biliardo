import type { Match, Participant } from '../types.js'

export interface StandingsRow {
  participant: Participant
  played: number
  wins: number
  losses: number
  pointsFor: number      // сумма выигранных партий
  pointsAgainst: number  // сумма проигранных партий
  diff: number           // pointsFor - pointsAgainst
  points: number         // 3 за победу, 0 за поражение (чистая бильярдная схема)
  rank: number
}

/**
 * Считает турнирную таблицу из массива матчей.
 * Используется для round-robin, swiss, group-playoff (внутри группы).
 *
 * Поддерживает фильтрацию по stage — например, для group-playoff нужно
 * считать standings только внутри одной группы.
 */
export function computeStandings(
  participants: Participant[],
  matches: Match[],
  filter?: (m: Match) => boolean,
): StandingsRow[] {
  const filtered = filter ? matches.filter(filter) : matches

  const rowsById = new Map<string, StandingsRow>()
  for (const p of participants) {
    rowsById.set(p.id, {
      participant: p,
      played: 0, wins: 0, losses: 0,
      pointsFor: 0, pointsAgainst: 0, diff: 0, points: 0, rank: 0,
    })
  }

  for (const m of filtered) {
    if (m.status !== 'completed' && m.status !== 'bye') continue
    const r1 = m.participant1Id ? rowsById.get(m.participant1Id) : undefined
    const r2 = m.participant2Id ? rowsById.get(m.participant2Id) : undefined

    if (m.status === 'bye') {
      // BYE: участник проходит без матча — не учитываем в played, но можно зачесть очки.
      // Для простоты — не зачисляем.
      continue
    }

    if (!r1 || !r2 || m.score1 == null || m.score2 == null) continue
    r1.played += 1; r2.played += 1
    r1.pointsFor += m.score1; r1.pointsAgainst += m.score2
    r2.pointsFor += m.score2; r2.pointsAgainst += m.score1
    if (m.winnerId === m.participant1Id) {
      r1.wins += 1; r1.points += 3; r2.losses += 1
    } else if (m.winnerId === m.participant2Id) {
      r2.wins += 1; r2.points += 3; r1.losses += 1
    }
  }

  for (const r of rowsById.values()) r.diff = r.pointsFor - r.pointsAgainst

  const rows = Array.from(rowsById.values()).sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points
    if (b.diff !== a.diff) return b.diff - a.diff
    if (b.wins !== a.wins) return b.wins - a.wins
    return (a.participant.seed ?? 999) - (b.participant.seed ?? 999)
  })

  rows.forEach((r, i) => { r.rank = i + 1 })
  return rows
}
