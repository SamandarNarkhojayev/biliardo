import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, ArrowRight, Check, Lock, Plus, Trash2, Globe, Sparkles } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { BracketTypeCard } from './BracketTypeCard'
import { useAuthStore } from '@/store/auth'
import { checkPlan, useTournamentsStore } from '@/store/tournaments'
import { FREE_TOURNAMENTS } from '@/config/flags'
import { toast } from '@/components/ui/Toast'
import type { BracketType, PrizePlace } from '@billiard/shared'
import { cn } from '@/utils/cn'

interface Props {
  open: boolean
  onClose: () => void
}

interface Form {
  name: string
  description: string
  bracketType: BracketType
  maxParticipants: number
  isPublic: boolean
  scheduledAt: string
  location: string
  city: string
  /** Когда true — пользователь хочет ввести город вручную. */
  cityCustom: boolean
  /** Сырое значение поля «Номера столов» (пользователь вводит через запятую). */
  tablesRaw: string
  entryFee: number
  prizeFund: number
  prizes: PrizePlace[]
}

const initialForm: Form = {
  name: '',
  description: '',
  bracketType: 'single-elimination',
  maxParticipants: 8,
  isPublic: true,
  scheduledAt: '',
  location: '',
  city: '',
  cityCustom: false,
  tablesRaw: '',
  entryFee: 0,
  prizeFund: 0,
  prizes: [{ place: 1, prize: '' }],
}

/** Основные города РК. Отсортированы по убыванию населения. */
const KZ_CITIES = [
  'Алматы',
  'Астана',
  'Шымкент',
  'Караганда',
  'Актобе',
  'Тараз',
  'Павлодар',
  'Усть-Каменогорск',
  'Семей',
  'Атырау',
  'Костанай',
  'Кызылорда',
  'Уральск',
  'Петропавловск',
  'Актау',
  'Темиртау',
  'Туркестан',
  'Кокшетау',
  'Талдыкорган',
] as const

/** Парсит "1, 3, 5-7" → [1, 3, 5, 6, 7]. Уникальные, отсортированные, в диапазоне 1–999. */
function parseTables(raw: string): number[] {
  const out = new Set<number>()
  for (const token of raw.split(',')) {
    const trimmed = token.trim()
    if (!trimmed) continue
    const rangeMatch = trimmed.match(/^(\d+)\s*-\s*(\d+)$/)
    if (rangeMatch) {
      const a = Math.min(Number(rangeMatch[1]), Number(rangeMatch[2]))
      const b = Math.max(Number(rangeMatch[1]), Number(rangeMatch[2]))
      for (let i = a; i <= b; i++) if (i >= 1 && i <= 999) out.add(i)
      continue
    }
    const n = Number(trimmed)
    if (Number.isFinite(n) && n >= 1 && n <= 999) out.add(Math.trunc(n))
  }
  return Array.from(out).sort((a, b) => a - b)
}

const bracketOptions: BracketType[] = [
  'single-elimination',
  'double-elimination',
  'round-robin',
  'swiss',
  'group-playoff',
  'page-playoff',
]

