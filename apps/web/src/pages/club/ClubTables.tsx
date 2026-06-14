import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { Wallet, Users, Layers, Coffee, Banknote, Tag, Phone, CalendarClock, Eye, Square, Play, Clock, DollarSign, Infinity as InfinityIcon } from 'lucide-react'
import type { TableSnapshot, SessionMode } from '@billiard/shared'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
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

interface StartPayload {
  mode: SessionMode
  hours?: number
  minutes?: number
  amount?: number
}

export default function ClubTables() {
  const { t } = useTranslation()
  const snapshot = useClubStore((s) => s.snapshot)
  const desktopOnline = useClubStore((s) => s.desktopOnline)
  const sendCommand = useClubStore((s) => s.sendCommand)
  const isPendingForTable = useClubStore((s) => s.isPendingForTable)

  // Модал «запустить стол» — null когда закрыт, иначе содержит выбранный стол.
  const [startModalTable, setStartModalTable] = useState<TableSnapshot | null>(null)

  if (!snapshot) {
    return <NoSnapshotBanner />
  }

  const occupied = snapshot.tables.filter((t) => t.status === 'occupied').length

  const handleStart = (tbl: TableSnapshot, p: StartPayload) => {
    sendCommand({
      type: 'TABLE_START_SESSION',
      tableId: tbl.id,
      payload: {
        mode: p.mode,
        hours: p.hours,
        minutes: p.minutes,
        amount: p.amount,
      },
    })
    setStartModalTable(null)
  }

  return (
    <div className="space-y-6">
      {!desktopOnline && (
        <div className="flex items-start gap-3 rounded-2xl border border-amber-400/30 bg-amber-400/[0.06] p-3.5 text-sm">
          <Eye size={18} className="mt-0.5 shrink-0 text-amber-400" />
          <div>
            <div className="font-semibold text-amber-200">Десктоп offline — режим только просмотр</div>
            <div className="text-xs text-amber-100/80">
              Команды (запуск/остановка, свет) станут доступны когда desktop-приложение подключится к веб-кабинету.
            </div>
          </div>
        </div>
      )}

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
            disabled={!desktopOnline || isPendingForTable(tbl.id)}
            onStart={() => setStartModalTable(tbl)}
            onEnd={() => sendCommand({ type: 'TABLE_END_SESSION', tableId: tbl.id })}
          />
        ))}
      </div>

      <StartSessionModal
        table={startModalTable}
        onClose={() => setStartModalTable(null)}
        onConfirm={handleStart}
      />
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
  tbl, disabled, onStart, onEnd,
}: {
  tbl: TableSnapshot
  disabled: boolean
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
          <>
            <Timer startMs={tbl.session.startTime} mode={tbl.session.mode} planned={tbl.session.plannedDuration} />
            {tbl.session.tariffName ? (
              <div className="mt-2 inline-flex items-center gap-1 rounded-md bg-emerald-500/15 px-2 py-0.5 text-[11px] font-medium text-emerald-200">
                <Tag size={10} /> {tbl.session.tariffName}
              </div>
            ) : null}
            <SessionCosts session={tbl.session} pricePerHour={tbl.pricePerHour} />
          </>
        ) : isReserved ? (
          <ReservationCard reservation={tbl.reservation} />
        ) : tbl.status === 'maintenance' ? (
          <div className="text-xs uppercase tracking-wider text-text-muted">{t('club.tables.status_maintenance')}</div>
        ) : (
          <div>
            <div className="text-xs uppercase tracking-wider text-text-muted">{t('club.tables.status_free')}</div>
            {tbl.pricePerHour != null ? (
              <div className="mt-2 text-[11px] text-text-muted">
                <span className="font-semibold text-text-secondary">{formatKzt(tbl.pricePerHour)}</span> / час
              </div>
            ) : null}
          </div>
        )}
      </div>

      {/* Кнопки управления — работают только когда desktop online (через WS). */}
      <div className="mt-4 flex flex-wrap gap-2">
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

