import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import {
  Activity, Database, Users, Trophy, CreditCard, Building2,
  Server, Terminal, RefreshCw, Bell, ShieldAlert, Download, Trash2, Ban,
} from 'lucide-react'
import type { AdminOverview, AdminHealth, AdminSqlResult, ActivityLogDto, ActivitySessionDto } from '@billiard/shared'
import { Container } from '@/components/ui/Container'
import { Button } from '@/components/ui/Button'
import { Seo } from '@/components/Seo'
import { toast } from '@/components/ui/Toast'
import { useAuthStore } from '@/store/auth'
import { adminApi, type AdminTournamentRow, type AdminPaymentRow, type AdminClubRow } from '@/api/admin'
import { ApiException } from '@/api/client'
import { cn } from '@/utils/cn'
import {
  useAsync, useAdminCaps, AdminCapsContext, LiveToggle,
  Panel, Loading, ErrorBox, Table, SearchBar, StatusBadge, StatCard,
  fmtDate, fmtKzt, fmtBytes, fmtDuration,
} from '@/components/admin/kit'
import { MetricsCharts, LatencyChart } from '@/components/admin/charts'
import { BackupPanel } from '@/components/admin/backup'
import { downloadCsv } from '@/components/admin/csv'
import {
  UserDetailModal, TournamentDetailModal, PaymentDetailModal, ClubDetailModal,
} from '@/components/admin/modals'

type Tab = 'overview' | 'users' | 'tournaments' | 'payments' | 'clubs' | 'activity' | 'bans' | 'server' | 'sql'

const TABS: { key: Tab; label: string; icon: typeof Activity }[] = [
  { key: 'overview', label: 'Обзор', icon: Activity },
  { key: 'users', label: 'Пользователи', icon: Users },
  { key: 'tournaments', label: 'Турниры', icon: Trophy },
  { key: 'payments', label: 'Платежи', icon: CreditCard },
  { key: 'clubs', label: 'Клубы', icon: Building2 },
  { key: 'activity', label: 'Активность', icon: Activity },
  { key: 'bans', label: 'IP-баны', icon: Ban },
  { key: 'server', label: 'Сервер / БД', icon: Server },
  { key: 'sql', label: 'SQL-консоль', icon: Terminal },
]

