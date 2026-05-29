import type { Match, Participant } from '../types.js'
import { cuid } from '../utils.js'
import { nextPow2, snakeSeed, sortBySeed } from './common.js'

/**
 * Double-Elimination:
 *  - Winners Bracket (WB): стандартный single-elim
 *  - Losers Bracket (LB): проигравшие из WB пересекаются с победителями LB
 *  - Grand Final: чемпион WB vs чемпион LB
 *
 * LB структура (для размера сетки S = nextPow2(N)):
 *  - LB-раундов: 2 * (log2(S) - 1)
 *  - На чётных LB-раундах добавляются проигравшие соответствующего WB-раунда
 *  - На нечётных играются победители прошлого LB-раунда между собой
 *
 * Упрощение: НЕ реализован "bracket reset" — финал играется одним матчем
 * (как в большинстве клубных турниров).
 */
export function generateDoubleElimination(
  tournamentId: string,
  participants: Participant[],
): Match[] {
  if (participants.length < 4) return []
  const size = nextPow2(participants.length)
  const wbRounds = Math.log2(size)
  const seeded = snakeSeed(sortBySeed(participants), size)

  const matches: Match[] = []
  let matchNumber = 1

  // ---- WB ----
  // Round 1: реальные пары + BYE
  for (let i = 0; i < size / 2; i++) {
    const p1 = seeded[i * 2]
    const p2 = seeded[i * 2 + 1]
    const isBye = !p1 || !p2
    matches.push({
      id: cuid(), tournamentId, round: 1, matchNumber: matchNumber++,
      stage: 'winners', status: isBye ? 'bye' : 'pending',
      participant1Id: p1?.id, participant2Id: p2?.id,
      winnerId: isBye ? (p1?.id ?? p2?.id) : undefined,
    })
  }
  for (let r = 2; r <= wbRounds; r++) {
    const count = size / Math.pow(2, r)
    for (let i = 0; i < count; i++) {
      matches.push({
        id: cuid(), tournamentId, round: r, matchNumber: matchNumber++,
        stage: 'winners', status: 'pending',
      })
    }
  }

  // ---- LB ----
  // Размеры LB-раундов: на каждом WB-раунде r выпадают (size / 2^r) проигравших.
  // LB чередует:
  //   нечётные LB-раунды (1, 3, 5, ...): победители LB играют между собой
  //   чётные LB-раунды (2, 4, 6, ...): входят новые проигравшие из WB
  //
  // Стандартная структура для S=8:
  //   LB R1: 2 матча (4 проигравших WB R1)
  //   LB R2: 2 матча (победители LB R1 vs проигравшие WB R2)
  //   LB R3: 1 матч (победители LB R2)
  //   LB R4: 1 матч (победитель LB R3 vs проигравший WB R3 = WB final loser)
  //   ИТОГО: 4 LB-раунда, 6 LB-матчей
  //
  // Общая формула: wbRounds-1 пар LB-раундов = 2*(wbRounds-1) раундов.
  // На LB R(2k-1) играется (size/2^(k+1)) матчей, на R(2k) — то же.
  // Special case: последний LB матч (LB final) — всегда 1 матч.
  const lbRoundsTotal = 2 * (wbRounds - 1)
  for (let lbR = 1; lbR <= lbRoundsTotal; lbR++) {
    const k = Math.ceil(lbR / 2) // 1,1,2,2,3,3...
    const count = Math.max(1, Math.floor(size / Math.pow(2, k + 1)))
    for (let i = 0; i < count; i++) {
      matches.push({
        id: cuid(), tournamentId, round: lbR, matchNumber: matchNumber++,
        stage: 'losers', status: 'pending',
      })
    }
  }

  // ---- Grand Final ----
  matches.push({
    id: cuid(), tournamentId, round: 1, matchNumber: matchNumber++,
    stage: 'grand-final', status: 'pending',
  })

  // Прокинуть BYE в WB R2 и связанные LB-проигравшие
  return advanceInitialByes(matches)
}

function advanceInitialByes(matches: Match[]): Match[] {
  const next = matches.map((m) => ({ ...m }))
  const wbR1 = next.filter((m) => m.stage === 'winners' && m.round === 1)
                   .sort((a, b) => a.matchNumber - b.matchNumber)
  const wbR2 = next.filter((m) => m.stage === 'winners' && m.round === 2)
                   .sort((a, b) => a.matchNumber - b.matchNumber)
  wbR1.forEach((m, idx) => {
    if (!m.winnerId) return
    const target = wbR2[Math.floor(idx / 2)]
    if (!target) return
    if (idx % 2 === 0) target.participant1Id = m.winnerId
    else target.participant2Id = m.winnerId
  })
  return next
}

