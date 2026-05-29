import { useTranslation } from 'react-i18next'
import { useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Edit2, Phone, Building2, Plus, Trophy, Medal, Target } from 'lucide-react'
import type { User, PlayerTournamentStats } from '@billiard/shared'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'

function initials(name: string): string {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase() ?? '').join('')
}

export function WorkspaceHeader({
  user, stats, onCreate, showCreate,
}: {
  user: User
  stats: PlayerTournamentStats[]
  onCreate: () => void
  showCreate: boolean
}) {
  const { t } = useTranslation()
  const [, setParams] = useSearchParams()

  const completed = stats.filter((s) => s.status === 'COMPLETED')
  const wins = completed.filter((s) => s.place === 1).length
  const placesWithValue = completed.filter((s) => s.place != null) as Array<PlayerTournamentStats & { place: number }>
  const bestPlace = placesWithValue.length > 0 ? Math.min(...placesWithValue.map((s) => s.place)) : null
  const totalBalls = stats.reduce((sum, s) => sum + s.ballsPotted, 0)

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="rounded-3xl border border-[var(--line)] bg-[var(--surface-card)] p-5 backdrop-blur-md sm:p-7"
      >
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-700 text-xl font-bold text-white shadow-lg sm:h-20 sm:w-20 sm:text-2xl">
              {initials(user.name) || '·'}
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="truncate text-2xl font-bold tracking-tight text-text-primary sm:text-3xl">
                  {user.accountType === 'CLUB' && user.clubName ? user.clubName : user.name}
                </h1>
                {user.accountType === 'CLUB' && (
                  <Badge variant="blue">
                    <Building2 size={12} className="mr-1 inline" /> {t('profile.badge_club')}
                  </Badge>
                )}
              </div>
              {user.accountType === 'CLUB' && user.clubName && (
                <div className="mt-1 text-sm text-text-secondary">{user.name}</div>
              )}
              <div className="mt-1.5 inline-flex items-center gap-1.5 text-sm text-text-secondary">
                <Phone size={14} /> {user.phone}
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<Edit2 size={14} />}
              onClick={() => setParams((prev) => {
                const next = new URLSearchParams(prev)
                next.set('tab', 'settings')
                return next
              }, { replace: true })}
            >
              {t('profile.edit')}
            </Button>
            {showCreate && (
              <Button variant="primary" size="sm" leftIcon={<Plus size={14} />} onClick={onCreate}>
                {t('dashboard.create')}
              </Button>
            )}
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
          <Stat icon={Trophy} label={t('workspace.stat_played')} value={stats.length} />
          <Stat icon={Medal} label={t('workspace.stat_wins')} value={wins} accent={wins > 0 ? 'gold' : undefined} />
          <Stat icon={Medal} label={t('workspace.stat_best_place')} value={bestPlace ?? '—'} />
          <Stat icon={Target} label={t('workspace.stat_balls')} value={totalBalls} />
        </div>
      </motion.div>
    </>
  )
}

function Stat({
  icon: Icon, label, value, accent,
}: {
  icon: typeof Trophy
  label: string
  value: number | string
  accent?: 'gold'
}) {
  return (
    <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface-elevated)] p-4">
      <Icon size={16} className={accent === 'gold' ? 'text-amber-300' : 'text-emerald-400'} />
      <div className="mt-2 text-2xl font-bold tabular-nums tracking-tight text-text-primary sm:text-3xl">{value}</div>
      <div className="mt-0.5 text-[11px] uppercase tracking-wider text-text-muted">{label}</div>
    </div>
  )
}
