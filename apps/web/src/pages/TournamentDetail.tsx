import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Calendar, MapPin, Trophy, Users, Lock, Wallet, ChevronLeft,
  Share2, Play, Settings, CheckCircle2, Circle, Sparkles, UserPlus, Search, Phone as PhoneIcon, X,
  Maximize2, Minimize2, Camera, Loader2, Trash2, Send, ExternalLink, Clock, PartyPopper,
} from 'lucide-react'
import { Container } from '@/components/ui/Container'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { BracketViewer } from '@/components/bracket/BracketViewer'
import { minParticipantsFor, computeStandings } from '@billiard/shared'
import { useAuthStore } from '@/store/auth'
import { useTournamentsStore } from '@/store/tournaments'
import { ApiException } from '@/api/client'
import { authApi, type LookupUser } from '@/api/auth'
import { toast } from '@/components/ui/Toast'
import { formatPhone, isValidPhone, normalizePhone } from '@/utils/phone'
import { fireRegistrationConfetti } from '@/utils/confetti'
import { cn } from '@/utils/cn'
import type { Tournament, TournamentStatus, Participant, Match, BracketType } from '@billiard/shared'

type Tab = 'bracket' | 'participants' | 'info'

const statusToBadge: Record<TournamentStatus, 'green' | 'blue' | 'gray' | 'gold' | 'red'> = {
  REGISTRATION: 'green',
  ACTIVE: 'blue',
  COMPLETED: 'gray',
  DRAFT: 'gold',
  CANCELLED: 'red',
}

