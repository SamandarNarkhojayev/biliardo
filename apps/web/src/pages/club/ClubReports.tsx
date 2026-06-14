import React, { useEffect, useMemo, useState } from 'react'
import {
  BarChart3, Calendar, DollarSign, Clock, TrendingUp, Users, ShoppingBag,
  ChevronLeft, ChevronRight, Filter, Download, Loader2, Briefcase, ChevronDown, Coffee, Tag,
} from 'lucide-react'
import type { ClubSessionRecordDto, ClubShiftDto } from '@billiard/shared'
import { Button } from '@/components/ui/Button'
import { clubApi } from '@/api/club'
import { ApiException } from '@/api/client'
import { toast } from '@/components/ui/Toast'
import { cn } from '@/utils/cn'

/**
 * Web-версия дашборда отчётов клуба: дизайн полностью повторяет ReportsPage из
 * bill_front (desktop). 5 режимов выборки, 6 карточек статистики, диаграмма по
 * столам + загрузка по часам, история игр с фильтрами и CSV-экспорт.
 */

type ViewMode = 'day' | 'shift' | 'week' | 'range' | 'all'
type AmountSort = 'default' | 'max' | 'min'
type TimeSort = 'default' | 'max' | 'min'
type ModeFilter = 'all' | 'time' | 'amount' | 'unlimited' | 'tariff'