export default function Admin() {
  const user = useAuthStore((s) => s.user)
  const [tab, setTab] = useState<Tab>('overview')
  const { data: me } = useAsync(() => adminApi.me(), [])
  const isSuper = me?.isSuper ?? false

  if (!user) return <Navigate to="/auth" replace state={{ mode: 'login', returnTo: '/admin' }} />
  if (user.role !== 'ADMIN') return <Navigate to="/" replace />

  const tabs = TABS.filter((t) => t.key !== 'sql' || isSuper)
  const activeTab: Tab = tab === 'sql' && !isSuper ? 'overview' : tab

  return (
    <AdminCapsContext.Provider value={{ isSuper }}>
      <section className="relative min-h-[calc(100vh-4rem)] py-8">
        <Seo title="Супер-админка — Biliardo" description="Панель управления" path="/admin" />
        <Container size="wide">
          <div className="mb-6 flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-400">
              <ShieldAlert size={20} />
            </span>
            <div>
              <h1 className="flex items-center gap-2 text-2xl font-bold text-text-primary">
                Супер-админка
                <span className={cn('rounded-md px-2 py-0.5 text-xs font-semibold', isSuper ? 'bg-emerald-500/15 text-emerald-400' : 'bg-slate-500/15 text-slate-400')}>
                  {isSuper ? 'full' : 'read-only'}
                </span>
              </h1>
              <p className="text-sm text-text-muted">Полный доступ ко всем данным и состоянию системы</p>
            </div>
          </div>

          <div className="mb-6 flex flex-wrap gap-1.5 border-b border-[var(--line)] pb-3">
            {tabs.map((t) => {
              const Icon = t.icon
              const active = activeTab === t.key
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

          {activeTab === 'overview' && <OverviewTab />}
          {activeTab === 'users' && <UsersTab />}
          {activeTab === 'tournaments' && <TournamentsTab />}
          {activeTab === 'payments' && <PaymentsTab />}
          {activeTab === 'clubs' && <ClubsTab />}
          {activeTab === 'activity' && <ActivityTab />}
          {activeTab === 'bans' && <BansTab />}
          {activeTab === 'server' && <ServerTab />}
          {activeTab === 'sql' && <SqlTab />}
        </Container>
      </section>
    </AdminCapsContext.Provider>
  )
}

function ExportButton({ rows, name }: { rows: Record<string, unknown>[]; name: string }) {
  return (
    <Button variant="ghost" size="sm" leftIcon={<Download size={14} />} onClick={() => downloadCsv(name, rows)} disabled={rows.length === 0}>
      CSV
    </Button>
  )
}

/* ─────────── Overview ─────────── */

function OverviewTab() {
  const [live, setLive] = useState(false)
  const { data, loading, error, reload } = useAsync<AdminOverview>(() => adminApi.overview(), [], { pollMs: live ? 15_000 : undefined })
  if (loading) return <Loading />
  if (error) return <ErrorBox msg={error} />
  if (!data) return null
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-end gap-2">
        <LiveToggle on={live} onToggle={setLive} />
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
      <MetricsCharts />
    </div>
  )
}

/* ─────────── Users ─────────── */

function UsersTab() {
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<string | null>(null)
  const { data, loading, error, reload } = useAsync(() => adminApi.users({ search, limit: 100 }), [search])
  const users = data?.users ?? []

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <SearchBar value={search} onChange={setSearch} placeholder="Поиск по имени или телефону" />
        <ExportButton rows={users as unknown as Record<string, unknown>[]} name="users" />
      </div>
      {loading ? <Loading /> : error ? <ErrorBox msg={error} /> : (
        <Table
          onRowClick={(i) => setSelected(users[i].id)}
          columns={['Имя', 'Телефон', 'Роль', 'Тип', 'Клуб', 'TG', 'Турниров', 'Платежей', 'Создан']}
          rows={users.map((u) => [
            <span className="font-medium text-text-primary">{u.name}</span>,
            u.phone, <StatusBadge status={u.role} />, u.accountType, u.clubName ?? '—',
            u.telegramLinked ? <span className="text-emerald-400">✓</span> : '—',
            u.tournamentsCount, u.paymentsCount, fmtDate(u.createdAt),
          ])}
        />
      )}
      <UserDetailModal id={selected} onClose={() => setSelected(null)} onChanged={reload} />
    </div>
  )
}

/* ─────────── Tournaments ─────────── */

function TournamentsTab() {
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<string | null>(null)
  const { data, loading, error, reload } = useAsync(() => adminApi.tournaments({ search, limit: 100 }), [search])
  const items = data?.tournaments ?? []
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <SearchBar value={search} onChange={setSearch} placeholder="Поиск по названию или городу" />
        <ExportButton rows={items as unknown as Record<string, unknown>[]} name="tournaments" />
      </div>
      {loading ? <Loading /> : error ? <ErrorBox msg={error} /> : (
        <Table
          onRowClick={(i) => setSelected(items[i].id)}
          columns={['Название', 'Статус', 'Формат', 'Организатор', 'Участники', 'Город', 'Взнос', 'Призовой', 'Создан']}
          rows={items.map((t: AdminTournamentRow) => [
            <span className="font-medium text-text-primary">{t.name}</span>,
            <StatusBadge status={t.status} />, t.bracketType, t.organizerName ?? t.organizerId,
            `${t.participantCount} / ${t.maxParticipants}`, t.city ?? '—', fmtKzt(t.entryFee), fmtKzt(t.prizeFund), fmtDate(t.createdAt),
          ])}
        />
      )}
      <TournamentDetailModal id={selected} onClose={() => setSelected(null)} onChanged={reload} />
    </div>
  )
}

/* ─────────── Payments ─────────── */

function PaymentsTab() {
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<string | null>(null)
  const { data, loading, error, reload } = useAsync(() => adminApi.payments({ search, limit: 100 }), [search])
  const items = data?.payments ?? []
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <SearchBar value={search} onChange={setSearch} placeholder="Поиск по юзеру, тарифу, статусу" />
        <ExportButton rows={items as unknown as Record<string, unknown>[]} name="payments" />
      </div>
      {loading ? <Loading /> : error ? <ErrorBox msg={error} /> : (
        <Table
          onRowClick={(i) => setSelected(items[i].id)}
          columns={['Пользователь', 'Тариф', 'Сумма', 'Статус', 'Провайдер', 'Цель', 'Создан', 'Оплачен']}
          rows={items.map((p: AdminPaymentRow) => [
            <span className="text-text-primary">{p.userName ?? p.userId}</span>,
            p.planCode, fmtKzt(p.amountKzt), <StatusBadge status={p.status} />, p.provider, p.targetType, fmtDate(p.createdAt), fmtDate(p.completedAt),
          ])}
        />
      )}
      <PaymentDetailModal id={selected} onClose={() => setSelected(null)} onChanged={reload} />
    </div>
  )
}

/* ─────────── Clubs ─────────── */

