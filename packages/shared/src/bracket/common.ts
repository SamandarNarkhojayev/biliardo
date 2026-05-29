import type { Match, Participant } from '../types.js'
import { cuid } from '../utils.js'

/**
 * Standard "snake" сидинг для турниров на выбывание:
 * 1 vs N, 2 vs N-1, ... — фавориты разбегаются.
 */
export function snakeSeed<T>(items: T[], size: number, fallback: T | null = null): (T | null)[] {
  const sorted = items.slice() // сортировка делается выше по seed
  const out: (T | null)[] = []
  for (let i = 0; i < size / 2; i++) {
    out.push(sorted[i] ?? fallback)
    out.push(sorted[size - 1 - i] ?? fallback)
  }
  return out
}

/** Возвращает ближайшую сверху степень двойки. */
export function nextPow2(n: number): number {
  return Math.pow(2, Math.ceil(Math.log2(n || 1)))
}

/** Сортирует участников по seed (1 — лучший). */
export function sortBySeed(participants: Participant[]): Participant[] {
  return [...participants].sort((a, b) => (a.seed ?? 999) - (b.seed ?? 999))
}

/** Перемешивает массив (Fisher-Yates). Используется для swiss-pairings без рейтинга. */
export function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice()
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/** Создаёт пустой матч-черновик. */
export function emptyMatch(
  tournamentId: string,
  round: number,
  matchNumber: number,
  stage?: Match['stage'],
): Match {
  return {
    id: cuid(),
    tournamentId,
    round,
    matchNumber,
    status: 'pending',
    stage,
  }
}

/** Возвращает максимальный раунд в массиве матчей. */
export function maxRound(matches: Match[]): number {
  return matches.reduce((acc, m) => Math.max(acc, m.round), 0)
}

/** Группирует матчи по раундам и сортирует внутри по matchNumber. */
export function groupByRound(matches: Match[]): Map<number, Match[]> {
  const map = new Map<number, Match[]>()
  for (const m of matches) {
    const arr = map.get(m.round) ?? []
    arr.push(m)
    map.set(m.round, arr)
  }
  for (const arr of map.values()) arr.sort((a, b) => a.matchNumber - b.matchNumber)
  return map
}

/** Фильтр матчей по стадии. */
export function byStage(matches: Match[], stage: Match['stage']): Match[] {
  return matches.filter((m) => m.stage === stage)
}
