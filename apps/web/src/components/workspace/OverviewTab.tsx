import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { Trophy, BarChart3, Target } from 'lucide-react'
import type { PlayerTournamentStats, Tournament } from '@billiard/shared'

interface Props {
  participations: PlayerTournamentStats[]
  myTournaments: Tournament[]
  showMine: boolean
}

const PLACE_LABEL = ['—', '1', '2', '3', '4', '5', '6', '7', '8']

export function OverviewTab({ participations, myTournaments, showMine }: Props) {
  const { t } = useTranslation()

  const completed = useMemo(
    () => participations.filter((s) => s.status === 'COMPLETED' && s.place != null).reverse(), // chronological
    [participations],
  )

  // Гистограмма распределения мест.
  const placeDistribution = useMemo(() => {
    const buckets = new Map<number, number>()
    completed.forEach((s) => {
      if (s.place == null) return
      const bucket = s.place <= 3 ? s.place : s.place <= 8 ? 4 : 5 // 1, 2, 3, 4-8, 9+
      buckets.set(bucket, (buckets.get(bucket) ?? 0) + 1)
    })
    return [
      { label: t('workspace.place_1'), value: buckets.get(1) ?? 0, color: '#fbbf24' },
      { label: t('workspace.place_2'), value: buckets.get(2) ?? 0, color: '#94a3b8' },
      { label: t('workspace.place_3'), value: buckets.get(3) ?? 0, color: '#fb923c' },
      { label: t('workspace.place_4_8'), value: buckets.get(4) ?? 0, color: '#34d399' },
      { label: t('workspace.place_9plus'), value: buckets.get(5) ?? 0, color: '#64748b' },
    ]
  }, [completed, t])

  // Линейный график: шары по турнирам (хронологический).
  const ballsTrend = useMemo(
    () => completed.map((s, i) => ({
      i,
      name: shortName(s.tournamentName),
      balls: s.ballsPotted,
      conceded: s.ballsConceded,
    })),
    [completed],
  )

  const totalGames = participations.reduce((sum, s) => sum + s.played, 0)
  const totalWins = participations.reduce((sum, s) => sum + s.wins, 0)
  const winRate = totalGames > 0 ? Math.round((totalWins / totalGames) * 100) : 0

  if (participations.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-[var(--line-strong)] bg-[var(--surface-card)] py-16 text-center">
        <Trophy className="mx-auto text-text-muted" size={32} />
        <p className="mt-3 text-sm text-text-secondary">{t('workspace.overview_empty')}</p>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* Mini-summary */}
      <div className="grid gap-3 sm:grid-cols-3">
        <SummaryRow
          icon={Trophy}
          label={t('workspace.win_rate')}
          value={`${winRate}%`}
          hint={`${totalWins} / ${totalGames}`}
        />
        <SummaryRow
          icon={Target}
          label={t('workspace.avg_balls')}
          value={completed.length > 0 ? Math.round(completed.reduce((s, x) => s + x.ballsPotted, 0) / completed.length) : 0}
          hint={t('workspace.per_tournament')}
        />
        <SummaryRow
          icon={BarChart3}
          label={t('workspace.completed_count')}
          value={completed.length}
          hint={`${participations.length - completed.length} ${t('workspace.still_playing')}`}
        />
      </div>

      {/* Charts */}
      <div className="grid gap-5 lg:grid-cols-2">
        <ChartCard title={t('workspace.chart_places_title')} subtitle={t('workspace.chart_places_subtitle')}>
          {placeDistribution.some((p) => p.value > 0) ? (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={placeDistribution} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.15)" vertical={false} />
                <XAxis dataKey="label" stroke="rgba(148,163,184,0.7)" fontSize={11} />
                <YAxis allowDecimals={false} stroke="rgba(148,163,184,0.7)" fontSize={11} />
                <Tooltip
                  cursor={{ fill: 'rgba(16,185,129,0.08)' }}
                  contentStyle={{
                    background: 'var(--surface-elevated)',
                    border: '1px solid var(--line)',
                    borderRadius: 12,
                    fontSize: 12,
                  }}
                />
                <Bar dataKey="value" radius={[8, 8, 0, 0]} fill="#34d399" />
              </BarChart>
            </ResponsiveContainer>
          ) : <ChartEmpty />}
        </ChartCard>

        <ChartCard title={t('workspace.chart_balls_title')} subtitle={t('workspace.chart_balls_subtitle')}>
          {ballsTrend.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={ballsTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.15)" vertical={false} />
                <XAxis dataKey="name" stroke="rgba(148,163,184,0.7)" fontSize={11} />
                <YAxis allowDecimals={false} stroke="rgba(148,163,184,0.7)" fontSize={11} />
                <Tooltip
                  contentStyle={{
                    background: 'var(--surface-elevated)',
                    border: '1px solid var(--line)',
                    borderRadius: 12,
                    fontSize: 12,
                  }}
                />
                <Line type="monotone" dataKey="balls" stroke="#34d399" strokeWidth={2.5} dot={{ r: 4 }} name={t('workspace.balls_potted')} />
                <Line type="monotone" dataKey="conceded" stroke="#f87171" strokeWidth={2} strokeDasharray="4 4" dot={{ r: 3 }} name={t('workspace.balls_conceded')} />
              </LineChart>
            </ResponsiveContainer>
          ) : <ChartEmpty />}
        </ChartCard>
      </div>

      {showMine && myTournaments.length > 0 && (
        <ChartCard title={t('workspace.chart_my_tournaments_title')} subtitle={t('workspace.chart_my_tournaments_subtitle')}>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <MiniMetric label={t('workspace.tournament_status_DRAFT')} value={myTournaments.filter((t) => t.status === 'DRAFT').length} />
            <MiniMetric label={t('workspace.tournament_status_REGISTRATION')} value={myTournaments.filter((t) => t.status === 'REGISTRATION').length} accent="green" />
            <MiniMetric label={t('workspace.tournament_status_ACTIVE')} value={myTournaments.filter((t) => t.status === 'ACTIVE').length} accent="blue" />
            <MiniMetric label={t('workspace.tournament_status_COMPLETED')} value={myTournaments.filter((t) => t.status === 'COMPLETED').length} />
          </div>
        </ChartCard>
      )}
    </div>
  )
}

