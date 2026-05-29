/**
 * Прогон всех 6 форматов сетки: симулирует UI-поток.
 *   1. создаём N тестовых участников
 *   2. generateBracket
 *   3. в цикле: берём первый pending-матч с обоими участниками,
 *      даём p1 победу 5:3, applyMatchResult
 *   4. повторяем пока есть playable-матчи
 *   5. проверяем инварианты: чемпион/standings/нет infinite loop
 *
 * Запуск: npx tsx scripts/verify-brackets.ts
 */
import type { BracketType, Match, Participant } from '@billiard/shared'
import {
  generateBracket, applyMatchResult, computeStandings, recommendedSwissRounds,
} from '@billiard/shared'

// ---- ANSI цвета для отчёта ----
const c = {
  reset: '\x1b[0m', dim: '\x1b[2m', bold: '\x1b[1m',
  red: '\x1b[31m', green: '\x1b[32m', yellow: '\x1b[33m',
  blue: '\x1b[34m', cyan: '\x1b[36m', gray: '\x1b[90m',
}

function log(s: string) { process.stdout.write(s + '\n') }
function ok(msg: string) { log(`  ${c.green}✓${c.reset} ${msg}`) }
function fail(msg: string) { log(`  ${c.red}✕ FAIL: ${msg}${c.reset}`); failures++ }
function info(msg: string) { log(`  ${c.gray}· ${msg}${c.reset}`) }

let failures = 0

function makeParticipants(count: number, tournamentId: string): Participant[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `p_${i + 1}`,
    tournamentId,
    name: `Player ${i + 1}`,
    seed: i + 1,
    registeredAt: new Date().toISOString(),
    checkedIn: true,
    paid: false,
    position: i,
  }))
}

interface TestResult {
  bracketType: BracketType
  participantsN: number
  totalMatches: number
  played: number
  byes: number
  unresolved: number
  loopAborted: boolean
  champion?: string
}

const MAX_ITER = 5000

function runScenario(bracketType: BracketType, n: number): TestResult {
  const tournamentId = `t_${bracketType}_${n}`
  const participants = makeParticipants(n, tournamentId)
  let matches: Match[] = generateBracket(bracketType, tournamentId, participants)

  let played = 0
  let iters = 0
  let loopAborted = false

  while (iters < MAX_ITER) {
    iters++
    const playable = findFirstPlayable(matches)
    if (!playable) break
    matches = applyMatchResult(
      bracketType, tournamentId, matches, playable.id, 5, 3, participants,
    )
    played++
  }
  if (iters >= MAX_ITER) loopAborted = true

  const byes = matches.filter((m) => m.status === 'bye').length
  const unresolved = matches.filter(
    (m) => m.status === 'pending' && m.participant1Id && m.participant2Id,
  ).length

  // Champion: лучший в standings (для round-robin/swiss/group) или победитель последнего матча
  let champion: string | undefined
  if (bracketType === 'round-robin' || bracketType === 'swiss') {
    const standings = computeStandings(participants, matches)
    champion = standings[0]?.participant.name
  } else if (bracketType === 'page-playoff') {
    const final = matches.find((m) => m.stage === 'final')
    if (final?.winnerId) champion = participants.find((p) => p.id === final.winnerId)?.name
  } else if (bracketType === 'double-elimination') {
    const gf = matches.find((m) => m.stage === 'grand-final')
    if (gf?.winnerId) champion = participants.find((p) => p.id === gf.winnerId)?.name
  } else if (bracketType === 'single-elimination') {
    const lastRound = Math.max(...matches.map((m) => m.round))
    const finalMatch = matches.find((m) => m.round === lastRound)
    if (finalMatch?.winnerId) champion = participants.find((p) => p.id === finalMatch.winnerId)?.name
  } else if (bracketType === 'group-playoff') {
    const playoffMatches = matches.filter((m) => m.stage === 'playoff')
    if (playoffMatches.length > 0) {
      const lastRound = Math.max(...playoffMatches.map((m) => m.round))
      const final = playoffMatches.find((m) => m.round === lastRound)
      if (final?.winnerId) champion = participants.find((p) => p.id === final.winnerId)?.name
    }
  }

  return {
    bracketType, participantsN: n,
    totalMatches: matches.length,
    played, byes, unresolved, loopAborted, champion,
  }
}

