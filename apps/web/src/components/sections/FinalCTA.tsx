import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import { Container } from '@/components/ui/Container'
import { Button } from '@/components/ui/Button'
import { useAuthStore } from '@/store/auth'

export function FinalCTA() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const handleCreate = () => {
    if (user) navigate('/me?tab=mine&create=1')
    else navigate('/auth', { state: { mode: 'register', returnTo: '/me?tab=mine&create=1' } })
  }

  return (
    <section className="relative py-20 sm:py-28">
      <Container size="default">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.6 }}
          className="relative overflow-hidden rounded-3xl border border-emerald-400/30 bg-gradient-to-br from-emerald-500/10 via-bg-secondary to-bg-secondary p-10 text-center sm:p-14"
        >
          {/* Decorative orbs */}
          <div className="pointer-events-none absolute -left-20 -top-20 h-64 w-64 rounded-full bg-emerald-500/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-20 -right-20 h-64 w-64 rounded-full bg-sky-500/15 blur-3xl" />
          <div className="bg-grid pointer-events-none absolute inset-0 opacity-40 [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_70%)]" />

          <div className="relative">
            <h2 className="text-balance text-3xl font-bold tracking-tight text-text-primary sm:text-4xl md:text-5xl">
              {t('final_cta.title')}
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-pretty text-base text-text-secondary sm:text-lg">
              {t('final_cta.subtitle')}
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button
                variant="primary" size="lg"
                rightIcon={<ArrowRight size={18} />}
                onClick={handleCreate}
              >
                {t('final_cta.cta')}
              </Button>
              <Link to="/tournaments">
                <Button variant="ghost" size="lg">
                  {t('hero.cta_secondary')}
                </Button>
              </Link>
            </div>
          </div>
        </motion.div>
      </Container>
    </section>
  )
}
