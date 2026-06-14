import { useEffect, useMemo, useState } from 'react'
import {
  Coffee, ShoppingBag, TrendingUp, Calendar, ChevronLeft, ChevronRight,
  Filter, Download, Loader2, Hash,
} from 'lucide-react'
import type { ClubSessionRecordDto } from '@billiard/shared'
import { Button } from '@/components/ui/Button'
import { clubApi } from '@/api/club'
import { ApiException } from '@/api/client'
import { toast } from '@/components/ui/Toast'
import { cn } from '@/utils/cn'

/**
 * Дашборд бара: агрегация бар-заказов из сессий по выбранному периоду.
 * Бар-заказы приходят с десктопа в каждом ClubSessionRecord.barOrders[].
 */

type ViewMode = 'day' | 'week' | 'range' | 'all'

function dateToStr(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}
function strToDate(s: string): Date {
  if (!s || !s.includes('-')) return new Date()
  const [y, m, d] = s.split('-').map(Number)
  const parsed = new Date(y, m - 1, d)
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed
}
function formatKzt(n: number): string {
  return new Intl.NumberFormat('ru-RU').format(n) + ' ₸'
}
function formatDateLabel(s: string): string {
  return strToDate(s).toLocaleDateString('ru-RU', { weekday: 'short', day: 'numeric', month: 'long' })
}
function weekRangeOf(selectedDate: string): { from: string; to: string; label: string } {
  const sel = strToDate(selectedDate)
  const day = sel.getDay()
  const mondayOffset = day === 0 ? -6 : 1 - day
  const monday = new Date(sel)
  monday.setDate(sel.getDate() + mondayOffset)
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  const fmt = (d: Date) => d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })
  return { from: dateToStr(monday), to: dateToStr(sunday), label: `${fmt(monday)} — ${fmt(sunday)}` }
}

