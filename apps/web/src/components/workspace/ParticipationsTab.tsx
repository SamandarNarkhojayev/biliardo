import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Calendar, MapPin, Trophy, Target, Medal } from 'lucide-react'
import type { PlayerTournamentStats, Tournament } from '@billiard/shared'
import { Badge } from '@/components/ui/Badge'
import { cn } from '@/utils/cn'

interface Props {
  participations: PlayerTournamentStats[]
  tournaments: Tournament[]
}

type Filter = 'all' | 'upcoming' | 'active' | 'completed'

const filters: Filter[] = ['all', 'upcoming', 'active', 'completed']

export function ParticipationsTab({ participations, tournaments }: Props) {
  const { t, i18n } = useTranslation()
  const lang = i18n.language === 'ru' ? 'ru-RU' : 'kk-KZ'
  const [filter, setFilter] = useState<Filter>('all')

  const tourById = useMemo(() => {
    const m = new Map<string, Tournament>()
    for (const x of tournaments) m.set(x.id, x)
    return m
  }, [tournaments])

  const filtered = useMemo(() => {
    if (filter === 'all') return participations
    if (filter === 'upcoming') return participations.filter((s) => s.status === 'REGISTRATION')
    if (filter === 'active') return participations.filter((s) => s.status === 'ACTIVE')
    return participations.filter((s) => s.status === 'COMPLETED')
  }, [participations, filter])

  if (participations.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-[var(--line-strong)] bg-[var(--surface-card)] py-16 text-center">
        <Trophy className="mx-auto text-text-muted" size={32} />
        <h3 className="mt-3 text-lg font-semibold text-text-primary">{t('workspace.parts_empty_title')}</h3>
        <p className="mt-1 text-sm text-text-secondary">{t('workspace.parts_empty_subtitle')}</p>
        <div className="mt-5">
          <Link to="/tournaments" className="text-sm font-semibold text-emerald-400 hover:underline">
            {t('profile.to_tournaments')} →
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {filters.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              'ring-focus shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-all',
              filter === f
                ? 'bg-emerald-400 text-bg-primary'
                : 'border border-[var(--line-strong)] bg-[var(--surface-card)] text-text-secondary hover:text-text-primary',
            )}
          >
            {t(`workspace.parts_filter_${f}`)}
          </button>
        ))}
      </div>

      <ul className="mt-4 space-y-2">
        {filtered.map((s) => {
          const tour = tourById.get(s.tournamentId)
          if (!tour) return null
          const date = s.scheduledAt
            ? new Date(s.scheduledAt).toLocaleDateString(lang, { day: 'numeric', month: 'short', year: 'numeric' })
            : '—'
          return (
            <li key={s.tournamentId}>
              <Link
                to={`/tournaments/${s.tournamentId}`}
                className="flex flex-col gap-3 rounded-2xl border border-[var(--line)] bg-[var(--surface-card)] p-4 transition hover:border-[var(--line-strong)] hover:bg-[var(--surface-card-hover)] sm:flex-row sm:items-center sm:gap-5"
              >
                <PlaceMedal place={s.place} status={s.status} />
                <div className="min-w-0 flex-1">
                  <div className="truncate font-semibold text-text-primary">{s.tournamentName}</div>
                  <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-text-muted">
                    <span className="inline-flex items-center gap-1.5"><Calendar size={12} />{date}</span>
                    {tour.city && <span className="inline-flex items-center gap-1.5"><MapPin size={12} />{tour.city}</span>}
                    <Badge variant={s.status === 'COMPLETED' ? 'gray' : s.status === 'ACTIVE' ? 'blue' : 'green'}>
                      {t(`tournament_status.${s.status.toLowerCase()}`)}
                    </Badge>
                  </div>
                </div>
                <div className="flex shrink-0 gap-5 text-sm sm:gap-4">
                  <MetricInline icon={Trophy} value={`${s.wins}-${s.losses}`} label={t('workspace.wl')} />
                  <MetricInline icon={Target} value={s.ballsPotted} label={t('workspace.balls_potted_short')} />
                </div>
              </Link>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

function PlaceMedal({ place, status }: { place: number | null; status: PlayerTournamentStats['status'] }) {
  if (place == null) {
    return (
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-[var(--line)] bg-[var(--surface-elevated)] text-text-muted">
        {status === 'ACTIVE' ? <Trophy size={18} /> : <Medal size={18} />}
      </div>
    )
  }
  const accent = place === 1
    ? 'from-amber-300 to-amber-500 text-bg-primary'
    : place === 2
    ? 'from-slate-300 to-slate-400 text-bg-primary'
    : place === 3
    ? 'from-orange-300 to-orange-500 text-bg-primary'
    : 'from-emerald-400/30 to-emerald-700/30 text-emerald-200'
  return (
    <div className={cn('flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br text-base font-bold shadow', accent)}>
      {place}
    </div>
  )
}

function MetricInline({ icon: Icon, value, label }: { icon: typeof Trophy; value: number | string; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <Icon size={14} className="text-text-muted" />
      <div className="leading-tight">
        <div className="text-sm font-semibold tabular-nums text-text-primary">{value}</div>
        <div className="text-[10px] uppercase tracking-wider text-text-muted">{label}</div>
      </div>
    </div>
  )
}
