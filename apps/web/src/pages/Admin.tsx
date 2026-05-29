import { useEffect, useState, type ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import {
  Activity, Database, Users, Trophy, CreditCard, Building2,
  Server, Terminal, RefreshCw, Bell, ShieldAlert,
} from 'lucide-react'
import type {
  AdminOverview, AdminUserRow, AdminHealth, AdminSqlResult,
  ActivityLogDto, ActivitySessionDto,
} from '@billiard/shared'
import { Container } from '@/components/ui/Container'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Seo } from '@/components/Seo'
import { toast } from '@/components/ui/Toast'
import { useAuthStore } from '@/store/auth'
import { adminApi, type AdminTournamentRow, type AdminPaymentRow, type AdminClubRow } from '@/api/admin'
import { ApiException } from '@/api/client'
import { cn } from '@/utils/cn'

type Tab = 'overview' | 'users' | 'tournaments' | 'payments' | 'clubs' | 'activity' | 'server' | 'sql'

const TABS: { key: Tab; label: string; icon: typeof Activity }[] = [
  { key: 'overview', label: 'Обзор', icon: Activity },
  { key: 'users', label: 'Пользователи', icon: Users },
  { key: 'tournaments', label: 'Турниры', icon: Trophy },
  { key: 'payments', label: 'Платежи', icon: CreditCard },
  { key: 'clubs', label: 'Клубы', icon: Building2 },
  { key: 'activity', label: 'Активность', icon: Activity },
  { key: 'server', label: 'Сервер / БД', icon: Server },
  { key: 'sql', label: 'SQL-консоль', icon: Terminal },
]

function fmtDate(iso: string | null | undefined): string {
  if (!iso) return '—'
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleString('ru-RU')
}
function fmtKzt(n: number | null | undefined): string {
  if (n == null) return '—'
  return new Intl.NumberFormat('ru-RU').format(n) + ' ₸'
}
function fmtBytes(n: number): string {
  if (n < 1024) return `${n} B`
  const units = ['KB', 'MB', 'GB', 'TB']
  let v = n / 1024, i = 0
  while (v >= 1024 && i < units.length - 1) { v /= 1024; i++ }
  return `${v.toFixed(1)} ${units[i]}`
}
function fmtDuration(sec: number): string {
  if (sec < 60) return `${sec} сек`
  const m = Math.floor(sec / 60), s = sec % 60
  if (m < 60) return `${m} мин ${s} сек`
  const h = Math.floor(m / 60)
  return `${h} ч ${m % 60} мин`
}

export default function Admin() {
  const user = useAuthStore((s) => s.user)
  const [tab, setTab] = useState<Tab>('overview')

  // Гард роли: гость → на /auth (через ProtectedRoute), не-админ → на главную.
  if (!user) return <Navigate to="/auth" replace state={{ mode: 'login', returnTo: '/admin' }} />
  if (user.role !== 'ADMIN') return <Navigate to="/" replace />

  return (
    <section className="relative min-h-[calc(100vh-4rem)] py-8">
      <Seo title="Супер-админка — Biliardo" description="Панель управления" path="/admin" />
      <Container size="wide">
        <div className="mb-6 flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-400">
            <ShieldAlert size={20} />
          </span>
          <div>
            <h1 className="text-2xl font-bold text-text-primary">Супер-админка</h1>
            <p className="text-sm text-text-muted">Полный доступ ко всем данным и состоянию системы</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6 flex flex-wrap gap-1.5 border-b border-[var(--line)] pb-3">
          {TABS.map((t) => {
            const Icon = t.icon
            const active = tab === t.key
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => setTab(t.key)}
                className={cn(
                  'inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  active ? 'bg-emerald-500/15 text-emerald-400' : 'text-text-secondary hover:bg-[var(--surface-card)] hover:text-text-primary',
                )}
              >
                <Icon size={15} /> {t.label}
              </button>
            )
          })}
        </div>

        {tab === 'overview' && <OverviewTab />}
        {tab === 'users' && <UsersTab />}
        {tab === 'tournaments' && <TournamentsTab />}
        {tab === 'payments' && <PaymentsTab />}
        {tab === 'clubs' && <ClubsTab />}
        {tab === 'activity' && <ActivityTab />}
        {tab === 'server' && <ServerTab />}
        {tab === 'sql' && <SqlTab />}
      </Container>
    </section>
  )
}

