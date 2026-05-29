import { useMemo, useState } from 'react'
import type { BracketType, Match, Participant } from '@billiard/shared'
import { MatchScoreModal } from './MatchScoreModal'
import { SingleElimView } from './viewers/SingleElimView'
import { DoubleElimView } from './viewers/DoubleElimView'
import { RoundRobinView } from './viewers/RoundRobinView'
import { SwissView } from './viewers/SwissView'
import { GroupPlayoffView } from './viewers/GroupPlayoffView'
import { PagePlayoffView } from './viewers/PagePlayoffView'

interface BracketViewerProps {
  bracketType: BracketType
  matches: Match[]
  participants: Participant[]
  isOrganizer?: boolean
  onMatchUpdate?: (matchId: string, score1: number, score2: number) => void
}

export function BracketViewer({
  bracketType, matches, participants, isOrganizer, onMatchUpdate,
}: BracketViewerProps) {
  const [editing, setEditing] = useState<Match | null>(null)

  const participantById = useMemo(() => {
    const m = new Map<string, Participant>()
    participants.forEach((p) => m.set(p.id, p))
    return m
  }, [participants])

  const onMatchClick = (m: Match) => {
    if (!isOrganizer) return
    if (m.status === 'bye') return
    if (!m.participant1Id || !m.participant2Id) return
    setEditing(m)
  }

  const viewerProps = { matches, participants, isOrganizer, onMatchClick }

  return (
    <>
      {bracketType === 'single-elimination' && <SingleElimView {...viewerProps} />}
      {bracketType === 'double-elimination' && <DoubleElimView {...viewerProps} />}
      {bracketType === 'round-robin'        && <RoundRobinView {...viewerProps} />}
      {bracketType === 'swiss'              && <SwissView {...viewerProps} />}
      {bracketType === 'group-playoff'      && <GroupPlayoffView {...viewerProps} />}
      {bracketType === 'page-playoff'       && <PagePlayoffView {...viewerProps} />}

      <MatchScoreModal
        open={!!editing}
        match={editing}
        p1={editing?.participant1Id ? participantById.get(editing.participant1Id) : undefined}
        p2={editing?.participant2Id ? participantById.get(editing.participant2Id) : undefined}
        onClose={() => setEditing(null)}
        onSave={(s1, s2) => {
          if (editing && onMatchUpdate) onMatchUpdate(editing.id, s1, s2)
          setEditing(null)
        }}
      />
    </>
  )
}
