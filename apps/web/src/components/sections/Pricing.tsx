import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Check, Sparkles, Crown } from 'lucide-react'
import { Container } from '@/components/ui/Container'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { cn } from '@/utils/cn'

interface PlanConfig {
  key: 'free' | 'standard' | 'pro' | 'lifetime'
  highlight?: 'popular' | 'club'
  cta: 'free' | 'paid'
  ctaVariant: 'primary' | 'secondary' | 'gold'
  billingKey: 'billing_per_tournament' | 'billing_per_month' | 'billing_lifetime' | null
}

const plans: PlanConfig[] = [
  { key: 'free', cta: 'free', ctaVariant: 'secondary', billingKey: null },
  { key: 'standard', highlight: 'popular', cta: 'paid', ctaVariant: 'primary', billingKey: 'billing_per_tournament' },
  { key: 'pro', cta: 'paid', ctaVariant: 'secondary', billingKey: 'billing_per_tournament' },
  { key: 'lifetime', highlight: 'club', cta: 'paid', ctaVariant: 'gold', billingKey: 'billing_lifetime' },
]

export function Pricing() {
  const { t } = useTranslation()

  return (
    <section id="pricing" className="relative py-20 sm:py-28">
      <div className="absolute inset-x-0 top-0 -z-10 h-1/2 bg-gradient-to-b from-emerald-500/[0.04] to-transparent" />
      <Container size="wide">
        <SectionHeader title={t('pricing.title')} subtitle={t('pricing.subtitle')} />

        <div className="mt-14 grid gap-5 lg:grid-cols-4">
          {plans.map((p, idx) => {
            const features = (t(`pricing.plans.${p.key}.features`, { returnObjects: true }) as string[]) || []
            const isPopular = p.highlight === 'popular'
            const isClub = p.highlight === 'club'
            return (
              <motion.div
                key={p.key}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ duration: 0.5, delay: idx * 0.06 }}
                className={cn(
                  'relative flex flex-col rounded-2xl p-6 backdrop-blur-xl transition-all duration-300',
                  isPopular
                    ? 'border-2 border-emerald-400/60 bg-gradient-to-b from-emerald-500/[0.06] to-transparent shadow-[0_0_50px_-15px_rgba(16,185,129,0.5)]'
                    : isClub
                      ? 'border border-amber-400/40 bg-gradient-to-b from-amber-500/[0.06] to-transparent'
                      : 'border border-[var(--line)] bg-[var(--surface-card)]',
                )}
              >
                {(isPopular || isClub) && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge variant={isPopular ? 'green' : 'gold'} className="shadow-lg">
                      {isPopular ? <Sparkles size={11} /> : <Crown size={11} />}
                      {isPopular ? t('pricing.popular') : t('pricing.for_clubs')}
                    </Badge>
                  </div>
                )}

                <div className="text-sm font-semibold text-text-secondary">
                  {t(`pricing.plans.${p.key}.name`)}
                </div>
                <div className="mt-1 text-xs text-text-muted">
                  {t(`pricing.plans.${p.key}.tagline`)}
                </div>

                <div className="mt-5 flex items-baseline gap-1.5">
                  <span className={cn(
                    'text-3xl font-bold tracking-tight',
                    isClub ? 'text-gradient-gold' : 'text-text-primary',
                  )}>
                    {t(`pricing.plans.${p.key}.price`)}
                  </span>
                  {p.billingKey && (
                    <span className="text-xs text-text-muted">/{t(`pricing.${p.billingKey}`)}</span>
                  )}
                </div>
                <div className="mt-1.5 text-sm font-medium text-text-secondary">
                  {t(`pricing.plans.${p.key}.limit`)}
                </div>

                <div className="my-5 h-px bg-[var(--line)]" />

                <ul className="flex flex-1 flex-col gap-3">
                  {features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-sm text-text-secondary">
                      <span className={cn(
                        'mt-0.5 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full',
                        isPopular ? 'bg-emerald-500/20 text-emerald-300' :
                        isClub ? 'bg-amber-500/20 text-amber-300' :
                        'bg-[var(--surface-card)] text-emerald-400',
                      )}>
                        <Check size={10} strokeWidth={3} />
                      </span>
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-7">
                  <Link to="/pricing" className="block">
                    <Button variant={p.ctaVariant} fullWidth size="md">
                      {p.cta === 'free' ? t('pricing.cta_free') : t('pricing.cta_paid')}
                    </Button>
                  </Link>
                </div>
              </motion.div>
            )
          })}
        </div>

        <p className="mx-auto mt-10 max-w-2xl text-center text-xs text-text-muted">
          {t('pricing.footnote')}
        </p>
      </Container>
    </section>
  )
}