function findFirstPlayable(matches: Match[]): Match | undefined {
  return matches.find(
    (m) => m.status === 'pending' && m.participant1Id && m.participant2Id,
  )
}

// ============================================================
// Тестовые сценарии
// ============================================================

function header(name: string, n: number) {
  log(`\n${c.bold}${c.cyan}▸ ${name} (N=${n})${c.reset}`)
}

function summary(r: TestResult) {
  info(`матчей: ${r.totalMatches}, сыграно: ${r.played}, BYE: ${r.byes}, незавершённых: ${r.unresolved}`)
  if (r.champion) ok(`чемпион определён: ${c.yellow}${r.champion}${c.reset}`)
  if (r.loopAborted) fail(`infinite loop (более ${MAX_ITER} итераций!)`)
  if (r.unresolved > 0) fail(`остались pending-матчи с обоими участниками: ${r.unresolved}`)
}

// ---------- 1. SINGLE-ELIMINATION ----------
function testSingleElim() {
  for (const n of [4, 6, 8, 16]) {
    header(`SINGLE-ELIMINATION`, n)
    const r = runScenario('single-elimination', n)
    summary(r)
    const expectedSize = Math.pow(2, Math.ceil(Math.log2(n)))
    const expectedRounds = Math.log2(expectedSize)
    const expectedTotal = expectedSize - 1 // классика
    if (r.totalMatches !== expectedTotal) fail(`ожидалось ${expectedTotal} матчей (S=${expectedSize}), получено ${r.totalMatches}`)
    else ok(`размер сетки = ${expectedSize}, всего матчей = ${expectedTotal}, раундов = ${expectedRounds}`)
    if (!r.champion) fail('чемпион не определён')
  }
}

// ---------- 2. PAGE-PLAYOFF ----------
function testPagePlayoff() {
  header('PAGE-PLAYOFF', 4)
  const r = runScenario('page-playoff', 4)
  summary(r)
  if (r.totalMatches !== 4) fail(`ожидалось 4 матча, получено ${r.totalMatches}`)
  else ok('всего 4 матча: 2 квалификационных, финал, за 3-е')
  if (r.played !== 4) fail(`сыграно ${r.played}, ожидалось 4`)
  if (!r.champion) fail('чемпион не определён')
}

// ---------- 3. ROUND-ROBIN ----------
function testRoundRobin() {
  for (const n of [4, 5, 6, 8]) {
    header('ROUND-ROBIN', n)
    const r = runScenario('round-robin', n)
    summary(r)
    const expectedRealMatches = (n * (n - 1)) / 2
    // BYE-матчи добавляются если N нечётное
    const expectedTotal = n % 2 === 1 ? expectedRealMatches + n : expectedRealMatches
    if (r.totalMatches !== expectedTotal) fail(`ожидалось ${expectedTotal} матчей, получено ${r.totalMatches}`)
    else ok(`всего матчей = ${expectedTotal} (реальных ${expectedRealMatches}, BYE ${expectedTotal - expectedRealMatches})`)
    if (r.played !== expectedRealMatches) fail(`сыграно ${r.played}, ожидалось ${expectedRealMatches}`)
    if (!r.champion) fail('чемпион не определён')

    // Проверяем что каждый игрок сыграл (n-1) реальных матчей
    const tour = `t_round-robin_${n}`
    const participants = makeParticipants(n, tour)
    let matches = generateBracket('round-robin', tour, participants)
    while (true) {
      const next = findFirstPlayable(matches)
      if (!next) break
      matches = applyMatchResult('round-robin', tour, matches, next.id, 5, 3, participants)
    }
    const standings = computeStandings(participants, matches)
    const wrong = standings.filter((s) => s.played !== n - 1)
    if (wrong.length > 0) fail(`${wrong.length} игроков сыграли не (n-1)=${n - 1} матчей: ${wrong.map((s) => `${s.participant.name}=${s.played}`).join(', ')}`)
    else ok(`каждый игрок сыграл ${n - 1} матчей`)
  }
}

