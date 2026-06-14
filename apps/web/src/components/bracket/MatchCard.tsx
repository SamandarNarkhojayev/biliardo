import { motion } from 'framer-motion'
import type { Match, Participant } from '@billiard/shared'
import { cn } from '@/utils/cn'

interface MatchCardProps {
  match: Match
  p1?: Participant
  p2?: Participant
  isOrganizer?: boolean
  onClick?: () => void
  /** Когда true — рендерим как абсолютно позиционированный (внутри bracket layout). */
  positioned?: { x: number; y: number; width: number }
  /** Кастомные подписи если participantId не задан. */
  placeholder?: { p1?: string; p2?: string }
  /** Метка матча (например, "Финал" или "За 3-е место"). */
  label?: string
}

export function MatchCard({
  match, p1, p2, isOrganizer, onClick, positioned, placeholder, label,
}: MatchCardProps) {
  const isLive = match.status === 'in-progress'
  const isCompleted = match.status === 'completed'
  const isBye = match.status === 'bye'
  const winnerId = match.winnerId
  const isClickable = isOrganizer && !isBye && p1 && p2 && !!onClick

  const style = positioned
    ? { left: positioned.x, top: positioned.y, width: positioned.width, position: 'absolute' as const }
    : undefined

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
      onClick={isClickable ? onClick : undefined}
      style={style}
      className={cn(
        'overflow-hidden rounded-xl border bg-[var(--surface-card)] backdrop-blur-md transition-all',
        isClickable && 'cursor-pointer hover:border-emerald-400/40 hover:shadow-[0_0_18px_-6px_rgba(16,185,129,0.5)]',
        isLive ? 'border-emerald-400/60 shadow-[0_0_18px_-6px_rgba(16,185,129,0.55)]' :
        isCompleted ? 'border-[var(--line-strong)]' :
        'border-[var(--line)]',
      )}
    >
      {label && (
        <div className="border-b border-[var(--line)] bg-[var(--surface-card)] px-3 py-1 text-[9px] font-semibold uppercase tracking-wider text-text-muted">
          {label}
        </div>
      )}
      {match.tableLabel && !isBye && (
        <div className="flex items-center justify-end gap-1 border-b border-[var(--line)] bg-emerald-500/[0.06] px-3 py-0.5 text-[9px] font-bold uppercase tracking-wider text-emerald-300">
          {match.tableLabel}
        </div>
      )}
      {isLive && (
        <motion.div
          className="absolute inset-x-0 top-0 h-0.5 bg-emerald-400"
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      )}
      <PlayerRow
        name={p1?.name ?? placeholder?.p1 ?? (isBye && p2 ? '—' : 'TBD')}
        avatar={p1?.avatar}
        score={match.score1}
        seed={p1?.seed}
        isWinner={winnerId === p1?.id}
        isCompleted={isCompleted}
        ghost={isBye && !p1}
        autoAdvance={isBye && !!p1 && !p2}
      />
      <div className="h-px bg-[var(--line)]" />
      <PlayerRow
        name={p2?.name ?? placeholder?.p2 ?? (isBye ? 'Авто-проход' : 'TBD')}
        avatar={p2?.avatar}
        score={match.score2}
        seed={p2?.seed}
        isWinner={winnerId === p2?.id}
        isCompleted={isCompleted}
        ghost={isBye && !p2}
        autoAdvance={isBye && !!p2 && !p1}
      />
    </motion.div>
  )
}

function PlayerRow({
  name, avatar, score, seed, isWinner, isCompleted, ghost, autoAdvance,
}: {
  name: string
  avatar?: string | null
  score?: number; seed?: number | null; isWinner?: boolean; isCompleted?: boolean
  /** Пустой/BYE-слот — рендерим бледно. */
  ghost?: boolean
  /** Этот участник проходит дальше без матча (соперник — BYE). */
  autoAdvance?: boolean
}) {
  return (
    <div className={cn(
      'flex items-center justify-between gap-2 px-3 py-2',
      isWinner && !ghost && 'bg-emerald-500/10',
      ghost && 'opacity-40',
    )}>
      <div className="flex min-w-0 items-center gap-2">
        {seed != null && (
          <span className="inline-flex h-4 w-4 shrink-0 items-center justify-center rounded text-[9px] font-bold text-text-muted">
            {seed}
          </span>
        )}
        {!ghost && (
          <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[var(--surface-input)] text-[9px] font-bold text-text-muted">
            {avatar ? (
              <img src={avatar} alt="" loading="lazy" decoding="async" width="20" height="20" className="h-full w-full object-cover" />
            ) : name && name !== 'TBD' && name !== '—' ? (
              name.slice(0, 1).toUpperCase()
            ) : (
              ''
            )}
          </span>
        )}
        <span className={cn(
          'truncate text-xs',
          ghost ? 'italic text-text-muted' :
          isWinner ? 'font-bold text-emerald-300' :
          isCompleted ? 'text-text-secondary' : 'text-text-primary',
        )}>
          {name}
        </span>
        {autoAdvance && (
          <span className="ml-1 inline-flex shrink-0 items-center rounded-md bg-emerald-500/15 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-emerald-300">
            проходит дальше
          </span>
        )}
      </div>
      {!ghost && (
        <span className={cn(
          'shrink-0 tabular-nums text-xs font-bold',
          isWinner ? 'text-emerald-300' : 'text-text-muted',
        )}>
          {score ?? '–'}
        </span>
      )}
    </div>
  )
}