function ClubsTab() {
  const [selected, setSelected] = useState<string | null>(null)
  const { data, loading, error } = useAsync(() => adminApi.clubs(), [])
  const items = data?.clubs ?? []
  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <ExportButton rows={items as unknown as Record<string, unknown>[]} name="clubs" />
      </div>
      {loading ? <Loading /> : error ? <ErrorBox msg={error} /> : (
        <Table
          onRowClick={(i) => setSelected(items[i].id)}
          columns={['Клуб', 'Контакт', 'Телефон', 'Онлайн', 'Последний sync', 'Создан']}
          rows={items.map((c: AdminClubRow) => [
            <span className="font-medium text-text-primary">{c.clubName ?? '—'}</span>,
            c.name, c.phone,
            c.online ? <span className="text-emerald-400">online</span> : <span className="text-text-muted">offline</span>,
            fmtDate(c.syncedAt), fmtDate(c.createdAt),
          ])}
        />
      )}
      <ClubDetailModal id={selected} onClose={() => setSelected(null)} />
    </div>
  )
}

/* ─────────── Activity ─────────── */

function ActivityTab() {
  const { isSuper } = useAdminCaps()
  const [mode, setMode] = useState<'log' | 'sessions'>('log')
  const [search, setSearch] = useState('')
  const [purging, setPurging] = useState(false)
  const log = useAsync<{ activity: ActivityLogDto[] }>(() => adminApi.activity({ search, limit: 200 }), [search, mode === 'log'])
  const sessions = useAsync<{ sessions: ActivitySessionDto[] }>(() => adminApi.sessions(150), [mode === 'sessions'])

  async function purge() {
    if (!window.confirm('Удалить старые записи аудита (вне ретеншна)?')) return
    setPurging(true)
    try { const r = await adminApi.purgeActivity(); toast.success('Очищено', `Удалено: ${r.deleted}`); log.reload() }
    catch (e) { toast.error('Ошибка', e instanceof ApiException ? e.message : '') } finally { setPurging(false) }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
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
        <div className="flex gap-2">
          <ExportButton rows={(mode === 'log' ? log.data?.activity : sessions.data?.sessions) as unknown as Record<string, unknown>[] ?? []} name={mode === 'log' ? 'activity' : 'sessions'} />
          {mode === 'log' && isSuper && <Button variant="ghost" size="sm" leftIcon={<Trash2 size={14} />} loading={purging} onClick={() => void purge()} className="text-red-400">Очистить</Button>}
        </div>
      </div>

      {mode === 'log' ? (
        log.loading ? <Loading /> : log.error ? <ErrorBox msg={log.error} /> : (
          <Table
            columns={['Время', 'Пользователь', 'Роль', 'Метод', 'Путь', 'Код', 'IP', 'мс']}
            rows={(log.data?.activity ?? []).map((a) => [
              fmtDate(a.createdAt),
              a.userName ?? (a.userId ? a.userId.slice(0, 8) : 'аноним'),
              a.role ?? '—', a.method,
              <span className="font-mono text-xs">{a.path}</span>,
              a.statusCode != null ? <span className={a.statusCode >= 500 ? 'text-red-400' : a.statusCode >= 400 ? 'text-amber-400' : 'text-emerald-400'}>{a.statusCode}</span> : '—',
              a.ip ?? '—', a.durationMs ?? '—',
            ])}
          />
        )
      ) : (
        sessions.loading ? <Loading /> : sessions.error ? <ErrorBox msg={sessions.error} /> : (
          <Table
            columns={['Пользователь', 'Начало', 'Последняя активность', 'Длительность', 'Запросов']}
            rows={(sessions.data?.sessions ?? []).map((s) => [
              <span className="text-text-primary">{s.userName ?? (s.userId ? s.userId.slice(0, 8) : '—')}</span>,
              fmtDate(s.startedAt), fmtDate(s.lastSeenAt), fmtDuration(s.durationSec), s.requests,
            ])}
          />
        )
      )}
    </div>
  )
}

/* ─────────── Server / DB ─────────── */