function csvCell(s: string): string {
  if (s.includes(';') || s.includes('"') || s.includes('\n')) return `"${s.replace(/"/g, '""')}"`
  return s
}
function downloadCsv(filename: string, header: string[], rows: string[][]): void {
  const all = [header, ...rows].map((r) => r.map(csvCell).join(';')).join('\r\n')
  const blob = new Blob(['﻿', all], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = filename
  document.body.appendChild(a); a.click(); a.remove()
  URL.revokeObjectURL(url)
}

interface ItemAgg {
  name: string
  quantity: number
  revenue: number
  /** Кол-во сессий, в которых был куплен этот товар. */
  sessions: number
  /** Средняя цена (revenue/quantity) — может отличаться от прайс-листа если бывали скидки. */
  avgPrice: number
}

export default function ClubBar() {
  const [viewMode, setViewMode] = useState<ViewMode>('day')
  const [selectedDate, setSelectedDate] = useState(dateToStr(new Date()))
  const [rangeStart, setRangeStart] = useState(dateToStr(new Date()))
  const [rangeEnd, setRangeEnd] = useState(dateToStr(new Date()))
  const [sessions, setSessions] = useState<ClubSessionRecordDto[] | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    const params = (() => {
      if (viewMode === 'day') return { date: selectedDate }
      if (viewMode === 'week') {
        const { from, to } = weekRangeOf(selectedDate)
        return { from, to }
      }
      if (viewMode === 'range') return { from: rangeStart, to: rangeEnd }
      const yearAgo = new Date()
      yearAgo.setDate(yearAgo.getDate() - 365)
      return { from: dateToStr(yearAgo), to: dateToStr(new Date()) }
    })()
    clubApi.sessions(params)
      .then((r) => setSessions(r.sessions))
      .catch((e) => { if (e instanceof ApiException) toast.error(e.message); setSessions([]) })
      .finally(() => setLoading(false))
  }, [viewMode, selectedDate, rangeStart, rangeEnd])

  // Агрегация: name → суммарное qty + revenue + sessions
  const items = useMemo<ItemAgg[]>(() => {
    const list = sessions ?? []
    const agg = new Map<string, { qty: number; revenue: number; sessions: Set<string> }>()
    for (const s of list) {
      if (!s.barOrders || s.barOrders.length === 0) continue
      for (const o of s.barOrders) {
        const prev = agg.get(o.menuItemName) ?? { qty: 0, revenue: 0, sessions: new Set<string>() }
        prev.qty += o.quantity
        prev.revenue += o.quantity * o.price
        prev.sessions.add(s.id)
        agg.set(o.menuItemName, prev)
      }
    }
    return Array.from(agg.entries())
      .map(([name, v]) => ({
        name,
        quantity: v.qty,
        revenue: v.revenue,
        sessions: v.sessions.size,
        avgPrice: v.qty > 0 ? Math.round(v.revenue / v.qty) : 0,
      }))
      .sort((a, b) => b.revenue - a.revenue)
  }, [sessions])

  const totals = useMemo(() => {
    const list = sessions ?? []
    const barRevenue = list.reduce((s, x) => s + (x.barCost || 0), 0)
    const tableRevenue = list.reduce((s, x) => s + (x.tableCost || 0), 0)
    const itemsCount = items.reduce((s, x) => s + x.quantity, 0)
    const sessionsWithBar = list.filter((s) => s.barCost > 0).length
    const share = (barRevenue + tableRevenue) > 0
      ? Math.round((barRevenue / (barRevenue + tableRevenue)) * 100)
      : 0
    return { barRevenue, itemsCount, sessionsWithBar, share }
  }, [sessions, items])

  const changeDate = (delta: number): void => {
    const d = strToDate(selectedDate)
    if (viewMode === 'week') d.setDate(d.getDate() + delta * 7)
    else d.setDate(d.getDate() + delta)
    setSelectedDate(dateToStr(d))
  }
  const periodLabel = (() => {
    if (viewMode === 'day') return formatDateLabel(selectedDate)
    if (viewMode === 'week') return weekRangeOf(selectedDate).label
    if (viewMode === 'range') return `${formatDateLabel(rangeStart)} — ${formatDateLabel(rangeEnd)}`
    return 'Всё время'
  })()

  const exportCsv = (): void => {
    const header = ['Товар', 'Продано (шт)', 'Сессий', 'Средняя цена (₸)', 'Выручка (₸)']
    const rows = items.map((it) => [it.name, String(it.quantity), String(it.sessions), String(it.avgPrice), String(it.revenue)])
    rows.push([], ['Всего товаров', String(totals.itemsCount)])
    rows.push(['Выручка бар', String(totals.barRevenue)])
    const now = new Date()
    const ts = `${dateToStr(now)}_${now.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }).replace(':', '-')}`
    downloadCsv(`бар_${viewMode}_${ts}.csv`, header, rows)
  }

  const maxRevenue = Math.max(1, ...items.map((it) => it.revenue))

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Coffee size={22} className="text-amber-400" />
          <h2 className="text-xl font-bold text-text-primary sm:text-2xl">Бар</h2>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex gap-1 rounded-2xl border border-[var(--line)] bg-[var(--surface-card)] p-1">
            {(['day', 'week', 'range', 'all'] as const).map((m) => (
              <TabBtn key={m} active={viewMode === m} onClick={() => setViewMode(m)}>
                {m === 'day' ? 'День' : m === 'week' ? 'Неделя' : m === 'range' ? (
                  <span className="inline-flex items-center gap-1"><Filter size={13} /> Диапазон</span>
                ) : 'Всё время'}
              </TabBtn>
            ))}
          </div>
          <Button variant="secondary" size="sm" leftIcon={<Download size={14} />} onClick={exportCsv} disabled={items.length === 0}>
            Экспорт
          </Button>
        </div>
      </div>

      {/* Навигация по датам */}
      {(viewMode === 'day' || viewMode === 'week') && (
        <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-[var(--line)] bg-[var(--surface-card)] p-2 sm:p-3">
          <button onClick={() => changeDate(-1)} className="ring-focus rounded-xl border border-[var(--line)] p-2 text-text-secondary hover:bg-[var(--surface-card-hover)]" aria-label="Назад">
            <ChevronLeft size={18} />
          </button>
          <div className="inline-flex flex-1 items-center gap-2 px-3 text-sm font-medium text-text-primary sm:text-base">
            <Calendar size={16} className="text-amber-400" />
            <span className="truncate">{periodLabel}</span>
          </div>
          <button onClick={() => changeDate(1)} className="ring-focus rounded-xl border border-[var(--line)] p-2 text-text-secondary hover:bg-[var(--surface-card-hover)]" aria-label="Вперёд">
            <ChevronRight size={18} />
          </button>
          <Button variant="ghost" size="sm" onClick={() => setSelectedDate(dateToStr(new Date()))}>Сегодня</Button>
        </div>
      )}

      {viewMode === 'range' && (
        <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-[var(--line)] bg-[var(--surface-card)] p-3">
          <DateInput label="С" value={rangeStart} onChange={setRangeStart} />
          <DateInput label="По" value={rangeEnd} onChange={setRangeEnd} />
          <Button variant="ghost" size="sm" onClick={() => {
            const today = dateToStr(new Date())
            const d = new Date(); d.setDate(d.getDate() - 7)
            setRangeStart(dateToStr(d)); setRangeEnd(today)
          }}>7 дней</Button>
          <Button variant="ghost" size="sm" onClick={() => {
            const today = dateToStr(new Date())
            const d = new Date(); d.setDate(d.getDate() - 30)
            setRangeStart(dateToStr(d)); setRangeEnd(today)
          }}>30 дней</Button>
        </div>
      )}

      {/* Сводные карточки */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard icon={<Coffee size={20} />} color="amber" label="Выручка бар" value={formatKzt(totals.barRevenue)} />
        <StatCard icon={<Hash size={20} />} color="emerald" label="Товаров продано" value={String(totals.itemsCount)} />
        <StatCard icon={<ShoppingBag size={20} />} color="blue" label="Сессий с баром" value={String(totals.sessionsWithBar)} />
        <StatCard icon={<TrendingUp size={20} />} color="violet" label="Доля бара" value={`${totals.share}%`} />
      </div>

      {/* Топ позиций */}
      <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface-card)] p-4 backdrop-blur-md sm:p-5">
        <h3 className="mb-4 text-sm font-semibold text-text-primary sm:text-base">Топ позиций</h3>
        {loading ? (
          <SkeletonBlock />
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-12 text-center">
            <Coffee size={42} className="text-text-muted/40" />
            <p className="text-sm text-text-secondary">Нет продаж за выбранный период</p>
            <p className="text-xs text-text-muted">
              Бар-позиции появляются здесь когда desktop отправит завершённые сессии с детализацией бара.
            </p>
          </div>
        ) : (
          <>
            <div className="mb-5 space-y-2.5">
              {items.slice(0, 5).map((it) => (
                <div key={it.name} className="grid grid-cols-[120px_1fr_auto] items-center gap-3 sm:grid-cols-[160px_1fr_auto]">
                  <div className="truncate text-sm font-medium text-text-secondary">{it.name}</div>
                  <div className="h-2 overflow-hidden rounded-full bg-[var(--surface-input)]">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-amber-500 to-amber-300 transition-[width]"
                      style={{ width: `${(it.revenue / maxRevenue) * 100}%` }}
                    />
                  </div>
                  <div className="whitespace-nowrap text-sm font-semibold tabular-nums text-amber-300">
                    {formatKzt(it.revenue)}
                  </div>
                </div>
              ))}
            </div>

            <div className="overflow-x-auto rounded-xl border border-[var(--line)]">
              <table className="w-full text-sm">
                <thead className="bg-[var(--surface-input)]/40">
                  <tr className="text-left text-[11px] uppercase tracking-wider text-text-muted">
                    <Th>#</Th>
                    <Th>Товар</Th>
                    <Th right>Продано</Th>
                    <Th right>Сессий</Th>
                    <Th right>Сред. цена</Th>
                    <Th right>Выручка</Th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((it, i) => (
                    <tr key={it.name} className="border-t border-[var(--line)] hover:bg-[var(--surface-card-hover)]">
                      <Td className="text-text-muted">{i + 1}</Td>
                      <Td className="font-medium text-text-primary">{it.name}</Td>
                      <Td right className="tabular-nums">{it.quantity}</Td>
                      <Td right className="text-text-muted tabular-nums">{it.sessions}</Td>
                      <Td right className="text-text-secondary tabular-nums">{formatKzt(it.avgPrice)}</Td>
                      <Td right className="font-bold tabular-nums text-amber-300">{formatKzt(it.revenue)}</Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* Подсказка если есть выручка но нет детализации */}
      {!loading && items.length === 0 && totals.barRevenue > 0 && (
        <div className="rounded-2xl border border-amber-400/30 bg-amber-400/[0.06] p-4 text-sm">
          <div className="font-semibold text-amber-200">Есть выручка по бару, но нет детализации</div>
          <div className="mt-1 text-xs text-amber-100/80">
            За период выручка бара {formatKzt(totals.barRevenue)}, но позиции не присланы. Это значит,
            что сессии были завершены на старой версии desktop'а (до миграции <code>barOrders</code>).
            Новые сессии будут отображаться с полной детализацией.
          </div>
        </div>
      )}
    </div>
  )
}

// ===== UI helpers =====
function TabBtn({ active, children, onClick }: { active: boolean; children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'ring-focus rounded-xl px-3 py-1.5 text-sm font-medium transition sm:px-4 sm:py-2',
        active ? 'bg-amber-400 text-bg-primary' : 'text-text-secondary hover:text-text-primary',
      )}
    >
      {children}
    </button>
  )
}

