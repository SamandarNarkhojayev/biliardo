import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { Plus, Trophy } from 'lucide-react'
import type { Tournament, TournamentStatus } from '@billiard/shared'
import { Button } from '@/components/ui/Button'
import { TournamentCard } from '@/components/tournament/TournamentCard'
import { cn } from '@/utils/cn'

type FilterTab = 'all' | 'draft' | 'registration' | 'active' | 'completed'

const tabs: { key: FilterTab; status?: TournamentStatus }[] = [
  { key: 'all' },
  { key: 'draft', status: 'DRAFT' },
  { key: 'registration', status: 'REGISTRATION' },
  { key: 'active', status: 'ACTIVE' },
  { key: 'completed', status: 'COMPLETED' },
]

export function MyTournamentsTab({
  tournaments,
  onCreate,
}: {
  tournaments: Tournament[]
  onCreate: () => void
}) {
  const { t } = useTranslation()
  const [filter, setFilter] = useState<FilterTab>('all')

  const counts = useMemo(() => ({
    all: tournaments.length,
    draft: tournaments.filter((x) => x.status === 'DRAFT').length,
    registration: tournaments.filter((x) => x.status === 'REGISTRATION').length,
    active: tournaments.filter((x) => x.status === 'ACTIVE').length,
    completed: tournaments.filter((x) => x.status === 'COMPLETED').length,
  }), [tournaments])

  const filtered = useMemo(() => {
    const cfg = tabs.find((x) => x.key === filter)
    if (!cfg?.status) return tournaments
    return tournaments.filter((x) => x.status === cfg.status)
  }, [tournaments, filter])

  if (tournaments.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-[var(--line-strong)] bg-[var(--surface-card)] py-16 text-center">
        <div className="mx-auto mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-400">
          <Trophy size={28} />
        </div>
        <h3 className="text-xl font-semibold text-text-primary">{t('dashboard.empty_title')}</h3>
        <p className="mx-auto mt-2 max-w-sm text-sm text-text-secondary">{t('dashboard.empty_subtitle')}</p>
        <div className="mt-6">
          <Button variant="primary" leftIcon={<Plus size={16} />} onClick={onCreate}>
            {t('dashboard.create')}
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex gap-1 overflow-x-auto pb-1">
        {tabs.map((tg) => {
          const active = filter === tg.key
          const count = counts[tg.key]
          return (
            <button
              key={tg.key}
              onClick={() => setFilter(tg.key)}
              className={cn(
                'ring-focus inline-flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all',
                active
                  ? 'bg-emerald-400 text-bg-primary'
                  : 'border border-[var(--line-strong)] bg-[var(--surface-card)] text-text-secondary hover:text-text-primary',
              )}
            >
              {t(`dashboard.tabs.${tg.key}`)}
              <span className={cn(
                'rounded-full px-1.5 py-0.5 text-[10px] font-bold tabular-nums',
                active ? 'bg-bg-primary/20 text-bg-primary' : 'bg-[var(--surface-input)] text-text-muted',
              )}>{count}</span>
            </button>
          )
        })}
      </div>

      <motion.div
        initial="initial"
        animate="animate"
        variants={{ animate: { transition: { staggerChildren: 0.04 } } }}
        className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
      >
        {filtered.map((tour) => (
          <motion.div
            key={tour.id}
            variants={{
              initial: { opacity: 0, y: 14 },
              animate: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.4, 0, 0.2, 1] } },
            }}
          >
            <TournamentCard tournament={tour} variant="manage" />
          </motion.div>
        ))}
      </motion.div>
    </div>
  )
}
