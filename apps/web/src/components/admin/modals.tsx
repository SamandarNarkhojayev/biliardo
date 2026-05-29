import { useState } from 'react'
import { Trash2, Save, Play, Flag, X, Check } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { toast } from '@/components/ui/Toast'
import { ApiException } from '@/api/client'
import { tournamentsApi } from '@/api/tournaments'
import {
  adminApi,
  type AdminUserDetail, type AdminTournamentDetail, type AdminPaymentDetail, type AdminClubDetail,
} from '@/api/admin'
import {
  useAsync, useAdminCaps, Loading, ErrorBox, Table, StatusBadge, KeyVal, Field, TextInput, Select,
  fmtDate, fmtKzt, fmtDuration,
} from './kit'

interface BaseProps {
  id: string | null
  onClose: () => void
  onChanged: () => void
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h4 className="mb-2 mt-5 text-xs font-semibold uppercase tracking-wider text-text-muted first:mt-0">{children}</h4>
}

async function confirmDelete(label: string): Promise<boolean> {
  return window.confirm(`Удалить ${label}? Действие необратимо.`)
}

/* ───────────────── User ───────────────── */

export function UserDetailModal({ id, onClose, onChanged }: BaseProps) {
  return (
    <Modal open={id !== null} onClose={onClose} size="xl" title="Карточка пользователя">
      {id && <UserBody id={id} onClose={onClose} onChanged={onChanged} />}
    </Modal>
  )
}

function UserBody({ id, onClose, onChanged }: { id: string; onClose: () => void; onChanged: () => void }) {
  const { data, loading, error } = useAsync<AdminUserDetail>(() => adminApi.userDetail(id), [id])
  if (loading) return <div className="p-6"><Loading /></div>
  if (error) return <div className="p-6"><ErrorBox msg={error} /></div>
  if (!data) return null
  return <UserEditor detail={data} onClose={onClose} onChanged={onChanged} />
}

function UserEditor({ detail, onClose, onChanged }: { detail: AdminUserDetail; onClose: () => void; onChanged: () => void }) {
  const u = detail.user
  const { isSuper } = useAdminCaps()
  const [name, setName] = useState(u.name)
  const [role, setRole] = useState(u.role)
  const [accountType, setAccountType] = useState(u.accountType)
  const [clubName, setClubName] = useState(u.clubName ?? '')
  const [saving, setSaving] = useState(false)

  async function save() {
    setSaving(true)
    try {
      await adminApi.updateUser(u.id, { name, role, accountType, clubName: clubName.trim() || null })
      toast.success('Сохранено')
      onChanged()
    } catch (e) { toast.error('Ошибка', e instanceof ApiException ? e.message : '') } finally { setSaving(false) }
  }
  async function del() {
    if (!(await confirmDelete(`пользователя ${u.name}`))) return
    try { await adminApi.deleteUser(u.id); toast.success('Удалён'); onChanged(); onClose() }
    catch (e) { toast.error('Ошибка', e instanceof ApiException ? e.message : '') }
  }

  return (
    <div className="px-6 py-5">
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Имя"><TextInput value={name} onChange={setName} /></Field>
        <Field label="Роль"><Select value={role} onChange={setRole} options={['PLAYER', 'ORGANIZER', 'ADMIN']} /></Field>
        <Field label="Тип аккаунта"><Select value={accountType} onChange={setAccountType} options={['PLAYER', 'CLUB']} /></Field>
        <Field label="Название клуба"><TextInput value={clubName} onChange={setClubName} placeholder="—" /></Field>
      </div>
      <div className="mt-2 grid grid-cols-2 gap-x-6">
        <KeyVal label="ID" value={<span className="font-mono text-xs">{u.id}</span>} />
        <KeyVal label="Телефон" value={u.phone} />
        <KeyVal label="Telegram" value={u.telegramLinked ? `✓ ${u.telegramUsername ?? ''}` : '—'} />
        <KeyVal label="Создан" value={fmtDate(u.createdAt)} />
      </div>

      <SectionTitle>Турниры ({detail.tournaments.length})</SectionTitle>
      <Table columns={['Название', 'Статус', 'Участники', 'Создан']}
        rows={detail.tournaments.map((t) => [t.name, <StatusBadge status={t.status} />, `${t.participantCount}/${t.maxParticipants}`, fmtDate(t.createdAt)])} />

      <SectionTitle>Платежи ({detail.payments.length})</SectionTitle>
      <Table columns={['Тариф', 'Сумма', 'Статус', 'Цель', 'Дата']}
        rows={detail.payments.map((p) => [p.planCode, fmtKzt(p.amountKzt), <StatusBadge status={p.status} />, p.targetType, fmtDate(p.createdAt)])} />

      <SectionTitle>Участия ({detail.participations.length})</SectionTitle>
      <Table columns={['Турнир', 'Зарегистрирован', 'Позиция', 'Чек-ин']}
        rows={detail.participations.map((p) => [p.name, fmtDate(p.registeredAt), p.position, p.checkedIn ? '✓' : '—'])} />

      <SectionTitle>Недавняя активность</SectionTitle>
      <Table columns={['Время', 'Метод', 'Путь', 'Код', 'IP']}
        rows={detail.recentActivity.map((a) => [fmtDate(a.createdAt), a.method, <span className="font-mono text-xs">{a.path}</span>, a.statusCode ?? '—', a.ip ?? '—'])} />

      {isSuper ? (
        <div className="mt-6 flex items-center justify-between border-t border-[var(--line)] pt-4">
          <Button variant="ghost" size="md" leftIcon={<Trash2 size={15} />} onClick={() => void del()} className="text-red-400">Удалить</Button>
          <Button variant="primary" size="md" leftIcon={<Save size={15} />} loading={saving} onClick={() => void save()}>Сохранить</Button>
        </div>
      ) : <ReadonlyNote />}
    </div>
  )
}

