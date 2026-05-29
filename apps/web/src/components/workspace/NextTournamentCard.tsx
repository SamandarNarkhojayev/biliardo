import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { CalendarDays, MapPin, Users, ArrowRight, CalendarCheck } from 'lucide-react'
import type { PlayerTournamentStats, Tournament } from '@billiard/shared'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'

interface Props {
  participations: PlayerTournamentStats[]
  tournaments: Tournament[]
}

export function NextTournamentCard({ participations, tournaments }: Props) {
  const { t, i18n } = useTranslation()
  const lang = i18n.language === 'ru' ? 'ru-RU' : 'kk-KZ'

  const next = useMemo(() => {
    const now = Date.now()
    // Ближайший зарегистрированный турнир: REGISTRATION или ACTIVE, в будущем,
    // отсортированный по дате по возрастанию.
    const upcoming = participations
      .filter((s) => s.status === 'REGISTRATION' || s.status === 'ACTIVE')
      .filter((s) => s.scheduledAt && new Date(s.scheduledAt).getTime() >= now - 6 * 3600_000)
      .sort((a, b) => new Date(a.scheduledAt ?? 0).getTime() - new Date(b.scheduledAt ?? 0).getTime())
    if (upcoming.length === 0) return null
    const stat = upcoming[0]
    const tour = tournaments.find((x) => x.id === stat.tournamentId)
    if (!tour) return null
    return { stat, tour }
  }, [participations, tournaments])

  if (!next) return null

  const { stat, tour } = next
  const date = stat.scheduledAt
    ? new Date(stat.scheduledAt).toLocaleString(lang, {
        weekday: 'short', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit',
      })
    : '—'
  const ms = stat.scheduledAt ? new Date(stat.scheduledAt).getTime() - Date.now() : 0
  const daysLeft = Math.max(0, Math.ceil(ms / 86_400_000))

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1 }}
      className="mt-5 overflow-hidden rounded-3xl border border-emerald-400/30 bg-gradient-to-br from-emerald-500/15 via-emerald-500/5 to-transparent p-5 backdrop-blur-md sm:p-7"
    >
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-emerald-300">
            <CalendarCheck size={14} />
            {t('workspace.next_label')}
          </div>
          <h3 className="mt-2 truncate text-xl font-bold text-text-primary sm:text-2xl">{tour.name}</h3>
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-text-secondary">
            <span className="inline-flex items-center gap-1.5"><CalendarDays size={14} />{date}</span>
            {(tour.city || tour.location) && (
              <span className="inline-flex items-center gap-1.5"><MapPin size={14} />{tour.city ?? tour.location}</span>
            )}
            <span className="inline-flex items-center gap-1.5">
              <Users size={14} />
              {tour.participants.length}/{tour.maxParticipants}
            </span>
            <Badge variant={tour.status === 'ACTIVE' ? 'blue' : 'green'}>
              {t(`tournament_status.${tour.status.toLowerCase()}`)}
            </Badge>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-4">
          {daysLeft > 0 && tour.status === 'REGISTRATION' && (
            <div className="text-right">
              <div className="text-3xl font-bold tabular-nums text-emerald-300">{daysLeft}</div>
              <div className="text-[11px] uppercase tracking-wider text-text-muted">{t('workspace.days_left')}</div>
            </div>
          )}
          <Link to={`/tournaments/${tour.id}`}>
            <Button variant="primary" rightIcon={<ArrowRight size={16} />}>
              {t('workspace.open_tournament')}
            </Button>
          </Link>
        </div>
      </div>
    </motion.div>
  )
}
