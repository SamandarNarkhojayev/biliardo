import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import {
  Trophy, Smartphone, Lock, Zap, BarChart3, Award, type LucideIcon,
} from 'lucide-react'
import { Container } from '@/components/ui/Container'
import { Card } from '@/components/ui/Card'
import { SectionHeader } from '@/components/ui/SectionHeader'

interface Feature {
  key: string
  icon: LucideIcon
  accent: string
  bg: string
}

const features: Feature[] = [
  { key: 'bracket', icon: Trophy, accent: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  { key: 'phone', icon: Smartphone, accent: 'text-sky-400', bg: 'bg-sky-500/10' },
  { key: 'privacy', icon: Lock, accent: 'text-violet-400', bg: 'bg-violet-500/10' },
  { key: 'realtime', icon: Zap, accent: 'text-amber-300', bg: 'bg-amber-500/10' },
  { key: 'stats', icon: BarChart3, accent: 'text-fuchsia-400', bg: 'bg-fuchsia-500/10' },
  { key: 'prizes', icon: Award, accent: 'text-emerald-400', bg: 'bg-emerald-500/10' },
]

const container = {
  animate: { transition: { staggerChildren: 0.07 } },
}
const item = {
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.4, 0, 0.2, 1] } },
}

export function Features() {
  const { t } = useTranslation()

  return (
    <section id="features" className="relative py-20 sm:py-28">
      <Container size="wide">
        <SectionHeader title={t('features.title')} subtitle={t('features.subtitle')} />

        <motion.div
          variants={container}
          initial="initial"
          whileInView="animate"
          viewport={{ once: true, margin: '-80px' }}
          className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
        >
          {features.map((f) => {
            const Icon = f.icon
            return (
              <motion.div key={f.key} variants={item}>
                <Card interactive glow="green" className="h-full">
                  <div className={`inline-flex h-12 w-12 items-center justify-center rounded-xl ${f.bg} ${f.accent}`}>
                    <Icon size={22} />
                  </div>
                  <h3 className="mt-5 text-lg font-semibold text-text-primary">
                    {t(`features.items.${f.key}.title`)}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-text-secondary">
                    {t(`features.items.${f.key}.desc`)}
                  </p>
                </Card>
              </motion.div>
            )
          })}
        </motion.div>
      </Container>
    </section>
  )
}