function ReadonlyNote() {
  return <div className="mt-6 border-t border-[var(--line)] pt-4 text-xs text-text-muted">Режим только для просмотра — редактирование доступно супер-админам.</div>
}

/* ───────────────── Tournament ───────────────── */

export function TournamentDetailModal({ id, onClose, onChanged }: BaseProps) {
  return (
    <Modal open={id !== null} onClose={onClose} size="xl" title="Карточка турнира">
      {id && <TournamentBody id={id} onClose={onClose} onChanged={onChanged} />}
    </Modal>
  )
}

function TournamentBody({ id, onClose, onChanged }: { id: string; onClose: () => void; onChanged: () => void }) {
  const { data, loading, error, reload } = useAsync<AdminTournamentDetail>(() => adminApi.tournamentDetail(id), [id])
  if (loading) return <div className="p-6"><Loading /></div>
  if (error) return <div className="p-6"><ErrorBox msg={error} /></div>
  if (!data) return null
  return <TournamentEditor detail={data} onClose={onClose} onChanged={() => { onChanged(); reload() }} />
}

function TournamentEditor({ detail, onClose, onChanged }: { detail: AdminTournamentDetail; onClose: () => void; onChanged: () => void }) {
  const t = detail.tournament as Record<string, unknown>
  const tid = String(t.id)
  const { isSuper } = useAdminCaps()
  const [name, setName] = useState(String(t.name ?? ''))
  const [status, setStatus] = useState(String(t.status ?? 'REGISTRATION'))
  const [maxParticipants, setMax] = useState(String(t.maxParticipants ?? ''))
  const [isPublic, setIsPublic] = useState(t.isPublic ? 'да' : 'нет')
  const [city, setCity] = useState(String(t.city ?? ''))
  const [entryFee, setEntryFee] = useState(t.entryFee != null ? String(t.entryFee) : '')
  const [prizeFund, setPrizeFund] = useState(t.prizeFund != null ? String(t.prizeFund) : '')
  const [saving, setSaving] = useState(false)
  const [busy, setBusy] = useState(false)
  const nameById = new Map(detail.participants.map((p) => [p.id, p.name]))

  async function manage(fn: () => Promise<unknown>, okMsg: string) {
    setBusy(true)
    try { await fn(); toast.success(okMsg); onChanged() }
    catch (e) { toast.error('Ошибка', e instanceof ApiException ? e.message : '') } finally { setBusy(false) }
  }

  async function save() {
    setSaving(true)
    try {
      await adminApi.updateTournament(tid, {
        name, status,
        maxParticipants: Number(maxParticipants) || 2,
        isPublic: isPublic === 'да',
        city: city.trim() || null,
        entryFee: entryFee === '' ? null : Number(entryFee),
        prizeFund: prizeFund === '' ? null : Number(prizeFund),
      })
      toast.success('Сохранено'); onChanged()
    } catch (e) { toast.error('Ошибка', e instanceof ApiException ? e.message : '') } finally { setSaving(false) }
  }
  async function del() {
    if (!(await confirmDelete(`турнир «${name}»`))) return
    try { await adminApi.deleteTournament(tid); toast.success('Удалён'); onChanged(); onClose() }
    catch (e) { toast.error('Ошибка', e instanceof ApiException ? e.message : '') }
  }

  return (
    <div className="px-6 py-5">
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Название"><TextInput value={name} onChange={setName} /></Field>
        <Field label="Статус"><Select value={status} onChange={setStatus} options={['DRAFT', 'REGISTRATION', 'ACTIVE', 'COMPLETED', 'CANCELLED']} /></Field>
        <Field label="Макс. участников"><TextInput value={maxParticipants} onChange={setMax} /></Field>
        <Field label="Публичный"><Select value={isPublic} onChange={setIsPublic} options={['да', 'нет']} /></Field>
        <Field label="Город"><TextInput value={city} onChange={setCity} placeholder="—" /></Field>
        <Field label="Взнос (₸)"><TextInput value={entryFee} onChange={setEntryFee} placeholder="—" /></Field>
        <Field label="Призовой (₸)"><TextInput value={prizeFund} onChange={setPrizeFund} placeholder="—" /></Field>
      </div>
      <div className="mt-2 grid grid-cols-2 gap-x-6">
        <KeyVal label="ID" value={<span className="font-mono text-xs">{tid}</span>} />
        <KeyVal label="Организатор" value={String(t.organizerName ?? t.organizerId ?? '—')} />
        <KeyVal label="Формат" value={String(t.bracketType ?? '—')} />
        <KeyVal label="Создан" value={fmtDate(String(t.createdAt ?? ''))} />
      </div>

      {isSuper && (
        <div className="mt-4 flex flex-wrap gap-2 rounded-xl border border-[var(--line)] bg-[var(--surface-card)] p-3">
          <span className="self-center text-xs font-medium text-text-muted">Управление:</span>
          <Button variant="secondary" size="sm" leftIcon={<Play size={14} />} loading={busy}
            onClick={() => void manage(() => tournamentsApi.start(tid), 'Турнир запущен — сетка построена')}>Старт</Button>
          <Button variant="secondary" size="sm" leftIcon={<Flag size={14} />} loading={busy}
            onClick={() => void manage(() => tournamentsApi.complete(tid), 'Турнир завершён')}>Завершить</Button>
        </div>
      )}

      <SectionTitle>Участники ({detail.participants.length})</SectionTitle>
      <Table columns={['#', 'Имя', 'Телефон', 'Чек-ин', 'Оплатил', ...(isSuper ? ['Действия'] : [])]}
        rows={detail.participants.map((p) => [
          p.position, p.name, p.phone ?? '—', p.checkedIn ? '✓' : '—', p.paid ? '✓' : '—',
          ...(isSuper ? [
            <div className="flex gap-1">
              <button title="Чек-ин" disabled={busy} onClick={() => void manage(() => tournamentsApi.toggleCheckin(tid, p.id), 'Чек-ин обновлён')}
                className="rounded-md border border-[var(--line-strong)] px-1.5 py-0.5 text-[11px] hover:bg-[var(--surface-card-hover)]"><Check size={12} /></button>
              <button title="Удалить" disabled={busy} onClick={() => void manage(() => tournamentsApi.removeParticipant(tid, p.id), 'Участник удалён')}
                className="rounded-md border border-red-500/30 px-1.5 py-0.5 text-[11px] text-red-400 hover:bg-red-500/10"><X size={12} /></button>
            </div>,
          ] : []),
        ])} />

      <SectionTitle>Матчи ({detail.matches.length})</SectionTitle>
      <div className="space-y-1.5">
        {detail.matches.length === 0 && <div className="rounded-xl border border-[var(--line)] px-3 py-6 text-center text-sm text-text-muted">Сетки ещё нет</div>}
        {detail.matches.map((m) => (
          <MatchRow key={m.id} match={m} nameById={nameById} editable={isSuper} busy={busy} onScore={(s1, s2) => manage(() => tournamentsApi.setMatchScore(tid, m.id, s1, s2), 'Счёт сохранён')} />
        ))}
      </div>

      <SectionTitle>Призы</SectionTitle>
      <Table columns={['Место', 'Приз']} rows={detail.prizes.map((p) => [p.place, p.prize])} />

      {isSuper ? (
        <div className="mt-6 flex items-center justify-between border-t border-[var(--line)] pt-4">
          <Button variant="ghost" size="md" leftIcon={<Trash2 size={15} />} onClick={() => void del()} className="text-red-400">Удалить</Button>
          <Button variant="primary" size="md" leftIcon={<Save size={15} />} loading={saving} onClick={() => void save()}>Сохранить</Button>
        </div>
      ) : <ReadonlyNote />}
    </div>
  )
}

