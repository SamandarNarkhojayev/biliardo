import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { Lightbulb, Square, Play, Wallet, Users, Layers, Coffee } from 'lucide-react'
import type { TableSnapshot, SessionMode } from '@billiard/shared'
import { Button } from '@/components/ui/Button'
import { useClubStore } from '@/store/club'
import { cn } from '@/utils/cn'

function formatKzt(n: number): string {
  return new Intl.NumberFormat('ru-RU').format(n) + ' ₸'
}

function pad2(n: number): string {
  return n.toString().padStart(2, '0')
}

function elapsedFromMs(startMs: number): { h: number; m: number; s: number } {
  const elapsed = Math.max(0, Math.floor((Date.now() - startMs) / 1000))
  return {
    h: Math.floor(elapsed / 3600),
    m: Math.floor((elapsed % 3600) / 60),
    s: elapsed % 60,
  }
}

export default function ClubTables() {
  const { t } = useTranslation()
  const snapshot = useClubStore((s) => s.snapshot)
  const desktopOnline = useClubStore((s) => s.desktopOnline)
  const sendCommand = useClubStore((s) => s.sendCommand)
  const pendingCommands = useClubStore((s) => s.pendingCommands)

  if (!snapshot) {
    return <NoSnapshotBanner />
  }

  const occupied = snapshot.tables.filter((t) => t.status === 'occupied').length

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat icon={<Wallet size={18} />} label={t('club.tables.stat_revenue')} value={formatKzt(snapshot.todayRevenue.total)} />
        <Stat icon={<Users size={18} />} label={t('club.tables.stat_occupied')} value={`${occupied}/${snapshot.tables.length}`} />
        <Stat icon={<Layers size={18} />} label={t('club.tables.stat_sessions')} value={snapshot.todayRevenue.sessionsCount} />
        <Stat icon={<Coffee size={18} />} label={t('club.tables.stat_bar')} value={formatKzt(snapshot.todayRevenue.bar)} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {snapshot.tables.map((tbl) => (
          <TableCard
            key={tbl.id}
            tbl={tbl}
            disabled={!desktopOnline || pendingCommands.size > 0}
            onToggleLight={() => sendCommand({ type: 'TABLE_TOGGLE_LIGHT', tableId: tbl.id })}
            onStart={() => sendCommand({ type: 'TABLE_START_SESSION', tableId: tbl.id, payload: { mode: 'unlimited' } })}
            onEnd={() => sendCommand({ type: 'TABLE_END_SESSION', tableId: tbl.id })}
          />
        ))}
      </div>
    </div>
  )
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface-card)] p-4 backdrop-blur-md">
      <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-text-muted">
        {icon}<span>{label}</span>
      </div>
      <div className="mt-2 text-xl font-bold tracking-tight text-text-primary sm:text-2xl">{value}</div>
    </div>
  )
}

function TableCard({
  tbl, disabled, onToggleLight, onStart, onEnd,
}: {
  tbl: TableSnapshot
  disabled: boolean
  onToggleLight: () => void
  onStart: () => void
  onEnd: () => void
}) {
  const { t } = useTranslation()
  const isOccupied = tbl.status === 'occupied' && tbl.session
  const isReserved = tbl.status === 'reserved'

  const cardCls = cn(
    'rounded-2xl border p-5 backdrop-blur-md transition',
    isOccupied
      ? 'border-emerald-400/40 bg-emerald-400/[0.06]'
      : isReserved
      ? 'border-amber-400/40 bg-amber-400/[0.04]'
      : 'border-[var(--line)] bg-[var(--surface-card)]',
  )

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className={cardCls}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="font-semibold text-text-primary">{tbl.name}</div>
        <StatusDot status={tbl.status} />
      </div>

      <div className="mt-3 min-h-[72px]">
        {isOccupied && tbl.session ? (
          <Timer startMs={tbl.session.startTime} mode={tbl.session.mode} planned={tbl.session.plannedDuration} />
        ) : isReserved ? (
          <div>
            <div className="text-xs uppercase tracking-wider text-amber-200/80">{t('club.tables.status_reserved')}</div>
          </div>
        ) : tbl.status === 'maintenance' ? (
          <div className="text-xs uppercase tracking-wider text-text-muted">{t('club.tables.status_maintenance')}</div>
        ) : (
          <div className="text-xs uppercase tracking-wider text-text-muted">{t('club.tables.status_free')}</div>
        )}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <Button
          size="sm"
          variant={tbl.lightOn ? 'primary' : 'secondary'}
          leftIcon={<Lightbulb size={14} />}
          onClick={onToggleLight}
          disabled={disabled}
        >
          {t(tbl.lightOn ? 'club.tables.btn_light_off' : 'club.tables.btn_light_on')}
        </Button>
        {isOccupied ? (
          <Button size="sm" variant="secondary" leftIcon={<Square size={14} />} onClick={onEnd} disabled={disabled}>
            {t('club.tables.btn_end')}
          </Button>
        ) : tbl.status === 'free' ? (
          <Button size="sm" variant="primary" leftIcon={<Play size={14} />} onClick={onStart} disabled={disabled}>
            {t('club.tables.btn_start')}
          </Button>
        ) : null}
      </div>
    </motion.div>
  )
}

function StatusDot({ status }: { status: TableSnapshot['status'] }) {
  const cls =
    status === 'occupied' ? 'bg-emerald-400 animate-pulse'
    : status === 'reserved' ? 'bg-amber-400'
    : status === 'maintenance' ? 'bg-rose-400'
    : 'bg-text-muted/40'
  return <span className={cn('inline-block h-2.5 w-2.5 rounded-full', cls)} aria-hidden />
}

function Timer({ startMs, mode, planned }: { startMs: number; mode: SessionMode; planned: number | null }) {
  const { t } = useTranslation()
  const [now, setNow] = useState(Date.now())
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(id)
  }, [])
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const e = useMemo(() => elapsedFromMs(startMs), [now, startMs])
  return (
    <div>
      <div className="text-2xl font-bold tracking-wider text-emerald-300 sm:text-3xl tabular-nums">
        {pad2(e.h)}:{pad2(e.m)}:{pad2(e.s)}
      </div>
      <div className="mt-1 text-[11px] uppercase tracking-wider text-text-muted">
        {t(`club.tables.mode_${mode}`)}{planned !== null ? ` · ${t('club.tables.minutes', { n: planned })}` : ''}
      </div>
    </div>
  )
}

function NoSnapshotBanner() {
  const { t } = useTranslation()
  return (
    <div className="rounded-3xl border border-amber-400/40 bg-amber-400/10 p-6 backdrop-blur-md sm:p-8">
      <h2 className="text-lg font-semibold text-amber-200">{t('club.tables.no_snapshot_title')}</h2>
      <p className="mt-2 text-sm text-amber-100/80">{t('club.tables.no_snapshot_hint')}</p>
      <ol className="mt-4 list-inside list-decimal space-y-1 text-sm text-amber-100/90">
        <li>{t('club.tables.no_snapshot_step_1')}</li>
        <li>{t('club.tables.no_snapshot_step_2')}</li>
        <li>{t('club.tables.no_snapshot_step_3')}</li>
      </ol>
    </div>
  )
}