// ===== Утилиты =====
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
function safeNum(n: unknown, fallback = 0): number {
  return typeof n === 'number' && Number.isFinite(n) ? n : fallback
}
function formatKzt(n: number): string {
  return new Intl.NumberFormat('ru-RU').format(n) + ' ₸'
}
function formatTime(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
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

function downloadCsv(filename: string, header: string[], rows: string[][]): void {
  const all = [header, ...rows].map((r) => r.map(csvCell).join(';')).join('\r\n')
  const blob = new Blob(['﻿', all], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}
function csvCell(s: string): string {
  if (s.includes(';') || s.includes('"') || s.includes('\n')) return `"${s.replace(/"/g, '""')}"`
  return s
}

function modeLabel(s: ClubSessionRecordDto): string {
  if (s.tariffName) return `Тариф: ${s.tariffName}`
  if (s.mode === 'time') return 'По времени'
  if (s.mode === 'amount') return 'На сумму'
  return 'Бессрочно'
}

function fmtDateTime(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
}
function shiftDurationLabel(s: ClubShiftDto): string {
  const end = s.endTime ? new Date(s.endTime).getTime() : Date.now()
  const start = new Date(s.startTime).getTime()
  const min = Math.max(0, Math.floor((end - start) / 60000))
  const h = Math.floor(min / 60)
  return h > 0 ? `${h}ч ${min % 60}м` : `${min}м`
}

// ===== Главный компонент =====
export default function ClubReports() {
  const [viewMode, setViewMode] = useState<ViewMode>('day')
  const [selectedDate, setSelectedDate] = useState(dateToStr(new Date()))
  const [rangeStart, setRangeStart] = useState(dateToStr(new Date()))
  const [rangeEnd, setRangeEnd] = useState(dateToStr(new Date()))

  const [sessions, setSessions] = useState<ClubSessionRecordDto[] | null>(null)
  const [shifts, setShifts] = useState<ClubShiftDto[] | null>(null)
  const [selectedShiftId, setSelectedShiftId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const [showFilters, setShowFilters] = useState(false)
  const [tableFilter, setTableFilter] = useState<string>('all')
  const [modeFilter, setModeFilter] = useState<ModeFilter>('all')
  const [amountSort, setAmountSort] = useState<AmountSort>('default')
  const [timeSort, setTimeSort] = useState<TimeSort>('default')
  const [expandedSessionId, setExpandedSessionId] = useState<string | null>(null)

  // Подгружаем список смен один раз — нужен для вкладки «За смену».
  useEffect(() => {
    clubApi.shifts()
      .then((r) => setShifts(r.shifts))
      .catch(() => setShifts([]))
  }, [])

  // Подгружаем сессии при смене режима/даты/диапазона/смены
  useEffect(() => {
    setLoading(true)
    const params = (() => {
      if (viewMode === 'day') return { date: selectedDate }
      if (viewMode === 'shift') {
        if (!selectedShiftId) return { date: dateToStr(new Date()) } // пусто пока не выбрана смена
        return { shiftId: selectedShiftId }
      }
      if (viewMode === 'week') {
        const { from, to } = weekRangeOf(selectedDate)
        return { from, to }
      }
      if (viewMode === 'range') return { from: rangeStart, to: rangeEnd }
      // all — последние ~365 дней (на проде можно убрать ограничение)
      const yearAgo = new Date()
      yearAgo.setDate(yearAgo.getDate() - 365)
      return { from: dateToStr(yearAgo), to: dateToStr(new Date()) }
    })()
    if (viewMode === 'shift' && !selectedShiftId) {
      setSessions([])
      setLoading(false)
      return
    }
    clubApi.sessions(params)
      .then((r) => setSessions(r.sessions))
      .catch((e) => { if (e instanceof ApiException) toast.error(e.message); setSessions([]) })
      .finally(() => setLoading(false))
  }, [viewMode, selectedDate, rangeStart, rangeEnd, selectedShiftId])

  // Статистика
  const stats = useMemo(() => {
    const list = sessions ?? []
    const tableRev = list.reduce((sum, s) => sum + safeNum(s.tableCost), 0)
    const barRev = list.reduce((sum, s) => sum + safeNum(s.barCost), 0)
    const totalRev = tableRev + barRev
    const totalDurMin = list.reduce((sum, s) => sum + safeNum(s.duration), 0)
    const avgSession = list.length > 0 ? Math.round(totalDurMin / list.length) : 0
    const avgCheck = list.length > 0 ? Math.round(totalRev / list.length) : 0
    const totalHours = totalDurMin / 60
    // По столам
    const byTable: Record<string, { sessions: number; revenue: number; hours: number }> = {}
    for (const s of list) {
      if (!byTable[s.tableName]) byTable[s.tableName] = { sessions: 0, revenue: 0, hours: 0 }
      byTable[s.tableName].sessions++
      byTable[s.tableName].revenue += safeNum(s.totalCost, safeNum(s.tableCost) + safeNum(s.barCost))
      byTable[s.tableName].hours += safeNum(s.duration) / 60
    }
    // По часам
    const byHour = new Array(24).fill(0) as number[]
    for (const s of list) {
      const start = new Date(s.startTime)
      if (Number.isNaN(start.getTime())) continue
      const h = start.getHours()
      if (h >= 0 && h < 24) byHour[h]++
    }
    return { tableRev, barRev, totalRev, totalHours, avgSession, avgCheck, byTable, byHour, count: list.length }
  }, [sessions])

  // Список столов для фильтра
  const tableNames = useMemo(() => {
    return Array.from(new Set((sessions ?? []).map((s) => s.tableName))).sort((a, b) => a.localeCompare(b, 'ru'))
  }, [sessions])

  // Отсортированный/отфильтрованный список для таблицы
  const historySessions = useMemo(() => {
    let list = (sessions ?? []).slice()
    if (tableFilter !== 'all') list = list.filter((s) => s.tableName === tableFilter)
    if (modeFilter === 'tariff') list = list.filter((s) => Boolean(s.tariffName))
    else if (modeFilter !== 'all') list = list.filter((s) => s.mode === modeFilter && !s.tariffName)
    if (amountSort === 'max') list.sort((a, b) => safeNum(b.totalCost) - safeNum(a.totalCost))
    if (amountSort === 'min') list.sort((a, b) => safeNum(a.totalCost) - safeNum(b.totalCost))
    if (timeSort === 'max') list.sort((a, b) => safeNum(b.duration) - safeNum(a.duration))
    if (timeSort === 'min') list.sort((a, b) => safeNum(a.duration) - safeNum(b.duration))
    if (amountSort === 'default' && timeSort === 'default') {
      // По умолчанию — свежие сверху
      list.sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())
    }
    return list
  }, [sessions, tableFilter, modeFilter, amountSort, timeSort])

  const selectedShift = useMemo(
    () => shifts?.find((s) => s.externalId === selectedShiftId) ?? null,
    [shifts, selectedShiftId],
  )

  const resetFilters = (): void => {
    setTableFilter('all')
    setModeFilter('all')
    setAmountSort('default')
    setTimeSort('default')
  }

  const maxByHour = Math.max(...stats.byHour, 1)

  // ===== Навигация по датам =====
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
    if (viewMode === 'shift') {
      if (!selectedShift) return 'Смена не выбрана'
      return `${selectedShift.operatorName} · ${fmtDateTime(selectedShift.startTime)}${selectedShift.endTime ? ` — ${fmtDateTime(selectedShift.endTime)}` : ' (активна)'}`
    }
    return 'Всё время'
  })()

  // ===== Экспорт =====
  const exportReport = (): void => {
    const header = ['Стол', 'Режим', 'Начало', 'Конец', 'Время (мин)', 'Стол (₸)', 'Бар (₸)', 'Итого (₸)']
    const rows = historySessions.map((s) => [
      s.tableName, modeLabel(s), formatTime(s.startTime), formatTime(s.endTime),
      String(s.duration), String(s.tableCost), String(s.barCost), String(s.totalCost),
    ])
    rows.push([], ['Всего игр', String(stats.count)])
    rows.push(['Выручка столы', String(stats.tableRev)])
    rows.push(['Выручка бар', String(stats.barRev)])
    rows.push(['Общая выручка', String(stats.totalRev)])
    const now = new Date()
    const ts = `${dateToStr(now)}_${now.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }).replace(':', '-')}`
    downloadCsv(`отчёт_${viewMode}_${ts}.csv`, header, rows)
  }

  const filtersActive = tableFilter !== 'all' || modeFilter !== 'all' || amountSort !== 'default' || timeSort !== 'default'

  return (
    <div className="space-y-5">
      {/* Шапка: вкладки + экспорт */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <BarChart3 size={22} className="text-violet-400" />
          <h2 className="text-xl font-bold text-text-primary sm:text-2xl">Отчёты</h2>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex gap-1 rounded-2xl border border-[var(--line)] bg-[var(--surface-card)] p-1">
            {(['day', 'shift', 'week', 'range', 'all'] as const).map((m) => (
              <TabBtn key={m} active={viewMode === m} onClick={() => { setViewMode(m); if (m === 'shift') setSelectedShiftId(null) }}>
                {m === 'day' ? 'День'
                  : m === 'shift' ? <span className="inline-flex items-center gap-1"><Briefcase size={13} /> За смену</span>
                  : m === 'week' ? 'Неделя'
                  : m === 'range' ? <span className="inline-flex items-center gap-1"><Filter size={13} /> Диапазон</span>
                  : 'Всё время'}
              </TabBtn>
            ))}
          </div>
          <Button
            variant="secondary"
            size="sm"
            leftIcon={<Download size={14} />}
            onClick={exportReport}
            disabled={historySessions.length === 0}
          >
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
            <Calendar size={16} className="text-emerald-400" />
            <span className="truncate">{periodLabel}</span>
          </div>
          <button onClick={() => changeDate(1)} className="ring-focus rounded-xl border border-[var(--line)] p-2 text-text-secondary hover:bg-[var(--surface-card-hover)]" aria-label="Вперёд">
            <ChevronRight size={18} />
          </button>
          <Button variant="ghost" size="sm" onClick={() => setSelectedDate(dateToStr(new Date()))}>
            Сегодня
          </Button>
        </div>
      )}

      {viewMode === 'shift' && (
        <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface-card)] p-3 sm:p-4">
          <div className="mb-2 text-[11px] uppercase tracking-wider text-text-muted">Выбери смену</div>
          {shifts === null ? (
            <Loader2 className="animate-spin text-text-muted" size={20} />
          ) : shifts.length === 0 ? (
            <div className="text-sm text-text-muted">
              Смен пока нет. Открой смену в desktop-приложении и она появится здесь.
            </div>
          ) : (
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {shifts.map((sh) => (
                <button
                  key={sh.id}
                  onClick={() => setSelectedShiftId(sh.externalId)}
                  className={cn(
                    'ring-focus flex flex-col items-start gap-1.5 rounded-xl border p-3 text-left transition',
                    selectedShiftId === sh.externalId
                      ? 'border-emerald-400/60 bg-emerald-400/[0.08]'
                      : 'border-[var(--line)] hover:bg-[var(--surface-card-hover)]',
                  )}
                >
                  <div className="flex w-full items-center justify-between">
                    <div className="flex items-center gap-1.5 text-sm font-semibold text-text-primary">
                      <Briefcase size={14} className="text-emerald-300" />
                      {sh.operatorName}
                    </div>
                    {sh.isActive && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-medium text-emerald-300">
                        <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" /> активна
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-text-muted">
                    {fmtDateTime(sh.startTime)}{sh.endTime ? ` — ${fmtDateTime(sh.endTime)}` : ''}
                  </div>
                  <div className="text-xs text-text-secondary">
                    Длительность: <span className="tabular-nums">{shiftDurationLabel(sh)}</span> · игр: {sh.sessionsCount} · выручка: <span className="tabular-nums text-emerald-300">{formatKzt(sh.totalRevenue)}</span>
                  </div>
                </button>
              ))}
            </div>
          )}
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

      {/* Карточки статистики (6 шт., как в desktop) */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <StatCard icon={<DollarSign size={20} />} color="emerald" label="Общая выручка" value={formatKzt(stats.totalRev)} />
        <StatCard icon={<Clock size={20} />} color="green" label="Столы" value={formatKzt(stats.tableRev)} />
        <StatCard icon={<ShoppingBag size={20} />} color="amber" label="Бар" value={formatKzt(stats.barRev)} />
        <StatCard icon={<Users size={20} />} color="blue" label="Игр" value={String(stats.count)} />
        <StatCard icon={<TrendingUp size={20} />} color="violet" label="Средний счёт" value={formatKzt(stats.avgCheck)} />
        <StatCard icon={<Clock size={20} />} color="sky" label="Среднее время" value={`${stats.avgSession} мин`} />
      </div>

      {/* Графики (две колонки на desktop) */}
      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard title="Выручка по столам">
          {Object.keys(stats.byTable).length === 0 ? (
            <p className="py-8 text-center text-sm text-text-muted">Нет данных за период</p>
          ) : (
            <div className="space-y-3">
              {Object.entries(stats.byTable)
                .sort(([, a], [, b]) => b.revenue - a.revenue)
                .map(([name, data]) => (
                  <div key={name} className="grid grid-cols-[110px_1fr_auto] items-center gap-3 sm:grid-cols-[140px_1fr_auto]">
                    <div className="truncate text-sm font-medium text-text-secondary">{name}</div>
                    <div className="h-2 overflow-hidden rounded-full bg-[var(--surface-input)]">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-300 transition-[width]"
                        style={{ width: `${stats.totalRev > 0 ? (data.revenue / stats.totalRev) * 100 : 0}%` }}
                      />
                    </div>
                    <div className="whitespace-nowrap text-sm font-semibold tabular-nums text-emerald-300">
                      {formatKzt(data.revenue)}
                    </div>
                  </div>
                ))}
            </div>
          )}
        </ChartCard>

        <ChartCard title="Загрузка по часам">
          <div className="flex h-44 items-end gap-1 sm:gap-1.5">
            {stats.byHour.map((count, hour) => (
              <div key={hour} className="flex flex-1 flex-col items-center gap-1">
                <div className="relative flex h-full w-full items-end">
                  <div
                    className={cn(
                      'w-full rounded-t bg-gradient-to-t from-violet-600 to-violet-400 transition-all',
                      count === 0 && 'opacity-15',
                    )}
                    style={{ height: `${(count / maxByHour) * 100}%`, minHeight: count > 0 ? 4 : 1 }}
                    title={`${hour}:00 — ${count} сессий`}
                  />
                </div>
                <span className="text-[9px] text-text-muted sm:text-[10px]">
                  {hour % 3 === 0 ? hour : ''}
                </span>
              </div>
            ))}
          </div>
        </ChartCard>
      </div>

      {/* История игр + фильтры */}
      <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface-card)] p-4 sm:p-5">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-sm font-semibold text-text-primary sm:text-base">История игр</h3>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" leftIcon={<Filter size={13} />} onClick={() => setShowFilters((v) => !v)}>
              Фильтр{filtersActive ? ' •' : ''}
            </Button>
            {filtersActive && (
              <Button variant="ghost" size="sm" onClick={resetFilters}>Сбросить</Button>
            )}
          </div>
        </div>

        {showFilters && (
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <Select value={tableFilter} onChange={setTableFilter}>
              <option value="all">Все столы</option>
              {tableNames.map((n) => <option key={n} value={n}>{n}</option>)}
            </Select>
            <Select value={amountSort} onChange={(v) => setAmountSort(v as AmountSort)}>
              <option value="default">Сумма: по умолчанию</option>
              <option value="max">Сумма: максимальная</option>
              <option value="min">Сумма: минимальная</option>
            </Select>
            <Select value={timeSort} onChange={(v) => setTimeSort(v as TimeSort)}>
              <option value="default">Время: по умолчанию</option>
              <option value="max">Время: максимальное</option>
              <option value="min">Время: минимальное</option>
            </Select>
            <div className="inline-flex gap-1 rounded-lg border border-[var(--line)] p-1">
              <ModeBtn active={modeFilter === 'tariff'} onClick={() => setModeFilter(modeFilter === 'tariff' ? 'all' : 'tariff')}>Тариф</ModeBtn>
              <ModeBtn active={modeFilter === 'time'} onClick={() => setModeFilter(modeFilter === 'time' ? 'all' : 'time')}>Время</ModeBtn>
              <ModeBtn active={modeFilter === 'amount'} onClick={() => setModeFilter(modeFilter === 'amount' ? 'all' : 'amount')}>На сумму</ModeBtn>
              <ModeBtn active={modeFilter === 'unlimited'} onClick={() => setModeFilter(modeFilter === 'unlimited' ? 'all' : 'unlimited')}>Бессрочно</ModeBtn>
            </div>
          </div>
        )}

        {loading ? (
          <SkeletonBlock />
        ) : historySessions.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-12 text-center">
            <BarChart3 size={42} className="text-text-muted/40" />
            <p className="text-sm text-text-secondary">Нет записей по выбранным фильтрам</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-[var(--line)]">
            <table className="w-full text-sm">
              <thead className="bg-[var(--surface-input)]/40">
                <tr className="text-left text-[11px] uppercase tracking-wider text-text-muted">
                  <Th />
                  <Th>Стол</Th>
                  <Th>Режим</Th>
                  <Th>Начало</Th>
                  <Th>Конец</Th>
                  <Th right>Время</Th>
                  <Th right>Стол</Th>
                  <Th right>Бар</Th>
                  <Th right>Итого</Th>
                </tr>
              </thead>
              <tbody>
                {historySessions.map((s) => {
                  const hasBarDetail = (s.barOrders && s.barOrders.length > 0) || s.barCost > 0
                  const isExpanded = expandedSessionId === s.id
                  return (
                    <React.Fragment key={s.id}>
                      <tr
                        onClick={() => hasBarDetail && setExpandedSessionId(isExpanded ? null : s.id)}
                        className={cn(
                          'border-t border-[var(--line)]',
                          hasBarDetail ? 'cursor-pointer hover:bg-[var(--surface-card-hover)]' : '',
                          isExpanded && 'bg-[var(--surface-card-hover)]',
                        )}
                      >
                        <Td className="w-8 text-text-muted">
                          {hasBarDetail ? (
                            <ChevronDown size={14} className={cn('transition-transform', isExpanded && 'rotate-180')} />
                          ) : null}
                        </Td>
                        <Td className="font-medium text-text-primary">{s.tableName}</Td>
                        <Td>
                          {s.tariffName ? (
                            <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/15 px-2 py-0.5 text-[11px] font-medium text-emerald-200">
                              <Tag size={10} /> {s.tariffName}
                            </span>
                          ) : (
                            <span className="text-text-muted">{modeLabel(s)}</span>
                          )}
                        </Td>
                        <Td>{formatTime(s.startTime)}</Td>
                        <Td>{formatTime(s.endTime)}</Td>
                        <Td right>{s.duration} мин</Td>
                        <Td right className="text-emerald-400">{formatKzt(s.tableCost)}</Td>
                        <Td right className="text-amber-400">{formatKzt(s.barCost)}</Td>
                        <Td right className="font-bold tabular-nums">{formatKzt(s.totalCost)}</Td>
                      </tr>
                      {isExpanded && hasBarDetail && (
                        <tr className="border-t border-[var(--line)] bg-[var(--surface-input)]/30">
                          <Td />
                          <td colSpan={8} className="px-3 py-3">
                            <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-amber-300/80">
                              <Coffee size={12} /> Бар по этой сессии
                            </div>
                            {s.barOrders && s.barOrders.length > 0 ? (
                              <div className="mt-2 grid gap-1.5 sm:grid-cols-2">
                                {s.barOrders.map((o, i) => (
                                  <div key={i} className="flex items-center justify-between rounded-md border border-[var(--line)] bg-[var(--surface-card)] px-2.5 py-1.5 text-xs">
                                    <span className="text-text-primary">{o.menuItemName}</span>
                                    <span className="tabular-nums text-text-secondary">
                                      {o.quantity} × {formatKzt(o.price)} = <span className="font-semibold text-amber-300">{formatKzt(o.price * o.quantity)}</span>
                                    </span>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="mt-1 text-xs text-text-muted italic">
                                Детализация позиций недоступна (старая запись). Итог по бару: {formatKzt(s.barCost)}
                              </div>
                            )}
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

// ===== UI-helpers =====
function TabBtn({ active, children, onClick }: { active: boolean; children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'ring-focus rounded-xl px-3 py-1.5 text-sm font-medium transition sm:px-4 sm:py-2',
        active ? 'bg-emerald-400 text-bg-primary' : 'text-text-secondary hover:text-text-primary',
      )}
    >
      {children}
    </button>
  )
}

function ModeBtn({ active, children, onClick }: { active: boolean; children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'ring-focus rounded-md px-3 py-1 text-xs font-medium transition',
        active ? 'bg-emerald-400 text-bg-primary' : 'text-text-secondary hover:text-text-primary',
      )}
    >
      {children}
    </button>
  )
}

function Select({ value, onChange, children }: { value: string; onChange: (v: string) => void; children: React.ReactNode }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="ring-focus rounded-lg border border-[var(--line)] bg-[var(--surface-input)] px-3 py-1.5 text-sm text-text-primary"
    >
      {children}
    </select>
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
  emerald: 'from-emerald-500/15 to-emerald-500/5 text-emerald-300',
  green: 'from-green-500/15 to-green-500/5 text-green-300',
  amber: 'from-amber-500/15 to-amber-500/5 text-amber-300',
  blue: 'from-blue-500/15 to-blue-500/5 text-blue-300',
  violet: 'from-violet-500/15 to-violet-500/5 text-violet-300',
  sky: 'from-sky-500/15 to-sky-500/5 text-sky-300',
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

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface-card)] p-4 backdrop-blur-md sm:p-5">
      <h3 className="mb-3 text-sm font-semibold text-text-primary sm:text-base">{title}</h3>
      {children}
    </div>
  )
}

function Th({ children, right }: { children?: React.ReactNode; right?: boolean }) {
  return <th className={cn('px-3 py-2.5', right && 'text-right')}>{children}</th>
}
function Td({ children, right, className }: { children?: React.ReactNode; right?: boolean; className?: string }) {
  return <td className={cn('px-3 py-2.5 align-middle', right && 'text-right tabular-nums', className)}>{children}</td>
}
function SkeletonBlock() {
  return (
    <div className="flex items-center justify-center py-10">
      <Loader2 className="animate-spin text-text-muted" size={28} />
    </div>
  )
}