function MatchRow({ match, nameById, editable, busy, onScore }: {
  match: AdminTournamentDetail['matches'][number]
  nameById: Map<string, string>
  editable: boolean
  busy: boolean
  onScore: (s1: number, s2: number) => void
}) {
  const [s1, setS1] = useState(match.score1 != null ? String(match.score1) : '')
  const [s2, setS2] = useState(match.score2 != null ? String(match.score2) : '')
  const p1 = match.participant1Id ? (nameById.get(match.participant1Id) ?? '—') : 'TBD'
  const p2 = match.participant2Id ? (nameById.get(match.participant2Id) ?? '—') : 'TBD'
  const canScore = editable && !!match.participant1Id && !!match.participant2Id
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-xl border border-[var(--line)] px-3 py-2 text-sm">
      <span className="w-14 shrink-0 text-xs text-text-muted">R{match.round}·{match.matchNumber}</span>
      <span className="min-w-0 flex-1 truncate text-text-primary">{p1} <span className="text-text-muted">vs</span> {p2}</span>
      <StatusBadge status={match.status} />
      {canScore ? (
        <div className="flex items-center gap-1">
          <input value={s1} inputMode="numeric" onChange={(e) => setS1(e.target.value.replace(/\D/g, ''))} className="w-10 rounded-md border border-[var(--line-strong)] bg-[var(--surface-input)] px-1.5 py-0.5 text-center text-sm text-text-primary" />
          <span className="text-text-muted">:</span>
          <input value={s2} inputMode="numeric" onChange={(e) => setS2(e.target.value.replace(/\D/g, ''))} className="w-10 rounded-md border border-[var(--line-strong)] bg-[var(--surface-input)] px-1.5 py-0.5 text-center text-sm text-text-primary" />
          <Button variant="ghost" size="sm" disabled={busy || s1 === '' || s2 === '' || s1 === s2} onClick={() => onScore(Number(s1), Number(s2))}>OK</Button>
        </div>
      ) : (
        <span className="text-text-secondary">{match.score1 ?? '-'}:{match.score2 ?? '-'}</span>
      )}
    </div>
  )
}