function SessionCosts({ session, pricePerHour }: { session: NonNullable<TableSnapshot['session']>; pricePerHour?: number }) {
  // Если десктоп прислал currentTableCost — показываем его. Иначе считаем сами.
  const [now, setNow] = useState(Date.now())
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 5000)
    return () => window.clearInterval(id)
  }, [])
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const tableCost = useMemo(() => {
    if (typeof session.currentTableCost === 'number') return session.currentTableCost
    if (typeof pricePerHour !== 'number') return null
    const elapsedHours = Math.max(0, (now - session.startTime) / 3_600_000)
    return Math.round(elapsedHours * pricePerHour)
  }, [now, session.currentTableCost, session.startTime, pricePerHour])
  const barCost = session.currentBarCost ?? 0
  if (tableCost == null && barCost === 0) return null
  return (
    <div className="mt-2 flex flex-wrap items-center gap-3 text-xs">
      {tableCost != null && (
        <span className="inline-flex items-center gap-1 text-emerald-300">
          <Banknote size={12} /> {formatKzt(tableCost)}
        </span>
      )}
      {barCost > 0 && (
        <span className="inline-flex items-center gap-1 text-amber-300">
          <Coffee size={12} /> {formatKzt(barCost)}
        </span>
      )}
    </div>
  )
}

