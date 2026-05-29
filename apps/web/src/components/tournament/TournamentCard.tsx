import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { Calendar, MapPin, Users, Lock } from 'lucide-react'
import type { Tournament, TournamentStatus } from '@billiard/shared'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { cn } from '@/utils/cn'

interface TournamentCardProps {
  tournament: Tournament
  variant?: 'public' | 'manage'
}

const statusToBadge: Record<TournamentStatus, 'green' | 'blue' | 'gray' | 'gold' | 'red'> = {
  REGISTRATION: 'green',
  ACTIVE: 'blue',
  COMPLETED: 'gray',
  DRAFT: 'gold',
  CANCELLED: 'red',
}

export function TournamentCard({ tournament, variant = 'public' }: TournamentCardProps) {
  const { t, i18n } = useTranslation()
  const cur = tournament.participants.length
  const max = tournament.maxParticipants
  const fillPct = Math.round((cur / max) * 100)
  const isFull = cur >= max
  const isHot = fillPct >= 80 && !isFull

  const statusKey = tournament.status.toLowerCase()
  const variantBadge = statusToBadge[tournament.status]

  const dateLabel = tournament.scheduledAt
    ? new Date(tournament.scheduledAt).toLocaleString(i18n.language === 'ru' ? 'ru-RU' : 'kk-KZ', {
        day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
      })
    : '—'

  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ type: 'spring', stiffness: 320, damping: 24 }}
      className="group relative overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--surface-card)] backdrop-blur-xl transition-colors hover:border-[var(--line-strong)]"
    >
      <Link to={`/tournaments/${tournament.id}`} className="block">
        <div className={cn('relative h-32 w-full overflow-hidden bg-gradient-to-br', tournament.coverGradient ?? 'from-emerald-500/30 via-emerald-700/20 to-bg-secondary')}>
          <div className="absolute inset-0 opacity-30" style={{
            backgroundImage: 'radial-gradient(circle at 25% 25%, rgba(255,255,255,0.5) 0.5px, transparent 0.5px)',
            backgroundSize: '14px 14px',
          }} />
          <div className="absolute left-4 top-4 flex flex-wrap gap-1.5">
            <Badge variant={variantBadge} dot={tournament.status !== 'COMPLETED' && tournament.status !== 'DRAFT'}>
              {t(`tournament_status.${statusKey}`)}
            </Badge>
            {!tournament.isPublic && (
              <Badge variant="purple" className="gap-1">
                <Lock size={10} /> Private
              </Badge>
            )}
          </div>
          <div className="absolute right-4 top-4 rounded-full bg-bg-primary/60 px-2 py-1 text-[10px] font-medium uppercase tracking-wider text-text-secondary backdrop-blur-md">
            {t(`bracket_type.${tournament.bracketType}`)}
          </div>
        </div>

        <div className="p-5">
          <h3 className="text-base font-semibold text-text-primary group-hover:text-emerald-300 transition-colors line-clamp-1">
            {tournament.name}
          </h3>
          <div className="mt-3 flex flex-col gap-2 text-xs text-text-secondary">
            <span className="inline-flex items-center gap-1.5"><Calendar size={12} />{dateLabel}</span>
            {tournament.city && <span className="inline-flex items-center gap-1.5"><MapPin size={12} />{tournament.city}</span>}
          </div>

          <div className="mt-4">
            <div className="flex items-center justify-between text-xs">
              <span className="inline-flex items-center gap-1.5 text-text-secondary">
                <Users size={12} />
                {t('dashboard.card.participants', { cur, max })}
              </span>
              <span className={cn(
                'font-semibold',
                isFull ? 'text-red-400' : isHot ? 'text-amber-300' : 'text-emerald-400',
              )}>{fillPct}%</span>
            </div>
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-[var(--surface-input)]">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${fillPct}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
                className={cn(
                  'h-full rounded-full',
                  isFull ? 'bg-gradient-to-r from-red-500 to-red-400' :
                  isHot ? 'bg-gradient-to-r from-amber-400 to-amber-300' :
                  'bg-gradient-to-r from-emerald-500 to-sky-400',
                )}
              />
            </div>
          </div>
        </div>
      </Link>

      <div className="px-5 pb-5">
        <Link to={`/tournaments/${tournament.id}`}>
          <Button
            variant={variant === 'manage' ? 'primary' : tournament.status === 'REGISTRATION' && !isFull ? 'primary' : 'secondary'}
            size="sm"
            fullWidth
          >
            {variant === 'manage' ? t('dashboard.card.manage') :
              tournament.status === 'COMPLETED' ? t('live.watch') :
              isFull ? t('live.no_tournaments') :
              t('live.register')}
          </Button>
        </Link>
      </div>
    </motion.div>
  )
}
