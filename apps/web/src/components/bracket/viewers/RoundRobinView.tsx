import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import type { Match, Participant } from '@billiard/shared'
import { computeStandings } from '@billiard/shared'
import { StandingsTable } from '../StandingsTable'
import { MatchCard } from '../MatchCard'
import { EmptyBracket } from '../EmptyBracket'

interface Props {
  matches: Match[]
  participants: Participant[]
  isOrganizer?: boolean
  onMatchClick?: (match: Match) => void
}

export function RoundRobinView({ matches, participants, isOrganizer, onMatchClick }: Props) {
  const { t } = useTranslation()
  const participantById = useMemo(() => {
    const map = new Map<string, Participant>()
    participants.forEach((p) => map.set(p.id, p))
    return map
  }, [participants])

  const standings = useMemo(
    () => computeStandings(participants, matches),
    [participants, matches],
  )

  const matchesByRound = useMemo(() => {
    const map = new Map<number, Match[]>()
    matches.forEach((m) => {
      const arr = map.get(m.round) ?? []
      arr.push(m); map.set(m.round, arr)
    })
    for (const arr of map.values()) arr.sort((a, b) => a.matchNumber - b.matchNumber)
    return map
  }, [matches])

  if (matches.length === 0) return <EmptyBracket isOrganizer={isOrganizer} />

  const rounds = Array.from(matchesByRound.keys()).sort((a, b) => a - b)

  return (
    <div className="grid gap-6 lg:grid-cols-12">
      <div className="lg:col-span-5">
        <StandingsTable rows={standings} title={t('bracket.standings_title')} />
      </div>
      <div className="lg:col-span-7">
        <div className="text-xs font-semibold uppercase tracking-wider text-text-muted">{t('bracket.matches_by_round')}</div>
        <div className="mt-3 space-y-5 max-h-[700px] overflow-y-auto pr-1">
          {rounds.map((round) => (
            <div key={round}>
              <div className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-text-muted">
                {t('bracket.round_short', { n: round })}
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                {matchesByRound.get(round)!.map((m) => {
                  const p1 = m.participant1Id ? participantById.get(m.participant1Id) : undefined
                  const p2 = m.participant2Id ? participantById.get(m.participant2Id) : undefined
                  return (
                    <MatchCard
                      key={m.id}
                      match={m} p1={p1} p2={p2}
                      isOrganizer={isOrganizer}
                      onClick={() => onMatchClick?.(m)}
                    />
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
