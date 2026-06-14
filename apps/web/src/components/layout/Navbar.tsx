import { useEffect, useState } from 'react'
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, X, Plus, Cpu, Trophy, UserCircle2, LayoutDashboard } from 'lucide-react'
import { Logo } from './Logo'
import { ThemeToggle } from './ThemeToggle'
import { LocaleToggle } from './LocaleToggle'
import { UserMenu } from './UserMenu'
import { Button } from '@/components/ui/Button'
import { useAuthStore } from '@/store/auth'
import { FREE_TOURNAMENTS } from '@/config/flags'
import { cn } from '@/utils/cn'

type World = 'auto' | 'club'

type SubLink =
  | { kind: 'hash'; path: string; hash: string; label: string }
  | { kind: 'route'; to: string; label: string; end?: boolean }

const SUB_LINKS: Record<World, SubLink[]> = {
  auto: [
    { kind: 'hash', path: '/', hash: 'features', label: 'ПО' },
    { kind: 'hash', path: '/', hash: 'calculator', label: 'Калькулятор' },
    { kind: 'hash', path: '/', hash: 'faq', label: 'FAQ' },
  ],
  club: [
    { kind: 'hash', path: '/club', hash: 'live', label: 'Ближайшие' },
    // Ссылка на тарифы скрыта на время промо (FREE_TOURNAMENTS).
    ...(FREE_TOURNAMENTS
      ? []
      : [{ kind: 'hash', path: '/club', hash: 'pricing', label: 'Тарифы' } as SubLink]),
    { kind: 'hash', path: '/club', hash: 'how', label: 'Как работает' },
  ],
}

const WORLD_LABELS: Record<World, { short: string; icon: typeof Cpu }> = {
  auto: { short: 'Клуб', icon: Cpu },
  club: { short: 'Турниры', icon: Trophy },
}

function getWorld(pathname: string): World {
  return pathname.startsWith('/club') || pathname.startsWith('/tournaments')
    ? 'club'
    : 'auto'
}

