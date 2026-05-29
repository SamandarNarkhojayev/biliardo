import { useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { ArrowRight, Trophy } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Container } from '@/components/ui/Container'
import { useAnimatedCounter } from '@/hooks/useAnimatedCounter'
import { useAuthStore } from '@/store/auth'
import { HeroBracket } from './HeroBracket'

function StatCounter({ target, label }: { target: number; label: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const value = useAnimatedCounter(ref, target, { duration: 2200 })
  return (
    <div ref={ref}>
      <div className="text-3xl font-bold tracking-tight text-text-primary sm:text-4xl">
        {value.toLocaleString('ru-RU')}
        <span className="text-emerald-400">+</span>
      </div>
      <div className="mt-1 text-xs uppercase tracking-wider text-text-muted sm:text-sm">{label}</div>
    </div>
  )
}

export function Hero() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)

  const handleCreate = () => {
    if (user) navigate('/me?tab=mine&create=1')
    else navigate('/auth', { state: { mode: 'register', returnTo: '/me?tab=mine&create=1' } })
  }

  return (
    <section className="relative overflow-hidden">
      {/* Background mesh */}
      <div className="bg-mesh absolute inset-0 -z-10" aria-hidden />
      <div className="bg-grid absolute inset-0 -z-10 [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_70%)]" aria-hidden />

      {/* Floating decorative orbs */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden" aria-hidden>
        {[
          { size: 6, top: '12%', left: '8%', delay: 0 },
          { size: 4, top: '70%', left: '14%', delay: 2 },
          { size: 8, top: '25%', left: '88%', delay: 1 },
          { size: 5, top: '60%', left: '78%', delay: 3 },
          { size: 3, top: '85%', left: '50%', delay: 4 },
          { size: 6, top: '40%', left: '50%', delay: 5 },
        ].map((o, i) => (
          <span
            key={i}
            className="absolute rounded-full bg-emerald-400/40 blur-sm animate-float-slow"
            style={{
              width: o.size, height: o.size, top: o.top, left: o.left,
              animationDelay: `${o.delay}s`,
            }}
          />
        ))}
      </div>

      <Container size="wide" className="pt-12 pb-20 sm:pt-20 sm:pb-28 lg:pt-28 lg:pb-32">
        <div className="grid items-center gap-12 lg:grid-cols-12 lg:gap-10">
          <div className="lg:col-span-6">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-300"
            >
              <Trophy size={12} />
              {t('hero.eyebrow')}
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.05 }}
              className="mt-5 text-balance text-4xl font-extrabold leading-[1.05] tracking-[-0.02em] text-text-primary sm:text-5xl md:text-6xl lg:text-[64px] lg:leading-[1.05]"
            >
              {t('hero.title_line1')}
              <br />
              <span className="text-gradient-green">{t('hero.title_line2')}</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.15 }}
              className="mt-6 max-w-xl text-pretty text-base leading-relaxed text-text-secondary sm:text-lg"
            >
              {t('hero.subtitle')}
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.25 }}
              className="mt-8 flex flex-col gap-3 sm:flex-row"
            >
              <Button
                variant="primary" size="lg"
                rightIcon={<ArrowRight size={18} />} fullWidth
                onClick={handleCreate}
                className="sm:w-auto"
              >
                {t('hero.cta_primary')}
              </Button>
              <Link to="/tournaments" className="sm:contents">
                <Button variant="secondary" size="lg" fullWidth className="sm:w-auto">
                  {t('hero.cta_secondary')}
                </Button>
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="mt-12 grid max-w-md grid-cols-3 gap-6 border-t border-[var(--line)] pt-8"
            >
              <StatCounter target={1240} label={t('hero.stat_tournaments')} />
              <StatCounter target={87} label={t('hero.stat_clubs')} />
              <StatCounter target={9500} label={t('hero.stat_players')} />
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2, ease: [0.4, 0, 0.2, 1] }}
            className="lg:col-span-6"
          >
            <HeroBracket />
          </motion.div>
        </div>
      </Container>
    </section>
  )
}
