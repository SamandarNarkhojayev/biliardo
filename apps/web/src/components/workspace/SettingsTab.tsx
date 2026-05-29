import { useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import {
  Camera, Loader2, Check, KeyRound, Eye, EyeOff, ShieldCheck, ShieldAlert,
  Trash2, Building2, User as UserIcon, Phone as PhoneIcon, Send, Copy, ExternalLink, X,
} from 'lucide-react'
import type { User } from '@billiard/shared'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useAuthStore } from '@/store/auth'
import { authApi } from '@/api/auth'
import { ApiException } from '@/api/client'
import { toast } from '@/components/ui/Toast'
import { cn } from '@/utils/cn'
import { formatPhone, isValidPhone, normalizePhone } from '@/utils/phone'

const MAX_AVATAR_BYTES = 5 * 1024 * 1024
const ALLOWED_AVATAR_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif'])

function initials(name: string): string {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase() ?? '').join('')
}

export function SettingsTab({ user }: { user: User }) {
  return (
    <div className="space-y-6">
      <ProfileHero user={user} />
      <PersonalSection user={user} />
      {user.accountType === 'CLUB' && <ClubSection user={user} />}
      {user.accountType === 'CLUB' && <ApiPasswordSection user={user} />}
      <TelegramSection />
      <DangerZone />
    </div>
  )
}

/* ────────────────── Hero: большой аватар + имя + actions ────────────────── */

