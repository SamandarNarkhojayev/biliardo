import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { Search, Filter, Inbox } from 'lucide-react'
import { Container } from '@/components/ui/Container'
import { Input } from '@/components/ui/Input'
import { TournamentCard } from '@/components/tournament/TournamentCard'
import { useTournamentsStore } from '@/store/tournaments'
import { api, ApiException } from '@/api/client'
import { toast } from '@/components/ui/Toast'
import type { Tournament, TournamentStatus } from '@billiard/shared'
import { cn } from '@/utils/cn'
import { Seo } from '@/components/Seo'

type FilterValue = 'ALL' | TournamentStatus

const filters: { value: FilterValue; key: string }[] = [
  { value: 'ALL', key: 'tournaments_page.filter_all' },
  { value: 'REGISTRATION', key: 'tournament_status.registration' },
  { value: 'ACTIVE', key: 'tournament_status.active' },
  { value: 'COMPLETED', key: 'tournament_status.completed' },
]

const PAGE_SIZE = 9

export default function Tournaments() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const localTournaments = useTournamentsStore((s) => s.tournaments)
  const fetchByInvite = useTournamentsStore((s) => s.fetchByInvite)

  const [serverTournaments, setServerTournaments] = useState<Tournament[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<FilterValue>('ALL')
  const [visible, setVisible] = useState(PAGE_SIZE)

  // Каталог тянем из tournament-service (server-side источник правды).
  // Локальный store (turnirы, созданные через wizard в этой сессии) дополнит список.
  useEffect(() => {
    let cancelled = false
    setLoading(true)
    // sort=upcoming — по дате REGISTRATION/ACTIVE; limit=100 хватает для каталога.
    api.get<{ tournaments: Tournament[] }>('/tournaments?limit=100&sort=upcoming')
      .then((d) => {
        if (!cancelled) {
          setServerTournaments(d.tournaments)
          setLoadError(null)
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setLoadError(err instanceof ApiException ? err.message : 'Не удалось загрузить каталог')
        }
      })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])

  useEffect(() => { setVisible(PAGE_SIZE) }, [search, filter])

  // Дедуп по id: серверные приоритетнее, если вдруг локальный turn'ир с тем же id.
  const tournaments = useMemo(() => {
    const map = new Map<string, Tournament>()
    for (const t of localTournaments) map.set(t.id, t)
    for (const t of serverTournaments) map.set(t.id, t)
    return Array.from(map.values())
  }, [localTournaments, serverTournaments])

  // ?invite=CODE → редирект на детали приватного турнира (lookup на бэкенде)
  useEffect(() => {
    const code = params.get('invite')
    if (!code) return
    params.delete('invite')
    setParams(params, { replace: true })
    void fetchByInvite(code).then((tour) => {
      if (tour) navigate(`/tournaments/${tour.id}`, { replace: true })
      else toast.error(t('tournament_page.invite_invalid_title'), t('tournament_page.invite_invalid_desc'))
    })
  }, [params, fetchByInvite, navigate, setParams, t])

  // Только публичные турниры — приватные доступны по invite-ссылке
  const publicTournaments = useMemo(
    () => tournaments.filter((x) => x.isPublic),
    [tournaments],
  )

  // Debounce поиска — фильтр большого списка перестаёт прыгать на каждом символе.
  const [debouncedSearch, setDebouncedSearch] = useState(search)
  useEffect(() => {
    const id = setTimeout(() => setDebouncedSearch(search), 180)
    return () => clearTimeout(id)
  }, [search])

  const filtered = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase()
    return publicTournaments.filter((tour) => {
      const matchesFilter = filter === 'ALL' || tour.status === filter
      if (!matchesFilter) return false
      if (!q) return true
      return (
        tour.name.toLowerCase().includes(q) ||
        (tour.city ?? '').toLowerCase().includes(q) ||
        (tour.location ?? '').toLowerCase().includes(q)
      )
    }).sort((a, b) => {
      // Сначала активные/регистрация → потом завершённые
      const order: Record<TournamentStatus, number> = {
        REGISTRATION: 0, ACTIVE: 1, DRAFT: 2, COMPLETED: 3, CANCELLED: 4,
      }
      const diff = order[a.status] - order[b.status]
      if (diff !== 0) return diff
      const da = new Date(a.scheduledAt ?? a.createdAt).getTime()
      const db = new Date(b.scheduledAt ?? b.createdAt).getTime()
      return da - db
    })
  }, [publicTournaments, filter, debouncedSearch])

  const visibleItems = filtered.slice(0, visible)
  const hasMore = filtered.length > visible

  return (
    <section className="relative py-10 sm:py-14">
      <Seo
        title="Турниры по бильярду в Казахстане — расписание и регистрация | Biliardo"
        description="Актуальные турниры по бильярду: Алматы, Астана, Шымкент и другие города Казахстана. Онлайн-регистрация, live-сетки и расписание матчей."
        keywords="турниры по бильярду Казахстан, бильярдные турниры Алматы, бильярдные турниры Астана, расписание турниров, онлайн регистрация на турнир"
        path="/tournaments"
      />
      <div className="bg-mesh absolute inset-0 -z-10 opacity-40" aria-hidden />
      <Container size="wide">
        <div className="text-center sm:text-left">
          <h1 className="text-3xl font-bold tracking-tight text-text-primary sm:text-4xl md:text-5xl">
            {t('tournaments_page.title')}
          </h1>
          <p className="mt-2 text-base text-text-secondary">
            {t('tournaments_page.subtitle')}
          </p>
        </div>

        <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex-1">
            <Input
              placeholder={t('tournaments_page.search_placeholder')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              leftIcon={<Search size={16} />}
              size="lg"
            />
          </div>
          <div className="hidden text-xs text-text-muted sm:flex sm:items-center sm:gap-1.5">
            <Filter size={14} /> {t('tournaments_page.filter_status')}:
          </div>
        </div>

        <div className="mt-3 flex gap-1.5 overflow-x-auto pb-1">
          {filters.map((f) => {
            const active = filter === f.value
            return (
              <button
                key={f.value}
                onClick={() => setFilter(f.value)}
                className={cn(
                  'ring-focus shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-all',
                  active
                    ? 'bg-emerald-400 text-bg-primary'
                    : 'border border-[var(--line-strong)] bg-[var(--surface-card)] text-text-secondary hover:text-text-primary',
                )}
              >
                {t(f.key)}
              </button>
            )
          })}
        </div>

        {loading ? (
          <div className="mt-7 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-72 animate-pulse rounded-2xl border border-[var(--line)] bg-[var(--surface-card)]" />
            ))}
          </div>
        ) : loadError ? (
          <div className="mt-12 rounded-2xl border border-red-500/40 bg-red-500/5 p-6 text-center text-sm text-red-300">
            {loadError}
          </div>
        ) : filtered.length === 0 ? (
          <div className="mt-12 flex flex-col items-center justify-center rounded-3xl border border-dashed border-[var(--line-strong)] bg-[var(--surface-card)] py-16 text-center">
            <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--surface-input)] text-text-muted">
              <Inbox size={24} />
            </div>
            <h3 className="text-lg font-semibold text-text-primary">{t('tournaments_page.empty_title')}</h3>
            <p className="mt-1 text-sm text-text-secondary">{t('tournaments_page.empty_subtitle')}</p>
          </div>
        ) : (
          <>
            <motion.div
              initial="initial"
              animate="animate"
              variants={{ animate: { transition: { staggerChildren: 0.04 } } }}
              className="mt-7 grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
            >
              {visibleItems.map((tour) => (
                <motion.div
                  key={tour.id}
                  variants={{
                    initial: { opacity: 0, y: 16 },
                    animate: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.4, 0, 0.2, 1] } },
                  }}
                >
                  <TournamentCard tournament={tour} />
                </motion.div>
              ))}
            </motion.div>

            {hasMore && (
              <div className="mt-10 flex justify-center">
                <button
                  onClick={() => setVisible((v) => v + PAGE_SIZE)}
                  className="ring-focus rounded-full border border-[var(--line-strong)] bg-[var(--surface-card)] px-6 py-3 text-sm font-medium text-text-primary transition hover:bg-[var(--surface-card-hover)]"
                >
                  {t('tournaments_page_extra.show_more', { count: filtered.length - visible })}
                </button>
              </div>
            )}
          </>
        )}
      </Container>
    </section>
  )
}