/* ─────────── shared helpers ─────────── */

function useAsync<T>(fn: () => Promise<T>, deps: unknown[]): { data: T | null; loading: boolean; error: string | null; reload: () => void } {
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

function Panel({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('rounded-2xl border border-[var(--line)] bg-[var(--surface-card)] p-5', className)}>{children}</div>
}

function Loading() {
  return <div className="py-16 text-center text-text-muted">Загрузка…</div>
}
function ErrorBox({ msg }: { msg: string }) {
  return <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">{msg}</div>
}

function Table({ columns, rows }: { columns: string[]; rows: (ReactNode[])[] }) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-[var(--line)]">
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead className="bg-[var(--surface-input)] text-xs uppercase tracking-wider text-text-muted">
          <tr>{columns.map((c) => <th key={c} className="whitespace-nowrap px-3 py-2.5 font-semibold">{c}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-t border-[var(--line)] hover:bg-[var(--surface-card-hover)]">
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

function SearchBar({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="ring-focus w-full max-w-sm rounded-xl border border-[var(--line-strong)] bg-[var(--surface-input)] px-3.5 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-emerald-400/70 focus:outline-none"
    />
  )
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, 'green' | 'gold' | 'blue' | 'red' | 'gray'> = {
    ACTIVE: 'green', COMPLETED: 'blue', REGISTRATION: 'gold', DRAFT: 'gray', CANCELLED: 'red',
    PENDING: 'gold', FAILED: 'red', EXPIRED: 'gray', REFUNDED: 'red', ADMIN: 'red', ORGANIZER: 'green', PLAYER: 'blue',
  }
  return <Badge variant={map[status] ?? 'gray'}>{status}</Badge>
}

/* ─────────── Overview ─────────── */

function StatCard({ label, value, hint }: { label: string; value: ReactNode; hint?: string }) {
  return (
    <Panel className="p-4">
      <div className="text-xs uppercase tracking-wider text-text-muted">{label}</div>
      <div className="mt-1 text-2xl font-bold text-text-primary">{value}</div>
      {hint && <div className="mt-0.5 text-xs text-text-muted">{hint}</div>}
    </Panel>
  )
}

function OverviewTab() {
  const { data, loading, error, reload } = useAsync<AdminOverview>(() => adminApi.overview(), [])
  if (loading) return <Loading />
  if (error) return <ErrorBox msg={error} />
  if (!data) return null
  return (
    <div className="space-y-5">
      <div className="flex justify-end">
        <Button variant="ghost" size="sm" leftIcon={<RefreshCw size={14} />} onClick={reload}>Обновить</Button>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        <StatCard label="Пользователи" value={data.users.total} hint={`+${data.users.newToday} за сутки`} />
        <StatCard label="Игроки / Клубы" value={`${data.users.players} / ${data.users.clubs}`} />
        <StatCard label="Админы" value={data.users.admins} />
        <StatCard label="Турниры" value={data.tournaments.total} hint={`${data.tournaments.active} активных`} />
        <StatCard label="Участники" value={data.participants.total} />
        <StatCard label="Платежи" value={data.payments.total} hint={`${data.payments.completed} оплачено`} />
        <StatCard label="Выручка" value={fmtKzt(data.payments.revenueKzt)} />
        <StatCard label="Подписки" value={data.subscriptions.active} hint="активных" />
        <StatCard label="Клубы онлайн" value={`${data.clubs.online} / ${data.clubs.total}`} />
        <StatCard label="Активность 24ч" value={data.activity.last24h} hint={`${data.activity.uniqueUsers24h} юзеров`} />
        <StatCard label="Алерты 24ч" value={data.alerts.last24h} />
      </div>
    </div>
  )
}

/* ─────────── Users ─────────── */

function UsersTab() {
  const [search, setSearch] = useState('')
  const { data, loading, error, reload } = useAsync(() => adminApi.users({ search, limit: 100 }), [search])

  async function setRole(u: AdminUserRow, role: string) {
    if (!window.confirm(`Сменить роль ${u.name} на ${role}?`)) return
    try {
      await adminApi.sql(`UPDATE auth."User" SET role = '${role}' WHERE id = '${u.id}'`)
      toast.success('Роль обновлена', `${u.name} → ${role}`)
      reload()
    } catch (e) {
      toast.error('Не удалось', e instanceof ApiException ? e.message : '')
    }
  }

  return (
    <div className="space-y-4">
      <SearchBar value={search} onChange={setSearch} placeholder="Поиск по имени или телефону" />
      {loading ? <Loading /> : error ? <ErrorBox msg={error} /> : (
        <Table
          columns={['Имя', 'Телефон', 'Роль', 'Тип', 'Клуб', 'TG', 'Турниров', 'Платежей', 'Создан', 'Действия']}
          rows={(data?.users ?? []).map((u) => [
            <span className="font-medium text-text-primary">{u.name}</span>,
            u.phone,
            <StatusBadge status={u.role} />,
            u.accountType,
            u.clubName ?? '—',
            u.telegramLinked ? <span className="text-emerald-400">✓ {u.telegramUsername ?? ''}</span> : '—',
            u.tournamentsCount,
            u.paymentsCount,
            fmtDate(u.createdAt),
            <div className="flex gap-1">
              {(['PLAYER', 'ORGANIZER', 'ADMIN'] as const).filter((r) => r !== u.role).map((r) => (
                <button key={r} onClick={() => setRole(u, r)} className="rounded-md border border-[var(--line-strong)] px-1.5 py-0.5 text-[11px] text-text-secondary hover:bg-[var(--surface-card-hover)]">{r}</button>
              ))}
            </div>,
          ])}
        />
      )}
    </div>
  )
}

/* ─────────── Tournaments ─────────── */

function TournamentsTab() {
  const [search, setSearch] = useState('')
  const { data, loading, error } = useAsync(() => adminApi.tournaments({ search, limit: 100 }), [search])
  return (
    <div className="space-y-4">
      <SearchBar value={search} onChange={setSearch} placeholder="Поиск по названию или городу" />
      {loading ? <Loading /> : error ? <ErrorBox msg={error} /> : (
        <Table
          columns={['Название', 'Статус', 'Формат', 'Организатор', 'Участники', 'Город', 'Взнос', 'Призовой', 'Создан']}
          rows={(data?.tournaments ?? []).map((t: AdminTournamentRow) => [
            <span className="font-medium text-text-primary">{t.name}</span>,
            <StatusBadge status={t.status} />,
            t.bracketType,
            t.organizerName ?? t.organizerId,
            `${t.participantCount} / ${t.maxParticipants}`,
            t.city ?? '—',
            fmtKzt(t.entryFee),
            fmtKzt(t.prizeFund),
            fmtDate(t.createdAt),
          ])}
        />
      )}
    </div>
  )
}

/* ─────────── Payments ─────────── */

function PaymentsTab() {
  const [search, setSearch] = useState('')
  const { data, loading, error } = useAsync(() => adminApi.payments({ search, limit: 100 }), [search])
  return (
    <div className="space-y-4">
      <SearchBar value={search} onChange={setSearch} placeholder="Поиск по юзеру, тарифу, статусу" />
      {loading ? <Loading /> : error ? <ErrorBox msg={error} /> : (
        <Table
          columns={['Пользователь', 'Тариф', 'Сумма', 'Статус', 'Провайдер', 'Цель', 'Создан', 'Оплачен']}
          rows={(data?.payments ?? []).map((p: AdminPaymentRow) => [
            <span className="text-text-primary">{p.userName ?? p.userId}</span>,
            p.planCode,
            fmtKzt(p.amountKzt),
            <StatusBadge status={p.status} />,
            p.provider,
            p.targetType,
            fmtDate(p.createdAt),
            fmtDate(p.completedAt),
          ])}
        />
      )}
    </div>
  )
}

/* ─────────── Clubs ─────────── */

function ClubsTab() {
  const { data, loading, error } = useAsync(() => adminApi.clubs(), [])
  return (
    <div className="space-y-4">
      {loading ? <Loading /> : error ? <ErrorBox msg={error} /> : (
        <Table
          columns={['Клуб', 'Контакт', 'Телефон', 'Онлайн', 'Последний sync', 'Создан']}
          rows={(data?.clubs ?? []).map((c: AdminClubRow) => [
            <span className="font-medium text-text-primary">{c.clubName ?? '—'}</span>,
            c.name,
            c.phone,
            c.online ? <Badge variant="green">online</Badge> : <Badge variant="gray">offline</Badge>,
            fmtDate(c.syncedAt),
            fmtDate(c.createdAt),
          ])}
        />
      )}
    </div>
  )
}

/* ─────────── Activity ─────────── */

function ActivityTab() {
  const [mode, setMode] = useState<'log' | 'sessions'>('log')
  const [search, setSearch] = useState('')
  const log = useAsync<{ activity: ActivityLogDto[] }>(() => adminApi.activity({ search, limit: 200 }), [search, mode === 'log'])
  const sessions = useAsync<{ sessions: ActivitySessionDto[] }>(() => adminApi.sessions(150), [mode === 'sessions'])

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="inline-flex rounded-xl border border-[var(--line-strong)] p-0.5">
          {(['log', 'sessions'] as const).map((m) => (
            <button key={m} onClick={() => setMode(m)} className={cn('rounded-lg px-3 py-1.5 text-sm font-medium', mode === m ? 'bg-emerald-500/15 text-emerald-400' : 'text-text-secondary')}>
              {m === 'log' ? 'Журнал' : 'Сессии'}
            </button>
          ))}
        </div>
        {mode === 'log' && <SearchBar value={search} onChange={setSearch} placeholder="Поиск по пути или юзеру" />}
      </div>

      {mode === 'log' ? (
        log.loading ? <Loading /> : log.error ? <ErrorBox msg={log.error} /> : (
          <Table
            columns={['Время', 'Пользователь', 'Роль', 'Метод', 'Путь', 'Код', 'IP', 'мс']}
            rows={(log.data?.activity ?? []).map((a) => [
              fmtDate(a.createdAt),
              a.userName ?? (a.userId ? a.userId.slice(0, 8) : 'аноним'),
              a.role ?? '—',
              a.method,
              <span className="font-mono text-xs">{a.path}</span>,
              a.statusCode != null ? <span className={a.statusCode >= 500 ? 'text-red-400' : a.statusCode >= 400 ? 'text-amber-400' : 'text-emerald-400'}>{a.statusCode}</span> : '—',
              a.ip ?? '—',
              a.durationMs ?? '—',
            ])}
          />
        )
      ) : (
        sessions.loading ? <Loading /> : sessions.error ? <ErrorBox msg={sessions.error} /> : (
          <Table
            columns={['Пользователь', 'Начало', 'Последняя активность', 'Длительность', 'Запросов']}
            rows={(sessions.data?.sessions ?? []).map((s) => [
              <span className="text-text-primary">{s.userName ?? (s.userId ? s.userId.slice(0, 8) : '—')}</span>,
              fmtDate(s.startedAt),
              fmtDate(s.lastSeenAt),
              fmtDuration(s.durationSec),
              s.requests,
            ])}
          />
        )
      )}
    </div>
  )
}

/* ─────────── Server / DB ─────────── */

function ServerTab() {
  const { data, loading, error, reload } = useAsync<AdminHealth>(() => adminApi.health(), [])
  const [testing, setTesting] = useState(false)

  async function sendTest() {
    setTesting(true)
    try {
      const r = await adminApi.testAlert()
      r.notified ? toast.success('Алерт отправлен в Telegram') : toast.info('Алерт записан в журнал', 'Привяжи Telegram, чтобы получать в личку')
    } catch (e) {
      toast.error('Ошибка', e instanceof ApiException ? e.message : '')
    } finally { setTesting(false) }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap justify-end gap-2">
        <Button variant="secondary" size="sm" leftIcon={<Bell size={14} />} loading={testing} onClick={sendTest}>Тестовый алерт</Button>
        <Button variant="ghost" size="sm" leftIcon={<RefreshCw size={14} />} onClick={reload}>Обновить</Button>
      </div>
      {loading ? <Loading /> : error ? <ErrorBox msg={error} /> : data && (
        <>
          <div>
            <h3 className="mb-3 text-sm font-semibold text-text-secondary">Сервисы</h3>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {data.services.map((s) => (
                <Panel key={s.name} className="flex items-center justify-between p-4">
                  <div>
                    <div className="flex items-center gap-2 font-medium text-text-primary">
                      <span className={cn('h-2.5 w-2.5 rounded-full', s.ok ? 'bg-emerald-400' : 'bg-red-500')} />
                      {s.name}
                    </div>
                    <div className="mt-0.5 text-xs text-text-muted">{s.url}</div>
                  </div>
                  <div className="text-right text-xs text-text-muted">
                    <div>{s.ok ? `${s.status}` : 'down'}</div>
                    <div>{s.latencyMs != null ? `${s.latencyMs} мс` : ''}</div>
                  </div>
                </Panel>
              ))}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <StatCard label="Размер БД" value={fmtBytes(data.db.sizeBytes)} />
            <StatCard label="Соединения" value={data.db.connections} />
            <StatCard label="Таблиц" value={data.db.tables.length} />
          </div>

          <div>
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-text-secondary"><Database size={15} /> Таблицы (строк)</h3>
            <Table
              columns={['Схема', 'Таблица', 'Строк']}
              rows={data.db.tables.map((t) => [t.schema, t.table, t.rows])}
            />
          </div>
        </>
      )}
    </div>
  )
}

/* ─────────── SQL console ─────────── */

function SqlTab() {
  const [sql, setSql] = useState('SELECT id, name, phone, role FROM auth."User" ORDER BY "createdAt" DESC LIMIT 20;')
  const [result, setResult] = useState<AdminSqlResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [running, setRunning] = useState(false)

  async function run() {
    setRunning(true); setError(null)
    try {
      const r = await adminApi.sql(sql)
      setResult(r)
      if (r.kind === 'command') toast.success('Выполнено', `Затронуто строк: ${r.rowCount}`)
    } catch (e) {
      setResult(null)
      setError(e instanceof ApiException ? e.message : 'Ошибка выполнения')
    } finally { setRunning(false) }
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-300">
        ⚠️ Полный доступ на чтение и запись по всем схемам. Запросы логируются в аудит. Будь осторожен с UPDATE/DELETE/DROP.
      </div>
      <textarea
        value={sql}
        onChange={(e) => setSql(e.target.value)}
        onKeyDown={(e) => { if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') void run() }}
        rows={6}
        spellCheck={false}
        className="ring-focus w-full resize-y rounded-xl border border-[var(--line-strong)] bg-[var(--surface-input)] px-3.5 py-3 font-mono text-sm text-text-primary focus:border-emerald-400/70 focus:outline-none"
        placeholder="SELECT ..."
      />
      <div className="flex items-center gap-3">
        <Button variant="primary" size="md" loading={running} leftIcon={<Terminal size={15} />} onClick={() => void run()}>
          Выполнить (⌘/Ctrl+Enter)
        </Button>
        {result && <span className="text-xs text-text-muted">{result.kind === 'rows' ? `${result.rowCount} строк` : `${result.command}: ${result.rowCount}`} · {result.durationMs} мс</span>}
      </div>

      {error && <ErrorBox msg={error} />}
      {result && result.kind === 'rows' && (
        <Table
          columns={result.columns.length ? result.columns : ['(пусто)']}
          rows={result.rows.map((row) => result.columns.map((c) => {
            const v = row[c]
            if (v === null || v === undefined) return <span className="text-text-muted">null</span>
            if (typeof v === 'object') return <span className="font-mono text-xs">{JSON.stringify(v)}</span>
            return String(v)
          }))}
        />
      )}
    </div>
  )
}
