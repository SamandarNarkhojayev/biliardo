import { useEffect } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Activity, BarChart3, Settings, Wifi, WifiOff } from 'lucide-react'
import { Container } from '@/components/ui/Container'
import { useAuthStore } from '@/store/auth'
import { useClubStore } from '@/store/club'
import { cn } from '@/utils/cn'

function relativeTime(iso: string | null, t: ReturnType<typeof useTranslation>['t']): string {
  if (!iso) return t('club.layout.never')
  const ms = Date.now() - new Date(iso).getTime()
  if (ms < 60_000) return t('club.layout.just_now')
  const min = Math.floor(ms / 60_000)
  if (min < 60) return t('club.layout.min_ago', { n: min })
  const h = Math.floor(min / 60)
  if (h < 24) return t('club.layout.h_ago', { n: h })
  const d = Math.floor(h / 24)
  return t('club.layout.d_ago', { n: d })
}

export default function ClubDashboardLayout() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const snapshot = useClubStore((s) => s.snapshot)
  const desktopOnline = useClubStore((s) => s.desktopOnline)
  const reconnecting = useClubStore((s) => s.reconnecting)
  const bootstrap = useClubStore((s) => s.bootstrap)
  const teardown = useClubStore((s) => s.teardown)

  useEffect(() => {
    if (!user || user.accountType !== 'CLUB') {
      navigate('/dashboard', { replace: true })
      return
    }
    void bootstrap()
    return () => teardown()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id])

  const status = !snapshot
    ? 'no-snapshot'
    : desktopOnline
    ? 'online'
    : reconnecting
    ? 'reconnecting'
    : 'offline'

  return (
    <section className="relative py-6 sm:py-10">
      <div className="bg-mesh absolute inset-0 -z-10 opacity-30" aria-hidden />
      <Container size="default">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-bold tracking-tight text-text-primary sm:text-3xl">
            {snapshot?.clubName ?? user?.clubName ?? user?.name ?? t('club.layout.title')}
          </h1>
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <StatusPill status={status} lastSyncAt={snapshot?.lastSyncAt ?? null} />
          </div>
        </div>

        {/* Tabs */}
        <div className="mt-5 flex gap-1 overflow-x-auto rounded-2xl border border-[var(--line)] bg-[var(--surface-card)] p-1 backdrop-blur-md">
          <Tab to="/club/dashboard/tables" icon={<Activity size={16} />} label={t('club.tabs.tables')} />
          <Tab to="/club/dashboard/reports" icon={<BarChart3 size={16} />} label={t('club.tabs.reports')} />
          <Tab to="/club/dashboard/settings" icon={<Settings size={16} />} label={t('club.tabs.settings')} />
        </div>

        <div className="mt-6">
          <Outlet />
        </div>
      </Container>
    </section>
  )
}

function Tab({ to, icon, label }: { to: string; icon: React.ReactNode; label: string }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        cn(
          'ring-focus inline-flex shrink-0 items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition',
          isActive
            ? 'bg-emerald-400 text-bg-primary'
            : 'text-text-secondary hover:bg-[var(--surface-card-hover)] hover:text-text-primary',
        )
      }
    >
      {icon}
      {label}
    </NavLink>
  )
}

function StatusPill({ status, lastSyncAt }: { status: 'online' | 'offline' | 'reconnecting' | 'no-snapshot'; lastSyncAt: string | null }) {
  const { t } = useTranslation()
  if (status === 'no-snapshot') {
    return (
      <span className="inline-flex items-center gap-2 rounded-full border border-rose-400/40 bg-rose-400/10 px-3 py-1 text-xs font-semibold text-rose-300">
        <WifiOff size={12} /> {t('club.layout.never_connected')}
      </span>
    )
  }
  if (status === 'online') {
    return (
      <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/40 bg-emerald-400/10 px-3 py-1 text-xs font-semibold text-emerald-300">
        <Wifi size={12} /> {t('club.layout.online_with_sync', { ago: relativeTime(lastSyncAt, t) })}
      </span>
    )
  }
  if (status === 'reconnecting') {
    return (
      <span className="inline-flex items-center gap-2 rounded-full border border-amber-400/40 bg-amber-400/10 px-3 py-1 text-xs font-semibold text-amber-200">
        <Wifi size={12} className="animate-pulse" /> {t('club.layout.reconnecting')}
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-amber-400/40 bg-amber-400/10 px-3 py-1 text-xs font-semibold text-amber-200">
      <WifiOff size={12} /> {t('club.layout.offline_with_sync', { ago: relativeTime(lastSyncAt, t) })}
    </span>
  )
}
