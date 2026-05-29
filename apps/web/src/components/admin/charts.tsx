import { useMemo, useState } from 'react'
import {
  ResponsiveContainer, AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from 'recharts'
import { adminApi, type HealthSample } from '@/api/admin'
import { Panel, Loading, ErrorBox, useAsync, fmtKzt } from './kit'
import { cn } from '@/utils/cn'

const SERVICE_COLORS: Record<string, string> = {
  auth: '#38bdf8', tournament: '#f59e0b', payment: '#a78bfa', club: '#34d399', bot: '#fb7185', gateway: '#facc15',
}

const RANGES = [7, 30, 90] as const

const tooltipStyle = {
  background: 'var(--surface-elevated, #1a1a1a)',
  border: '1px solid var(--line-strong, #333)',
  borderRadius: 12,
  fontSize: 12,
}

export function MetricsCharts() {
  const [days, setDays] = useState<number>(30)
  const { data, loading, error } = useAsync(() => adminApi.timeseries(days), [days])

  return (
    <Panel>
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-text-secondary">Динамика за период</h3>
        <div className="inline-flex rounded-xl border border-[var(--line-strong)] p-0.5">
          {RANGES.map((r) => (
            <button
              key={r}
              onClick={() => setDays(r)}
              className={cn('rounded-lg px-2.5 py-1 text-xs font-medium', days === r ? 'bg-emerald-500/15 text-emerald-400' : 'text-text-secondary')}
            >
              {r}д
            </button>
          ))}
        </div>
      </div>

      {loading ? <Loading /> : error ? <ErrorBox msg={error} /> : data && (
        <div className="space-y-6">
          <div>
            <div className="mb-2 text-xs text-text-muted">Регистрации, турниры, платежи, активность</div>
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={data.points} margin={{ top: 5, right: 8, left: -16, bottom: 0 }}>
                <defs>
                  <linearGradient id="gActivity" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'var(--color-text-muted, #888)' }} tickFormatter={(d: string) => d.slice(5)} />
                <YAxis tick={{ fontSize: 10, fill: 'var(--color-text-muted, #888)' }} allowDecimals={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Area type="monotone" dataKey="activity" name="Активность" stroke="#10b981" fill="url(#gActivity)" />
                <Area type="monotone" dataKey="users" name="Юзеры" stroke="#38bdf8" fillOpacity={0} />
                <Area type="monotone" dataKey="tournaments" name="Турниры" stroke="#f59e0b" fillOpacity={0} />
                <Area type="monotone" dataKey="payments" name="Платежи" stroke="#a78bfa" fillOpacity={0} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div>
            <div className="mb-2 text-xs text-text-muted">Выручка (оплаченные), ₸</div>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={data.points} margin={{ top: 5, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'var(--color-text-muted, #888)' }} tickFormatter={(d: string) => d.slice(5)} />
                <YAxis tick={{ fontSize: 10, fill: 'var(--color-text-muted, #888)' }} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => fmtKzt(v)} />
                <Bar dataKey="revenue" name="Выручка" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </Panel>
  )
}

function pivotLatency(series: HealthSample[]): { rows: Record<string, number | string>[]; services: string[] } {
  const services = Array.from(new Set(series.map((s) => s.service)))
  const byBucket = new Map<string, Record<string, number | string>>()
  for (const s of series) {
    const bucket = s.createdAt.slice(0, 16) // YYYY-MM-DDTHH:MM
    let row = byBucket.get(bucket)
    if (!row) { row = { time: bucket.slice(11) }; byBucket.set(bucket, row) }
    if (s.ok && s.latencyMs != null) row[s.service] = s.latencyMs
  }
  return { rows: Array.from(byBucket.values()), services }
}

const LAT_RANGES = [60, 360, 1440] as const

export function LatencyChart() {
  const [minutes, setMinutes] = useState<number>(60)
  const { data, loading, error } = useAsync(() => adminApi.healthHistory(minutes), [minutes], { pollMs: 30_000 })
  const { rows, services } = useMemo(() => pivotLatency(data?.series ?? []), [data])

  return (
    <Panel>
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-text-secondary">Латентность сервисов (мс)</h3>
        <div className="inline-flex rounded-xl border border-[var(--line-strong)] p-0.5">
          {LAT_RANGES.map((r) => (
            <button
              key={r}
              onClick={() => setMinutes(r)}
              className={cn('rounded-lg px-2.5 py-1 text-xs font-medium', minutes === r ? 'bg-emerald-500/15 text-emerald-400' : 'text-text-secondary')}
            >
              {r >= 60 ? `${r / 60}ч` : `${r}м`}
            </button>
          ))}
        </div>
      </div>
      {loading ? <Loading /> : error ? <ErrorBox msg={error} /> : rows.length === 0 ? (
        <div className="py-10 text-center text-sm text-text-muted">Пока нет данных — сэмплы пишутся раз в минуту.</div>
      ) : (
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={rows} margin={{ top: 5, right: 8, left: -16, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" />
            <XAxis dataKey="time" tick={{ fontSize: 10, fill: 'var(--color-text-muted, #888)' }} minTickGap={32} />
            <YAxis tick={{ fontSize: 10, fill: 'var(--color-text-muted, #888)' }} />
            <Tooltip contentStyle={tooltipStyle} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            {services.map((s) => (
              <Line key={s} type="monotone" dataKey={s} name={s} stroke={SERVICE_COLORS[s] ?? '#10b981'} dot={false} connectNulls strokeWidth={1.5} />
            ))}
          </LineChart>
        </ResponsiveContainer>
      )}
    </Panel>
  )
}
