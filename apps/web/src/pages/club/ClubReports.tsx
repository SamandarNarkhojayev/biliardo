import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Download, Loader2 } from 'lucide-react'
import { ResponsiveContainer, AreaChart, Area, CartesianGrid, XAxis, YAxis, Tooltip } from 'recharts'
import type { ClubSessionRecordDto, ClubSessionsSummaryRow } from '@billiard/shared'
import { Button } from '@/components/ui/Button'
import { clubApi } from '@/api/club'
import { ApiException } from '@/api/client'
import { toast } from '@/components/ui/Toast'
import { cn } from '@/utils/cn'

type Tab = 'today' | 'days' | 'months'

function formatKzt(n: number): string {
  return new Intl.NumberFormat('ru-RU').format(n) + ' ₸'
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10)
}

function daysAgoIso(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() - days)
  return d.toISOString().slice(0, 10)
}

function downloadCsv(filename: string, rows: string[][]): void {
  const csv = rows.map((r) => r.map(csvCell).join(',')).join('\r\n')
  // BOM для Excel под Windows
  const blob = new Blob(['﻿', csv], { type: 'text/csv;charset=utf-8;' })
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
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return `"${s.replace(/"/g, '""')}"`
  }
  return s
}

export default function ClubReports() {
  const { t } = useTranslation()
  const [tab, setTab] = useState<Tab>('today')

  return (
    <div className="space-y-5">
      <div className="inline-flex gap-1 rounded-2xl border border-[var(--line)] bg-[var(--surface-card)] p-1">
        {(['today', 'days', 'months'] as const).map((tk) => (
          <button
            key={tk}
            type="button"
            onClick={() => setTab(tk)}
            className={cn(
              'ring-focus rounded-xl px-4 py-2 text-sm font-medium transition',
              tab === tk
                ? 'bg-emerald-400 text-bg-primary'
                : 'text-text-secondary hover:text-text-primary',
            )}
          >
            {t(`club.reports.tab_${tk}`)}
          </button>
        ))}
      </div>

      {tab === 'today' && <TodayTab />}
      {tab === 'days' && <RangeTab groupBy="day" />}
      {tab === 'months' && <RangeTab groupBy="month" />}
    </div>
  )
}