function ProfileHero({ user }: { user: User }) {
  const updateProfile = useAuthStore((s) => s.updateProfile)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)

  async function upload(file: File): Promise<void> {
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
      if (!res.ok) throw new Error(`Ошибка загрузки в хранилище: ${res.status}`)
      await updateProfile({ avatar: publicUrl })
      toast.success('Аватар обновлён')
    } catch (e) {
      if (e instanceof ApiException && e.code === 'S3_NOT_CONFIGURED') {
        toast.error('Загрузка временно недоступна', 'Свяжитесь с поддержкой')
      } else {
        toast.error(e instanceof Error ? e.message : 'Не удалось загрузить')
      }
    } finally {
      setUploading(false)
    }
  }

  async function remove(): Promise<void> {
    try {
      await updateProfile({ avatar: null })
      toast.success('Аватар удалён')
    } catch {
      toast.error('Не удалось удалить')
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="relative overflow-hidden rounded-3xl border border-[var(--line)] bg-[var(--surface-card)] p-6 sm:p-8"
    >
      <div className="absolute inset-0 -z-10 opacity-60">
        <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="absolute -bottom-20 -left-20 h-72 w-72 rounded-full bg-sky-500/10 blur-3xl" />
      </div>

      <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-start">
        {/* Avatar — клик прямо на него = смена */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          aria-label="Сменить аватар"
          className="group relative h-28 w-28 shrink-0 overflow-hidden rounded-3xl ring-2 ring-[var(--line-strong)] transition hover:ring-emerald-400/60 sm:h-32 sm:w-32"
        >
          {user.avatar ? (
            <img
              src={user.avatar}
              alt={user.name}
              className="h-full w-full object-cover transition group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-emerald-400 via-emerald-500 to-emerald-700 text-3xl font-bold text-white sm:text-4xl">
              {initials(user.name) || '·'}
            </div>
          )}
          {/* hover overlay */}
          <div className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 transition group-hover:opacity-100">
            {uploading ? (
              <Loader2 size={24} className="animate-spin text-white" />
            ) : (
              <span className="flex flex-col items-center gap-1 text-white">
                <Camera size={20} />
                <span className="text-xs font-semibold">Изменить</span>
              </span>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) void upload(f)
              e.target.value = ''
            }}
          />
        </button>

        <div className="flex flex-1 flex-col items-center gap-3 text-center sm:items-start sm:text-left">
          <div>
            <div className="text-[11px] uppercase tracking-wider text-emerald-400">
              {user.accountType === 'CLUB' ? 'Клубный аккаунт' : 'Аккаунт игрока'}
            </div>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-text-primary sm:text-3xl">
              {user.accountType === 'CLUB' && user.clubName ? user.clubName : user.name}
            </h1>
            {user.accountType === 'CLUB' && user.clubName && (
              <div className="text-sm text-text-secondary">{user.name}</div>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-sm text-text-secondary sm:justify-start">
            <span className="font-mono">{formatPhone(user.phone)}</span>
            <span className="text-text-muted">·</span>
            <span>
              На сервисе с {new Date(user.createdAt).toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' })}
            </span>
          </div>

          <div className="flex flex-wrap gap-2 pt-1">
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<Camera size={14} />}
              onClick={() => fileInputRef.current?.click()}
              loading={uploading}
            >
              {user.avatar ? 'Заменить аватар' : 'Загрузить аватар'}
            </Button>
            {user.avatar && (
              <Button variant="ghost" size="sm" leftIcon={<Trash2 size={14} />} onClick={() => void remove()}>
                Удалить
              </Button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  )
}

/* ────────────────── Section card ────────────────── */

function SectionCard({
  icon, title, hint, children,
}: { icon: React.ReactNode; title: string; hint?: string; children: React.ReactNode }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="rounded-3xl border border-[var(--line)] bg-[var(--surface-card)] p-6 sm:p-7"
    >
      <header className="flex items-start gap-3">
        <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
          {icon}
        </span>
        <div className="flex-1">
          <h2 className="text-base font-semibold text-text-primary">{title}</h2>
          {hint && <p className="mt-0.5 text-xs text-text-muted">{hint}</p>}
        </div>
      </header>
      <div className="mt-5">{children}</div>
    </motion.section>
  )
}

/* ────────────────── Personal data form ────────────────── */

function PersonalSection({ user }: { user: User }) {
  const updateProfile = useAuthStore((s) => s.updateProfile)
  const [name, setName] = useState(user.name)
  const [phone, setPhone] = useState(() => formatPhone(user.phone))
  const [saving, setSaving] = useState(false)
  const [phoneError, setPhoneError] = useState<string | null>(null)

  // Сбрасываем форму, если внешний user изменился (например, после save).
  useEffect(() => { setName(user.name) }, [user.name])
  useEffect(() => { setPhone(formatPhone(user.phone)); setPhoneError(null) }, [user.phone])

  const trimmedName = name.trim()
  const validName = trimmedName.length >= 2 && trimmedName.length <= 80

  const normalizedPhone = normalizePhone(phone)
  const validPhone = isValidPhone(phone)

  const nameDirty = trimmedName !== user.name.trim()
  const phoneDirty = normalizedPhone !== user.phone
  const dirty = nameDirty || phoneDirty
  const valid = validName && validPhone

  async function save(): Promise<void> {
    if (!dirty || !valid) return
    setSaving(true)
    setPhoneError(null)
    try {
      const patch: { name?: string; phone?: string } = {}
      if (nameDirty) patch.name = trimmedName
      if (phoneDirty) patch.phone = normalizedPhone
      await updateProfile(patch)
      toast.success('Сохранено')
    } catch (e) {
      if (e instanceof ApiException && e.code === 'USER_EXISTS') {
        setPhoneError('Этот номер уже зарегистрирован')
      } else {
        toast.error(e instanceof ApiException ? e.message : 'Не удалось сохранить')
      }
    } finally {
      setSaving(false)
    }
  }

  function reset(): void {
    setName(user.name)
    setPhone(formatPhone(user.phone))
    setPhoneError(null)
  }

  return (
    <SectionCard icon={<UserIcon size={18} />} title="Личные данные" hint="Имя видно в публичных профилях турниров">
      <div className="space-y-4">
        <Input
          label="Имя"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Например, Алишер"
          maxLength={80}
          size="lg"
          error={name.length > 0 && !validName ? 'От 2 до 80 символов' : null}
        />

        <Input
          label="Телефон"
          value={phone}
          onChange={(e) => { setPhone(formatPhone(e.target.value)); setPhoneError(null) }}
          placeholder="+7 (___) ___-__-__"
          leftIcon={<PhoneIcon size={16} />}
          inputMode="tel"
          autoComplete="tel"
          size="lg"
          error={phoneError ?? (phone.length > 0 && !validPhone ? 'Введите корректный номер +7XXXXXXXXXX' : null)}
        />
        <p className="text-xs text-text-muted">
          Телефон используется как логин для входа. После сохранения входите по новому номеру.
        </p>
      </div>

      <SaveBar dirty={dirty} saving={saving} valid={valid} onSave={save} onReset={reset} />
    </SectionCard>
  )
}

/* ────────────────── Club data ────────────────── */

function ClubSection({ user }: { user: User }) {
  const updateProfile = useAuthStore((s) => s.updateProfile)
  const [clubName, setClubName] = useState(user.clubName ?? '')
  const [saving, setSaving] = useState(false)

  useEffect(() => { setClubName(user.clubName ?? '') }, [user.clubName])

  const dirty = clubName.trim() !== (user.clubName ?? '').trim()
  const trimmed = clubName.trim()
  const valid = trimmed.length >= 2 && trimmed.length <= 120

  async function save(): Promise<void> {
    if (!dirty || !valid) return
    setSaving(true)
    try {
      await updateProfile({ clubName: trimmed })
      toast.success('Сохранено')
    } catch (e) {
      toast.error(e instanceof ApiException ? e.message : 'Не удалось сохранить')
    } finally {
      setSaving(false)
    }
  }

  return (
    <SectionCard icon={<Building2 size={18} />} title="Клуб" hint="Название клуба отображается в шапке кабинета и на странице турнира">
      <Input
        label="Название клуба"
        value={clubName}
        onChange={(e) => setClubName(e.target.value)}
        placeholder="Например, Pyramid Almaty"
        maxLength={120}
        size="lg"
        error={clubName.length > 0 && !valid ? 'От 2 до 120 символов' : null}
      />
      <SaveBar dirty={dirty} saving={saving} valid={valid} onSave={save} onReset={() => setClubName(user.clubName ?? '')} />
    </SectionCard>
  )
}

/* ────────────────── API password (CLUB only) ────────────────── */

function ApiPasswordSection({ user }: { user: User }) {
  const setApiPassword = useAuthStore((s) => s.setApiPassword)
  const removeApiPassword = useAuthStore((s) => s.removeApiPassword)
  const [pwd, setPwd] = useState('')
  const [confirm, setConfirm] = useState('')
  const [show, setShow] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [removing, setRemoving] = useState(false)
  const has = user.hasApiPassword === true

  const validPwd = pwd.length >= 8
  const matches = pwd === confirm && confirm.length > 0
  const err = useMemo(() => {
    if (!pwd && !confirm) return null
    if (pwd && !validPwd) return 'Минимум 8 символов'
    if (pwd && confirm && !matches) return 'Пароли не совпадают'
    return null
  }, [pwd, confirm, validPwd, matches])

  async function save(): Promise<void> {
    if (!validPwd || !matches) return
    setSubmitting(true)
    try {
      await setApiPassword(pwd)
      setPwd(''); setConfirm('')
      toast.success('API-пароль сохранён')
    } catch (e) {
      toast.error(e instanceof ApiException ? e.message : 'Не удалось сохранить')
    } finally {
      setSubmitting(false)
    }
  }

  async function remove(): Promise<void> {
    setRemoving(true)
    try {
      await removeApiPassword()
      toast.success('API-пароль удалён')
    } catch (e) {
      toast.error(e instanceof ApiException ? e.message : 'Не удалось удалить')
    } finally {
      setRemoving(false)
    }
  }

  return (
    <SectionCard
      icon={<KeyRound size={18} />}
      title="API-пароль для desktop-приложения"
      hint="Нужен, чтобы подключить настольное приложение клуба к веб-отчётам. Пока пароль установлен — все турниры клуба бесплатны."
    >
      {/* Статус-баннер */}
      <div className={cn(
        'mb-5 flex items-start gap-3 rounded-2xl border p-3.5 text-sm',
        has
          ? 'border-emerald-400/40 bg-emerald-400/10 text-emerald-200'
          : 'border-amber-400/40 bg-amber-400/10 text-amber-200',
      )}>
        {has ? (
          <ShieldCheck size={18} className="mt-0.5 shrink-0 text-emerald-400" />
        ) : (
          <ShieldAlert size={18} className="mt-0.5 shrink-0 text-amber-400" />
        )}
        <div>
          <div className="font-semibold">
            {has ? 'Автоматизация подключена' : 'Автоматизация не подключена'}
          </div>
          <div className="text-xs opacity-80">
            {has
              ? 'Турниры этого клуба не требуют оплаты тарифа.'
              : 'Установи пароль, чтобы подключить приложение и получить бесплатные турниры.'}
          </div>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Input
          type={show ? 'text' : 'password'}
          label="Новый пароль"
          placeholder="Минимум 8 символов"
          value={pwd}
          onChange={(e) => setPwd(e.target.value)}
          size="lg"
          autoComplete="new-password"
        />
        <Input
          type={show ? 'text' : 'password'}
          label="Повторите пароль"
          placeholder="Минимум 8 символов"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          size="lg"
          autoComplete="new-password"
        />
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          className="ring-focus inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs text-text-muted hover:text-text-primary"
        >
          {show ? <EyeOff size={14} /> : <Eye size={14} />}
          {show ? 'Скрыть' : 'Показать'}
        </button>
        {err && <div className="text-xs text-rose-400">{err}</div>}
      </div>

      <div className="mt-5 flex flex-wrap gap-3 border-t border-[var(--line)] pt-5">
        <Button
          variant="primary"
          loading={submitting}
          disabled={!validPwd || !matches}
          onClick={() => void save()}
        >
          {has ? 'Сменить пароль' : 'Установить пароль'}
        </Button>
        {has && (
          <Button variant="ghost" loading={removing} onClick={() => void remove()}>
            Удалить пароль
          </Button>
        )}
      </div>
    </SectionCard>
  )
}

/* ────────────────── Telegram-уведомления ────────────────── */

function TelegramSection() {
  const [status, setStatus] = useState<{ connected: boolean; username: string | null } | null>(null)
  const [loading, setLoading] = useState(true)
  const [issuing, setIssuing] = useState(false)
  const [unlinking, setUnlinking] = useState(false)
  const [link, setLink] = useState<{ token: string; expiresAt: string; deepLink: string | null } | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    authApi.telegramStatus()
      .then((s) => { if (!cancelled) setStatus(s) })
      .catch(() => { if (!cancelled) setStatus({ connected: false, username: null }) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])

  async function issueLink(): Promise<void> {
    setIssuing(true)
    try {
      const res = await authApi.telegramLinkToken()
      setLink(res)
    } catch (e) {
      toast.error(e instanceof ApiException ? e.message : 'Не удалось выпустить код')
    } finally {
      setIssuing(false)
    }
  }

  async function refresh(): Promise<void> {
    const s = await authApi.telegramStatus()
    setStatus(s)
    if (s.connected) setLink(null)
  }

  async function unlink(): Promise<void> {
    setUnlinking(true)
    try {
      await authApi.telegramUnlink()
      setStatus({ connected: false, username: null })
      toast.success('Telegram отключён')
    } catch (e) {
      toast.error(e instanceof ApiException ? e.message : 'Не удалось отключить')
    } finally {
      setUnlinking(false)
    }
  }

  function copyToken(): void {
    if (!link) return
    void navigator.clipboard.writeText(link.token).then(() => toast.success('Код скопирован'))
  }

  return (
    <SectionCard
      icon={<Send size={18} />}
      title="Уведомления в Telegram"
      hint="Бот пришлёт о старте турнира, готовом матче с соперником и столом, завершении"
    >
      {loading ? (
        <div className="text-sm text-text-muted">Загружаем…</div>
      ) : status?.connected ? (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="inline-flex items-center gap-2 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm">
            <ShieldCheck size={16} className="text-emerald-400" />
            <span className="font-semibold text-emerald-200">Подключено</span>
            {status.username && <span className="text-emerald-300/80">@{status.username}</span>}
          </div>
          <Button
            variant="ghost"
            size="sm"
            leftIcon={<X size={14} />}
            loading={unlinking}
            onClick={() => void unlink()}
          >
            Отключить
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-text-secondary">
            Подключите Telegram, чтобы получать уведомления о ваших турнирах. Бот пришлёт сообщение,
            когда матч готов, и подскажет, на каком столе играть.
          </p>
          {!link ? (
            <Button
              variant="primary"
              size="md"
              leftIcon={<Send size={14} />}
              loading={issuing}
              onClick={() => void issueLink()}
            >
              Подключить Telegram
            </Button>
          ) : (
            <div className="space-y-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/[0.06] p-4">
              <div className="text-sm font-semibold text-text-primary">Шаг 1. Откройте бота:</div>
              {link.deepLink ? (
                <a
                  href={link.deepLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-3 py-2 text-sm font-semibold text-bg-primary hover:bg-emerald-400"
                >
                  <ExternalLink size={14} /> Открыть бот в Telegram
                </a>
              ) : (
                <div className="text-xs text-text-muted">
                  Имя бота не настроено на сервере. Найдите бота в Telegram вручную и пришлите ему /start с кодом ниже.
                </div>
              )}
              <div className="text-sm font-semibold text-text-primary pt-2">Шаг 2. Если бот не открылся — отправьте ему вручную:</div>
              <div className="flex items-center gap-2">
                <code className="flex-1 truncate rounded-lg border border-[var(--line)] bg-[var(--surface-input)] px-3 py-2 font-mono text-sm text-text-primary">
                  /start {link.token}
                </code>
                <Button variant="secondary" size="sm" leftIcon={<Copy size={14} />} onClick={copyToken}>
                  Код
                </Button>
              </div>
              <div className="text-[11px] text-text-muted">
                Код одноразовый, действителен 10 минут. После привязки нажмите «Обновить статус».
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => void refresh()}
              >
                Обновить статус
              </Button>
            </div>
          )}
        </div>
      )}
    </SectionCard>
  )
}

/* ────────────────── Danger zone ────────────────── */

function DangerZone() {
  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="rounded-3xl border border-rose-500/25 bg-rose-500/5 p-6 sm:p-7"
    >
      <h2 className="text-base font-semibold text-rose-300">Опасная зона</h2>
      <p className="mt-1 text-xs text-text-muted">
        Удаление аккаунта необратимо. Заявка сначала отправляется в службу поддержки —
        мы подтвердим вашу личность и передадим запрос владельцу Сервиса. После принятия
        положительного решения персональные данные стираются в срок до 30 календарных дней.
        Турниры, в которых вы организатор, останутся.
      </p>
      <div className="mt-4">
        <a
          href="https://wa.me/77066869414?text=%D0%97%D0%B4%D1%80%D0%B0%D0%B2%D1%81%D1%82%D0%B2%D1%83%D0%B9%D1%82%D0%B5%21%20%D0%9F%D1%80%D0%BE%D1%88%D1%83%20%D1%83%D0%B4%D0%B0%D0%BB%D0%B8%D1%82%D1%8C%20%D0%BC%D0%BE%D0%B9%20%D0%B0%D0%BA%D0%BA%D0%B0%D1%83%D0%BD%D1%82%20biliardo.kz"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex"
        >
          <Button variant="danger" size="sm" leftIcon={<Trash2 size={14} />}>
            Запросить удаление
          </Button>
        </a>
      </div>
    </motion.section>
  )
}

/* ────────────────── Helpers ────────────────── */

function SaveBar({
  dirty, saving, valid, onSave, onReset,
}: { dirty: boolean; saving: boolean; valid: boolean; onSave: () => void | Promise<void>; onReset: () => void }) {
  if (!dirty) return null
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-[var(--line)] pt-5"
    >
      <div className="text-xs text-text-muted">Есть несохранённые изменения</div>
      <div className="flex gap-2">
        <Button variant="ghost" size="sm" onClick={onReset} disabled={saving}>
          Отменить
        </Button>
        <Button
          variant="primary"
          size="sm"
          loading={saving}
          disabled={!valid}
          leftIcon={!saving ? <Check size={14} /> : undefined}
          onClick={() => void onSave()}
        >
          Сохранить
        </Button>
      </div>
    </motion.div>
  )
}