export default function TournamentDetail() {
  const { id } = useParams<{ id: string }>()
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const cached = useTournamentsStore((s) => s.tournaments)
  const fetchById = useTournamentsStore((s) => s.fetchById)
  const registerParticipant = useTournamentsStore((s) => s.registerParticipant)
  const startTournament = useTournamentsStore((s) => s.start)
  const completeTournament = useTournamentsStore((s) => s.complete)
  const setMatchScore = useTournamentsStore((s) => s.setMatchScore)
  const toggleCheckin = useTournamentsStore((s) => s.toggleCheckin)
  const togglePaid = useTournamentsStore((s) => s.togglePaid)

  const [tab, setTab] = useState<Tab>('bracket')
  const [registerOpen, setRegisterOpen] = useState(false)
  const [addByOrgOpen, setAddByOrgOpen] = useState(false)
  const [bracketFullscreen, setBracketFullscreen] = useState(false)
  const [telegramPromptOpen, setTelegramPromptOpen] = useState(false)
  const [loading, setLoading] = useState(true)

  const tournament = useMemo(
    () => cached.find((x) => x.id === id) ?? null,
    [cached, id],
  )

  useEffect(() => {
    if (!id) { setLoading(false); return }
    let cancelled = false
    setLoading(true)
    fetchById(id)
      .catch((err: unknown) => {
        if (cancelled) return
        if (!(err instanceof ApiException && (err.status === 404 || err.status === 403))) {
          toast.error(err instanceof ApiException ? err.message : 'Не удалось загрузить турнир')
        }
      })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [id, fetchById])

  if (loading) {
    return (
      <Container size="default" className="py-20">
        <div className="mx-auto h-72 max-w-3xl animate-pulse rounded-3xl border border-[var(--line)] bg-[var(--surface-card)]" />
      </Container>
    )
  }

  if (!tournament) {
    return (
      <Container size="default" className="py-20 text-center">
        <h1 className="text-2xl font-bold text-text-primary">{t('tournament_page.tour_not_found_title')}</h1>
        <p className="mt-2 text-text-secondary">{t('tournament_page.tour_not_found_desc')}</p>
        <div className="mt-6">
          <Link to="/tournaments">
            <Button variant="secondary" leftIcon={<ChevronLeft size={16} />}>{t('tournament_page.to_list')}</Button>
          </Link>
        </div>
      </Container>
    )
  }

  const isOrganizer = !!user && tournament.organizerId === user.id
  const isFull = tournament.participants.length >= tournament.maxParticipants
  const userIsRegistered = !!user && tournament.participants.some((p) => p.userId === user.id)
  const canRegister = tournament.status === 'REGISTRATION' && !isFull && !userIsRegistered
  // Добавлять участников можно только до старта турнира.
  const canAddParticipants =
    !isFull && (tournament.status === 'REGISTRATION' || tournament.status === 'DRAFT')
  // Менять результаты матчей можно, только пока турнир не завершён.
  const canEditMatches = tournament.status !== 'COMPLETED'

  const dateLabel = tournament.scheduledAt
    ? new Date(tournament.scheduledAt).toLocaleString(i18n.language === 'ru' ? 'ru-RU' : 'kk-KZ', {
        day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
      })
    : '—'

  function handleRegisterClick() {
    if (!user) {
      navigate('/auth', { state: { mode: 'register', returnTo: `/tournaments/${id}` } })
      return
    }
    setRegisterOpen(true)
  }

  async function handleConfirmRegister(name: string, phone: string) {
    if (!tournament || !user) return
    const normalized = normalizePhone(phone)
    try {
      await registerParticipant(tournament.id, {
        name,
        phone: normalized,
        userId: user.id,
        avatar: user.avatar ?? null,
      })
      setRegisterOpen(false)
      toast.success(t('tournament_page.registered'), t('tournament_page.registered_desc'))
      fireRegistrationConfetti()
      // Предлагаем подключить Telegram, чтобы получать напоминание и уведомления.
      setTelegramPromptOpen(true)
    } catch (err) {
      if (err instanceof ApiException) {
        if (err.code === 'DUPLICATE_PHONE' || err.code === 'DUPLICATE_USER' || err.code === 'DUPLICATE') {
          toast.error(t('tournament_page.registration_failed'), 'Этот номер уже зарегистрирован в турнире')
          return
        }
        if (err.code === 'FULL') {
          toast.error(t('tournament_page.registration_failed'), t('tournament_page.registration_failed_full'))
          return
        }
      }
      toast.error(t('tournament_page.registration_failed'), t('tournament_page.registration_failed_retry'))
    }
  }

  async function handleOrganizerAdd(name: string, phone: string, userId?: string, avatar?: string | null) {
    if (!tournament) return
    try {
      await registerParticipant(tournament.id, { name, phone, userId, avatar })
      setAddByOrgOpen(false)
      toast.success('Участник добавлен', name)
    } catch (err) {
      let msg = 'Попробуйте ещё раз'
      if (err instanceof ApiException) {
        if (err.code === 'DUPLICATE_PHONE') msg = 'Этот номер уже зарегистрирован в турнире'
        else if (err.code === 'DUPLICATE_USER') msg = 'Этот пользователь уже зарегистрирован'
        else if (err.code === 'FULL') msg = 'Свободных мест больше нет'
      }
      toast.error('Не удалось добавить участника', msg)
    }
  }

  function handleShare() {
    if (!tournament) return
    // Для приватных — invite-URL, для публичных — прямой URL
    const url = tournament.isPublic
      ? `${window.location.origin}/tournaments/${tournament.id}`
      : `${window.location.origin}/tournaments?invite=${tournament.inviteCode}`
    if (navigator.share) {
      void navigator.share({ title: tournament.name, url })
      return
    }
    void navigator.clipboard.writeText(url)
    toast.success(t('common.copied'), url)
  }

  return (
    <section className="relative pb-20">
      {/* Cover */}
      <div className={cn('relative h-48 w-full bg-gradient-to-br sm:h-64', tournament.coverGradient)}>
        <div className="absolute inset-0 opacity-30" style={{
          backgroundImage: 'radial-gradient(circle at 25% 25%, rgba(255,255,255,0.5) 0.5px, transparent 0.5px)',
          backgroundSize: '14px 14px',
        }} />
        <div className="absolute inset-0 bg-gradient-to-t from-bg-primary via-bg-primary/40 to-transparent" />

        <Container size="wide" className="relative h-full">
          <div className="flex h-full flex-col justify-end pb-6">
            <Link to="/tournaments" className="mb-4 inline-flex items-center gap-1.5 self-start text-xs text-text-secondary transition hover:text-text-primary">
              <ChevronLeft size={14} /> {t('tournament_page.all_tournaments')}
            </Link>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={statusToBadge[tournament.status]} dot={tournament.status === 'REGISTRATION' || tournament.status === 'ACTIVE'}>
                {t(`tournament_status.${tournament.status.toLowerCase()}`)}
              </Badge>
              <Badge variant="gray">{t(`bracket_type.${tournament.bracketType}`)}</Badge>
              {!tournament.isPublic && (
                <Badge variant="purple"><Lock size={10} /> {t('tournament_page.private')}</Badge>
              )}
            </div>
            <h1 className="mt-3 text-balance text-2xl font-bold tracking-tight text-text-primary sm:text-3xl md:text-4xl lg:text-5xl">
              {tournament.name}
            </h1>
            {tournament.organizerName && (
              <div className="mt-2 text-sm text-text-secondary">{tournament.organizerName}</div>
            )}
          </div>
        </Container>
      </div>

      <Container size="wide" className="-mt-4">
        <div className="grid gap-6 lg:grid-cols-12">
          <div className="lg:col-span-8">
            {/* Tabs */}
            <div className="flex gap-1 overflow-x-auto rounded-2xl border border-[var(--line-strong)] bg-[var(--surface-card)] p-1.5 backdrop-blur-md">
              {([
                { v: 'bracket', label: t('tournament_page.tab_bracket') },
                { v: 'participants', label: t('tournament_page.tab_participants') },
                { v: 'info', label: t('tournament_page.tab_info') },
              ] as { v: Tab; label: string }[]).map((tg) => {
                const active = tab === tg.v
                return (
                  <button
                    key={tg.v}
                    onClick={() => setTab(tg.v)}
                    className={cn(
                      'ring-focus relative shrink-0 rounded-xl px-4 py-2 text-sm font-medium transition-colors',
                      active ? 'text-bg-primary' : 'text-text-secondary hover:text-text-primary',
                    )}
                  >
                    {active && (
                      <motion.span
                        layoutId="tour-tab"
                        className="absolute inset-0 -z-10 rounded-xl bg-emerald-400"
                        transition={{ type: 'spring', stiffness: 360, damping: 28 }}
                      />
                    )}
                    {tg.label}
                  </button>
                )
              })}
            </div>

            <div className="mt-5 rounded-2xl border border-[var(--line)] bg-[var(--surface-card)] p-5 backdrop-blur-md">
              <AnimatePresence mode="wait">
                <motion.div
                  key={tab}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2 }}
                >
                  {tab === 'bracket' && (
                    <>
                      {tournament.matches.length > 0 && (
                        <div className="mb-3 flex justify-end">
                          <Button
                            variant="ghost"
                            size="sm"
                            leftIcon={<Maximize2 size={14} />}
                            onClick={() => setBracketFullscreen(true)}
                          >
                            На весь экран
                          </Button>
                        </div>
                      )}
                      <BracketViewer
                        bracketType={tournament.bracketType}
                        matches={tournament.matches}
                        participants={tournament.participants}
                        isOrganizer={isOrganizer && canEditMatches}
                        onMatchUpdate={(matchId, s1, s2) => {
                          void setMatchScore(tournament.id, matchId, s1, s2)
                            .then(() => toast.success(t('tournament_page.score_updated'), `${s1} : ${s2}`))
                            .catch((err) => toast.error('Не удалось сохранить счёт', err instanceof Error ? err.message : ''))
                        }}
                      />
                    </>
                  )}
                  {tab === 'participants' && (
                    <>
                      {isOrganizer && canAddParticipants && (
                        <div className="mb-4 flex justify-end">
                          <Button
                            variant="primary"
                            size="sm"
                            leftIcon={<UserPlus size={14} />}
                            onClick={() => setAddByOrgOpen(true)}
                          >
                            Добавить участника
                          </Button>
                        </div>
                      )}
                      <ParticipantsTable
                        participants={tournament.participants}
                        isOrganizer={isOrganizer}
                        entryFee={tournament.entryFee ?? null}
                        onToggleCheckin={(pid) => void toggleCheckin(tournament.id, pid)}
                        onTogglePaid={(pid) => void togglePaid(tournament.id, pid)
                          .catch((err) => toast.error('Не удалось обновить взнос', err instanceof Error ? err.message : ''))}
                      />
                    </>
                  )}
                  {tab === 'info' && (
                    <InfoBlock tournament={tournament} dateLabel={dateLabel} />
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-4">
            <div className="sticky top-20 space-y-4">
              <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface-card)] p-5 backdrop-blur-md">
                <SidebarRow icon={<Calendar size={14} />} label={t('tournament_page.starts_at')} value={dateLabel} />
                <SidebarRow icon={<MapPin size={14} />} label={t('tournament_page.location')} value={tournament.location ?? t('tournament_page.participants_table.dash')} />
                <SidebarRow icon={<Trophy size={14} />} label={t('tournament_page.format')} value={t(`bracket_type.${tournament.bracketType}`)} />
                <SidebarRow
                  icon={<Wallet size={14} />} label={t('tournament_page.entry_fee')}
                  value={tournament.entryFee ? `${tournament.entryFee.toLocaleString('ru-RU')} ₸` : t('tournament_page.no_entry_fee')}
                />
                {tournament.prizeFund ? (
                  <SidebarRow icon={<Sparkles size={14} />} label={t('tournament_page.prize_fund')} value={`${tournament.prizeFund.toLocaleString('ru-RU')} ₸`} />
                ) : null}
              </div>

              {/* Прогресс участников */}
              <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface-card)] p-5 backdrop-blur-md">
                <div className="flex items-center justify-between text-sm">
                  <span className="inline-flex items-center gap-2 text-text-secondary">
                    <Users size={14} />
                    {t('dashboard.card.participants', { cur: tournament.participants.length, max: tournament.maxParticipants })}
                  </span>
                  <span className="font-bold text-emerald-400">
                    {Math.round((tournament.participants.length / tournament.maxParticipants) * 100)}%
                  </span>
                </div>
                <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-[var(--surface-input)]">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(tournament.participants.length / tournament.maxParticipants) * 100}%` }}
                    transition={{ duration: 0.8 }}
                    className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-sky-400"
                  />
                </div>

                <div className="mt-4 flex flex-col gap-2">
                  {canRegister ? (
                    <Button variant="primary" fullWidth onClick={handleRegisterClick}>
                      {t('tournament_page.register_cta')}
                    </Button>
                  ) : userIsRegistered ? (
                    <Button variant="secondary" fullWidth disabled leftIcon={<CheckCircle2 size={14} />}>
                      {t('tournament_page.registered_short')}
                    </Button>
                  ) : (
                    <Button variant="secondary" fullWidth disabled>
                      {tournament.status === 'COMPLETED' ? t('tournament_page.tournament_completed') :
                        isFull ? t('tournament_page.no_seats') : t('tournament_page.registration_closed')}
                    </Button>
                  )}
                  <Button variant="ghost" fullWidth onClick={handleShare} leftIcon={<Share2 size={14} />}>
                    {t('tournament_page.share_link')}
                  </Button>
                </div>
              </div>

              {tournament.tables && tournament.tables.length > 0 && (
                <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface-card)] p-5 backdrop-blur-md">
                  <div className="text-sm font-semibold text-text-primary">Столы турнира</div>
                  <div className="mt-1 text-xs text-text-muted">
                    Программа сама распределяет матчи по этим столам.
                  </div>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {tournament.tables.map((n) => (
                      <span
                        key={n}
                        className="inline-flex items-center rounded-md bg-emerald-500/15 px-2 py-0.5 text-xs font-semibold text-emerald-300"
                      >
                        Стол {n}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {tournament.matches.length > 0 && (
                <StandingsPanel
                  bracketType={tournament.bracketType}
                  participants={tournament.participants}
                  matches={tournament.matches}
                />
              )}

              {isOrganizer && (
                <OrganizerPanel
                  status={tournament.status}
                  participantsCount={tournament.participants.length}
                  matchesCount={tournament.matches.length}
                  canAddParticipant={canAddParticipants}
                  onAddParticipant={() => setAddByOrgOpen(true)}
                  onStart={() => {
                    const min = minParticipantsFor(tournament.bracketType)
                    if (tournament.participants.length < min) {
                      toast.warning(
                        t('tournament_page.not_enough_participants'),
                        t('tournament_page.not_enough_participants_desc', {
                          format: t(`bracket_type.${tournament.bracketType}`),
                          min,
                        }),
                      )
                      return
                    }
                    void startTournament(tournament.id)
                      .then(() => {
                        toast.success('Турнир запущен', 'Сетка сформирована автоматически')
                        setTab('bracket')
                      })
                      .catch((err) => toast.error('Не удалось запустить', err instanceof Error ? err.message : ''))
                  }}
                  onComplete={() => {
                    void completeTournament(tournament.id)
                      .then(() => toast.success(t('tournament_page.tournament_completed_toast')))
                      .catch((err) => toast.error('Не удалось завершить', err instanceof Error ? err.message : ''))
                  }}
                />
              )}

              {/* Призы */}
              {tournament.prizePlaces.length > 0 && (
                <div className="rounded-2xl border border-amber-500/20 bg-amber-500/[0.04] p-5 backdrop-blur-md">
                  <div className="text-sm font-semibold text-text-primary">{t('tournament_page.prize_places')}</div>
                  <ul className="mt-3 space-y-2">
                    {tournament.prizePlaces.map((p) => (
                      <li key={p.place} className="flex items-start gap-3 text-sm">
                        <span className={cn(
                          'flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-xs font-bold',
                          p.place === 1 ? 'bg-amber-400 text-bg-primary' :
                          p.place === 2 ? 'bg-slate-300 text-bg-primary' :
                          p.place === 3 ? 'bg-amber-700 text-amber-100' :
                          'bg-[var(--surface-input)] text-text-secondary',
                        )}>{p.place}</span>
                        <span className="text-text-secondary">{p.prize}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      </Container>

      <RegisterModal
        open={registerOpen}
        onClose={() => setRegisterOpen(false)}
        onConfirm={handleConfirmRegister}
        defaultName={user?.name ?? ''}
        defaultPhone={user?.phone ?? ''}
        entryFee={tournament.entryFee ?? null}
      />

      <TelegramPromptModal
        open={telegramPromptOpen}
        onClose={() => setTelegramPromptOpen(false)}
      />

      <AddParticipantModal
        open={addByOrgOpen}
        onClose={() => setAddByOrgOpen(false)}
        onConfirm={handleOrganizerAdd}
        existingUserIds={tournament.participants.map((p) => p.userId).filter((id): id is string => !!id)}
        existingPhones={tournament.participants.map((p) => p.phone).filter((p): p is string => !!p)}
      />

      <BracketFullscreen
        open={bracketFullscreen}
        onClose={() => setBracketFullscreen(false)}
        tournament={tournament}
        isOrganizer={isOrganizer && canEditMatches}
        onMatchUpdate={(matchId, s1, s2) => {
          setMatchScore(tournament.id, matchId, s1, s2)
          toast.success(t('tournament_page.score_updated'), `${s1} : ${s2}`)
        }}
      />
    </section>
  )
}

function SidebarRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-[var(--line)] py-2.5 last:border-b-0 last:pb-0 first:pt-0">
      <span className="inline-flex items-center gap-2 text-xs text-text-muted">{icon}{label}</span>
      <span className="text-right text-sm font-medium text-text-primary">{value}</span>
    </div>
  )
}

function ParticipantsTable({
  participants, isOrganizer, entryFee, onToggleCheckin, onTogglePaid,
}: {
  participants: import('@billiard/shared').Participant[]
  isOrganizer?: boolean
  entryFee?: number | null
  onToggleCheckin: (id: string) => void
  onTogglePaid: (id: string) => void
}) {
  const { t, i18n } = useTranslation()
  // Колонку взноса показываем организатору только если у турнира есть платный вход.
  const showPaid = !!isOrganizer && !!entryFee
  if (participants.length === 0) {
    return (
      <div className="py-12 text-center">
        <Users className="mx-auto text-text-muted" size={32} />
        <div className="mt-3 text-text-primary">{t('tournament_page.no_participants_yet')}</div>
        <div className="mt-1 text-xs text-text-muted">{t('tournament_page.be_first')}</div>
      </div>
    )
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[480px] text-sm">
        <thead>
          <tr className="text-left text-xs uppercase tracking-wider text-text-muted">
            <th className="px-2 py-2">{t('tournament_page.participants_table.header_num')}</th>
            <th className="px-2 py-2">{t('tournament_page.participants_table.header_name')}</th>
            {isOrganizer && <th className="hidden px-2 py-2 sm:table-cell">{t('tournament_page.participants_table.header_phone')}</th>}
            {showPaid && <th className="px-2 py-2">{t('tournament_page.participants_table.header_fee')}</th>}
            <th className="hidden px-2 py-2 md:table-cell">{t('tournament_page.participants_table.header_registered')}</th>
            <th className="px-2 py-2 text-right">{t('tournament_page.participants_table.header_status')}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--line)]">
          {participants.map((p, i) => (
            <tr key={p.id} className="hover:bg-[var(--surface-card-hover)]">
              <td className="px-2 py-3 text-text-muted">{i + 1}</td>
              <td className="px-2 py-3 font-medium text-text-primary">{p.name}</td>
              {isOrganizer && (
                <td className="hidden px-2 py-3 text-text-secondary tabular-nums sm:table-cell">{p.phone ?? t('tournament_page.participants_table.dash')}</td>
              )}
              {showPaid && (
                <td className="px-2 py-3">
                  <button
                    onClick={() => onTogglePaid(p.id)}
                    className={cn(
                      'ring-focus inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-all',
                      p.paid
                        ? 'border-emerald-500/30 bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/20'
                        : 'border-amber-500/30 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20',
                    )}
                  >
                    <Wallet size={12} />
                    {p.paid ? t('tournament_page.participants_table.paid') : t('tournament_page.participants_table.not_paid')}
                  </button>
                </td>
              )}
              <td className="hidden px-2 py-3 text-text-secondary md:table-cell">
                {new Date(p.registeredAt).toLocaleString(i18n.language === 'ru' ? 'ru-RU' : 'kk-KZ', {
                  day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
                })}
              </td>
              <td className="px-2 py-3 text-right">
                {isOrganizer ? (
                  <button
                    onClick={() => onToggleCheckin(p.id)}
                    className={cn(
                      'ring-focus inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-all',
                      p.checkedIn
                        ? 'border-emerald-500/30 bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/20'
                        : 'border-[var(--line-strong)] bg-[var(--surface-card)] text-text-muted hover:text-text-primary',
                    )}
                  >
                    {p.checkedIn ? <CheckCircle2 size={12} /> : <Circle size={12} />}
                    {p.checkedIn ? t('tournament_page.participants_table.checked_in') : t('tournament_page.participants_table.not_checked')}
                  </button>
                ) : (
                  <span className={cn(
                    'inline-flex items-center gap-1.5 text-xs',
                    p.checkedIn ? 'text-emerald-400' : 'text-text-muted',
                  )}>
                    {p.checkedIn ? <CheckCircle2 size={12} /> : <Circle size={12} />}
                    {p.checkedIn ? t('tournament_page.participants_table.checked_in') : t('tournament_page.participants_table.dash')}
                  </span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function InfoBlock({ tournament, dateLabel }: { tournament: import('@billiard/shared').Tournament; dateLabel: string }) {
  const { t } = useTranslation()
  return (
    <div className="space-y-5">
      {tournament.description && (
        <p className="text-sm leading-relaxed text-text-secondary">{tournament.description}</p>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <InfoLine icon={<Calendar size={14} />} label={t('tournament_page.starts_at')} value={dateLabel} />
        <InfoLine icon={<MapPin size={14} />} label={t('tournament_page.location')} value={tournament.location ?? t('tournament_page.participants_table.dash')} />
        <InfoLine icon={<Trophy size={14} />} label={t('tournament_page.format')} value={t(`bracket_type.${tournament.bracketType}`)} />
        <InfoLine icon={<Users size={14} />} label={t('tournament_page.max_participants')} value={String(tournament.maxParticipants)} />
        <InfoLine icon={<Wallet size={14} />} label={t('tournament_page.entry_fee')}
          value={tournament.entryFee ? `${tournament.entryFee.toLocaleString('ru-RU')} ₸` : t('tournament_page.no_entry_fee')} />
        {tournament.prizeFund != null && (
          <InfoLine icon={<Sparkles size={14} />} label={t('tournament_page.prize_fund')} value={`${tournament.prizeFund.toLocaleString('ru-RU')} ₸`} />
        )}
        {tournament.organizerName && (
          <InfoLine icon={<Users size={14} />} label={t('tournament_page.organizer')} value={tournament.organizerName} />
        )}
      </div>
    </div>
  )
}

function InfoLine({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-xl border border-[var(--line)] bg-[var(--surface-card)] p-3">
      <div className="inline-flex items-center gap-1.5 text-xs text-text-muted">{icon}{label}</div>
      <div className="mt-1 text-sm font-medium text-text-primary">{value}</div>
    </div>
  )
}

function OrganizerPanel({
  status, participantsCount, matchesCount, canAddParticipant, onAddParticipant, onStart, onComplete,
}: {
  status: TournamentStatus
  participantsCount: number
  matchesCount: number
  canAddParticipant: boolean
  onAddParticipant: () => void
  onStart: () => void
  onComplete: () => void
}) {
  const { t } = useTranslation()
  const notStarted = (status === 'REGISTRATION' || status === 'DRAFT') && matchesCount === 0
  const inProgress = status === 'ACTIVE' || matchesCount > 0
  return (
    <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/[0.05] p-5 backdrop-blur-md">
      <div className="flex items-center gap-2 text-sm font-semibold text-text-primary">
        <Settings size={14} className="text-emerald-400" /> {t('tournament_page.manage')}
      </div>
      <div className="mt-3 space-y-2">
        {canAddParticipant && (
          <Button
            variant="secondary"
            fullWidth
            leftIcon={<UserPlus size={14} />}
            onClick={onAddParticipant}
          >
            Добавить участника
          </Button>
        )}
        {notStarted && (
          <Button
            variant="primary"
            fullWidth
            leftIcon={<Play size={14} />}
            onClick={onStart}
            disabled={participantsCount < 2}
          >
            Начать турнир
          </Button>
        )}
        {inProgress && status !== 'COMPLETED' && (
          <Button variant="secondary" fullWidth leftIcon={<CheckCircle2 size={14} />} onClick={onComplete}>
            Завершить турнир
          </Button>
        )}
        <p className="mt-2 text-xs text-text-muted">
          Сетка формируется автоматически при запуске турнира.
        </p>
      </div>
    </div>
  )
}

function RegisterModal({
  open, onClose, onConfirm, defaultName, defaultPhone, entryFee,
}: {
  open: boolean
  onClose: () => void
  onConfirm: (name: string, phone: string) => void
  defaultName: string
  defaultPhone: string
  entryFee: number | null
}) {
  const { t } = useTranslation()
  const [name, setName] = useState(defaultName)
  const [phone, setPhone] = useState(defaultPhone)
  const [agreed, setAgreed] = useState(false)

  useEffect(() => {
    if (open) { setName(defaultName); setPhone(defaultPhone); setAgreed(false) }
  }, [open, defaultName, defaultPhone])

  const feeLabel = entryFee
    ? `${entryFee.toLocaleString('ru-RU')} ₸`
    : t('tournament_page.no_entry_fee')

  return (
    <Modal open={open} onClose={onClose} size="sm" title={t('tournament_page.register_modal_title')}>
      <div className="px-6 py-5 space-y-4">
        {/* Условия участия: взнос + просьба прийти заранее */}
        <div className="space-y-2.5 rounded-2xl border border-[var(--line)] bg-[var(--surface-input)] p-4">
          <div className="flex items-center justify-between gap-3">
            <span className="inline-flex items-center gap-2 text-sm text-text-secondary">
              <Wallet size={15} className="text-emerald-400" /> {t('tournament_page.entry_fee')}
            </span>
            <span className="text-sm font-bold text-text-primary">{feeLabel}</span>
          </div>
          {entryFee ? (
            <p className="text-xs leading-relaxed text-text-muted">
              {t('tournament_page.register_fee_note', { fee: feeLabel })}
            </p>
          ) : null}
          <div className="flex items-start gap-2 border-t border-[var(--line)] pt-2.5 text-xs leading-relaxed text-text-muted">
            <Clock size={14} className="mt-0.5 shrink-0 text-sky-400" />
            <span>{t('tournament_page.register_arrive_early')}</span>
          </div>
        </div>

        <Input
          label={t('auth.name_label')}
          value={name}
          onChange={(e) => setName(e.target.value)}
          size="lg"
        />
        <Input
          label={t('auth.phone_label')}
          value={phone}
          onChange={(e) => setPhone(formatPhone(e.target.value))}
          inputMode="tel"
          size="lg"
        />

        {/* Согласие с условиями — обязательно для регистрации */}
        <label className="flex cursor-pointer items-start gap-2.5 text-xs leading-relaxed text-text-secondary">
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer accent-emerald-500"
          />
          <span>
            {entryFee
              ? t('tournament_page.register_consent_paid', { fee: feeLabel })
              : t('tournament_page.register_consent_free')}
          </span>
        </label>

        <div className="flex gap-3 pt-2">
          <Button variant="secondary" fullWidth onClick={onClose}>{t('common.cancel')}</Button>
          <Button
            variant="primary"
            fullWidth
            disabled={!name.trim() || !phone || !agreed}
            onClick={() => onConfirm(name.trim(), phone)}
          >
            {t('tournament_page.register_modal_confirm')}
          </Button>
        </div>
      </div>
    </Modal>
  )
}

/* ────────────────── Пост-регистрация: подключение Telegram ────────────────── */

function TelegramPromptModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useTranslation()
  const [status, setStatus] = useState<{ connected: boolean; username: string | null } | null>(null)
  const [loading, setLoading] = useState(false)
  const [issuing, setIssuing] = useState(false)
  const [deepLink, setDeepLink] = useState<string | null>(null)
  const [token, setToken] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setDeepLink(null)
    setToken(null)
    setLoading(true)
    authApi.telegramStatus()
      .then((s) => setStatus(s))
      .catch(() => setStatus({ connected: false, username: null }))
      .finally(() => setLoading(false))
  }, [open])

  async function connect(): Promise<void> {
    setIssuing(true)
    try {
      const res = await authApi.telegramLinkToken()
      setToken(res.token)
      setDeepLink(res.deepLink)
      if (res.deepLink) window.open(res.deepLink, '_blank', 'noopener,noreferrer')
    } catch (e) {
      toast.error(e instanceof ApiException ? e.message : 'Не удалось подключить Telegram')
    } finally {
      setIssuing(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} size="sm" title={t('tournament_page.tg_modal_title')}>
      <div className="px-6 py-5 space-y-4">
        <div className="flex items-start gap-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4">
          <PartyPopper size={22} className="mt-0.5 shrink-0 text-emerald-400" />
          <div className="space-y-1">
            <div className="text-sm font-semibold text-text-primary">{t('tournament_page.tg_modal_success')}</div>
            <p className="text-xs leading-relaxed text-text-muted">{t('tournament_page.tg_modal_arrive_early')}</p>
          </div>
        </div>

        {loading ? (
          <div className="text-sm text-text-muted">{t('common.loading')}</div>
        ) : status?.connected ? (
          <div className="inline-flex items-center gap-2 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm">
            <CheckCircle2 size={16} className="text-emerald-400" />
            <span className="text-emerald-200">{t('tournament_page.tg_modal_already')}</span>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-text-secondary">{t('tournament_page.tg_modal_offer')}</p>
            <Button
              variant="primary"
              fullWidth
              leftIcon={<Send size={15} />}
              loading={issuing}
              onClick={() => void connect()}
            >
              {t('tournament_page.tg_modal_connect')}
            </Button>
            {token && (
              <div className="space-y-2 rounded-xl border border-[var(--line)] bg-[var(--surface-input)] p-3">
                <p className="text-xs text-text-muted">{t('tournament_page.tg_modal_manual')}</p>
                {deepLink && (
                  <a
                    href={deepLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-300 hover:text-emerald-200"
                  >
                    <ExternalLink size={14} /> {t('tournament_page.tg_modal_open_bot')}
                  </a>
                )}
                <code className="block truncate rounded-lg border border-[var(--line)] bg-[var(--surface-card)] px-3 py-2 font-mono text-xs text-text-primary">
                  /start {token}
                </code>
              </div>
            )}
          </div>
        )}

        <Button variant="ghost" fullWidth onClick={onClose}>{t('tournament_page.tg_modal_later')}</Button>
      </div>
    </Modal>
  )
}

/* ────────────────── Organizer: добавить участника ────────────────── */

const ALLOWED_AVATAR_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
const MAX_AVATAR_BYTES = 5 * 1024 * 1024

function AddParticipantModal({
  open, onClose, onConfirm, existingUserIds, existingPhones,
}: {
  open: boolean
  onClose: () => void
  onConfirm: (name: string, phone: string, userId?: string, avatar?: string | null) => void
  existingUserIds: string[]
  existingPhones: string[]
}) {
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [uploadedAvatar, setUploadedAvatar] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [lookingUp, setLookingUp] = useState(false)
  const [found, setFound] = useState<LookupUser | null>(null)
  const [lookupError, setLookupError] = useState<string | null>(null)
  const lookupTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) {
      setName('')
      setPhone('')
      setUploadedAvatar(null)
      setUploading(false)
      setFound(null)
      setLookupError(null)
    } else if (lookupTimer.current) {
      clearTimeout(lookupTimer.current)
      lookupTimer.current = null
    }
  }, [open])

  async function uploadAvatar(file: File): Promise<void> {
    if (!ALLOWED_AVATAR_TYPES.has(file.type)) {
      toast.error('Поддерживаются JPEG, PNG, WebP, GIF')
      return
    }
    if (file.size > MAX_AVATAR_BYTES) {
      toast.error('Файл больше 5 МБ')
      return
    }
    setUploading(true)
    try {
      const { uploadUrl, publicUrl } = await authApi.presignAvatarUpload({
        contentType: file.type,
        size: file.size,
      })
      const res = await fetch(uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': file.type },
        body: file,
      })
      if (!res.ok) throw new Error(`Ошибка загрузки: ${res.status}`)
      setUploadedAvatar(publicUrl)
    } catch (e) {
      if (e instanceof ApiException && e.code === 'S3_NOT_CONFIGURED') {
        toast.error('Загрузка временно недоступна', 'Сохраним без фото')
      } else {
        toast.error(e instanceof Error ? e.message : 'Не удалось загрузить фото')
      }
    } finally {
      setUploading(false)
    }
  }

  // Если телефон изменили — сбрасываем найденного пользователя и запускаем авто-поиск.
  function onPhoneChange(value: string) {
    const formatted = formatPhone(value)
    setPhone(formatted)
    if (found) setFound(null)
    if (lookupError) setLookupError(null)
    if (lookupTimer.current) {
      clearTimeout(lookupTimer.current)
      lookupTimer.current = null
    }
    // Автозапрос, как только номер стал валидным — с лёгким дебаунсом.
    if (isValidPhone(formatted)) {
      lookupTimer.current = setTimeout(() => { void doLookup(normalizePhone(formatted)) }, 400)
    }
  }

  async function doLookup(targetPhone?: string) {
    const normalized = targetPhone ?? (isValidPhone(phone) ? normalizePhone(phone) : null)
    if (!normalized) {
      setLookupError('Введите корректный номер +7XXXXXXXXXX')
      return
    }
    if (existingPhones.includes(normalized)) {
      setLookupError('Этот номер уже зарегистрирован в турнире')
      return
    }
    setLookingUp(true)
    setLookupError(null)
    setFound(null)
    try {
      const { user } = await authApi.lookupByPhone(normalized)
      if (existingUserIds.includes(user.id)) {
        setLookupError('Этот пользователь уже зарегистрирован в турнире')
        return
      }
      setFound(user)
      setName(user.name)
    } catch (err) {
      if (err instanceof ApiException && err.status === 404) {
        // Не ошибка — просто можно ввести имя вручную.
        setLookupError(null)
      } else {
        setLookupError(err instanceof ApiException ? err.message : 'Не удалось выполнить поиск')
      }
    } finally {
      setLookingUp(false)
    }
  }

  const phoneIsValid = isValidPhone(phone)
  const canSubmit = phoneIsValid && name.trim().length >= 2
  const normalizedPhone = phoneIsValid ? normalizePhone(phone) : ''
  const isDuplicatePhone = phoneIsValid && existingPhones.includes(normalizedPhone)

  function submit() {
    if (!canSubmit || isDuplicatePhone || uploading) return
    const avatar = found?.avatar ?? uploadedAvatar ?? null
    onConfirm(name.trim(), normalizedPhone, found?.id, avatar)
  }

  return (
    <Modal open={open} onClose={onClose} size="sm" title="Добавить участника">
      <div className="px-6 py-5 space-y-4">
        <p className="text-xs text-text-muted">
          Введите номер — программа сама найдёт игрока по базе и подставит имя с фото. Если в
          базе его нет — впишите имя вручную, фото при желании.
        </p>

        <Input
          label="Телефон"
          value={phone}
          onChange={(e) => onPhoneChange(e.target.value)}
          placeholder="+7 (___) ___-__-__"
          leftIcon={<PhoneIcon size={16} />}
          inputMode="tel"
          autoComplete="tel"
          size="lg"
          error={
            isDuplicatePhone ? 'Этот номер уже зарегистрирован в турнире' :
            lookupError ??
            (phone.length > 0 && !phoneIsValid ? 'Введите корректный номер' : null)
          }
        />
        {lookingUp && (
          <div className="inline-flex items-center gap-2 text-xs text-text-muted">
            <Search size={12} className="animate-pulse" /> Ищем в базе…
          </div>
        )}

        {found && (
          <div className="flex items-start gap-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-3.5">
            <div className="h-10 w-10 shrink-0 overflow-hidden rounded-xl bg-emerald-500/20">
              {found.avatar ? (
                <img src={found.avatar} alt={found.name} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-sm font-bold text-emerald-300">
                  {found.name.slice(0, 1).toUpperCase()}
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-semibold text-text-primary">{found.name}</div>
              <div className="text-xs text-text-muted">
                {found.accountType === 'CLUB' ? 'Клубный аккаунт' : 'Игрок'} · {formatPhone(found.phone)}
              </div>
              <div className="mt-1 inline-flex items-center gap-1 rounded-md bg-emerald-500/20 px-1.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-emerald-300">
                Найден в базе
              </div>
            </div>
            <button
              type="button"
              onClick={() => { setFound(null); setName('') }}
              className="ring-focus rounded-md p-1 text-text-muted hover:text-text-primary"
              aria-label="Сбросить"
            >
              <X size={14} />
            </button>
          </div>
        )}

        <Input
          label="Имя"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Например, Алишер"
          maxLength={80}
          size="lg"
          disabled={!!found}
          error={name.length > 0 && name.trim().length < 2 ? 'Минимум 2 символа' : null}
        />

        {!found && (
          <div>
            <div className="mb-1.5 block text-xs font-medium text-text-secondary">
              Фото (необязательно)
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                aria-label="Загрузить фото"
                className="ring-focus group relative h-14 w-14 shrink-0 overflow-hidden rounded-2xl border border-dashed border-[var(--line-strong)] bg-[var(--surface-input)] transition hover:border-emerald-400/60"
              >
                {uploadedAvatar ? (
                  <img src={uploadedAvatar} alt="Фото участника" className="h-full w-full object-cover" />
                ) : uploading ? (
                  <Loader2 size={18} className="mx-auto animate-spin text-text-muted" />
                ) : (
                  <Camera size={18} className="mx-auto text-text-muted" />
                )}
                {uploadedAvatar && (
                  <div className="absolute inset-0 hidden items-center justify-center bg-black/50 group-hover:flex">
                    <Camera size={16} className="text-white" />
                  </div>
                )}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0]
                  if (f) void uploadAvatar(f)
                  e.target.value = ''
                }}
              />
              <div className="flex flex-1 flex-wrap gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  leftIcon={uploading ? <Loader2 size={14} className="animate-spin" /> : <Camera size={14} />}
                  loading={uploading}
                  onClick={() => fileInputRef.current?.click()}
                >
                  {uploadedAvatar ? 'Заменить фото' : 'Загрузить фото'}
                </Button>
                {uploadedAvatar && !uploading && (
                  <Button
                    variant="ghost"
                    size="sm"
                    leftIcon={<Trash2 size={14} />}
                    onClick={() => setUploadedAvatar(null)}
                  >
                    Убрать
                  </Button>
                )}
              </div>
            </div>
            <div className="mt-1.5 text-[11px] text-text-muted">
              JPEG, PNG, WebP или GIF, до 5 МБ. Можно пропустить.
            </div>
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <Button variant="secondary" fullWidth onClick={onClose}>Отмена</Button>
          <Button
            variant="primary"
            fullWidth
            disabled={!canSubmit || isDuplicatePhone || uploading}
            onClick={submit}
          >
            Добавить
          </Button>
        </div>
      </div>
    </Modal>
  )
}

/* ────────────────── Live standings ────────────────── */

interface RankRow { participant: Participant; label: string; rank: number }

/**
 * Считает текущие позиции участников для elimination-сеток:
 * — победитель финала: 1 место
 * — проигравший финала: 2
 * — проигравшие полуфинала: 3-4
 * — и т.д. по раундам выбывания
 * Ещё не выбывшие отображаются с пометкой «в игре».
 */
function computeEliminationStandings(
  matches: Match[],
  participants: Participant[],
): RankRow[] {
  const mainMatches = matches.filter((m) => m.stage === 'main' || !m.stage)
  if (mainMatches.length === 0) return []

  const maxRound = mainMatches.reduce((a, m) => Math.max(a, m.round), 0)
  const eliminatedAtRound = new Map<string, number>()

  for (const m of mainMatches) {
    if (m.status !== 'completed') continue
    if (!m.winnerId) continue
    const loserId = m.winnerId === m.participant1Id ? m.participant2Id : m.participant1Id
    if (!loserId) continue
    if (!eliminatedAtRound.has(loserId)) eliminatedAtRound.set(loserId, m.round)
  }

  // Победитель финала (если есть) — 1 место.
  const finalMatch = mainMatches.find((m) => m.round === maxRound && m.status === 'completed')
  const championId = finalMatch?.winnerId

  const rows: RankRow[] = participants.map((p) => {
    if (championId === p.id) {
      return { participant: p, label: '1 место', rank: 1 }
    }
    const elim = eliminatedAtRound.get(p.id)
    if (elim != null) {
      // Места: 2 за финал, 3-4 за полуфинал, 5-8 за 1/4 и т.д.
      if (elim === maxRound) return { participant: p, label: '2 место', rank: 2 }
      const placeStart = Math.pow(2, maxRound - elim) + 1
      const placeEnd = Math.pow(2, maxRound - elim + 1)
      const label = placeStart === placeEnd ? `${placeStart} место` : `${placeStart}–${placeEnd} место`
      return { participant: p, label, rank: placeStart }
    }
    return { participant: p, label: 'В игре', rank: 0 }
  })

  return rows.sort((a, b) => {
    if (a.rank === 0 && b.rank !== 0) return -1
    if (a.rank !== 0 && b.rank === 0) return 1
    return a.rank - b.rank
  })
}

function StandingsPanel({
  bracketType, participants, matches,
}: {
  bracketType: BracketType
  participants: Participant[]
  matches: Match[]
}) {
  const isElimination = bracketType === 'single-elimination' || bracketType === 'double-elimination'

  if (isElimination) {
    const rows = computeEliminationStandings(matches, participants)
    if (rows.length === 0) return null
    return (
      <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface-card)] p-5 backdrop-blur-md">
        <div className="text-sm font-semibold text-text-primary">Текущие места</div>
        <ul className="mt-3 max-h-72 space-y-1 overflow-y-auto pr-1">
          {rows.map((r) => (
            <li key={r.participant.id} className="flex items-center justify-between gap-2 text-sm">
              <span className="min-w-0 flex-1 truncate text-text-secondary">{r.participant.name}</span>
              <span className={cn(
                'shrink-0 rounded-md px-2 py-0.5 text-[11px] font-semibold',
                r.rank === 1 ? 'bg-amber-400/20 text-amber-300' :
                r.rank === 2 ? 'bg-slate-400/20 text-slate-300' :
                r.rank === 3 ? 'bg-amber-700/20 text-amber-200' :
                r.rank === 0 ? 'bg-emerald-500/15 text-emerald-300' :
                'bg-[var(--surface-input)] text-text-muted',
              )}>{r.label}</span>
            </li>
          ))}
        </ul>
      </div>
    )
  }

  // Round-robin / Swiss / Group-playoff — табличные standings.
  const rows = computeStandings(participants, matches)
  if (rows.length === 0) return null
  return (
    <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface-card)] p-5 backdrop-blur-md">
      <div className="text-sm font-semibold text-text-primary">Текущая таблица</div>
      <div className="mt-3 max-h-72 overflow-y-auto pr-1">
        <table className="w-full text-xs">
          <thead className="text-text-muted">
            <tr>
              <th className="px-1 py-1 text-left">#</th>
              <th className="px-1 py-1 text-left">Игрок</th>
              <th className="px-1 py-1 text-right">И</th>
              <th className="px-1 py-1 text-right">В</th>
              <th className="px-1 py-1 text-right">О</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--line)]">
            {rows.map((r) => (
              <tr key={r.participant.id}>
                <td className={cn(
                  'px-1 py-1.5 font-semibold',
                  r.rank === 1 ? 'text-amber-300' : r.rank === 2 ? 'text-slate-300' : r.rank === 3 ? 'text-amber-200' : 'text-text-muted',
                )}>{r.rank}</td>
                <td className="px-1 py-1.5 truncate text-text-secondary">{r.participant.name}</td>
                <td className="px-1 py-1.5 text-right tabular-nums text-text-muted">{r.played}</td>
                <td className="px-1 py-1.5 text-right tabular-nums text-text-secondary">{r.wins}</td>
                <td className="px-1 py-1.5 text-right tabular-nums font-semibold text-emerald-300">{r.points}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

/* ────────────────── Fullscreen bracket viewer ────────────────── */

function BracketFullscreen({
  open, onClose, tournament, isOrganizer, onMatchUpdate,
}: {
  open: boolean
  onClose: () => void
  tournament: Tournament
  isOrganizer: boolean
  onMatchUpdate: (matchId: string, s1: number, s2: number) => void
}) {
  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onEsc)
    return () => {
      document.body.style.overflow = prev
      document.removeEventListener('keydown', onEsc)
    }
  }, [open, onClose])

  if (!open) return null
  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-bg-primary">
      <header className="flex items-center justify-between gap-3 border-b border-[var(--line)] px-4 py-3 sm:px-6">
        <div className="flex items-center gap-3 min-w-0">
          <Trophy size={18} className="shrink-0 text-emerald-400" />
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold text-text-primary">{tournament.name}</div>
            <div className="text-[11px] text-text-muted">Полноэкранный режим · Esc — закрыть</div>
          </div>
        </div>
        <Button variant="secondary" size="sm" leftIcon={<Minimize2 size={14} />} onClick={onClose}>
          Свернуть
        </Button>
      </header>

      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        <div className="min-h-0 flex-1 overflow-auto p-4 sm:p-6">
          <BracketViewer
            bracketType={tournament.bracketType}
            matches={tournament.matches}
            participants={tournament.participants}
            isOrganizer={isOrganizer}
            onMatchUpdate={onMatchUpdate}
          />
        </div>

        <aside className="border-t border-[var(--line)] bg-bg-secondary/40 p-4 lg:w-80 lg:shrink-0 lg:border-l lg:border-t-0 lg:p-5">
          <div className="space-y-4 lg:sticky lg:top-0 lg:max-h-[calc(100vh-64px)] lg:overflow-y-auto">
            <StandingsPanel
              bracketType={tournament.bracketType}
              participants={tournament.participants}
              matches={tournament.matches}
            />

            <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface-card)] p-5">
              <div className="text-sm font-semibold text-text-primary">Участники</div>
              <ul className="mt-3 max-h-72 space-y-1 overflow-y-auto pr-1">
                {tournament.participants.map((p, i) => (
                  <li key={p.id} className="flex items-center justify-between text-sm">
                    <span className="flex min-w-0 items-center gap-2">
                      <span className="text-text-muted">{i + 1}.</span>
                      <span className="truncate text-text-secondary">{p.name}</span>
                    </span>
                    {p.checkedIn && (
                      <CheckCircle2 size={12} className="shrink-0 text-emerald-400" />
                    )}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}

