import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { Plus, LayoutGrid, BarChart3, Trophy, Settings } from 'lucide-react'
import { playerStatsForTournament, type PlayerTournamentStats } from '@billiard/shared'
import { Container } from '@/components/ui/Container'
import { Button } from '@/components/ui/Button'
import { CreateTournamentWizard } from '@/components/tournament/CreateTournamentWizard'
import { useAuthStore } from '@/store/auth'
import { useTournamentsStore } from '@/store/tournaments'
import { cn } from '@/utils/cn'
import { WorkspaceHeader } from '@/components/workspace/WorkspaceHeader'
import { NextTournamentCard } from '@/components/workspace/NextTournamentCard'
import { OverviewTab } from '@/components/workspace/OverviewTab'
import { ParticipationsTab } from '@/components/workspace/ParticipationsTab'
import { MyTournamentsTab } from '@/components/workspace/MyTournamentsTab'
import { SettingsTab } from '@/components/workspace/SettingsTab'

type TabKey = 'overview' | 'participations' | 'mine' | 'settings'

interface TabSpec {
  key: TabKey
  icon: typeof BarChart3
  i18n: string
}

const ALL_TABS: TabSpec[] = [
  { key: 'overview', icon: BarChart3, i18n: 'workspace.tab_overview' },
  { key: 'participations', icon: Trophy, i18n: 'workspace.tab_participations' },
  { key: 'mine', icon: LayoutGrid, i18n: 'workspace.tab_mine' },
  { key: 'settings', icon: Settings, i18n: 'workspace.tab_settings' },
]

export default function Workspace() {
  const { t } = useTranslation()
  const user = useAuthStore((s) => s.user)!
  const tournaments = useTournamentsStore((s) => s.tournaments)
  const fetchMine = useTournamentsStore((s) => s.fetchMine)
  const fetchCatalog = useTournamentsStore((s) => s.fetchCatalog)
  const [params, setParams] = useSearchParams()
  const [createOpen, setCreateOpen] = useState(false)

  // Прогреваем кэш: «мои турниры» + публичный каталог (для участий).
  useEffect(() => {
    void fetchMine()
    void fetchCatalog()
  }, [fetchMine, fetchCatalog])
  // Таб берём из URL ?tab=... — это позволяет другим компонентам (шапка,
  // ссылки в меню) переключать таб простым изменением searchParams.
  const tabParam = params.get('tab')
  const tab: TabKey = tabParam === 'participations' || tabParam === 'mine' || tabParam === 'settings'
    ? tabParam
    : 'overview'

  useEffect(() => {
    if (params.get('create') === '1') {
      setCreateOpen(true)
      params.delete('create')
      setParams(params, { replace: true })
    }
  }, [params, setParams])

  // Где я участник (по userId в participants).
  const myParticipations = useMemo<PlayerTournamentStats[]>(
    () => tournaments
      .map((tour) => playerStatsForTournament(tour, user.id))
      .filter((s): s is PlayerTournamentStats => s !== null)
      .sort((a, b) => new Date(b.scheduledAt ?? 0).getTime() - new Date(a.scheduledAt ?? 0).getTime()),
    [tournaments, user.id],
  )

  // Где я организатор.
  const myTournaments = useMemo(
    () => tournaments.filter((t) => t.organizerId === user.id),
    [tournaments, user.id],
  )

  // CLUB-аккаунт или у юзера есть свои турниры — показываем таб «Мои турниры».
  const showMineTab = user.accountType === 'CLUB' || myTournaments.length > 0

  const visibleTabs = useMemo(
    () => ALL_TABS.filter((tb) => tb.key !== 'mine' || showMineTab),
    [showMineTab],
  )

  function switchTab(k: TabKey): void {
    const next = new URLSearchParams(params)
    if (k === 'overview') next.delete('tab')
    else next.set('tab', k)
    setParams(next, { replace: true })
  }

  return (
    <section className="relative py-8 sm:py-12">
      <div className="bg-mesh absolute inset-0 -z-10 opacity-40" aria-hidden />
      <Container size="wide">
        {/* Header card */}
        <WorkspaceHeader
          user={user}
          stats={myParticipations}
          onCreate={() => setCreateOpen(true)}
          showCreate={showMineTab}
        />

        {/* Next registered tournament */}
        <NextTournamentCard participations={myParticipations} tournaments={tournaments} />

        {/* Tabs */}
        <div className="sticky top-16 z-20 -mx-4 mt-8 overflow-x-auto bg-bg-primary/80 px-4 pb-1 pt-2 backdrop-blur-md sm:mx-0 sm:rounded-2xl sm:px-2">
          <div className="flex gap-1">
            {visibleTabs.map((tb) => {
              const active = tab === tb.key
              const Icon = tb.icon
              return (
                <button
                  key={tb.key}
                  onClick={() => switchTab(tb.key)}
                  className={cn(
                    'ring-focus inline-flex shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-all',
                    active
                      ? 'bg-emerald-400 text-bg-primary shadow-[0_0_20px_-6px_rgba(16,185,129,0.5)]'
                      : 'text-text-secondary hover:text-text-primary',
                  )}
                >
                  <Icon size={15} />
                  {t(tb.i18n)}
                </button>
              )
            })}
            {tab !== 'mine' && showMineTab && (
              <div className="ml-auto hidden sm:block">
                <Button variant="secondary" size="sm" leftIcon={<Plus size={14} />} onClick={() => setCreateOpen(true)}>
                  {t('dashboard.create')}
                </Button>
              </div>
            )}
          </div>
        </div>

        <motion.div
          key={tab}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="mt-6"
        >
          {tab === 'overview' && (
            <OverviewTab participations={myParticipations} myTournaments={myTournaments} showMine={showMineTab} />
          )}
          {tab === 'participations' && (
            <ParticipationsTab participations={myParticipations} tournaments={tournaments} />
          )}
          {tab === 'mine' && showMineTab && (
            <MyTournamentsTab tournaments={myTournaments} onCreate={() => setCreateOpen(true)} />
          )}
          {tab === 'settings' && <SettingsTab user={user} />}
        </motion.div>
      </Container>

      <CreateTournamentWizard open={createOpen} onClose={() => setCreateOpen(false)} />
    </section>
  )
}
