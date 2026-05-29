import type { Match, Participant } from '../types.js'
import { cuid } from '../utils.js'
import { nextPow2 } from './common.js'
import { generateRoundRobin } from './round-robin.js'
import { applySingleElimResult } from './single-elimination.js'
import { computeStandings } from './standings.js'

/**
 * Group + Playoff:
 *  1. Делим участников на K групп (по 4 в среднем).
 *  2. В каждой группе — round-robin.
 *  3. Топ-2 из каждой группы → single-elimination playoff.
 *
 * Размер группы — 4 (классика). Если N не делится на 4 — берём 3 или 5.
 */

const PREFERRED_GROUP_SIZE = 4

export function generateGroupPlayoff(
  tournamentId: string,
  participants: Participant[],
): Match[] {
  if (participants.length < 4) return []

  const groups = splitIntoGroups(participants)
  const matches: Match[] = []

  // Группы — каждая со своим round-robin, в stage кодируем имя группы
  groups.forEach((groupParticipants, idx) => {
    const groupName = String.fromCharCode(65 + idx) // A, B, C, ...
    const groupMatches = generateRoundRobin(tournamentId, groupParticipants)
      .map((m) => ({ ...m, stage: `group:${groupName}` as const }))
    matches.push(...groupMatches)
  })

  // Playoff slots — пустые матчи (заполнятся после групповой фазы)
  const playoffSize = groups.length * 2 // топ-2 из каждой
  const playoffPlaceholder = generateEmptyPlayoff(tournamentId, playoffSize)
  matches.push(...playoffPlaceholder)

  return matches
}

function splitIntoGroups(participants: Participant[]): Participant[][] {
  // Snake-distribution по seed чтобы выровнять силу групп
  const sorted = [...participants].sort((a, b) => (a.seed ?? 999) - (b.seed ?? 999))
  const groupCount = Math.max(2, Math.round(sorted.length / PREFERRED_GROUP_SIZE))
  const groups: Participant[][] = Array.from({ length: groupCount }, () => [])
  let direction = 1
  let groupIdx = 0
  for (const p of sorted) {
    groups[groupIdx].push(p)
    groupIdx += direction
    if (groupIdx === groupCount) { direction = -1; groupIdx = groupCount - 1 }
    else if (groupIdx === -1) { direction = 1; groupIdx = 0 }
  }
  return groups
}

function generateEmptyPlayoff(tournamentId: string, size: number): Match[] {
  // Используем nextPow2: если из групп идёт 6 → bracket на 8 с двумя BYE (top-seed advance).
  const bracketSize = nextPow2(size)
  const totalRounds = Math.log2(bracketSize)
  const matches: Match[] = []
  let matchNumber = 1000 // высокий offset чтобы не пересечься с groups
  for (let round = 1; round <= totalRounds; round++) {
    const count = bracketSize / Math.pow(2, round)
    for (let i = 0; i < count; i++) {
      matches.push({
        id: cuid(), tournamentId, round, matchNumber: matchNumber++,
        stage: 'playoff', status: 'pending',
      })
    }
  }
  return matches
}

export function applyGroupPlayoffResult(
  matches: Match[],
  matchId: string,
  score1: number,
  score2: number,
  participants: Participant[],
): Match[] {
  if (score1 === score2) return matches

  const target = matches.find((m) => m.id === matchId)
  if (!target) return matches

  // Group-stage match → обновляем + если все матчи группы сыграны, заполняем playoff
  if (target.stage?.startsWith('group:')) {
    const updated = matches.map((m) => {
      if (m.id !== matchId) return m
      return {
        ...m, score1, score2,
        status: 'completed' as const,
        winnerId: score1 > score2 ? m.participant1Id : m.participant2Id,
      }
    })
    return tryFillPlayoff(updated, participants)
  }

  // Playoff-match → обычный single-elim advance внутри stage='playoff'
  return applySingleElimResult(matches, matchId, score1, score2)
}

