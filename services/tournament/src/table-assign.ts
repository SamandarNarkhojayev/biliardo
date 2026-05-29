import type { Match as DbMatch } from './_prisma/index.js'

/**
 * Назначает «готовым к игре» матчам столы из пула.
 *
 * Готовый матч — оба участника известны, статус не COMPLETED/BYE.
 * Уже назначенные столы остаются занятыми, новые матчи получают самый низкий свободный.
 *
 * Возвращает массив { matchId, tableLabel } для применения через prisma.match.update.
 */
export function pickAssignments(matches: DbMatch[], tables: number[]): Array<{ matchId: string; tableLabel: string }> {
  if (tables.length === 0) return []

  const isReady = (m: DbMatch): boolean =>
    !!m.participant1Id && !!m.participant2Id && m.status !== 'COMPLETED' && m.status !== 'BYE'

  const occupied = new Set<string>()
  for (const m of matches) {
    if (m.tableLabel && isReady(m)) occupied.add(m.tableLabel)
  }

  const candidates = matches
    .filter((m) => isReady(m) && !m.tableLabel)
    .sort((a, b) => a.round - b.round || a.matchNumber - b.matchNumber)

  const out: Array<{ matchId: string; tableLabel: string }> = []
  for (const m of candidates) {
    const free = tables.find((n) => !occupied.has(`Стол ${n}`))
    if (free === undefined) break
    const label = `Стол ${free}`
    out.push({ matchId: m.id, tableLabel: label })
    occupied.add(label)
  }
  return out
}
