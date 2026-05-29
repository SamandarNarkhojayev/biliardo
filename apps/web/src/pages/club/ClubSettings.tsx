import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Building2, Save, KeyRound, Eye, EyeOff, ShieldCheck, ShieldAlert } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useAuthStore } from '@/store/auth'
import { useClubStore } from '@/store/club'
import { ApiException } from '@/api/client'
import { toast } from '@/components/ui/Toast'

export default function ClubSettings() {
  const { t } = useTranslation()
  const user = useAuthStore((s) => s.user)!
  const updateProfile = useAuthStore((s) => s.updateProfile)

  const [clubName, setClubName] = useState(user.clubName ?? '')
  const [savingName, setSavingName] = useState(false)

  useEffect(() => {
    setClubName(user.clubName ?? '')
  }, [user.clubName])

  async function saveName(): Promise<void> {
    if (!clubName.trim() || clubName.trim() === user.clubName) return
    setSavingName(true)
    try {
      await updateProfile({ clubName: clubName.trim() })
      toast.success(t('club.settings.name_saved'))
    } catch (e) {
      toast.error(e instanceof ApiException ? e.message : t('club.settings.name_save_error'))
    } finally {
      setSavingName(false)
    }
  }

  return (
    <div className="space-y-5">
      {/* Club name */}
      <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface-card)] p-6 backdrop-blur-md sm:p-8">
        <div className="flex items-start gap-3">
          <Building2 size={20} className="mt-0.5 shrink-0 text-emerald-400" />
          <div>
            <h2 className="text-lg font-semibold text-text-primary">{t('club.settings.name_title')}</h2>
            <p className="mt-1 text-sm text-text-secondary">{t('club.settings.name_subtitle')}</p>
          </div>
        </div>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1">
            <Input
              label={t('club.settings.name_label')}
              value={clubName}
              onChange={(e) => setClubName(e.target.value)}
              size="lg"
              placeholder={t('club.settings.name_placeholder')}
            />
          </div>
          <Button
            variant="primary"
            size="md"
            leftIcon={<Save size={14} />}
            loading={savingName}
            disabled={!clubName.trim() || clubName.trim() === user.clubName}
            onClick={() => void saveName()}
          >
            {t('club.settings.save')}
          </Button>
        </div>
      </div>

      <ApiPasswordCard />

      <ConnectionStatusCard />
    </div>
  )
}

/** API-password секция (тот же UX, что в Profile, но автономная). */
function ApiPasswordCard() {
  const { t } = useTranslation()
  const user = useAuthStore((s) => s.user)!
  const setApiPassword = useAuthStore((s) => s.setApiPassword)
  const removeApiPassword = useAuthStore((s) => s.removeApiPassword)

  const [pwd, setPwd] = useState('')
  const [confirm, setConfirm] = useState('')
  const [show, setShow] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [removing, setRemoving] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  const has = user.hasApiPassword === true

  async function save(): Promise<void> {
    setErr(null)
    if (pwd.length < 8) return setErr(t('profile.api.err_short'))
    if (pwd !== confirm) return setErr(t('profile.api.err_mismatch'))
    setSubmitting(true)
    try {
      await setApiPassword(pwd)
      setPwd(''); setConfirm('')
      toast.success(t('profile.api.saved'))
    } catch (e) {
      setErr(e instanceof ApiException ? e.message : t('profile.api.err_generic'))
    } finally {
      setSubmitting(false)
    }
  }

  async function remove(): Promise<void> {
    setRemoving(true)
    try {
      await removeApiPassword()
      toast.success(t('profile.api.removed'))
    } catch (e) {
      toast.error(e instanceof ApiException ? e.message : t('profile.api.err_generic'))
    } finally {
      setRemoving(false)
    }
  }

  return (
    <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface-card)] p-6 backdrop-blur-md sm:p-8">
      <div className="flex items-start gap-3">
        <KeyRound size={20} className="mt-0.5 shrink-0 text-emerald-400" />
        <div>
          <h2 className="text-lg font-semibold text-text-primary">{t('profile.api.title')}</h2>
          <p className="mt-1 text-sm text-text-secondary">{t('profile.api.subtitle')}</p>
        </div>
      </div>

      <div className={`mt-4 flex items-start gap-2 rounded-2xl border p-3 text-sm ${
        has
          ? 'border-emerald-400/40 bg-emerald-400/10 text-emerald-200'
          : 'border-amber-400/40 bg-amber-400/10 text-amber-200'
      }`}>
        {has ? <ShieldCheck size={18} className="mt-0.5 shrink-0 text-emerald-400" /> : <ShieldAlert size={18} className="mt-0.5 shrink-0 text-amber-400" />}
        <div>
          <div className="font-semibold">{t(has ? 'profile.api.status_active' : 'profile.api.status_inactive')}</div>
          <div className="opacity-80">{t(has ? 'profile.api.status_active_hint' : 'profile.api.status_inactive_hint')}</div>
        </div>
      </div>

      <div className="mt-5 space-y-3">
        <Input
          type={show ? 'text' : 'password'}
          label={t('profile.api.new_label')}
          placeholder={t('profile.api.placeholder')}
          value={pwd}
          onChange={(e) => setPwd(e.target.value)}
          size="lg"
          autoComplete="new-password"
        />
        <Input
          type={show ? 'text' : 'password'}
          label={t('profile.api.confirm_label')}
          placeholder={t('profile.api.placeholder')}
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          size="lg"
          autoComplete="new-password"
        />
        <button type="button" onClick={() => setShow((s) => !s)}
          className="ring-focus inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs text-text-muted hover:text-text-primary">
          {show ? <EyeOff size={14} /> : <Eye size={14} />}
          {t(show ? 'profile.api.hide' : 'profile.api.show')}
        </button>

        {err && <div className="text-sm text-rose-400">{err}</div>}

        <div className="flex flex-wrap gap-3 pt-2">
          <Button variant="primary" loading={submitting} disabled={!pwd || !confirm} onClick={() => void save()}>
            {t(has ? 'profile.api.cta_change' : 'profile.api.cta_set')}
          </Button>
          {has && (
            <Button variant="secondary" loading={removing} onClick={() => void remove()}>
              {t('profile.api.cta_remove')}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

function ConnectionStatusCard() {
  const { t, i18n } = useTranslation()
  const snapshot = useClubStore((s) => s.snapshot)
  const desktopOnline = useClubStore((s) => s.desktopOnline)

  const lastSync = snapshot?.lastSyncAt
  const lastSyncStr = lastSync
    ? new Date(lastSync).toLocaleString(i18n.language === 'ru' ? 'ru-RU' : 'kk-KZ')
    : null

  return (
    <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface-card)] p-6 backdrop-blur-md sm:p-8">
      <h2 className="text-lg font-semibold text-text-primary">{t('club.settings.status_title')}</h2>
      <div className="mt-3 text-sm">
        {!snapshot ? (
          <span className="text-rose-300">✕ {t('club.settings.status_never')}</span>
        ) : desktopOnline ? (
          <span className="text-emerald-300">● {t('club.settings.status_online', { at: lastSyncStr })}</span>
        ) : (
          <span className="text-amber-300">◌ {t('club.settings.status_offline', { at: lastSyncStr })}</span>
        )}
      </div>
    </div>
  )
}
