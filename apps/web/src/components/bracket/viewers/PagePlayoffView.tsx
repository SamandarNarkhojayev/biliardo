import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import type { Match, Participant } from '@billiard/shared'
import { MatchCard } from '../MatchCard'
import { EmptyBracket } from '../EmptyBracket'

interface Props {
  matches: Match[]
  participants: Participant[]
  isOrganizer?: boolean
  onMatchClick?: (match: Match) => void
}

/**
 * Page-playoff: 4 матча.
 *  - 2 квалификационных (M1, M2)
 *  - финал (M3) — победители
 *  - матч за 3-е (M4) — проигравшие
 */
export function PagePlayoffView({ matches, participants, isOrganizer, onMatchClick }: Props) {
  const { t } = useTranslation()
  const participantById = useMemo(() => {
    const map = new Map<string, Participant>()
    participants.forEach((p) => map.set(p.id, p))
    return map
  }, [participants])

  if (matches.length === 0) return <EmptyBracket isOrganizer={isOrganizer} />

  const m1 = matches.find((m) => m.round === 1 && m.matchNumber === 1)
  const m2 = matches.find((m) => m.round === 1 && m.matchNumber === 2)
  const final = matches.find((m) => m.stage === 'final')
  const third = matches.find((m) => m.stage === 'third-place')

  const renderMatch = (m: Match | undefined, label: string) => {
    if (!m) return null
    const p1 = m.participant1Id ? participantById.get(m.participant1Id) : undefined
    const p2 = m.participant2Id ? participantById.get(m.participant2Id) : undefined
    return (
      <MatchCard
        match={m} p1={p1} p2={p2}
        isOrganizer={isOrganizer}
        onClick={() => onMatchClick?.(m)}
        label={label}
      />
    )
  }

  return (
    <div className="grid gap-5 sm:grid-cols-2">
      <div className="space-y-3">
        <div className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">{t('bracket.page_qualification')}</div>
        {renderMatch(m1, t('bracket.page_match1'))}
        {renderMatch(m2, t('bracket.page_match2'))}
      </div>
      <div className="space-y-3">
        <div className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">{t('bracket.page_decisive')}</div>
        {renderMatch(final, t('bracket.page_final'))}
        {renderMatch(third, t('bracket.page_third_place'))}
      </div>
    </div>
  )
}