/**
 * Когда все групповые матчи сыграны: собирает топ-2 каждой группы,
 * snake-сидит их в bracket size = nextPow2(advancers), лишние слоты = BYE,
 * пробрасывает BYE-победителей в R2.
 */
function tryFillPlayoff(matches: Match[], participants: Participant[]): Match[] {
  const playoffR1 = matches.filter((m) => m.stage === 'playoff' && m.round === 1)
                           .sort((a, b) => a.matchNumber - b.matchNumber)
  const alreadyFilled = playoffR1.some((m) => m.participant1Id || m.participant2Id)
  if (alreadyFilled) return matches

  const groupMatches = matches.filter((m) => m.stage?.startsWith('group:'))
  const allGroupsDone = groupMatches.every((m) => m.status === 'completed' || m.status === 'bye')
  if (!allGroupsDone) return matches

  const groupNames = Array.from(
    new Set(groupMatches.map((m) => m.stage!.split(':')[1])),
  ).sort()

  // Собираем проходящих: 1-е места всех групп, потом 2-е
  // (1-е сильнее → попадут "вверху" snake-seed → BYE достанется им)
  const firstPlaces: string[] = []
  const secondPlaces: string[] = []
  for (const group of groupNames) {
    const gms = matches.filter((m) => m.stage === `group:${group}`)
    const ids = new Set<string>()
    gms.forEach((m) => {
      if (m.participant1Id) ids.add(m.participant1Id)
      if (m.participant2Id) ids.add(m.participant2Id)
    })
    const groupParts = participants.filter((p) => ids.has(p.id))
    const st = computeStandings(groupParts, gms)
    if (st[0]) firstPlaces.push(st[0].participant.id)
    if (st[1]) secondPlaces.push(st[1].participant.id)
  }
  const advancers = [...firstPlaces, ...secondPlaces]

  // Snake-seed в bracket size = nextPow2(advancers)
  const bracketSize = nextPow2(advancers.length)
  const seeded: (string | null)[] = []
  for (let i = 0; i < bracketSize / 2; i++) {
    seeded.push(advancers[i] ?? null)
    seeded.push(advancers[bracketSize - 1 - i] ?? null)
  }

  // Заполняем R1
  let updated = matches.map((m) => {
    if (m.stage !== 'playoff' || m.round !== 1) return m
    const idx = playoffR1.indexOf(m)
    const p1 = seeded[idx * 2] ?? undefined
    const p2 = seeded[idx * 2 + 1] ?? undefined
    const isBye = !p1 || !p2
    return {
      ...m,
      participant1Id: p1,
      participant2Id: p2,
      status: isBye ? 'bye' as const : 'pending' as const,
      winnerId: isBye ? (p1 ?? p2) : undefined,
    }
  })

  // Прокинуть BYE-победителей в R2 (и далее, если цепочка)
  updated = advanceByesInPlayoff(updated)
  return updated
}

function advanceByesInPlayoff(matches: Match[]): Match[] {
  const next = matches.map((m) => ({ ...m }))
  const playoff = next.filter((m) => m.stage === 'playoff')
                      .sort((a, b) => a.round - b.round || a.matchNumber - b.matchNumber)
  const byRound = new Map<number, Match[]>()
  playoff.forEach((m) => {
    const arr = byRound.get(m.round) ?? []
    arr.push(m); byRound.set(m.round, arr)
  })
  const rounds = Array.from(byRound.keys()).sort((a, b) => a - b)

  for (let i = 0; i < rounds.length - 1; i++) {
    const cur = byRound.get(rounds[i])!
    const nxt = byRound.get(rounds[i + 1])!
    cur.forEach((m, idx) => {
      if (!m.winnerId) return
      const target = nxt[Math.floor(idx / 2)]
      if (!target) return
      if (idx % 2 === 0) target.participant1Id = m.winnerId
      else target.participant2Id = m.winnerId
    })
  }
  return next
}
