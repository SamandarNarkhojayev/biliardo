import type { BracketType, Match, Participant } from '../types.js'
import { generateSingleElimination, applySingleElimResult } from './single-elimination.js'
import { generateDoubleElimination, applyDoubleElimResult } from './double-elimination.js'
import { generateRoundRobin, applyRoundRobinResult } from './round-robin.js'
import {
  generateSwiss, applySwissResult, maybeGenerateNextSwissRound, recommendedSwissRounds,
} from './swiss.js'
import { generateGroupPlayoff, applyGroupPlayoffResult } from './group-playoff.js'
import { generatePagePlayoff, applyPagePlayoffResult } from './page-playoff.js'

/** Генерирует начальную сетку для любого формата турнира. */
export function generateBracket(
  type: BracketType,
  tournamentId: string,
  participants: Participant[],
): Match[] {
  switch (type) {
    case 'single-elimination': return generateSingleElimination(tournamentId, participants)
    case 'double-elimination': return generateDoubleElimination(tournamentId, participants)
    case 'round-robin':        return generateRoundRobin(tournamentId, participants)
    case 'swiss':              return generateSwiss(tournamentId, participants)
    case 'group-playoff':      return generateGroupPlayoff(tournamentId, participants)
    case 'page-playoff':       return generatePagePlayoff(tournamentId, participants)
  }
}

/**
 * Применяет результат матча и (где нужно) автоматически продвигает участников
 * в следующий раунд / стадию. Для swiss дополнительно генерит следующий раунд,
 * если текущий полностью завершён.
 */
export function applyMatchResult(
  type: BracketType,
  tournamentId: string,
  matches: Match[],
  matchId: string,
  score1: number,
  score2: number,
  participants: Participant[],
): Match[] {
  switch (type) {
    case 'single-elimination':
      return applySingleElimResult(matches, matchId, score1, score2)
    case 'double-elimination':
      return applyDoubleElimResult(matches, matchId, score1, score2)
    case 'round-robin':
      return applyRoundRobinResult(matches, matchId, score1, score2)
    case 'swiss': {
      const updated = applySwissResult(matches, matchId, score1, score2)
      return maybeGenerateNextSwissRound(tournamentId, updated, participants)
    }
    case 'group-playoff':
      return applyGroupPlayoffResult(matches, matchId, score1, score2, participants)
    case 'page-playoff':
      return applyPagePlayoffResult(matches, matchId, score1, score2)
  }
}

/** Минимальное число участников для запуска турнира выбранного формата. */
export function minParticipantsFor(type: BracketType): number {
  if (type === 'page-playoff') return 4
  if (type === 'group-playoff') return 4
  if (type === 'double-elimination') return 4
  return 2
}

export { recommendedSwissRounds }
export { computeStandings, type StandingsRow } from './standings.js'
export {
  computePlacements,
  placeOf,
  playerStatsForTournament,
  type PlayerTournamentStats,
} from './player-stats.js'
