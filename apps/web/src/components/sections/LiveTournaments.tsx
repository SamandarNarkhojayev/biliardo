import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { ArrowRight, Calendar, MapPin, Users } from 'lucide-react'
import type { Tournament } from '@billiard/shared'
import { Container } from '@/components/ui/Container'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { api, ApiException } from '@/api/client'
import { cn } from '@/utils/cn'

type UiStatus = 'registration' | 'active' | 'completed'

const STATUS_TO_UI: Record<Tournament['status'], UiStatus | null> = {
  REGISTRATION: 'registration',
  ACTIVE: 'active',
  COMPLETED: 'completed',
  DRAFT: null,
  CANCELLED: null,
}

const statusToBadge: Record<UiStatus, 'green' | 'blue' | 'gray'> = {
  registration: 'green',
  active: 'blue',
  completed: 'gray',
}

const DATE_FMT = new Intl.DateTimeFormat('ru-RU', {
  day: 'numeric',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
})

function formatScheduled(iso: string | null | undefined): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return DATE_FMT.format(d).replace('.', '')
}

function tournamentLocation(t: Tournament): string {
  if (t.city && t.location && !t.location.toLowerCase().includes(t.city.toLowerCase())) {
    return `${t.city}, ${t.location}`
  }
  return t.location ?? t.city ?? ''
}

export function LiveTournaments() {
  const { t } = useTranslation()
  const [tournaments, setTournaments] = useState<Tournament[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    api.get<{ tournaments: Tournament[] }>('/tournaments?limit=6')
      .then((data) => {
        if (cancelled) return
        setTournaments(data.tournaments)
        setError(null)
      })
      .catch((err: unknown) => {
        if (cancelled) return
        setError(err instanceof ApiException ? err.message : 'Не удалось загрузить турниры')
      })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])

  return (
    <section id="live" className="relative py-20 sm:py-28">
      <Container size="wide">
        <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
          <SectionHeader title={t('live.title')} subtitle={t('live.subtitle')} align="left" />
          <Link to="/tournaments" className="hidden md:block">
            <Button variant="secondary" rightIcon={<ArrowRight size={16} />}>
              {t('live.view_all')}
            </Button>
          </Link>
        </div>

        {loading ? (
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="h-72 animate-pulse rounded-2xl border border-[var(--line)] bg-[var(--surface-card)]"
              />
            ))}
          </div>
        ) : error ? (
          <div className="mt-12 rounded-2xl border border-red-500/40 bg-red-500/5 p-6 text-center text-sm text-red-300">
            {error}
          </div>
        ) : tournaments.length === 0 ? (
          <div className="mt-12 rounded-2xl border border-[var(--line)] bg-[var(--surface-card)] p-8 text-center text-sm text-text-secondary">
            Пока нет открытых турниров. Загляни позже.
          </div>
        ) : (
          <motion.div
            initial="initial"
            whileInView="animate"
            viewport={{ once: true, margin: '-50px' }}
            variants={{ animate: { transition: { staggerChildren: 0.05 } } }}
            className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
          >
            {tournaments.map((tour) => {
              const uiStatus = STATUS_TO_UI[tour.status] ?? 'registration'
              const current = tour.participantCount ?? 0
              const max = tour.maxParticipants
              const fillPct = max > 0 ? Math.round((current / max) * 100) : 0
              const isFull = current >= max
              const isHot = fillPct >= 80 && !isFull
              const date = formatScheduled(tour.scheduledAt)
              const place = tournamentLocation(tour)
              return (
                <motion.div
                  key={tour.id}
                  variants={{
                    initial: { opacity: 0, y: 20 },
                    animate: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.4, 0, 0.2, 1] } },
                  }}
                  whileHover={{ y: -4 }}
                  transition={{ type: 'spring', stiffness: 320, damping: 24 }}
                  className="group relative overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--surface-card)] backdrop-blur-xl transition-colors hover:border-[var(--line-strong)]"
                >
                  <div className={cn('relative h-32 w-full overflow-hidden bg-gradient-to-br', tour.coverGradient ?? 'from-emerald-500/30 via-emerald-700/20 to-bg-secondary')}>
                    <div className="absolute inset-0 opacity-30" style={{
                      backgroundImage: 'radial-gradient(circle at 25% 25%, rgba(255,255,255,0.5) 0.5px, transparent 0.5px)',
                      backgroundSize: '14px 14px',
                    }} />
                    <div className="absolute left-4 top-4">
                      <Badge variant={statusToBadge[uiStatus]} dot={uiStatus !== 'completed'}>
                        {t(`tournament_status.${uiStatus}`)}
                      </Badge>
                    </div>
                    <div className="absolute right-4 top-4 rounded-full bg-bg-primary/60 px-2 py-1 text-[10px] font-medium uppercase tracking-wider text-text-secondary backdrop-blur-md">
                      {t(`bracket_type.${tour.bracketType}`)}
                    </div>
                  </div>

                  <div className="p-5">
                    <h3 className="text-base font-semibold text-text-primary group-hover:text-emerald-300 transition-colors line-clamp-1">
                      {tour.name}
                    </h3>
                    <div className="mt-3 flex flex-col gap-2 text-xs text-text-secondary">
                      <span className="inline-flex items-center gap-1.5"><Calendar size={12} />{date}</span>
                      <span className="inline-flex items-center gap-1.5"><MapPin size={12} />{place}</span>
                    </div>

                    <div className="mt-4">
                      <div className="flex items-center justify-between text-xs">
                        <span className="inline-flex items-center gap-1.5 text-text-secondary">
                          <Users size={12} />
                          {t('live.participants', { cur: current, max })}
                        </span>
                        <span className={cn(
                          'font-semibold',
                          isFull ? 'text-red-400' : isHot ? 'text-amber-300' : 'text-emerald-400',
                        )}>{fillPct}%</span>
                      </div>
                      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-[var(--surface-input)]">
                        <motion.div
                          initial={{ width: 0 }}
                          whileInView={{ width: `${fillPct}%` }}
                          viewport={{ once: true }}
                          transition={{ duration: 1, ease: 'easeOut' }}
                          className={cn(
                            'h-full rounded-full',
                            isFull ? 'bg-gradient-to-r from-red-500 to-red-400' :
                            isHot ? 'bg-gradient-to-r from-amber-400 to-amber-300' :
                            'bg-gradient-to-r from-emerald-500 to-sky-400',
                          )}
                        />
                      </div>
                    </div>

                    <div className="mt-5">
                      <Link to={`/tournaments/${tour.id}`}>
                        <Button
                          variant={uiStatus === 'registration' && !isFull ? 'primary' : 'secondary'}
                          size="sm"
                          fullWidth
                          disabled={isFull && uiStatus === 'registration'}
                        >
                          {uiStatus === 'completed' ? t('live.watch') :
                            isFull ? 'Мест нет' : t('live.register')}
                        </Button>
                      </Link>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </motion.div>
        )}

        <div className="mt-10 flex justify-center md:hidden">
          <Link to="/tournaments">
            <Button variant="secondary" rightIcon={<ArrowRight size={16} />}>
              {t('live.view_all')}
            </Button>
          </Link>
        </div>
      </Container>
    </section>
  )
}
