import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import type { Match, Participant } from '@billiard/shared'
import { MatchCard } from '../MatchCard'

interface Props {
  matches: Match[]
  participants: Participant[]
  isOrganizer?: boolean
  onMatchClick?: (match: Match) => void
}

const MATCH_W = 220
const MATCH_H = 88
const ROUND_GAP = 56
const VERTICAL_PAD = 24

export function SingleElimView({ matches, participants, isOrganizer, onMatchClick }: Props) {
  const { t } = useTranslation()
  const participantById = useMemo(() => {
    const m = new Map<string, Participant>()
    participants.forEach((p) => m.set(p.id, p))
    return m
  }, [participants])

  const layout = useMemo(() => layoutBracket(matches), [matches])

  if (matches.length === 0) return <EmptyState />

  const totalRounds = layout.maxRound
  const width = totalRounds * MATCH_W + (totalRounds - 1) * ROUND_GAP
  const height = layout.height + VERTICAL_PAD * 2

  return (
    <div className="relative overflow-x-auto pb-2">
      <div style={{ minWidth: width, height }} className="relative mx-auto">
        <div className="absolute inset-x-0 top-0 flex" style={{ width }}>
          {Array.from({ length: totalRounds }).map((_, i) => (
            <div
              key={i}
              className="text-center text-[11px] font-semibold uppercase tracking-wider text-text-muted"
              style={{ width: MATCH_W, marginRight: i < totalRounds - 1 ? ROUND_GAP : 0 }}
            >
              {i === totalRounds - 1 ? t('bracket.round_final') :
               i === totalRounds - 2 ? t('bracket.round_semifinal') :
               i === totalRounds - 3 ? t('bracket.round_quarterfinal') :
               t('bracket.round', { n: i + 1 })}
            </div>
          ))}
        </div>

        <svg className="pointer-events-none absolute inset-0" width={width} height={height}>
          {layout.connectors.map((c, i) => (
            <motion.path
              key={i} d={c}
              stroke="rgba(148,163,184,0.25)" strokeWidth="1.5" fill="none"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.6, delay: 0.1 + i * 0.02 }}
            />
          ))}
        </svg>

        {layout.positioned.map(({ match, x, y }) => {
          const p1 = match.participant1Id ? participantById.get(match.participant1Id) : undefined
          const p2 = match.participant2Id ? participantById.get(match.participant2Id) : undefined
          return (
            <MatchCard
              key={match.id}
              match={match} p1={p1} p2={p2}
              isOrganizer={isOrganizer}
              onClick={() => onMatchClick?.(match)}
              positioned={{ x, y: y + VERTICAL_PAD + 28, width: MATCH_W }}
            />
          )
        })}
      </div>
    </div>
  )
}

function EmptyState() {
  const { t } = useTranslation()
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[var(--line-strong)] bg-[var(--surface-card)] py-16 text-center">
      <div className="text-text-secondary">{t('bracket.empty_title')}</div>
      <div className="mt-1 text-xs text-text-muted">{t('bracket.empty_hint_organizer')}</div>
    </div>
  )
}

interface PositionedMatch { match: Match; x: number; y: number }
interface BracketLayout {
  positioned: PositionedMatch[]
  connectors: string[]
  maxRound: number
  height: number
}

function layoutBracket(matches: Match[]): BracketLayout {
  if (matches.length === 0) return { positioned: [], connectors: [], maxRound: 0, height: 0 }

  const byRound: Record<number, Match[]> = {}
  let maxRound = 0
  matches.forEach((m) => {
    if (!byRound[m.round]) byRound[m.round] = []
    byRound[m.round].push(m)
    if (m.round > maxRound) maxRound = m.round
  })
  Object.values(byRound).forEach((arr) => arr.sort((a, b) => a.matchNumber - b.matchNumber))

  const firstRoundCount = byRound[1]?.length ?? 0
  const baseGap = 22
  const roundHeight = firstRoundCount * (MATCH_H + baseGap)

  const positioned: PositionedMatch[] = []
  const matchPos = new Map<string, { x: number; y: number }>()

  for (let round = 1; round <= maxRound; round++) {
    const arr = byRound[round] ?? []
    const x = (round - 1) * (MATCH_W + ROUND_GAP)
    const slotHeight = roundHeight / arr.length
    arr.forEach((m, idx) => {
      const y = idx * slotHeight + (slotHeight - MATCH_H) / 2
      positioned.push({ match: m, x, y })
      matchPos.set(m.id, { x, y })
    })
  }

  const connectors: string[] = []
  for (let round = 1; round < maxRound; round++) {
    const cur = byRound[round] ?? []
    const next = byRound[round + 1] ?? []
    cur.forEach((m, idx) => {
      const target = next[Math.floor(idx / 2)]
      if (!target) return
      const from = matchPos.get(m.id)!
      const to = matchPos.get(target.id)!
      const x1 = from.x + MATCH_W
      const y1 = from.y + MATCH_H / 2 + VERTICAL_PAD + 28
      const x2 = to.x
      const y2 = to.y + MATCH_H / 2 + VERTICAL_PAD + 28
      const midX = x1 + ROUND_GAP / 2
      connectors.push(`M ${x1} ${y1} L ${midX} ${y1} L ${midX} ${y2} L ${x2} ${y2}`)
    })
  }

  return { positioned, connectors, maxRound, height: roundHeight + 28 }
}