function DateInput({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="inline-flex items-center gap-2">
      <span className="text-xs text-text-muted">{label}</span>
      <input
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="ring-focus rounded-lg border border-[var(--line)] bg-[var(--surface-input)] px-2 py-1 text-sm text-text-primary"
      />
    </label>
  )
}

const colorMap: Record<string, string> = {
  amber: 'from-amber-500/15 to-amber-500/5 text-amber-300',
  emerald: 'from-emerald-500/15 to-emerald-500/5 text-emerald-300',
  blue: 'from-blue-500/15 to-blue-500/5 text-blue-300',
  violet: 'from-violet-500/15 to-violet-500/5 text-violet-300',
}
function StatCard({ icon, color, label, value }: { icon: React.ReactNode; color: keyof typeof colorMap; label: string; value: string }) {
  return (
    <div className={cn(
      'rounded-2xl border border-[var(--line)] bg-gradient-to-br p-3.5 backdrop-blur-md sm:p-4',
      colorMap[color],
    )}>
      <div className="flex items-center gap-2">
        <div className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-bg-primary/40">{icon}</div>
        <div className="text-[10px] uppercase tracking-wider text-text-muted sm:text-[11px]">{label}</div>
      </div>
      <div className="mt-2 text-lg font-bold tabular-nums text-text-primary sm:text-xl">{value}</div>
    </div>
  )
}

function Th({ children, right }: { children?: React.ReactNode; right?: boolean }) {
  return <th className={cn('px-3 py-2.5', right && 'text-right')}>{children}</th>
}
function Td({ children, right, className }: { children?: React.ReactNode; right?: boolean; className?: string }) {
  return <td className={cn('px-3 py-2.5 align-middle', right && 'text-right', className)}>{children}</td>
}
function SkeletonBlock() {
  return (
    <div className="flex items-center justify-center py-10">
      <Loader2 className="animate-spin text-text-muted" size={28} />
    </div>
  )
}