function ServerTab() {
  const [live, setLive] = useState(false)
  const { data, loading, error, reload } = useAsync<AdminHealth>(() => adminApi.health(), [], { pollMs: live ? 15_000 : undefined })
  const [testing, setTesting] = useState(false)

  async function sendTest() {
    setTesting(true)
    try {
      const r = await adminApi.testAlert()
      r.notified ? toast.success('Алерт отправлен в Telegram') : toast.info('Алерт записан в журнал', 'Привяжи Telegram, чтобы получать в личку')
    } catch (e) { toast.error('Ошибка', e instanceof ApiException ? e.message : '') } finally { setTesting(false) }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-end gap-2">
        <LiveToggle on={live} onToggle={setLive} />
        <Button variant="secondary" size="sm" leftIcon={<Bell size={14} />} loading={testing} onClick={() => void sendTest()}>Тестовый алерт</Button>
        <Button variant="ghost" size="sm" leftIcon={<RefreshCw size={14} />} onClick={reload}>Обновить</Button>
      </div>

      <BackupPanel />
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

          <LatencyChart />

          <div>
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-text-secondary"><Database size={15} /> Таблицы (строк)</h3>
            <Table columns={['Схема', 'Таблица', 'Строк']} rows={data.db.tables.map((t) => [t.schema, t.table, t.rows])} />
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
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="primary" size="md" loading={running} leftIcon={<Terminal size={15} />} onClick={() => void run()}>
          Выполнить (⌘/Ctrl+Enter)
        </Button>
        {result && <span className="text-xs text-text-muted">{result.kind === 'rows' ? `${result.rowCount} строк` : `${result.command}: ${result.rowCount}`} · {result.durationMs} мс</span>}
        {result && result.kind === 'rows' && result.rows.length > 0 && <ExportButton rows={result.rows} name="sql-result" />}
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

function BansTab() {
  const { isSuper } = useAdminCaps()
  const [version, setVersion] = useState(0)
  const { data, loading, error } = useAsync(() => adminApi.listIpBans(), [version])
  const [ip, setIp] = useState('')
  const [reason, setReason] = useState('')
  const [until, setUntil] = useState('')
  const [busy, setBusy] = useState(false)

  async function add() {
    if (!ip.trim()) return
    setBusy(true)
    try {
      await adminApi.createIpBan({
        ip: ip.trim(),
        reason: reason.trim() || undefined,
        until: until ? new Date(until).toISOString() : null,
      })
      setIp(''); setReason(''); setUntil('')
      setVersion((v) => v + 1)
      toast.success('IP забанен')
    } catch (e) {
      toast.error(e instanceof ApiException ? e.message : 'Не удалось добавить бан')
    } finally { setBusy(false) }
  }

  async function unban(id: string) {
    if (!confirm('Снять бан?')) return
    try {
      await adminApi.deleteIpBan(id)
      setVersion((v) => v + 1)
      toast.success('Бан снят')
    } catch (e) {
      toast.error(e instanceof ApiException ? e.message : 'Не удалось снять бан')
    }
  }

  if (loading) return <Loading />
  if (error) return <ErrorBox msg={error} />
  const bans = data?.bans ?? []

  return (
    <div className="space-y-4">
      <Panel>
        <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-text-primary">
          <Ban size={16} /> Добавить IP-бан
        </div>
        {!isSuper && (
          <div className="mb-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-300">
            Только супер-админ может изменять бан-лист. У вас режим просмотра.
          </div>
        )}
        <div className="grid gap-3 sm:grid-cols-[1fr_2fr_1fr_auto]">
          <input
            value={ip}
            onChange={(e) => setIp(e.target.value)}
            placeholder="IP, напр. 1.2.3.4"
            disabled={!isSuper || busy}
            className="ring-focus rounded-xl border border-[var(--line-strong)] bg-[var(--surface-input)] px-3 py-2 font-mono text-sm text-text-primary"
          />
          <input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Причина (опционально)"
            disabled={!isSuper || busy}
            className="ring-focus rounded-xl border border-[var(--line-strong)] bg-[var(--surface-input)] px-3 py-2 text-sm text-text-primary"
          />
          <input
            type="datetime-local"
            value={until}
            onChange={(e) => setUntil(e.target.value)}
            disabled={!isSuper || busy}
            title="Когда снять (пусто = бессрочно)"
            className="ring-focus rounded-xl border border-[var(--line-strong)] bg-[var(--surface-input)] px-3 py-2 text-sm text-text-primary"
          />
          <Button variant="primary" size="md" loading={busy} disabled={!isSuper || !ip.trim()} onClick={() => void add()}>
            Забанить
          </Button>
        </div>
        <p className="mt-2 text-xs text-text-muted">
          Gateway синкается с базой раз в минуту, поэтому бан вступит в силу в течение ~60 сек.
        </p>
      </Panel>

      <Panel>
        <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-text-primary">
          <Ban size={16} /> Активные баны ({bans.length})
        </div>
        {bans.length === 0 ? (
          <p className="text-sm text-text-muted">Бан-лист пуст.</p>
        ) : (
          <Table
            columns={['IP', 'Причина', 'До', 'Добавлен', '']}
            rows={bans.map((b) => [
              <span className="font-mono text-sm">{b.ip}</span>,
              b.reason ?? <span className="text-text-muted">—</span>,
              b.until ? fmtDate(b.until) : <span className="rounded-md bg-amber-500/15 px-2 py-0.5 text-xs text-amber-300">бессрочно</span>,
              fmtDate(b.createdAt),
              <Button size="sm" variant="ghost" leftIcon={<Trash2 size={13} />} disabled={!isSuper} onClick={() => void unban(b.id)}>
                Снять
              </Button>,
            ])}
          />
        )}
      </Panel>
    </div>
  )
}
