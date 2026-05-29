import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import type { StandingsRow } from '@billiard/shared'
import { cn } from '@/utils/cn'

interface Props {
  rows: StandingsRow[]
  /** Подсветить топ-N зелёным (например, "проходят в плей-офф"). */
  highlightTop?: number
  /** Кастомный заголовок таблицы. */
  title?: string
  /** Compact-режим (для групп). */
  compact?: boolean
}

export function StandingsTable({ rows, highlightTop = 0, title, compact }: Props) {
  const { t } = useTranslation()
  return (
    <div>
      {title && (
        <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-text-muted">
          {title}
        </div>
      )}
      <div className="overflow-hidden rounded-xl border border-[var(--line)] bg-[var(--surface-card)] backdrop-blur-md">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--line)] text-left text-[10px] uppercase tracking-wider text-text-muted">
              <th className="px-3 py-2 font-semibold">{t('bracket.standings.header_num')}</th>
              <th className="px-2 py-2 font-semibold">{t('bracket.standings.header_player')}</th>
              <th className="px-2 py-2 text-center font-semibold tabular-nums">{t('bracket.standings.header_played')}</th>
              <th className="px-2 py-2 text-center font-semibold tabular-nums">{t('bracket.standings.header_wins')}</th>
              <th className="px-2 py-2 text-center font-semibold tabular-nums">{t('bracket.standings.header_losses')}</th>
              {!compact && <th className="px-2 py-2 text-center font-semibold tabular-nums">{t('bracket.standings.header_games')}</th>}
              <th className="px-3 py-2 text-right font-bold">{t('bracket.standings.header_points')}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => {
              const isTopHighlight = i < highlightTop
              return (
                <motion.tr
                  key={row.participant.id}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.02 }}
                  className={cn(
                    'border-b border-[var(--line)] last:border-b-0',
                    isTopHighlight && 'bg-emerald-500/[0.06]',
                  )}
                >
                  <td className={cn(
                    'px-3 py-2 text-xs font-bold tabular-nums',
                    isTopHighlight ? 'text-emerald-400' : 'text-text-muted',
                  )}>
                    {row.rank}
                  </td>
                  <td className="px-2 py-2">
                    <span className="truncate font-medium text-text-primary">{row.participant.name}</span>
                    {row.participant.seed != null && (
                      <span className="ml-1.5 text-[10px] text-text-muted">#{row.participant.seed}</span>
                    )}
                  </td>
                  <td className="px-2 py-2 text-center text-xs tabular-nums text-text-secondary">{row.played}</td>
                  <td className="px-2 py-2 text-center text-xs tabular-nums text-emerald-400">{row.wins}</td>
                  <td className="px-2 py-2 text-center text-xs tabular-nums text-red-400/80">{row.losses}</td>
                  {!compact && (
                    <td className="px-2 py-2 text-center text-xs tabular-nums text-text-muted">
                      {row.pointsFor}–{row.pointsAgainst}
                      {row.diff !== 0 && (
                        <span className={cn(
                          'ml-1 text-[10px]',
                          row.diff > 0 ? 'text-emerald-400/70' : 'text-red-400/70',
                        )}>
                          ({row.diff > 0 ? '+' : ''}{row.diff})
                        </span>
                      )}
                    </td>
                  )}
                  <td className="px-3 py-2 text-right font-bold tabular-nums text-text-primary">{row.points}</td>
                </motion.tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