function TodayTab() {
  const { t, i18n } = useTranslation()
  const [data, setData] = useState<{ sessions: ClubSessionRecordDto[]; totals: { table: number; bar: number; total: number; count: number } } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    clubApi.sessions({ date: todayIso() })
      .then(setData)
      .catch((e) => {
        if (e instanceof ApiException) toast.error(e.message)
      })
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <SkeletonBlock />
  if (!data) return null

  const locale = i18n.language === 'ru' ? 'ru-RU' : 'kk-KZ'
  const fmtTime = (iso: string): string => new Date(iso).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })

  function exportCsv(): void {
    if (!data) return
    const header = ['#', t('club.reports.col_table'), t('club.reports.col_start'), t('club.reports.col_end'),
      t('club.reports.col_duration'), t('club.reports.col_mode'), t('club.reports.col_table_kzt'),
      t('club.reports.col_bar_kzt'), t('club.reports.col_total_kzt')]
    const rows = data.sessions.map((s, i) => [
      String(i + 1), s.tableName, fmtTime(s.startTime), fmtTime(s.endTime),
      `${s.duration}`, s.mode, String(s.tableCost), String(s.barCost), String(s.totalCost),
    ])
    rows.push(['', '', '', '', '', t('club.reports.total'),
      String(data.totals.table), String(data.totals.bar), String(data.totals.total)])
    downloadCsv(`sessions-${todayIso()}.csv`, [header, ...rows])
  }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label={t('club.reports.metric_table')} value={formatKzt(data.totals.table)} />
        <Stat label={t('club.reports.metric_bar')} value={formatKzt(data.totals.bar)} />
        <Stat label={t('club.reports.metric_total')} value={formatKzt(data.totals.total)} />
        <Stat label={t('club.reports.metric_count')} value={data.totals.count} />
      </div>

      <div className="flex justify-end">
        <Button variant="secondary" size="sm" leftIcon={<Download size={14} />} onClick={exportCsv} disabled={data.sessions.length === 0}>
          {t('club.reports.export_csv')}
        </Button>
      </div>

      {data.sessions.length === 0 ? (
        <EmptyHint />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-[var(--line)] bg-[var(--surface-card)] backdrop-blur-md">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--line)] text-left text-[11px] uppercase tracking-wider text-text-muted">
                <Th>#</Th>
                <Th>{t('club.reports.col_table')}</Th>
                <Th>{t('club.reports.col_start')}</Th>
                <Th>{t('club.reports.col_end')}</Th>
                <Th>{t('club.reports.col_duration')}</Th>
                <Th>{t('club.reports.col_mode')}</Th>
                <Th right>{t('club.reports.col_table_kzt')}</Th>
                <Th right>{t('club.reports.col_bar_kzt')}</Th>
                <Th right>{t('club.reports.col_total_kzt')}</Th>
              </tr>
            </thead>
            <tbody>
              {data.sessions.map((s, i) => (
                <tr key={s.id} className="border-b border-[var(--line)] last:border-0">
                  <Td className="text-text-muted">{i + 1}</Td>
                  <Td className="font-medium text-text-primary">{s.tableName}</Td>
                  <Td>{fmtTime(s.startTime)}</Td>
                  <Td>{fmtTime(s.endTime)}</Td>
                  <Td>{s.duration} {t('club.reports.minutes_short')}</Td>
                  <Td className="text-text-muted">{t(`club.reports.mode_${s.mode}`)}</Td>
                  <Td right>{formatKzt(s.tableCost)}</Td>
                  <Td right>{formatKzt(s.barCost)}</Td>
                  <Td right className="font-semibold">{formatKzt(s.totalCost)}</Td>
                </tr>
              ))}
              <tr className="bg-emerald-400/[0.06]">
                <Td colSpan={6} className="text-right font-semibold text-text-primary">{t('club.reports.total')}</Td>
                <Td right className="font-semibold">{formatKzt(data.totals.table)}</Td>
                <Td right className="font-semibold">{formatKzt(data.totals.bar)}</Td>
                <Td right className="font-bold text-emerald-300">{formatKzt(data.totals.total)}</Td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function RangeTab({ groupBy }: { groupBy: 'day' | 'month' }) {
  const { t } = useTranslation()
  const [days, setDays] = useState<7 | 30 | 90>(30)
  const [rows, setRows] = useState<ClubSessionsSummaryRow[] | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    const from = daysAgoIso(groupBy === 'month' ? days * 30 : days)
    clubApi.summary({ groupBy, from, to: todayIso() })
      .then((r) => setRows(r.rows))
      .catch((e) => {
        if (e instanceof ApiException) toast.error(e.message)
      })
      .finally(() => setLoading(false))
  }, [groupBy, days])

  const totals = useMemo(() => {
    if (!rows) return { table: 0, bar: 0, total: 0, sessions: 0 }
    return rows.reduce((a, r) => ({
      table: a.table + r.table,
      bar: a.bar + r.bar,
      total: a.total + r.total,
      sessions: a.sessions + r.sessions,
    }), { table: 0, bar: 0, total: 0, sessions: 0 })
  }, [rows])

  function exportCsv(): void {
    if (!rows) return
    const header = [t('club.reports.col_period'), t('club.reports.col_table_kzt'), t('club.reports.col_bar_kzt'),
      t('club.reports.col_total_kzt'), t('club.reports.col_sessions')]
    const data = rows.map((r) => [r.period, String(r.table), String(r.bar), String(r.total), String(r.sessions)])
    downloadCsv(`summary-${groupBy}-${todayIso()}.csv`, [header, ...data])
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex gap-1 rounded-xl border border-[var(--line)] bg-[var(--surface-card)] p-1 text-sm">
          {([7, 30, 90] as const).map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setDays(d)}
              className={cn(
                'ring-focus rounded-lg px-3 py-1.5 transition',
                days === d ? 'bg-emerald-400 text-bg-primary' : 'text-text-secondary hover:text-text-primary',
              )}
            >
              {t('club.reports.range_days', { n: d })}
            </button>
          ))}
        </div>
        <Button variant="secondary" size="sm" leftIcon={<Download size={14} />} onClick={exportCsv} disabled={!rows || rows.length === 0}>
          {t('club.reports.export_csv')}
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label={t('club.reports.metric_table')} value={formatKzt(totals.table)} />
        <Stat label={t('club.reports.metric_bar')} value={formatKzt(totals.bar)} />
        <Stat label={t('club.reports.metric_total')} value={formatKzt(totals.total)} />
        <Stat label={t('club.reports.metric_count')} value={totals.sessions} />
      </div>

      {loading ? (
        <SkeletonBlock />
      ) : !rows || rows.length === 0 ? (
        <EmptyHint />
      ) : (
        <>
          <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface-card)] p-3 backdrop-blur-md sm:p-5">
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={rows} margin={{ top: 10, right: 12, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="g-table" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10b981" stopOpacity={0.55} />
                      <stop offset="100%" stopColor="#10b981" stopOpacity={0.05} />
                    </linearGradient>
                    <linearGradient id="g-bar" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#38bdf8" stopOpacity={0.55} />
                      <stop offset="100%" stopColor="#38bdf8" stopOpacity={0.05} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="rgba(148,163,184,0.12)" vertical={false} />
                  <XAxis dataKey="period" tick={{ fill: '#94a3b8', fontSize: 11 }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{
                      background: '#0f1729',
                      border: '1px solid rgba(148,163,184,0.2)',
                      borderRadius: 12,
                      color: '#e2e8f0',
                      fontSize: 12,
                    }}
                    formatter={(v: number) => formatKzt(v)}
                  />
                  <Area type="monotone" dataKey="table" stackId="1" stroke="#10b981" fill="url(#g-table)" strokeWidth={2} />
                  <Area type="monotone" dataKey="bar" stackId="1" stroke="#38bdf8" fill="url(#g-bar)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-3 flex flex-wrap gap-4 text-xs text-text-muted">
              <span className="inline-flex items-center gap-1.5"><span className="inline-block h-2 w-3 rounded bg-emerald-400" /> {t('club.reports.legend_table')}</span>
              <span className="inline-flex items-center gap-1.5"><span className="inline-block h-2 w-3 rounded bg-sky-400" /> {t('club.reports.legend_bar')}</span>
            </div>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-[var(--line)] bg-[var(--surface-card)] backdrop-blur-md">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--line)] text-left text-[11px] uppercase tracking-wider text-text-muted">
                  <Th>{t('club.reports.col_period')}</Th>
                  <Th right>{t('club.reports.col_table_kzt')}</Th>
                  <Th right>{t('club.reports.col_bar_kzt')}</Th>
                  <Th right>{t('club.reports.col_total_kzt')}</Th>
                  <Th right>{t('club.reports.col_sessions')}</Th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.period} className="border-b border-[var(--line)] last:border-0">
                    <Td className="font-medium text-text-primary">{r.period}</Td>
                    <Td right>{formatKzt(r.table)}</Td>
                    <Td right>{formatKzt(r.bar)}</Td>
                    <Td right className="font-semibold">{formatKzt(r.total)}</Td>
                    <Td right className="text-text-muted">{r.sessions}</Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface-card)] p-4 backdrop-blur-md">
      <div className="text-[11px] uppercase tracking-wider text-text-muted">{label}</div>
      <div className="mt-2 text-xl font-bold tracking-tight text-text-primary sm:text-2xl">{value}</div>
    </div>
  )
}

function Th({ children, right }: { children: React.ReactNode; right?: boolean }) {
  return <th className={cn('px-3 py-2.5', right && 'text-right')}>{children}</th>
}

function Td({ children, right, className, colSpan }: { children: React.ReactNode; right?: boolean; className?: string; colSpan?: number }) {
  return <td colSpan={colSpan} className={cn('px-3 py-2.5 align-middle', right && 'text-right tabular-nums', className)}>{children}</td>
}

function SkeletonBlock() {
  return <div className="h-72 animate-pulse rounded-2xl border border-[var(--line)] bg-[var(--surface-card)]" />
}

function EmptyHint() {
  const { t } = useTranslation()
  return (
    <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-[var(--line-strong)] bg-[var(--surface-card)] p-10 text-center">
      <Loader2 className="text-text-muted" size={28} />
      <p className="text-sm text-text-secondary">{t('club.reports.empty')}</p>
    </div>
  )
}