function ReservationCard({ reservation }: { reservation?: TableSnapshot['reservation'] }) {
  const { t } = useTranslation()
  if (!reservation) {
    return <div className="text-xs uppercase tracking-wider text-amber-200/80">{t('club.tables.status_reserved')}</div>
  }
  const when = reservation.reservedFor ? new Date(reservation.reservedFor) : null
  return (
    <div className="space-y-1.5">
      <div className="text-xs uppercase tracking-wider text-amber-200/80">{t('club.tables.status_reserved')}</div>
      {reservation.customerName && (
        <div className="text-sm font-medium text-text-primary">{reservation.customerName}</div>
      )}
      {reservation.customerPhone && (
        <div className="flex items-center gap-1 text-xs text-text-secondary">
          <Phone size={11} /> {reservation.customerPhone}
        </div>
      )}
      {when && (
        <div className="flex items-center gap-1 text-xs text-amber-200/90">
          <CalendarClock size={11} /> {when.toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
        </div>
      )}
    </div>
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

/**
 * Модал выбора режима запуска (как в десктопном Dashboard):
 *   - «По времени» — задаёт hours+minutes, десктоп посчитает plannedDuration
 *   - «На сумму»   — задаёт amount в тенге, десктоп оценит длительность
 *   - «Бессрочно» — без параметров, идёт до ручной остановки
 */
function StartSessionModal({
  table, onClose, onConfirm,
}: {
  table: TableSnapshot | null
  onClose: () => void
  onConfirm: (tbl: TableSnapshot, p: StartPayload) => void
}) {
  const [mode, setMode] = useState<SessionMode>('unlimited')
  const [hours, setHours] = useState<number>(1)
  const [minutes, setMinutes] = useState<number>(0)
  const [amount, setAmount] = useState<number>(5000)

  // Сброс при открытии нового стола.
  useEffect(() => {
    if (table) {
      setMode('unlimited')
      setHours(1)
      setMinutes(0)
      setAmount(table.pricePerHour ?? 5000)
    }
  }, [table])

  if (!table) return null

  const pricePerHour = table.pricePerHour ?? 0
  const estimateCost = mode === 'time' && pricePerHour > 0
    ? Math.round((hours + minutes / 60) * pricePerHour)
    : null
  const estimateDuration = mode === 'amount' && pricePerHour > 0 && amount > 0
    ? Math.round((amount / pricePerHour) * 60) // минуты
    : null

  const canSubmit =
    mode === 'unlimited' ||
    (mode === 'time' && (hours > 0 || minutes > 0)) ||
    (mode === 'amount' && amount > 0)

  const handleSubmit = () => {
    if (!canSubmit) return
    onConfirm(table, {
      mode,
      hours: mode === 'time' ? hours : undefined,
      minutes: mode === 'time' ? minutes : undefined,
      amount: mode === 'amount' ? amount : undefined,
    })
  }

  return (
    <Modal
      open={!!table}
      onClose={onClose}
      title={`Запустить «${table.name}»`}
      description={pricePerHour > 0 ? `Тариф: ${formatKzt(pricePerHour)} / час` : undefined}
      size="sm"
    >
      <div className="space-y-5 p-6">
        <div className="grid grid-cols-3 gap-2">
          <ModeButton
            active={mode === 'time'}
            onClick={() => setMode('time')}
            icon={<Clock size={16} />}
            label="По времени"
          />
          <ModeButton
            active={mode === 'amount'}
            onClick={() => setMode('amount')}
            icon={<DollarSign size={16} />}
            label="На сумму"
          />
          <ModeButton
            active={mode === 'unlimited'}
            onClick={() => setMode('unlimited')}
            icon={<InfinityIcon size={16} />}
            label="Бессрочно"
          />
        </div>

        {mode === 'time' && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Часы"
                type="number"
                min={0}
                max={24}
                value={hours}
                onChange={(e) => setHours(Math.max(0, Number(e.target.value) || 0))}
              />
              <Input
                label="Минуты"
                type="number"
                min={0}
                max={59}
                value={minutes}
                onChange={(e) => setMinutes(Math.max(0, Math.min(59, Number(e.target.value) || 0)))}
              />
            </div>
            {estimateCost !== null && estimateCost > 0 && (
              <div className="rounded-lg border border-emerald-400/20 bg-emerald-400/5 px-3 py-2 text-xs text-emerald-200">
                Примерная стоимость: <span className="font-semibold">{formatKzt(estimateCost)}</span>
              </div>
            )}
          </div>
        )}

        {mode === 'amount' && (
          <div className="space-y-3">
            <Input
              label="Сумма, ₸"
              type="number"
              min={0}
              step={500}
              value={amount}
              onChange={(e) => setAmount(Math.max(0, Number(e.target.value) || 0))}
            />
            <div className="flex flex-wrap gap-1.5">
              {[1000, 2000, 5000, 10000].map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setAmount(v)}
                  className="rounded-md border border-[var(--line)] bg-[var(--surface-card)] px-2.5 py-1 text-xs text-text-secondary hover:border-emerald-400/40 hover:text-emerald-200"
                >
                  {formatKzt(v)}
                </button>
              ))}
            </div>
            {estimateDuration !== null && estimateDuration > 0 && (
              <div className="rounded-lg border border-emerald-400/20 bg-emerald-400/5 px-3 py-2 text-xs text-emerald-200">
                Примерная длительность: <span className="font-semibold">~{Math.floor(estimateDuration / 60)} ч {estimateDuration % 60} мин</span>
              </div>
            )}
          </div>
        )}

        {mode === 'unlimited' && (
          <div className="rounded-lg border border-[var(--line)] bg-[var(--surface-card)] px-3 py-3 text-xs text-text-secondary">
            Сессия будет идти до ручной остановки. Тариф — {formatKzt(pricePerHour)} / час.
          </div>
        )}

        <div className="flex gap-2 pt-1">
          <Button variant="ghost" onClick={onClose} className="flex-1">Отмена</Button>
          <Button variant="primary" onClick={handleSubmit} disabled={!canSubmit} className="flex-1" leftIcon={<Play size={14} />}>
            Запустить
          </Button>
        </div>
      </div>
    </Modal>
  )
}

function ModeButton({ active, onClick, icon, label }: {
  active: boolean
  onClick: () => void
  icon: React.ReactNode
  label: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex flex-col items-center gap-1.5 rounded-xl border px-2 py-3 text-xs font-medium transition',
        active
          ? 'border-emerald-400/60 bg-emerald-400/10 text-emerald-200'
          : 'border-[var(--line)] bg-[var(--surface-card)] text-text-secondary hover:border-emerald-400/30 hover:text-text-primary',
      )}
    >
      {icon}
      <span>{label}</span>
    </button>
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