/* ───────────────── Payment ───────────────── */

export function PaymentDetailModal({ id, onClose, onChanged }: BaseProps) {
  return (
    <Modal open={id !== null} onClose={onClose} size="lg" title="Карточка платежа">
      {id && <PaymentBody id={id} onClose={onClose} onChanged={onChanged} />}
    </Modal>
  )
}

function PaymentBody({ id, onClose, onChanged }: { id: string; onClose: () => void; onChanged: () => void }) {
  const { data, loading, error } = useAsync<AdminPaymentDetail>(() => adminApi.paymentDetail(id), [id])
  if (loading) return <div className="p-6"><Loading /></div>
  if (error) return <div className="p-6"><ErrorBox msg={error} /></div>
  if (!data) return null
  return <PaymentEditor detail={data} onClose={onClose} onChanged={onChanged} />
}

function PaymentEditor({ detail, onClose, onChanged }: { detail: AdminPaymentDetail; onClose: () => void; onChanged: () => void }) {
  const p = detail.payment
  const { isSuper } = useAdminCaps()
  const [status, setStatus] = useState(p.status)
  const [saving, setSaving] = useState(false)

  async function save() {
    setSaving(true)
    try { await adminApi.updatePayment(p.id, { status }); toast.success('Сохранено'); onChanged() }
    catch (e) { toast.error('Ошибка', e instanceof ApiException ? e.message : '') } finally { setSaving(false) }
  }
  async function del() {
    if (!(await confirmDelete('платёж'))) return
    try { await adminApi.deletePayment(p.id); toast.success('Удалён'); onChanged(); onClose() }
    catch (e) { toast.error('Ошибка', e instanceof ApiException ? e.message : '') }
  }

  return (
    <div className="px-6 py-5">
      <Field label="Статус"><Select value={status} onChange={setStatus} options={['PENDING', 'COMPLETED', 'FAILED', 'EXPIRED', 'REFUNDED']} /></Field>
      <div className="mt-3 grid grid-cols-2 gap-x-6">
        <KeyVal label="ID" value={<span className="font-mono text-xs">{p.id}</span>} />
        <KeyVal label="Пользователь" value={p.userName ?? '—'} />
        <KeyVal label="Телефон" value={p.userPhone ?? '—'} />
        <KeyVal label="Тариф" value={p.planCode} />
        <KeyVal label="Сумма" value={fmtKzt(p.amountKzt)} />
        <KeyVal label="Провайдер" value={String(p.provider ?? '—')} />
        <KeyVal label="Цель" value={String(p.targetType ?? '—')} />
        <KeyVal label="External ID" value={<span className="font-mono text-xs">{String(p.externalId ?? '—')}</span>} />
        <KeyVal label="Создан" value={fmtDate(String(p.createdAt ?? ''))} />
        <KeyVal label="Оплачен" value={fmtDate(p.completedAt as string | null)} />
      </div>
      {isSuper ? (
        <div className="mt-6 flex items-center justify-between border-t border-[var(--line)] pt-4">
          <Button variant="ghost" size="md" leftIcon={<Trash2 size={15} />} onClick={() => void del()} className="text-red-400">Удалить</Button>
          <Button variant="primary" size="md" leftIcon={<Save size={15} />} loading={saving} onClick={() => void save()}>Сохранить</Button>
        </div>
      ) : <ReadonlyNote />}
    </div>
  )
}