export function CreateTournamentWizard({ open, onClose }: Props) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const create = useTournamentsStore((s) => s.create)

  const [step, setStep] = useState(1)
  const [form, setForm] = useState<Form>(initialForm)

  function reset() {
    setStep(1)
    setForm(initialForm)
  }

  function handleClose() {
    reset()
    onClose()
  }

  function update<K extends keyof Form>(key: K, value: Form[K]) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  function addPrizePlace() {
    setForm((f) => ({
      ...f,
      prizes: [...f.prizes, { place: f.prizes.length + 1, prize: '' }],
    }))
  }

  function removePrizePlace(idx: number) {
    setForm((f) => ({
      ...f,
      prizes: f.prizes.filter((_, i) => i !== idx).map((p, i) => ({ ...p, place: i + 1 })),
    }))
  }

  function updatePrize(idx: number, prize: string) {
    setForm((f) => ({
      ...f,
      prizes: f.prizes.map((p, i) => (i === idx ? { ...p, prize } : p)),
    }))
  }

  const plan = checkPlan(form.maxParticipants)

  function canGoNext(): boolean {
    if (step === 1) return form.name.trim().length >= 3 && form.maxParticipants >= 2
    if (step === 2) return true
    if (step === 3) return form.prizes.every((p) => p.prize.trim().length > 0)
    return true
  }

  const [submitting, setSubmitting] = useState(false)

  async function handleCreate() {
    if (!user || submitting) return
    const tables = parseTables(form.tablesRaw)
    setSubmitting(true)
    try {
      const tournament = await create({
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        bracketType: form.bracketType,
        maxParticipants: form.maxParticipants,
        isPublic: form.isPublic,
        scheduledAt: form.scheduledAt || undefined,
        location: form.location.trim() || undefined,
        city: form.city.trim() || undefined,
        tables: tables.length > 0 ? tables : undefined,
        entryFee: form.entryFee || undefined,
        prizeFund: form.prizeFund || undefined,
        prizePlaces: form.prizes.filter((p) => p.prize.trim()),
      })
      toast.success(t('create_tournament.created'), t('create_tournament.created_desc'))
      handleClose()
      navigate(`/tournaments/${tournament.id}`)
    } catch (err) {
      toast.error('Не удалось создать турнир', err instanceof Error ? err.message : '')
    } finally {
      setSubmitting(false)
    }
  }

  const totalSteps = 4

  return (
    <Modal open={open} onClose={handleClose} size="lg" title={t('create_tournament.title')}>
      <div className="px-6 py-5">
        {/* Stepper */}
        <div className="mb-6 flex items-center gap-2">
          {Array.from({ length: totalSteps }).map((_, i) => {
            const s = i + 1
            const done = s < step
            const active = s === step
            return (
              <div key={s} className="flex flex-1 items-center gap-2">
                <div className={cn(
                  'flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-colors',
                  done ? 'bg-emerald-500 text-bg-primary' :
                  active ? 'bg-emerald-500/20 text-emerald-300 ring-2 ring-emerald-500/50' :
                  'bg-[var(--surface-input)] text-text-muted',
                )}>
                  {done ? <Check size={14} /> : s}
                </div>
                {i < totalSteps - 1 && (
                  <div className={cn('h-px flex-1', done ? 'bg-emerald-500/40' : 'bg-[var(--line)]')} />
                )}
              </div>
            )
          })}
        </div>

        <div className="mb-1 text-xs text-text-muted">
          {t('create_tournament.step', { cur: step, total: totalSteps })}
        </div>
        <h3 className="mb-5 text-lg font-semibold text-text-primary">
          {t(`create_tournament.step${step}_title`)}
        </h3>

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -16 }}
            transition={{ duration: 0.2 }}
            className="space-y-5"
          >
            {step === 1 && (
              <>
                <Input
                  label={t('create_tournament.fields.name')}
                  placeholder={t('create_tournament.fields.name_placeholder')}
                  value={form.name}
                  onChange={(e) => update('name', e.target.value)}
                  size="lg"
                />
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-text-secondary">
                    {t('create_tournament.fields.description')}
                  </label>
                  <textarea
                    placeholder={t('create_tournament.fields.description_placeholder')}
                    value={form.description}
                    onChange={(e) => update('description', e.target.value)}
                    rows={3}
                    className="ring-focus w-full resize-none rounded-xl border border-[var(--line-strong)] bg-[var(--surface-input)] px-3.5 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:border-emerald-400/70 focus:outline-none focus:shadow-[0_0_0_3px_rgba(16,185,129,0.18)]"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-xs font-medium text-text-secondary">
                    {t('create_tournament.fields.format')}
                  </label>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {bracketOptions.map((bt) => (
                      <BracketTypeCard
                        key={bt}
                        type={bt}
                        active={form.bracketType === bt}
                        onClick={() => update('bracketType', bt)}
                      />
                    ))}
                  </div>
                </div>
                <Input
                  label={t('create_tournament.fields.max_participants')}
                  type="number" min={2} max={500}
                  value={form.maxParticipants}
                  onChange={(e) => update('maxParticipants', Math.max(2, Number(e.target.value) || 0))}
                  size="lg"
                />
                <div>
                  <label className="mb-2 block text-xs font-medium text-text-secondary">
                    {t('create_tournament.fields.visibility')}
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <VisibilityCard
                      active={form.isPublic}
                      icon={<Globe size={16} />}
                      title={t('create_tournament.fields.visibility_public')}
                      hint={t('create_tournament.fields.visibility_public_hint')}
                      onClick={() => update('isPublic', true)}
                    />
                    <VisibilityCard
                      active={!form.isPublic}
                      icon={<Lock size={16} />}
                      title={t('create_tournament.fields.visibility_private')}
                      hint={t('create_tournament.fields.visibility_private_hint')}
                      onClick={() => update('isPublic', false)}
                    />
                  </div>
                </div>
              </>
            )}

            {step === 2 && (
              <>
                <Input
                  label={t('create_tournament.fields.scheduled_at')}
                  type="datetime-local"
                  value={form.scheduledAt}
                  onChange={(e) => update('scheduledAt', e.target.value)}
                  size="lg"
                />
                <Input
                  label={t('create_tournament.fields.location')}
                  placeholder={t('create_tournament.fields.location_placeholder')}
                  value={form.location}
                  onChange={(e) => update('location', e.target.value)}
                  size="lg"
                />
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-text-secondary">
                    {t('create_tournament.fields.city')}
                  </label>
                  <select
                    value={form.cityCustom ? '__other__' : form.city}
                    onChange={(e) => {
                      const v = e.target.value
                      if (v === '__other__') {
                        setForm((f) => ({ ...f, cityCustom: true, city: '' }))
                      } else {
                        setForm((f) => ({ ...f, cityCustom: false, city: v }))
                      }
                    }}
                    className="ring-focus w-full rounded-xl border border-[var(--line-strong)] bg-[var(--surface-input)] px-3.5 py-2.5 text-sm text-text-primary focus:border-emerald-400/70 focus:outline-none focus:shadow-[0_0_0_3px_rgba(16,185,129,0.18)]"
                  >
                    <option value="">— Выберите город —</option>
                    {KZ_CITIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                    <option value="__other__">Другой город…</option>
                  </select>
                  {form.cityCustom && (
                    <div className="mt-2">
                      <Input
                        placeholder="Например, Жезказган"
                        value={form.city}
                        onChange={(e) => update('city', e.target.value)}
                        size="lg"
                      />
                    </div>
                  )}
                </div>

                <div>
                  <Input
                    label="Номера столов для турнира"
                    placeholder="Например: 1, 3, 5-7"
                    value={form.tablesRaw}
                    onChange={(e) => update('tablesRaw', e.target.value)}
                    size="lg"
                  />
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {parseTables(form.tablesRaw).map((n) => (
                      <span
                        key={n}
                        className="inline-flex items-center gap-1 rounded-md bg-emerald-500/15 px-2 py-0.5 text-xs font-semibold text-emerald-300"
                      >
                        Стол {n}
                      </span>
                    ))}
                  </div>
                  <div className="mt-1 text-[11px] text-text-muted">
                    Программа автоматически распределит матчи по этим столам. Поддерживаются перечисления через запятую и диапазоны (например, «1, 3, 5-7»).
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Input
                    label={t('create_tournament.fields.entry_fee')}
                    type="number" min={0}
                    value={form.entryFee || ''}
                    placeholder="0"
                    onChange={(e) => update('entryFee', Number(e.target.value) || 0)}
                    size="lg"
                  />
                  <Input
                    label={t('create_tournament.fields.prize_fund')}
                    type="number" min={0}
                    value={form.prizeFund || ''}
                    placeholder="0"
                    onChange={(e) => update('prizeFund', Number(e.target.value) || 0)}
                    size="lg"
                  />
                </div>
              </>
            )}

            {step === 3 && (
              <div className="space-y-3">
                {form.prizes.map((p, idx) => (
                  <div key={idx} className="flex items-end gap-2">
                    <div className="flex-1">
                      <Input
                        label={t('create_tournament.fields.place_label', { place: p.place })}
                        placeholder={t('create_tournament.fields.prize_placeholder')}
                        value={p.prize}
                        onChange={(e) => updatePrize(idx, e.target.value)}
                        size="lg"
                      />
                    </div>
                    {form.prizes.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removePrizePlace(idx)}
                        className="ring-focus inline-flex h-13 w-11 items-center justify-center rounded-xl border border-red-500/30 bg-red-500/10 text-red-400 transition hover:bg-red-500/15"
                        aria-label={t('create_tournament.remove_place')}
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                ))}
                <Button variant="ghost" size="md" onClick={addPrizePlace} leftIcon={<Plus size={16} />}>
                  {t('create_tournament.fields.add_place')}
                </Button>
              </div>
            )}

            {step === 4 && (
              <div className="space-y-4">
                <div className="rounded-2xl border border-[var(--line-strong)] bg-[var(--surface-card)] p-4">
                  <div className="text-xs uppercase tracking-wider text-text-muted">{form.name || t('create_tournament.summary.dash')}</div>
                  <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                    <SummaryRow label={t('create_tournament.summary.format')} value={t(`bracket_type.${form.bracketType}`)} />
                    <SummaryRow label={t('create_tournament.summary.participants')} value={t('create_tournament.summary.up_to', { n: form.maxParticipants })} />
                    <SummaryRow label={t('create_tournament.summary.type')} value={form.isPublic ? t('create_tournament.summary.type_public') : t('create_tournament.summary.type_private')} />
                    <SummaryRow label={t('create_tournament.summary.location')} value={form.location || t('create_tournament.summary.dash')} />
                    <SummaryRow label={t('create_tournament.summary.entry_fee')} value={form.entryFee ? t('create_tournament.summary.currency_kzt', { n: form.entryFee.toLocaleString('ru-RU') }) : t('create_tournament.summary.free')} />
                    <SummaryRow label={t('create_tournament.summary.prize_fund')} value={form.prizeFund ? t('create_tournament.summary.currency_kzt', { n: form.prizeFund.toLocaleString('ru-RU') }) : t('create_tournament.summary.dash')} />
                  </div>
                </div>

                {/* Блок проверки тарифа платформы скрыт на время промо (FREE_TOURNAMENTS). */}
                {!FREE_TOURNAMENTS && (
                  <div className={cn(
                    'flex items-start gap-3 rounded-2xl border p-4',
                    plan.allowed ? 'border-emerald-500/30 bg-emerald-500/[0.06]' : 'border-amber-500/30 bg-amber-500/[0.06]',
                  )}>
                    <div className={cn(
                      'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg',
                      plan.allowed ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300',
                    )}>
                      <Sparkles size={16} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 text-sm font-semibold text-text-primary">
                        {t('create_tournament.tariff.title')}
                        <Badge variant={plan.allowed ? 'green' : 'gold'}>{plan.plan}</Badge>
                      </div>
                      <div className="mt-1 text-xs text-text-secondary">
                        {plan.allowed
                          ? t('create_tournament.tariff.free_ok')
                          : t('create_tournament.tariff.needs_plan', { count: form.maxParticipants, plan: plan.plan })}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        <div className="mt-7 flex flex-col-reverse items-stretch justify-between gap-3 border-t border-[var(--line)] pt-5 sm:flex-row sm:items-center">
          <Button
            variant="ghost"
            size="md"
            leftIcon={<ArrowLeft size={16} />}
            disabled={step === 1}
            onClick={() => setStep((s) => Math.max(1, s - 1))}
          >
            {t('common.back')}
          </Button>
          {step < totalSteps ? (
            <Button
              variant="primary"
              size="md"
              rightIcon={<ArrowRight size={16} />}
              disabled={!canGoNext()}
              onClick={() => setStep((s) => Math.min(totalSteps, s + 1))}
            >
              {t('common.next')}
            </Button>
          ) : (
            <Button
              variant={FREE_TOURNAMENTS || plan.allowed ? 'primary' : 'gold'}
              size="md"
              loading={submitting}
              disabled={submitting}
              onClick={() => void handleCreate()}
              rightIcon={<Check size={16} />}
            >
              {FREE_TOURNAMENTS
                ? t('create_tournament.create_button')
                : plan.allowed
                  ? t('create_tournament.tariff.free_button')
                  : t('create_tournament.tariff.pay_button', { price: plan.price.toLocaleString('ru-RU') })}
            </Button>
          )}
        </div>
      </div>
    </Modal>
  )
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs text-text-muted">{label}</div>
      <div className="mt-0.5 font-medium text-text-primary">{value}</div>
    </div>
  )
}

interface VisibilityCardProps {
  active: boolean
  icon: React.ReactNode
  title: string
  hint: string
  onClick: () => void
}

function VisibilityCard({ active, icon, title, hint, onClick }: VisibilityCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'ring-focus rounded-xl border p-3 text-left transition-all',
        active
          ? 'border-emerald-400/60 bg-emerald-500/10 shadow-[0_0_0_1px_rgba(16,185,129,0.3)]'
          : 'border-[var(--line-strong)] bg-[var(--surface-card)] hover:bg-[var(--surface-card-hover)]',
      )}
    >
      <div className={cn('mb-2 inline-flex h-8 w-8 items-center justify-center rounded-lg',
        active ? 'bg-emerald-500/20 text-emerald-300' : 'bg-[var(--surface-input)] text-text-secondary')}>
        {icon}
      </div>
      <div className="text-sm font-semibold text-text-primary">{title}</div>
      <div className="mt-0.5 text-xs text-text-secondary">{hint}</div>
    </button>
  )
}
