import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import type { Match, Participant } from '@billiard/shared'
import { computeStandings } from '@billiard/shared'
import { StandingsTable } from '../StandingsTable'
import { MatchCard } from '../MatchCard'
import { EmptyBracket } from '../EmptyBracket'
import { SingleElimView } from './SingleElimView'

interface Props {
  matches: Match[]
  participants: Participant[]
  isOrganizer?: boolean
  onMatchClick?: (match: Match) => void
}

export function GroupPlayoffView({ matches, participants, isOrganizer, onMatchClick }: Props) {
  const { t } = useTranslation()
  const participantById = useMemo(() => {
    const map = new Map<string, Participant>()
    participants.forEach((p) => map.set(p.id, p))
    return map
  }, [participants])

  const groupNames = useMemo(() => {
    const set = new Set<string>()
    matches.forEach((m) => {
      if (m.stage?.startsWith('group:')) set.add(m.stage.split(':')[1])
    })
    return Array.from(set).sort()
  }, [matches])

  const playoffMatches = useMemo(() => matches.filter((m) => m.stage === 'playoff'), [matches])

  if (matches.length === 0) return <EmptyBracket isOrganizer={isOrganizer} />

  return (
    <div className="space-y-8">
      {/* Группы */}
      <div>
        <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-text-muted">
          {t('bracket.group_stage')}
        </h3>
        <div className="grid gap-5 lg:grid-cols-2">
          {groupNames.map((groupName) => (
            <GroupBlock
              key={groupName}
              groupName={groupName}
              matches={matches}
              participants={participants}
              participantById={participantById}
              isOrganizer={isOrganizer}
              onMatchClick={onMatchClick}
            />
          ))}
        </div>
      </div>

      {/* Playoff */}
      <div>
        <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-text-muted">
          {t('bracket.playoff_stage')}
        </h3>
        {playoffMatches.length === 0 || playoffMatches.every((m) => !m.participant1Id && !m.participant2Id) ? (
          <div className="rounded-2xl border border-dashed border-[var(--line-strong)] bg-[var(--surface-card)] py-10 text-center text-sm text-text-muted">
            {t('bracket.playoff_pending')}
          </div>
        ) : (
          <SingleElimView
            matches={playoffMatches}
            participants={participants}
            isOrganizer={isOrganizer}
            onMatchClick={onMatchClick}
          />
        )}
      </div>
    </div>
  )
}

function GroupBlock({
  groupName, matches, participants, participantById, isOrganizer, onMatchClick,
}: {
  groupName: string
  matches: Match[]
  participants: Participant[]
  participantById: Map<string, Participant>
  isOrganizer?: boolean
  onMatchClick?: (match: Match) => void
}) {
  const { t } = useTranslation()
  const groupMatches = matches.filter((m) => m.stage === `group:${groupName}`)
  const groupParticipantIds = new Set<string>()
  groupMatches.forEach((m) => {
    if (m.participant1Id) groupParticipantIds.add(m.participant1Id)
    if (m.participant2Id) groupParticipantIds.add(m.participant2Id)
  })
  const groupParticipants = participants.filter((p) => groupParticipantIds.has(p.id))
  const standings = computeStandings(groupParticipants, groupMatches)

  return (
    <div className="space-y-3 rounded-2xl border border-[var(--line)] bg-[var(--surface-card)] p-4 backdrop-blur-md">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-text-primary">{t('bracket.group', { name: groupName })}</h4>
        <span className="text-[10px] text-text-muted">{t('bracket.top_advances', { n: 2 })}</span>
      </div>
      <StandingsTable rows={standings} highlightTop={2} compact />
      <div className="space-y-2">
        {groupMatches.map((m) => {
          const p1 = m.participant1Id ? participantById.get(m.participant1Id) : undefined
          const p2 = m.participant2Id ? participantById.get(m.participant2Id) : undefined
          return (
            <MatchCard
              key={m.id} match={m} p1={p1} p2={p2}
              isOrganizer={isOrganizer}
              onClick={() => onMatchClick?.(m)}
            />
          )
        })}
      </div>
    </div>
  )
}
