import { useEffect, useRef, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, LogOut, ShieldAlert, LayoutDashboard } from 'lucide-react'
import type { User } from '@billiard/shared'
import { useAuthStore } from '@/store/auth'
import { cn } from '@/utils/cn'

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('')
}

export function UserMenu({ user }: { user: User }) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const logout = useAuthStore((s) => s.logout)
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  // Переход в личный кабинет: всегда сбрасываем search/hash, чтобы не "застревать"
  // на /me?tab=settings, который остался от прошлого визита.
  function goToMe(): void {
    if (location.pathname === '/me' && !location.search && !location.hash) return
    navigate('/me', { replace: false })
  }

  useEffect(() => {
    if (!open) return
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    const onEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', onClick)
    document.addEventListener('keydown', onEsc)
    return () => {
      document.removeEventListener('mousedown', onClick)
      document.removeEventListener('keydown', onEsc)
    }
  }, [open])

  return (
    <div ref={ref} className="relative flex items-center gap-1">
      {/* Avatar + name = прямая ссылка в кабинет. */}
      <button
        type="button"
        onClick={goToMe}
        className={cn(
          'ring-focus inline-flex items-center gap-2 rounded-full border border-[var(--line-strong)] bg-[var(--surface-card)] py-1 pl-1 pr-3 text-sm font-medium text-text-primary transition-colors',
          'hover:bg-[var(--surface-card-hover)]',
        )}
      >
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-emerald-700 text-xs font-bold text-white">
          {initials(user.name) || '·'}
        </span>
        <span className="hidden max-w-[120px] truncate sm:inline">{user.name}</span>
      </button>

      {/* Только меню выхода. */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Меню"
        className={cn(
          'ring-focus inline-flex h-9 w-9 items-center justify-center rounded-full border border-[var(--line-strong)] bg-[var(--surface-card)] text-text-secondary transition-colors',
          'hover:bg-[var(--surface-card-hover)] hover:text-text-primary',
        )}
      >
        <ChevronDown size={14} className={cn('transition-transform', open && 'rotate-180')} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full z-50 mt-2 w-56 origin-top-right overflow-hidden rounded-2xl border border-[var(--line-strong)] bg-bg-secondary p-1.5 shadow-xl backdrop-blur-xl"
          >
            <div className="px-3 py-2.5">
              <div className="text-sm font-semibold text-text-primary">{user.name}</div>
              <div className="mt-0.5 text-xs text-text-muted">{user.phone}</div>
            </div>
            <div className="my-1 h-px bg-[var(--line)]" />
            {user.accountType === 'CLUB' && (
              <button
                type="button"
                onClick={() => { setOpen(false); navigate('/club/dashboard/tables') }}
                className="ring-focus flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-emerald-400 transition-colors hover:bg-emerald-500/10"
              >
                <LayoutDashboard size={15} /> Дашборд клуба
              </button>
            )}
            {user.role === 'ADMIN' && (
              <button
                type="button"
                onClick={() => { setOpen(false); navigate('/admin') }}
                className="ring-focus flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-emerald-400 transition-colors hover:bg-emerald-500/10"
              >
                <ShieldAlert size={15} /> Супер-админка
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                logout()
                setOpen(false)
                navigate('/')
              }}
              className="ring-focus flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-red-400 transition-colors hover:bg-red-500/10"
            >
              <LogOut size={15} /> {t('nav.logout')}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