// ---------- 4. SWISS ----------
function testSwiss() {
  for (const n of [4, 6, 8, 16]) {
    header('SWISS', n)
    const r = runScenario('swiss', n)
    summary(r)
    const expectedRounds = recommendedSwissRounds(n)
    const matchesPerRound = Math.ceil(n / 2)
    const expectedTotal = expectedRounds * matchesPerRound
    if (r.totalMatches < expectedTotal - matchesPerRound || r.totalMatches > expectedTotal + matchesPerRound) {
      fail(`ожидалось ~${expectedTotal} матчей, получено ${r.totalMatches}`)
    } else {
      ok(`раундов ${expectedRounds}, матчей ${r.totalMatches} (≈${expectedTotal})`)
    }
    if (!r.champion) fail('чемпион не определён')
  }
}

// ---------- 5. GROUP-PLAYOFF ----------
function testGroupPlayoff() {
  for (const n of [8, 12, 16]) {
    header('GROUP-PLAYOFF', n)
    const r = runScenario('group-playoff', n)
    summary(r)

    const tour = `t_group-playoff_${n}`
    const participants = makeParticipants(n, tour)
    let matches = generateBracket('group-playoff', tour, participants)
    const groupNames = Array.from(new Set(matches.filter((m) => m.stage?.startsWith('group:')).map((m) => m.stage!.split(':')[1])))
    info(`групп: ${groupNames.length} (${groupNames.join(', ')})`)

    while (true) {
      const next = findFirstPlayable(matches)
      if (!next) break
      matches = applyMatchResult('group-playoff', tour, matches, next.id, 5, 3, participants)
    }
    // После всех матчей playoff должен быть заполнен
    const playoffR1 = matches.filter((m) => m.stage === 'playoff' && m.round === 1)
    const filled = playoffR1.filter((m) => m.participant1Id || m.participant2Id).length
    if (filled === 0) fail('плейоф не заполнен после групповой стадии')
    else ok(`playoff R1 заполнен: ${filled} матчей с участниками`)
    if (!r.champion) fail('чемпион плейоффа не определён')
  }
}

// ---------- 6. DOUBLE-ELIMINATION ----------
function testDoubleElim() {
  for (const n of [4, 8, 16]) {
    header('DOUBLE-ELIMINATION', n)
    const r = runScenario('double-elimination', n)
    summary(r)

    const tour = `t_double-elimination_${n}`
    const participants = makeParticipants(n, tour)
    const matches = generateBracket('double-elimination', tour, participants)
    const wb = matches.filter((m) => m.stage === 'winners')
    const lb = matches.filter((m) => m.stage === 'losers')
    const gf = matches.filter((m) => m.stage === 'grand-final')
    info(`WB матчей: ${wb.length}, LB матчей: ${lb.length}, GF: ${gf.length}`)

    const expectedSize = Math.pow(2, Math.ceil(Math.log2(n)))
    const expectedWB = expectedSize - 1
    if (wb.length !== expectedWB) fail(`WB: ожидалось ${expectedWB}, получено ${wb.length}`)
    else ok(`WB размер корректен: ${expectedWB} матчей`)

    if (gf.length !== 1) fail(`GF должен быть ровно 1 матч, есть ${gf.length}`)
    if (!r.champion) fail('гранд-финал не определил чемпиона')
  }
}

// ============================================================
// MAIN
// ============================================================

log(`${c.bold}${c.blue}═══ Smoke-тест 6 форматов турнирной сетки ═══${c.reset}\n`)

testSingleElim()
testPagePlayoff()
testRoundRobin()
testSwiss()
testGroupPlayoff()
testDoubleElim()

log('')
if (failures === 0) {
  log(`${c.bold}${c.green}═══ ✓ ВСЕ ТЕСТЫ ПРОШЛИ ═══${c.reset}`)
  process.exit(0)
} else {
  log(`${c.bold}${c.red}═══ ✕ ${failures} FAIL ═══${c.reset}`)
  process.exit(1)
}