function SummaryRow({ icon: Icon, label, value, hint }: { icon: typeof Trophy; label: string; value: number | string; hint?: string }) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-[var(--line)] bg-[var(--surface-card)] p-4">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-400">
        <Icon size={18} />
      </div>
      <div className="min-w-0">
        <div className="text-xs text-text-muted">{label}</div>
        <div className="mt-0.5 truncate text-2xl font-bold tabular-nums text-text-primary">{value}</div>
        {hint && <div className="mt-0.5 truncate text-xs text-text-muted">{hint}</div>}
      </div>
    </div>
  )
}

function ChartCard({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-3xl border border-[var(--line)] bg-[var(--surface-card)] p-5 backdrop-blur-md sm:p-6">
      <h3 className="text-base font-semibold text-text-primary sm:text-lg">{title}</h3>
      {subtitle && <p className="mt-0.5 text-xs text-text-muted">{subtitle}</p>}
      <div className="mt-4">{children}</div>
    </div>
  )
}

function ChartEmpty() {
  const { t } = useTranslation()
  return (
    <div className="flex h-[240px] items-center justify-center rounded-2xl border border-dashed border-[var(--line)] text-sm text-text-muted">
      {t('workspace.chart_no_data')}
    </div>
  )
}

function MiniMetric({ label, value, accent }: { label: string; value: number; accent?: 'green' | 'blue' }) {
  const color = accent === 'green' ? 'text-emerald-300' : accent === 'blue' ? 'text-sky-300' : 'text-text-primary'
  return (
    <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface-elevated)] p-3 text-center">
      <div className={`text-2xl font-bold tabular-nums ${color}`}>{value}</div>
      <div className="mt-0.5 text-[11px] uppercase tracking-wider text-text-muted">{label}</div>
    </div>
  )
}

function shortName(s: string): string {
  return s.length > 18 ? s.slice(0, 16) + '…' : s
}

// Suppress unused PLACE_LABEL warning (kept for future use).
void PLACE_LABEL