/* ───────────────── Club (read-only) ───────────────── */

export function ClubDetailModal({ id, onClose }: { id: string | null; onClose: () => void }) {
  return (
    <Modal open={id !== null} onClose={onClose} size="xl" title="Карточка клуба">
      {id && <ClubBody id={id} />}
    </Modal>
  )
}

function ClubBody({ id }: { id: string }) {
  const { data, loading, error } = useAsync<AdminClubDetail>(() => adminApi.clubDetail(id), [id])
  if (loading) return <div className="p-6"><Loading /></div>
  if (error) return <div className="p-6"><ErrorBox msg={error} /></div>
  if (!data) return null
  const { club, snapshot, sessions, summary } = data
  return (
    <div className="px-6 py-5">
      <div className="grid grid-cols-2 gap-x-6">
        <KeyVal label="Клуб" value={club.clubName ?? '—'} />
        <KeyVal label="Контакт" value={club.name} />
        <KeyVal label="Телефон" value={club.phone} />
        <KeyVal label="Онлайн" value={snapshot?.online ? 'да' : 'нет'} />
        <KeyVal label="Последний sync" value={fmtDate(snapshot?.syncedAt)} />
        <KeyVal label="Создан" value={fmtDate(club.createdAt)} />
        <KeyVal label="Всего сессий" value={summary.sessions} />
        <KeyVal label="Выручка (всего)" value={fmtKzt(summary.revenue)} />
      </div>

      <SectionTitle>Сессии ({sessions.length})</SectionTitle>
      <Table columns={['Стол', 'Режим', 'Начало', 'Длит.', 'Стол ₸', 'Бар ₸', 'Итого']}
        rows={sessions.map((s) => [s.tableName, s.mode, fmtDate(s.startTime), fmtDuration(s.duration * 60), fmtKzt(s.tableCost), fmtKzt(s.barCost), fmtKzt(s.totalCost)])} />
    </div>
  )
}
