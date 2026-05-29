import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { Plus, Users, Trophy } from 'lucide-react'
import { Container } from '@/components/ui/Container'
import { SectionHeader } from '@/components/ui/SectionHeader'

const steps = [
  { key: 'create', icon: Plus, color: 'from-emerald-400 to-emerald-600' },
  { key: 'register', icon: Users, color: 'from-sky-400 to-sky-600' },
  { key: 'play', icon: Trophy, color: 'from-amber-300 to-amber-500' },
]

export function HowItWorks() {
  const { t } = useTranslation()

  return (
    <section id="how" className="relative py-20 sm:py-28">
      <Container size="wide">
        <SectionHeader title={t('how.title')} subtitle={t('how.subtitle')} />

        <div className="relative mt-16">
          {/* Соединительная линия (desktop) */}
          <svg className="pointer-events-none absolute inset-x-0 top-7 hidden h-1 w-full md:block" preserveAspectRatio="none" viewBox="0 0 100 1">
            <motion.line
              x1="8" y1="0.5" x2="92" y2="0.5"
              stroke="url(#step-grad)" strokeWidth="0.4" strokeDasharray="1,1"
              initial={{ pathLength: 0 }}
              whileInView={{ pathLength: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 1.4, ease: 'easeOut' }}
            />
            <defs>
              <linearGradient id="step-grad" x1="0" x2="1">
                <stop offset="0%" stopColor="#10b981" />
                <stop offset="50%" stopColor="#38bdf8" />
                <stop offset="100%" stopColor="#fbbf24" />
              </linearGradient>
            </defs>
          </svg>

          <div className="grid gap-10 md:grid-cols-3 md:gap-6">
            {steps.map((s, i) => {
              const Icon = s.icon
              return (
                <motion.div
                  key={s.key}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-80px' }}
                  transition={{ duration: 0.5, delay: i * 0.12 }}
                  className="relative text-center md:px-4"
                >
                  <div className={`mx-auto inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${s.color} text-white shadow-lg`}>
                    <Icon size={24} />
                  </div>
                  <div className="mt-1 text-xs font-bold tracking-wider text-text-muted">
                    {String(i + 1).padStart(2, '0')}
                  </div>
                  <h3 className="mt-3 text-xl font-semibold text-text-primary">
                    {t(`how.steps.${s.key}.title`)}
                  </h3>
                  <p className="mt-3 mx-auto max-w-xs text-sm leading-relaxed text-text-secondary">
                    {t(`how.steps.${s.key}.desc`)}
                  </p>
                </motion.div>
              )
            })}
          </div>
        </div>
      </Container>
    </section>
  )
}
