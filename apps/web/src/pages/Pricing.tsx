import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { Check, Sparkles, Zap, MessageCircle } from 'lucide-react'
import type { Plan } from '@billiard/shared'
import { Container } from '@/components/ui/Container'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Seo } from '@/components/Seo'
import { useAuthStore } from '@/store/auth'
import { paymentApi } from '@/api/payment'
import { ApiException } from '@/api/client'
import { toast } from '@/components/ui/Toast'
import { PaymentMethodModal } from '@/components/payment/PaymentMethodModal'
import { buildWhatsAppLink, formatTenge } from '@/components/sections/equipment/config'

function formatKzt(n: number): string {
  if (n === 0) return 'Бесплатно'
  return new Intl.NumberFormat('ru-RU').format(n) + ' ₸'
}

function billingLabel(plan: Plan): string {
  if (plan.billing === 'monthly') return 'в месяц'
  if (plan.billing === 'lifetime') return 'навсегда'
  if (plan.billing === 'one-time') return 'за турнир'
  return ''
}

function buildPricingMessage(plan: Plan, userName?: string | null): string {
  const lines: string[] = []
  lines.push('Здравствуйте! Хочу оформить тариф для бильярдного клуба.')
  lines.push('')
  lines.push(`• Тариф: ${plan.name}`)
  lines.push(`• Стоимость: ${plan.priceKzt === 0 ? 'Бесплатно' : `${formatTenge(plan.priceKzt)} ${billingLabel(plan)}`.trim()}`)
  lines.push(
    `• Лимит участников: ${plan.maxParticipants === -1 ? 'без ограничений' : `до ${plan.maxParticipants}`}`,
  )
  if (userName) {
    lines.push(`• Клиент: ${userName}`)
  }
  lines.push('')
  lines.push('Подскажите, как оплатить и подключить.')
  return lines.join('\n')
}