export function applyDoubleElimResult(
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

  if (m.stage === 'winners') {
    advanceWinnersAdvance(next, m)
    if (loserId) sendLoserToLB(next, m, loserId)
  } else if (m.stage === 'losers') {
    advanceLosersAdvance(next, m)
  }
  // grand-final → ничего не двигаем дальше
  return next
}

function advanceWinnersAdvance(all: Match[], m: Match): void {
  const wb = all.filter((x) => x.stage === 'winners').sort((a, b) => a.round - b.round || a.matchNumber - b.matchNumber)
  const sameRound = wb.filter((x) => x.round === m.round)
  const idx = sameRound.findIndex((x) => x.id === m.id)
  const nextRound = wb.filter((x) => x.round === m.round + 1)
  const target = nextRound[Math.floor(idx / 2)]
  if (target) {
    if (idx % 2 === 0) target.participant1Id = m.winnerId
    else target.participant2Id = m.winnerId
  } else {
    // Это был WB final → победитель в Grand Final как participant1
    const gf = all.find((x) => x.stage === 'grand-final')
    if (gf) gf.participant1Id = m.winnerId
  }
}

function sendLoserToLB(all: Match[], wbMatch: Match, loserId: string): void {
  const lb = all.filter((x) => x.stage === 'losers').sort((a, b) => a.round - b.round || a.matchNumber - b.matchNumber)
  const wbR = wbMatch.round
  // Проигравшие WB R1 → LB R1 (как participant1/2 первой пары)
  // Проигравшие WB R2 → LB R2
  // Проигравшие WB R3 → LB R4 (после двух LB-раундов)
  // Формула: LB-раунд = 2*wbR - 2 (для wbR>=2), и LB R1 для wbR=1
  const lbTargetRound = wbR === 1 ? 1 : (wbR - 1) * 2
  const lbRoundMatches = lb.filter((x) => x.round === lbTargetRound)
  if (lbRoundMatches.length === 0) return

  // Найти первый матч этого раунда без participant1 ИЛИ participant2 — сначала p1, потом p2
  // Проигравшие WB R1 идут попарно в LB R1
  // Проигравшие WB R>=2 — каждый в свой LB-раунд как "новый участник"
  if (wbR === 1) {
    // Раскладываем по LB R1 как WB R1: matchIdx//2 → LB matchIdx
    const wbR1 = all.filter((x) => x.stage === 'winners' && x.round === 1).sort((a, b) => a.matchNumber - b.matchNumber)
    const idxInWB = wbR1.findIndex((x) => x.id === wbMatch.id)
    const lbIdx = Math.floor(idxInWB / 2)
    const lbTarget = lbRoundMatches[lbIdx]
    if (!lbTarget) return
    if (idxInWB % 2 === 0) lbTarget.participant1Id = loserId
    else lbTarget.participant2Id = loserId
  } else {
    // Для WB R>=2: проигравший идёт в LB R(2*wbR-2) как "новый игрок"
    // Идёт как participant2 в порядке проигрыша
    const wbRMatches = all.filter((x) => x.stage === 'winners' && x.round === wbR).sort((a, b) => a.matchNumber - b.matchNumber)
    const idxInWB = wbRMatches.findIndex((x) => x.id === wbMatch.id)
    const lbTarget = lbRoundMatches[idxInWB]
    if (lbTarget) {
      // p1 уже занят победителем прошлого LB-раунда (если есть), вешаем на p2
      if (!lbTarget.participant2Id) lbTarget.participant2Id = loserId
      else if (!lbTarget.participant1Id) lbTarget.participant1Id = loserId
    }
  }
}

function advanceLosersAdvance(all: Match[], m: Match): void {
  const lb = all.filter((x) => x.stage === 'losers').sort((a, b) => a.round - b.round || a.matchNumber - b.matchNumber)
  const sameRound = lb.filter((x) => x.round === m.round)
  const idx = sameRound.findIndex((x) => x.id === m.id)
  const nextRound = lb.filter((x) => x.round === m.round + 1)
  if (nextRound.length === 0) {
    // Победитель LB final → в Grand Final как participant2
    const gf = all.find((x) => x.stage === 'grand-final')
    if (gf) gf.participant2Id = m.winnerId
    return
  }

  // После нечётного LB-раунда (R1, R3): победитель идёт 1-к-1 в следующий
  //   чётный раунд как p1 (там его ждёт новый WB-проигравший как p2)
  // После чётного LB-раунда (R2, R4): победители идут попарно в нечётный раунд
  const isOddRound = m.round % 2 === 1
  if (isOddRound) {
    const target = nextRound[idx]
    if (target) target.participant1Id = m.winnerId
  } else {
    const target = nextRound[Math.floor(idx / 2)]
    if (target) {
      if (idx % 2 === 0) target.participant1Id = m.winnerId
      else target.participant2Id = m.winnerId
    }
  }
}
