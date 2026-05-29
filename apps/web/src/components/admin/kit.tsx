import { useEffect, useState, type ReactNode } from 'react'
import { Badge } from '@/components/ui/Badge'
import { ApiException } from '@/api/client'
import { cn } from '@/utils/cn'

/* ───── format helpers ───── */

export function fmtDate(iso: string | null | undefined): string {
  if (!iso) return '—'
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleString('ru-RU')
}
export function fmtKzt(n: number | null | undefined): string {
  if (n == null) return '—'
  return new Intl.NumberFormat('ru-RU').format(n) + ' ₸'
}
export function fmtBytes(n: number): string {
  if (n < 1024) return `${n} B`
  const units = ['KB', 'MB', 'GB', 'TB']
  let v = n / 1024, i = 0
  while (v >= 1024 && i < units.length - 1) { v /= 1024; i++ }
  return `${v.toFixed(1)} ${units[i]}`
}
export function fmtDuration(sec: number): string {
  if (sec < 60) return `${sec} сек`
  const m = Math.floor(sec / 60), s = sec % 60
  if (m < 60) return `${m} мин ${s} сек`
  const h = Math.floor(m / 60)
  return `${h} ч ${m % 60} мин`
}

/* ───── data fetching ───── */

export function useAsync<T>(fn: () => Promise<T>, deps: unknown[]): {
  data: T | null; loading: boolean; error: string | null; reload: () => void
} {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tick, setTick] = useState(0)
  useEffect(() => {
    let alive = true
    setLoading(true); setError(null)
    fn().then((d) => { if (alive) { setData(d); setLoading(false) } })
      .catch((e) => { if (alive) { setError(e instanceof ApiException ? e.message : 'Ошибка загрузки'); setLoading(false) } })
    return () => { alive = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, tick])
  return { data, loading, error, reload: () => setTick((t) => t + 1) }
}

/* ───── primitives ───── */

export function Panel({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('rounded-2xl border border-[var(--line)] bg-[var(--surface-card)] p-5', className)}>{children}</div>
}

export function Loading() {
  return <div className="py-16 text-center text-text-muted">Загрузка…</div>
}
export function ErrorBox({ msg }: { msg: string }) {
  return <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">{msg}</div>
}

export function Table({ columns, rows, onRowClick }: {
  columns: string[]
  rows: (ReactNode[])[]
  onRowClick?: (i: number) => void
}) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-[var(--line)]">
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead className="bg-[var(--surface-input)] text-xs uppercase tracking-wider text-text-muted">
          <tr>{columns.map((c) => <th key={c} className="whitespace-nowrap px-3 py-2.5 font-semibold">{c}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr
              key={i}
              onClick={onRowClick ? () => onRowClick(i) : undefined}
              className={cn('border-t border-[var(--line)] hover:bg-[var(--surface-card-hover)]', onRowClick && 'cursor-pointer')}
            >
              {r.map((cell, j) => <td key={j} className="whitespace-nowrap px-3 py-2.5 text-text-secondary">{cell}</td>)}
            </tr>
          ))}
          {rows.length === 0 && (
            <tr><td colSpan={columns.length} className="px-3 py-10 text-center text-text-muted">Нет данных</td></tr>
          )}
        </tbody>
      </table>
    </div>
  )
}

export function SearchBar({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="ring-focus w-full max-w-sm rounded-xl border border-[var(--line-strong)] bg-[var(--surface-input)] px-3.5 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-emerald-400/70 focus:outline-none"
    />
  )
}

const STATUS_MAP: Record<string, 'green' | 'gold' | 'blue' | 'red' | 'gray'> = {
  ACTIVE: 'green', COMPLETED: 'blue', REGISTRATION: 'gold', DRAFT: 'gray', CANCELLED: 'red',
  PENDING: 'gold', FAILED: 'red', EXPIRED: 'gray', REFUNDED: 'red',
  ADMIN: 'red', ORGANIZER: 'green', PLAYER: 'blue',
}
export function StatusBadge({ status }: { status: string }) {
  return <Badge variant={STATUS_MAP[status] ?? 'gray'}>{status}</Badge>
}

export function StatCard({ label, value, hint }: { label: string; value: ReactNode; hint?: string }) {
  return (
    <Panel className="p-4">
      <div className="text-xs uppercase tracking-wider text-text-muted">{label}</div>
      <div className="mt-1 text-2xl font-bold text-text-primary">{value}</div>
      {hint && <div className="mt-0.5 text-xs text-text-muted">{hint}</div>}
    </Panel>
  )
}

/* ───── field/edit primitives (for modals) ───── */

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-text-secondary">{label}</span>
      {children}
    </label>
  )
}

export function TextInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <input
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      className="ring-focus w-full rounded-xl border border-[var(--line-strong)] bg-[var(--surface-input)] px-3 py-2 text-sm text-text-primary focus:border-emerald-400/70 focus:outline-none"
    />
  )
}

export function Select({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: string[] }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="ring-focus w-full rounded-xl border border-[var(--line-strong)] bg-[var(--surface-input)] px-3 py-2 text-sm text-text-primary focus:border-emerald-400/70 focus:outline-none"
    >
      {options.map((o) => <option key={o} value={o}>{o}</option>)}
    </select>
  )
}

export function KeyVal({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-[var(--line)] py-1.5 text-sm last:border-0">
      <span className="text-text-muted">{label}</span>
      <span className="text-right font-medium text-text-primary">{value}</span>
    </div>
  )
}