export default function Pricing() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)

  const [plans, setPlans] = useState<Plan[] | null>(null)
  const [busyCode, setBusyCode] = useState<string | null>(null)
  const [modalPlan, setModalPlan] = useState<Plan | null>(null)

  useEffect(() => {
    void paymentApi.listPlans()
      .then((r) => setPlans(r.plans.sort((a, b) => a.order - b.order)))
      .catch(() => toast.error('Не удалось загрузить тарифы'))
  }, [])

  const automationActive = user?.accountType === 'CLUB' && user.hasApiPassword === true

  // Подписки (Клуб/Навсегда) оплачиваются через Kaspi прямо отсюда.
  // Разовые per-tournament тарифы выбираются при создании турнира (WhatsApp как запасной канал).
  async function handleSubscribe(plan: Plan): Promise<void> {
    if (!user) {
      navigate('/auth', { state: { returnTo: '/pricing', mode: 'login' } })
      return
    }
    setBusyCode(plan.code)
    try {
      const res = await paymentApi.createPayment({ planCode: plan.code })
      if ('free' in res) {
        toast.success(res.message)
        setModalPlan(null)
        return
      }
      navigate(`/payment/checkout/${res.payment.id}`)
    } catch (e) {
      toast.error(e instanceof ApiException ? e.message : 'Не удалось создать платёж')
    } finally {
      setBusyCode(null)
    }
  }

  return (
    <section className="relative py-12 sm:py-16">
      <Seo
        title="Тарифы Biliardo — программа для бильярдного клуба | От бесплатного до Pro"
        description="Прозрачные тарифы для бильярдных клубов в Казахстане. Бесплатный старт до 6 игроков, подписки и пожизненная лицензия. Оплата через Kaspi Pay."
        keywords="тарифы бильярдного клуба, цена программа бильярд, подписка бильярд, стоимость автоматизации бильярда"
        path="/pricing"
      />
      <div className="bg-mesh absolute inset-0 -z-10 opacity-50" aria-hidden />
      <Container size="default">
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="text-3xl font-bold tracking-tight text-text-primary sm:text-5xl">
            {t('pricing.title')}
          </h1>
          <p className="mt-4 text-base text-text-secondary sm:text-lg">{t('pricing.subtitle')}</p>
        </div>

        {automationActive && (
          <div className="mx-auto mt-8 flex max-w-2xl items-start gap-3 rounded-2xl border border-emerald-400/40 bg-emerald-400/10 p-4 text-sm text-emerald-200">
            <Zap size={20} className="mt-0.5 shrink-0 text-emerald-400" />
            <div>
              <div className="font-semibold text-emerald-300">{t('pricing.automation_active_title')}</div>
              <div className="text-emerald-200/80">{t('pricing.automation_active_hint')}</div>
            </div>
          </div>
        )}

        {!plans ? (
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-80 animate-pulse rounded-3xl border border-[var(--line)] bg-[var(--surface-card)]" />
            ))}
          </div>
        ) : (
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {plans.map((p) => {
              const featured = p.code === 'PRO'
              return (
                <motion.div
                  key={p.code}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, delay: p.order * 0.04 }}
                  className={`relative flex flex-col rounded-3xl border p-6 backdrop-blur-md ${
                    featured
                      ? 'border-emerald-400 bg-[var(--surface-card)] shadow-[0_0_40px_-12px_rgba(16,185,129,0.4)]'
                      : 'border-[var(--line)] bg-[var(--surface-card)]'
                  }`}
                >
                  {featured && (
                    <div className="absolute -top-3 left-6 inline-flex items-center gap-1 rounded-full bg-emerald-400 px-3 py-1 text-xs font-bold text-bg-primary">
                      <Sparkles size={12} /> {t('pricing.popular')}
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-bold text-text-primary">{p.name}</h3>
                    {p.billing === 'monthly' && <Badge variant="blue">{t('pricing.monthly')}</Badge>}
                    {p.billing === 'lifetime' && <Badge variant="gold">{t('pricing.lifetime')}</Badge>}
                  </div>
                  <div className="mt-4 flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-text-primary">{formatKzt(p.priceKzt)}</span>
                    {p.billing === 'monthly' && p.priceKzt > 0 && (
                      <span className="text-sm text-text-muted">/{t('pricing.month_short')}</span>
                    )}
                    {p.billing === 'lifetime' && (
                      <span className="text-sm text-text-muted">/{t('pricing.forever_short')}</span>
                    )}
                  </div>
                  <p className="mt-3 text-sm text-text-secondary">
                    {p.maxParticipants === -1
                      ? t('pricing.unlimited_players')
                      : t('pricing.up_to_players', { n: p.maxParticipants })}
                  </p>
                  <ul className="mt-5 space-y-2.5">
                    {p.features.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-sm text-text-secondary">
                        <Check size={16} className="mt-0.5 shrink-0 text-emerald-400" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-auto pt-6">
                    {p.priceKzt === 0 ? (
                      <Button
                        variant={featured ? 'primary' : 'secondary'}
                        fullWidth
                        onClick={() => toast.success(t('pricing.free_active'))}
                      >
                        {t('pricing.cta_free')}
                      </Button>
                    ) : p.billing === 'monthly' || p.billing === 'lifetime' ? (
                      <Button
                        variant={featured ? 'primary' : 'secondary'}
                        fullWidth
                        onClick={() => setModalPlan(p)}
                      >
                        {p.billing === 'monthly'
                          ? t('pricing.cta_subscribe')
                          : t('pricing.cta_buy_lifetime')}
                      </Button>
                    ) : (
                      <a
                        href={buildWhatsAppLink(buildPricingMessage(p, user?.name ?? null))}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block"
                      >
                        <Button
                          variant={featured ? 'primary' : 'secondary'}
                          fullWidth
                          leftIcon={<MessageCircle size={16} />}
                        >
                          {t('pricing.cta_pick_at_create')}
                        </Button>
                      </a>
                    )}
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}

        <p className="mt-10 text-center text-xs text-text-muted">
          {t('pricing.payment_provider_hint')}
        </p>
      </Container>

      <PaymentMethodModal
        plan={modalPlan}
        open={modalPlan !== null}
        loading={busyCode !== null}
        whatsappHref={modalPlan ? buildWhatsAppLink(buildPricingMessage(modalPlan, user?.name ?? null)) : '#'}
        onClose={() => setModalPlan(null)}
        onPayKaspi={() => { if (modalPlan) void handleSubscribe(modalPlan) }}
      />
    </section>
  )
}
