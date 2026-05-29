import { useEffect, useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Trans, useTranslation } from 'react-i18next'
import { motion, AnimatePresence } from 'framer-motion'
import { Phone, Lock, User as UserIcon, ArrowRight, Building2, UserCircle2 } from 'lucide-react'
import type { AccountType } from '@billiard/shared'
import { Container } from '@/components/ui/Container'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useAuthStore } from '@/store/auth'
import { formatPhone, isValidPhone } from '@/utils/phone'
import { toast } from '@/components/ui/Toast'
import { cn } from '@/utils/cn'

type Mode = 'login' | 'register'

interface FieldErrors {
  name?: string | null
  phone?: string | null
  password?: string | null
  clubName?: string | null
  consent?: string | null
}

export default function Auth() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const login = useAuthStore((s) => s.login)
  const register = useAuthStore((s) => s.register)
  const user = useAuthStore((s) => s.user)

  const initialMode: Mode = (location.state as { mode?: Mode } | null)?.mode ?? 'login'
  const returnTo = (location.state as { returnTo?: string } | null)?.returnTo ?? '/me?tab=mine'

  const [mode, setMode] = useState<Mode>(initialMode)
  const [accountType, setAccountType] = useState<AccountType>('PLAYER')
  const [name, setName] = useState('')
  const [clubName, setClubName] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [consent, setConsent] = useState(false)
  const [errors, setErrors] = useState<FieldErrors>({})
  const [shake, setShake] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // Если уже залогинен — редирект сразу
  useEffect(() => {
    if (user) navigate(returnTo, { replace: true })
  }, [user, navigate, returnTo])

  function validate(): FieldErrors {
    const e: FieldErrors = {}
    if (mode === 'register') {
      if (!name.trim()) e.name = t('auth.errors.name_required')
      else if (name.trim().length < 2) e.name = t('auth.errors.name_short')
      if (accountType === 'CLUB') {
        if (!clubName.trim()) e.clubName = t('auth.errors.club_name_required')
        else if (clubName.trim().length < 2) e.clubName = t('auth.errors.club_name_short')
      }
    }
    if (!phone) e.phone = t('auth.errors.phone_required')
    else if (!isValidPhone(phone)) e.phone = t('auth.errors.phone_invalid')
    if (!password) e.password = t('auth.errors.password_required')
    else if (mode === 'register' && password.length < 6) e.password = t('auth.errors.password_weak')
    if (mode === 'register' && !consent) e.consent = t('auth.errors.consent_required')
    return e
  }

  async function handleSubmit(ev: FormEvent) {
    ev.preventDefault()
    const e = validate()
    setErrors(e)
    if (Object.values(e).some(Boolean)) {
      triggerShake()
      return
    }

    setSubmitting(true)
    const result = mode === 'login'
      ? await login(phone, password)
      : await register({ name, phone, password, accountType, clubName })
    setSubmitting(false)

    if (!result.ok) {
      const errorMap: Record<string, FieldErrors> = {
        USER_NOT_FOUND: { phone: t('auth.errors.user_not_found') },
        INVALID_CREDENTIALS: { password: t('auth.errors.invalid_credentials') },
        USER_EXISTS: { phone: t('auth.errors.user_exists') },
        WEAK_PASSWORD: { password: t('auth.errors.password_weak') },
        NETWORK: { phone: 'Сервер недоступен. Проверь подключение или попробуй позже' },
      }
      setErrors(errorMap[result.error] ?? {})
      triggerShake()
      return
    }

    const successKey = mode === 'login' ? 'auth.success.logged_in' : 'auth.success.registered'
    toast.success(t(successKey, { name: result.user.name }))
    navigate(returnTo, { replace: true })
  }

  function triggerShake() {
    setShake(true)
    window.setTimeout(() => setShake(false), 450)
  }

  function switchMode(next: Mode) {
    setMode(next)
    setErrors({})
  }

  return (
    <section className="relative flex min-h-[calc(100vh-4rem)] items-center justify-center py-12">
      <div className="bg-mesh absolute inset-0 -z-10 opacity-70" aria-hidden />
      <div className="bg-grid absolute inset-0 -z-10 [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_70%)]" aria-hidden />

      <Container size="narrow" className="max-w-md">
        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.45, ease: [0.4, 0, 0.2, 1] }}
          className={cn(
            'glass relative overflow-hidden rounded-3xl p-7 sm:p-9',
            shake && 'shake',
          )}
        >
          {/* Mode tabs */}
          <div className="relative mb-7 inline-flex items-center rounded-full border border-[var(--line-strong)] bg-[var(--surface-card)] p-0.5 text-sm font-medium">
            {(['login', 'register'] as const).map((m) => {
              const active = mode === m
              return (
                <button
                  key={m}
                  type="button"
                  onClick={() => switchMode(m)}
                  className={cn(
                    'relative z-10 px-5 py-2 transition-colors ring-focus rounded-full',
                    active ? 'text-bg-primary' : 'text-text-secondary hover:text-text-primary',
                  )}
                >
                  {active && (
                    <motion.span
                      layoutId="auth-pill"
                      className="absolute inset-0 -z-10 rounded-full bg-emerald-400"
                      transition={{ type: 'spring', stiffness: 360, damping: 28 }}
                    />
                  )}
                  {t(m === 'login' ? 'auth.tab_login' : 'auth.tab_register')}
                </button>
              )
            })}
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={mode}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              <h1 className="text-2xl font-bold tracking-tight text-text-primary sm:text-3xl">
                {t(mode === 'login' ? 'auth.login_title' : 'auth.register_title')}
              </h1>
              <p className="mt-1.5 text-sm text-text-secondary">
                {t(mode === 'login' ? 'auth.login_subtitle' : 'auth.register_subtitle')}
              </p>
            </motion.div>
          </AnimatePresence>

          <form onSubmit={handleSubmit} className="mt-7 space-y-4" noValidate>
            <AnimatePresence initial={false}>
              {mode === 'register' && (
                <motion.div
                  key="account-type-field"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="mb-1.5 text-xs font-medium uppercase tracking-wider text-text-muted">
                    {t('auth.account_type_label')}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {(['PLAYER', 'CLUB'] as const).map((type) => {
                      const active = accountType === type
                      const Icon = type === 'PLAYER' ? UserCircle2 : Building2
                      return (
                        <button
                          key={type}
                          type="button"
                          onClick={() => setAccountType(type)}
                          className={cn(
                            'ring-focus flex flex-col items-start gap-1.5 rounded-2xl border p-3.5 text-left transition',
                            active
                              ? 'border-emerald-400 bg-emerald-400/10'
                              : 'border-[var(--line-strong)] bg-[var(--surface-card)] hover:border-[var(--line-strong)] hover:bg-[var(--surface-card-hover)]',
                          )}
                        >
                          <Icon size={20} className={active ? 'text-emerald-400' : 'text-text-secondary'} />
                          <div>
                            <div className="text-sm font-semibold text-text-primary">
                              {t(type === 'PLAYER' ? 'auth.account_type_player' : 'auth.account_type_club')}
                            </div>
                            <div className="text-[11px] leading-snug text-text-muted">
                              {t(type === 'PLAYER' ? 'auth.account_type_player_hint' : 'auth.account_type_club_hint')}
                            </div>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence initial={false}>
              {mode === 'register' && (
                <motion.div
                  key="name-field"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <Input
                    label={t(accountType === 'CLUB' ? 'auth.contact_name_label' : 'auth.name_label')}
                    placeholder={t('auth.name_placeholder')}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    error={errors.name}
                    leftIcon={<UserIcon size={16} />}
                    autoComplete="name"
                    size="lg"
                  />
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence initial={false}>
              {mode === 'register' && accountType === 'CLUB' && (
                <motion.div
                  key="club-name-field"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <Input
                    label={t('auth.club_name_label')}
                    placeholder={t('auth.club_name_placeholder')}
                    value={clubName}
                    onChange={(e) => setClubName(e.target.value)}
                    error={errors.clubName}
                    leftIcon={<Building2 size={16} />}
                    autoComplete="organization"
                    size="lg"
                  />
                </motion.div>
              )}
            </AnimatePresence>

            <Input
              label={t('auth.phone_label')}
              placeholder={t('auth.phone_placeholder')}
              value={phone}
              onChange={(e) => setPhone(formatPhone(e.target.value))}
              error={errors.phone}
              leftIcon={<Phone size={16} />}
              inputMode="tel"
              autoComplete="tel"
              size="lg"
            />

            <Input
              type="password"
              label={t('auth.password_label')}
              placeholder={t('auth.password_placeholder')}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={errors.password}
              leftIcon={<Lock size={16} />}
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              size="lg"
            />

            <AnimatePresence initial={false}>
              {mode === 'register' && (
                <motion.div
                  key="consent-field"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="flex items-start gap-2.5">
                    <input
                      type="checkbox"
                      checked={consent}
                      onChange={(e) => {
                        setConsent(e.target.checked)
                        if (e.target.checked) setErrors((prev) => ({ ...prev, consent: null }))
                      }}
                      aria-invalid={!!errors.consent}
                      className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer accent-emerald-500"
                    />
                    <span className="text-[11px] leading-relaxed text-text-muted">
                      <Trans
                        i18nKey="auth.consent"
                        components={{
                          terms: (
                            <Link
                              to="/terms"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="font-medium text-emerald-400 hover:text-emerald-300"
                            />
                          ),
                          privacy: (
                            <Link
                              to="/privacy"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="font-medium text-emerald-400 hover:text-emerald-300"
                            />
                          ),
                        }}
                      />
                    </span>
                  </div>
                  {errors.consent && (
                    <p className="mt-1.5 text-xs text-red-400">{errors.consent}</p>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              loading={submitting}
              rightIcon={<ArrowRight size={18} />}
              className="mt-2"
            >
              {t(mode === 'login' ? 'auth.submit_login' : 'auth.submit_register')}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-text-secondary">
            {mode === 'login' ? t('auth.no_account') : t('auth.have_account')}{' '}
            <button
              type="button"
              onClick={() => switchMode(mode === 'login' ? 'register' : 'login')}
              className="ring-focus rounded font-semibold text-emerald-400 hover:text-emerald-300"
            >
              {t(mode === 'login' ? 'auth.switch_to_register' : 'auth.switch_to_login')}
            </button>
          </div>

        </motion.div>

        <div className="mt-4 text-center text-xs text-text-muted">
          <Link to="/" className="hover:text-text-secondary">{t('common.back_home')}</Link>
        </div>
      </Container>
    </section>
  )
}
