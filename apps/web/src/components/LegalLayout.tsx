import type { ReactNode } from 'react'
import { motion } from 'framer-motion'
import { Container } from '@/components/ui/Container'
import { Seo } from '@/components/Seo'

interface LegalLayoutProps {
  title: string
  description: string
  path: string
  eyebrow?: string
  children: ReactNode
}

/**
 * Универсальный layout для контентных/правовых страниц (About, Terms, Privacy и т.д.).
 * Подключает <Seo> и аккуратно типографит длинный текст.
 */
export function LegalLayout({ title, description, path, eyebrow, children }: LegalLayoutProps) {
  return (
    <section className="relative py-12 sm:py-16">
      <Seo title={`${title} — biliardo.kz`} description={description} path={path} />
      <div className="bg-mesh absolute inset-0 -z-10 opacity-40" aria-hidden />
      <Container size="narrow">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          {eyebrow && (
            <div className="mb-3 text-xs font-semibold uppercase tracking-wider text-emerald-400">
              {eyebrow}
            </div>
          )}
          <h1 className="text-3xl font-bold tracking-tight text-text-primary sm:text-4xl">{title}</h1>
          <p className="mt-3 text-base text-text-secondary">{description}</p>

          <div className="prose-bil mt-10 space-y-6 text-text-secondary [&_h2]:mt-10 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-text-primary [&_h3]:mt-6 [&_h3]:text-base [&_h3]:font-semibold [&_h3]:text-text-primary [&_p]:leading-relaxed [&_strong]:text-text-primary [&_a]:text-emerald-500 [&_a]:underline [&_a:hover]:text-emerald-600 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1.5 [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:space-y-1.5 [&_li]:leading-relaxed [&_hr]:my-10 [&_hr]:border-0 [&_hr]:h-px [&_hr]:bg-[var(--line-strong)]">
            {children}
          </div>
        </motion.div>
      </Container>
    </section>
  )
}
