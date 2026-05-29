// Главный entry-point @billiard/shared
export * from './types.js'
export * from './schemas.js'
export { cuid, isFreeByAutomation } from './utils.js'
export {
  generateBracket, applyMatchResult, minParticipantsFor,
  recommendedSwissRounds, computeStandings,
  computePlacements, placeOf, playerStatsForTournament,
  type StandingsRow, type PlayerTournamentStats,
} from './bracket/index.js'