export function Navbar() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const user = useAuthStore((s) => s.user)

  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)
  const [activeHash, setActiveHash] = useState<string>('')

  const world = getWorld(location.pathname)
  const inWorkspace = location.pathname === '/me' || location.pathname.startsWith('/me/')
  const workspaceTab = inWorkspace ? new URLSearchParams(location.search).get('tab') : null
  const workspaceTabLabel: Record<string, string> = {
    overview: 'Обзор',
    participations: 'Мои участия',
    mine: 'Мои турниры',
    settings: 'Настройки',
  }

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Scroll-spy: подсветка ссылки с якорем, когда секция в зоне видимости.
  useEffect(() => {
    const hashes = SUB_LINKS[world]
      .filter((l): l is Extract<SubLink, { kind: 'hash' }> => l.kind === 'hash')
      .filter((l) => l.path === location.pathname)
      .map((l) => l.hash)
    if (hashes.length === 0) {
      setActiveHash('')
      return
    }
    const sections = hashes
      .map((h) => ({ h, el: document.getElementById(h) }))
      .filter((s): s is { h: string; el: HTMLElement } => Boolean(s.el))
    if (sections.length === 0) {
      setActiveHash('')
      return
    }
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0]
        if (visible) setActiveHash(visible.target.id)
      },
      { rootMargin: '-30% 0px -55% 0px', threshold: 0 },
    )
    sections.forEach((s) => observer.observe(s.el))
    return () => observer.disconnect()
  }, [world, location.pathname])

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  function handleHashClick(path: string, hash: string) {
    if (location.pathname === path) {
      document.getElementById(hash)?.scrollIntoView({ behavior: 'smooth' })
    } else {
      navigate(path)
      setTimeout(() => document.getElementById(hash)?.scrollIntoView({ behavior: 'smooth' }), 350)
    }
  }

  function switchWorld(w: World) {
    navigate(w === 'auto' ? '/' : '/club')
  }

  function handleCreateClick() {
    if (user) navigate('/me?tab=mine&create=1')
    else navigate('/auth', { state: { mode: 'register', returnTo: '/me?tab=mine&create=1' } })
  }

  return (
    <>
      <header
        className={cn(
          'fixed inset-x-0 top-0 z-50 transition-all duration-300',
          inWorkspace && 'border-b border-emerald-500/25 shadow-[inset_0_2px_0_var(--color-accent-green)]',
          scrolled
            ? 'backdrop-blur-xl bg-[color-mix(in_oklab,var(--color-bg-primary)_82%,transparent)] shadow-[0_1px_0_var(--line)]'
            : 'bg-transparent',
        )}
      >
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
          {/* Logo */}
          <Logo />

          {/* Center: switcher + sub-links (или индикатор личного кабинета) */}
          <div className="hidden items-center gap-2 lg:flex">
            {inWorkspace ? (
              <div className="inline-flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-sm font-semibold text-emerald-400">
                <UserCircle2 size={16} />
                Личный кабинет
                {workspaceTab && workspaceTabLabel[workspaceTab] && (
                  <>
                    <span className="text-emerald-500/50">/</span>
                    <span className="font-normal text-emerald-300">{workspaceTabLabel[workspaceTab]}</span>
                  </>
                )}
              </div>
            ) : (
              <>
                {/* World switcher pill */}
                <WorldSwitcher world={world} onSwitch={switchWorld} />

                {/* Divider */}
                <div className="h-5 w-px bg-[var(--line-strong)]" aria-hidden />

                {/* Sub-links — animated swap when world changes */}
                <AnimatePresence mode="wait" initial={false}>
              <motion.nav
                key={world}
                initial={{ opacity: 0, x: world === 'auto' ? -8 : 8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: world === 'auto' ? 8 : -8 }}
                transition={{ duration: 0.18, ease: [0.4, 0, 0.2, 1] }}
                className="flex items-center gap-0.5"
              >
                {SUB_LINKS[world].map((link) =>
                  link.kind === 'hash' ? (
                    <button
                      key={link.hash}
                      type="button"
                      onClick={() => handleHashClick(link.path, link.hash)}
                      className={cn(
                        'rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                        activeHash === link.hash && location.pathname === link.path
                          ? 'text-emerald-500'
                          : 'text-text-secondary hover:text-text-primary',
                      )}
                    >
                      {link.label}
                    </button>
                  ) : (
                    <NavLink
                      key={link.to}
                      to={link.to}
                      end={link.end}
                      className={({ isActive }) =>
                        cn(
                          'rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                          isActive ? 'text-emerald-500' : 'text-text-secondary hover:text-text-primary',
                        )
                      }
                    >
                      {link.label}
                    </NavLink>
                  ),
                )}
              </motion.nav>
            </AnimatePresence>
              </>
            )}
          </div>

          {/* CLUB Dashboard CTA — видна на ВСЕХ размерах экрана, не только lg+.
             Это главный CTA для владельца клуба: попасть в /club/dashboard сразу
             после логина без копаний по меню. */}
          {user?.accountType === 'CLUB' && !location.pathname.startsWith('/club/dashboard') && (
            <Button
              variant="primary"
              size="sm"
              leftIcon={<LayoutDashboard size={16} />}
              onClick={() => { setOpen(false); navigate('/club/dashboard/tables') }}
              className="shadow-lg shadow-emerald-500/20 ring-1 ring-emerald-400/40"
            >
              <span className="hidden sm:inline">Дашборд клуба</span>
              <span className="sm:hidden">Дашборд</span>
            </Button>
          )}

          {/* Right: locale, theme, auth */}
          <div className="hidden items-center gap-2 lg:flex">
            <LocaleToggle />
            <ThemeToggle />
            {user ? (
              <>
                {!inWorkspace && user.accountType !== 'CLUB' && (
                  <Button
                    variant="primary" size="sm"
                    leftIcon={<Plus size={16} />}
                    onClick={handleCreateClick}
                  >
                    {t('nav.create')}
                  </Button>
                )}
                <UserMenu user={user} />
              </>
            ) : (
              <>
                <Link to="/auth" state={{ mode: 'login' }}>
                  <Button variant="secondary" size="sm">{t('nav.login')}</Button>
                </Link>
                {!inWorkspace && (
                  <Button
                    variant="primary" size="sm"
                    leftIcon={<Plus size={16} />}
                    onClick={handleCreateClick}
                  >
                    {t('nav.create')}
                  </Button>
                )}
              </>
            )}
          </div>

          {/* Mobile burger */}
          <button
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? 'Закрыть меню' : 'Открыть меню'}
            className="ring-focus inline-flex h-10 w-10 items-center justify-center rounded-lg border border-[var(--line-strong)] bg-[var(--surface-card)] text-text-primary lg:hidden"
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.span
                key={open ? 'close' : 'open'}
                initial={{ rotate: -90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 90, opacity: 0 }}
                transition={{ duration: 0.18 }}
                className="flex"
              >
                {open ? <X size={20} /> : <Menu size={20} />}
              </motion.span>
            </AnimatePresence>
          </button>
        </div>
      </header>

      <div className="h-16" aria-hidden />

      {/* Mobile drawer */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-bg-primary/95 backdrop-blur-xl lg:hidden"
          >
            <motion.div
              initial={{ y: -16, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -16, opacity: 0 }}
              transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1], delay: 0.05 }}
              className="flex h-full flex-col px-6 pb-10 pt-20"
            >
              {user && (
                <div className="mb-4 rounded-2xl border border-[var(--line-strong)] bg-[var(--surface-card)] px-4 py-3">
                  <div className="text-sm font-semibold text-text-primary">{user.name}</div>
                  <div className="text-xs text-text-muted">{user.phone}</div>
                </div>
              )}

              {/* World switcher — full width in mobile */}
              <MobileWorldSwitcher
                world={world}
                onSwitch={(w) => { setOpen(false); switchWorld(w) }}
              />

              {/* Sub-links */}
              <nav className="mt-4 flex flex-col gap-1">
                {SUB_LINKS[world].map((link, i) => (
                  <motion.div
                    key={link.kind === 'hash' ? link.hash : link.to}
                    initial={{ x: -16, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.08 + i * 0.04 }}
                  >
                    {link.kind === 'hash' ? (
                      <button
                        type="button"
                        onClick={() => { setOpen(false); handleHashClick(link.path, link.hash) }}
                        className={cn(
                          'block w-full rounded-xl px-4 py-3 text-left text-xl font-semibold hover:bg-[var(--surface-card)]',
                          activeHash === link.hash && location.pathname === link.path
                            ? 'text-emerald-500'
                            : 'text-text-primary',
                        )}
                      >
                        {link.label}
                      </button>
                    ) : (
                      <NavLink
                        to={link.to}
                        end={link.end}
                        onClick={() => setOpen(false)}
                        className={({ isActive }) =>
                          cn(
                            'block rounded-xl px-4 py-3 text-xl font-semibold hover:bg-[var(--surface-card)]',
                            isActive ? 'text-emerald-500' : 'text-text-primary',
                          )
                        }
                      >
                        {link.label}
                      </NavLink>
                    )}
                  </motion.div>
                ))}
              </nav>

              <div className="mt-6 flex items-center gap-3">
                <LocaleToggle />
                <ThemeToggle />
              </div>

              <div className="mt-auto flex flex-col gap-3 pt-8">
                {user ? (
                  <>
                    {user.accountType === 'CLUB' && !location.pathname.startsWith('/club/dashboard') && (
                      <Button
                        variant="primary" size="lg" fullWidth
                        leftIcon={<LayoutDashboard size={18} />}
                        onClick={() => { setOpen(false); navigate('/club/dashboard/tables') }}
                      >
                        Дашборд клуба
                      </Button>
                    )}
                    {!inWorkspace && user.accountType !== 'CLUB' && (
                      <Button
                        variant="primary" size="lg" fullWidth
                        leftIcon={<Plus size={18} />}
                        onClick={() => { setOpen(false); handleCreateClick() }}
                      >
                        {t('nav.create')}
                      </Button>
                    )}
                    <Button
                      variant="secondary" size="lg" fullWidth
                      onClick={() => { setOpen(false); useAuthStore.getState().logout(); navigate('/') }}
                    >
                      {t('nav.logout')}
                    </Button>
                  </>
                ) : (
                  <>
                    <Link to="/auth" state={{ mode: 'login' }} onClick={() => setOpen(false)}>
                      <Button variant="secondary" size="lg" fullWidth>{t('nav.login')}</Button>
                    </Link>
                    <Button
                      variant="primary" size="lg" fullWidth
                      leftIcon={<Plus size={18} />}
                      onClick={() => { setOpen(false); handleCreateClick() }}
                    >
                      {t('nav.create')}
                    </Button>
                  </>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

/* ── World Switcher (desktop pill) ─────────────────────────────── */
const BTN_W = 96 // px — фиксированная ширина каждой кнопки

function WorldSwitcher({ world, onSwitch }: { world: World; onSwitch: (w: World) => void }) {
  return (
    <div className="relative flex items-center rounded-xl border border-[var(--line)] bg-[var(--surface-card)] p-1">
      {/* Sliding background — animate по X, без layoutId */}
      <motion.span
        aria-hidden
        className="pointer-events-none absolute inset-y-1 left-1 rounded-lg bg-[var(--surface-elevated)]"
        style={{ width: BTN_W }}
        animate={{ x: world === 'auto' ? 0 : BTN_W }}
        initial={false}
        transition={{ type: 'spring', stiffness: 420, damping: 34 }}
      />

      {(['auto', 'club'] as World[]).map((w) => {
        const { short, icon: Icon } = WORLD_LABELS[w]
        const isActive = world === w
        return (
          <button
            key={w}
            type="button"
            onClick={() => onSwitch(w)}
            style={{ width: BTN_W }}
            className={cn(
              'relative z-10 flex items-center justify-center gap-1.5 rounded-lg py-1.5 text-sm font-medium transition-colors duration-150',
              isActive ? 'text-text-primary' : 'text-text-muted hover:text-text-secondary',
            )}
          >
            <Icon size={13} className={cn('shrink-0', isActive && 'text-emerald-400')} />
            {short}
          </button>
        )
      })}
    </div>
  )
}

/* ── World Switcher (mobile full-width) ─────────────────────────── */
function MobileWorldSwitcher({ world, onSwitch }: { world: World; onSwitch: (w: World) => void }) {
  const worlds: World[] = ['auto', 'club']
  return (
    <div className="flex gap-3">
      {worlds.map((w) => {
        const { short, icon: Icon } = WORLD_LABELS[w]
        const isActive = world === w
        return (
          <button
            key={w}
            type="button"
            onClick={() => onSwitch(w)}
            className={cn(
              'flex flex-1 items-center justify-center gap-2 rounded-2xl border px-4 py-3.5 text-base font-semibold transition',
              isActive
                ? 'border-emerald-400/40 bg-emerald-500/10 text-emerald-300'
                : 'border-[var(--line-strong)] bg-[var(--surface-card)] text-text-secondary',
            )}
          >
            <Icon size={18} />
            {short}
          </button>
        )
      })}
    </div>
  )
}
