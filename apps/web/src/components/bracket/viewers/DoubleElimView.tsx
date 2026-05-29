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

const MATCH_W = 220
const MATCH_H = 88
const ROUND_GAP = 56
const VERTICAL_PAD = 16

/**
 * Double-elimination viewer: WB сверху, LB снизу, Grand Final отдельной карточкой справа.
 * Соединительные линии рисуются только внутри каждой сетки.
 */
export function DoubleElimView({ matches, participants, isOrganizer, onMatchClick }: Props) {
  const { t } = useTranslation()
  const participantById = useMemo(() => {
    const m = new Map<string, Participant>()
    participants.forEach((p) => m.set(p.id, p))
    return m
  }, [participants])

  const wb = matches.filter((m) => m.stage === 'winners')
  const lb = matches.filter((m) => m.stage === 'losers')
  const gf = matches.find((m) => m.stage === 'grand-final')

  const renderMatch = (m: Match) => {
    const p1 = m.participant1Id ? participantById.get(m.participant1Id) : undefined
    const p2 = m.participant2Id ? participantById.get(m.participant2Id) : undefined
    return (
      <MatchCard
        key={m.id} match={m} p1={p1} p2={p2}
        isOrganizer={isOrganizer}
        onClick={() => onMatchClick?.(m)}
      />
    )
  }

  if (matches.length === 0) return <EmptyBracket isOrganizer={isOrganizer} />

  const wbByRound = groupBy(wb)
  const lbByRound = groupBy(lb)

  return (
    <div className="space-y-8">
      {/* Winners */}
      <div>
        <h3 className="mb-3 inline-flex items-center gap-2 text-sm font-semibold text-text-primary">
          <span className="h-2 w-2 rounded-full bg-emerald-400" /> {t('bracket.wb_title')}
        </h3>
        <BracketRows roundsMap={wbByRound} renderMatch={renderMatch} accent="emerald" />
      </div>

      {/* Losers */}
      <div>
        <h3 className="mb-3 inline-flex items-center gap-2 text-sm font-semibold text-text-primary">
          <span className="h-2 w-2 rounded-full bg-amber-400" /> {t('bracket.lb_title')}
        </h3>
        <BracketRows roundsMap={lbByRound} renderMatch={renderMatch} accent="amber" />
      </div>

      {/* Grand Final */}
      {gf && (
        <div>
          <h3 className="mb-3 inline-flex items-center gap-2 text-sm font-semibold text-text-primary">
            🏆 {t('bracket.grand_final')}
          </h3>
          <div className="max-w-md">{renderMatch(gf)}</div>
        </div>
      )}
    </div>
  )
}

function groupBy(matches: Match[]): Map<number, Match[]> {
  const map = new Map<number, Match[]>()
  matches.forEach((m) => {
    const arr = map.get(m.round) ?? []
    arr.push(m); map.set(m.round, arr)
  })
  for (const arr of map.values()) arr.sort((a, b) => a.matchNumber - b.matchNumber)
  return map
}

function BracketRows({
  roundsMap, renderMatch, accent,
}: {
  roundsMap: Map<number, Match[]>
  renderMatch: (m: Match) => React.ReactNode
  accent: 'emerald' | 'amber'
}) {
  const rounds = Array.from(roundsMap.keys()).sort((a, b) => a - b)
  if (rounds.length === 0) return null

  const firstRoundCount = roundsMap.get(rounds[0])?.length ?? 0
  const totalHeight = firstRoundCount * (MATCH_H + 22)

  const width = rounds.length * MATCH_W + (rounds.length - 1) * ROUND_GAP

  // Соединительные линии
  const matchPos = new Map<string, { x: number; y: number }>()
  rounds.forEach((round, roundIdx) => {
    const arr = roundsMap.get(round)!
    const x = roundIdx * (MATCH_W + ROUND_GAP)
    const slotHeight = totalHeight / arr.length
    arr.forEach((m, i) => {
      const y = i * slotHeight + (slotHeight - MATCH_H) / 2
      matchPos.set(m.id, { x, y })
    })
  })

  const connectors: string[] = []
  for (let i = 0; i < rounds.length - 1; i++) {
    const cur = roundsMap.get(rounds[i])!
    const next = roundsMap.get(rounds[i + 1])!
    cur.forEach((m, idx) => {
      const ratio = next.length > 0 ? cur.length / next.length : 1
      const targetIdx = Math.floor(idx / ratio)
      const target = next[targetIdx]
      if (!target) return
      const from = matchPos.get(m.id)!
      const to = matchPos.get(target.id)!
      const x1 = from.x + MATCH_W
      const y1 = from.y + MATCH_H / 2 + VERTICAL_PAD + 4
      const x2 = to.x
      const y2 = to.y + MATCH_H / 2 + VERTICAL_PAD + 4
      const midX = x1 + ROUND_GAP / 2
      connectors.push(`M ${x1} ${y1} L ${midX} ${y1} L ${midX} ${y2} L ${x2} ${y2}`)
    })
  }

  const accentColor = accent === 'emerald' ? 'rgba(16,185,129,0.3)' : 'rgba(251,191,36,0.3)'

  return (
    <div className="relative overflow-x-auto pb-2">
      <div style={{ minWidth: width, height: totalHeight + VERTICAL_PAD * 2 + 8 }} className="relative">
        <svg className="pointer-events-none absolute inset-0" width={width} height={totalHeight + VERTICAL_PAD * 2 + 8}>
          {connectors.map((d, i) => (
            <path key={i} d={d} stroke={accentColor} strokeWidth="1.5" fill="none" />
          ))}
        </svg>
        {rounds.map((round, roundIdx) => {
          const arr = roundsMap.get(round)!
          const x = roundIdx * (MATCH_W + ROUND_GAP)
          const slotHeight = totalHeight / arr.length
          return arr.map((m, i) => {
            const y = i * slotHeight + (slotHeight - MATCH_H) / 2
            return (
              <div
                key={m.id}
                style={{
                  position: 'absolute',
                  left: x, top: y + VERTICAL_PAD + 4, width: MATCH_W,
                }}
              >
                {renderMatch(m)}
              </div>
            )
          })
        })}
      </div>
    </div>
  )
}
