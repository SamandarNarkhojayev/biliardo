import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { ArrowLeft, Construction } from 'lucide-react'
import { Container } from '@/components/ui/Container'
import { Button } from '@/components/ui/Button'

interface PlaceholderProps {
  title: string
  description?: string
}

export default function Placeholder({ title, description }: PlaceholderProps) {
  const { t } = useTranslation()
  return (
    <section className="relative flex min-h-[70vh] items-center justify-center py-20">
      <div className="bg-mesh absolute inset-0 -z-10 opacity-50" aria-hidden />
      <Container size="narrow">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <div className="mx-auto inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/15 text-amber-300">
            <Construction size={28} />
          </div>
          <h1 className="mt-6 text-3xl font-bold tracking-tight text-text-primary sm:text-4xl">
            {title}
          </h1>
          <p className="mx-auto mt-4 max-w-md text-balance text-base text-text-secondary">
            {description ?? `${t('common.in_development')}. ${t('common.soon')}.`}
          </p>
          <div className="mt-8">
            <Link to="/">
              <Button variant="secondary" leftIcon={<ArrowLeft size={16} />}>
                {t('common.back_home')}
              </Button>
            </Link>
          </div>
        </motion.div>
      </Container>
    </section>
  )
}
