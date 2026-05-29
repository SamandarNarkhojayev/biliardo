import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { Quote } from 'lucide-react'
import { Container } from '@/components/ui/Container'
import { SectionHeader } from '@/components/ui/SectionHeader'

interface Testimonial {
  text: string
  author: string
  role: string
  avatarColor: string
  initials: string
}

const items: Testimonial[] = [
  {
    text: 'Провели первый турнир в клубе — участники сами зарегистрировались за один вечер. До этого мы три дня собирали список в WhatsApp.',
    author: 'Ержан Турсунов',
    role: 'Клуб «Пирамида», Алматы',
    avatarColor: 'from-emerald-400 to-emerald-700',
    initials: 'ЕТ',
  },
  {
    text: 'Раньше вёл сетку в Excel и распечатывал на А3. Теперь всё онлайн, игроки сами видят свои матчи на телефоне. Экономия времени — часы.',
    author: 'Айгуль Бекова',
    role: 'Организатор турниров, Астана',
    avatarColor: 'from-sky-400 to-sky-700',
    initials: 'АБ',
  },
  {
    text: 'Красиво, удобно, понятно даже бабушкам, которые приводят внуков на турниры. Платформа стала частью клуба за месяц.',
    author: 'Бахыт Нурланов',
    role: 'Клуб «Чемпион», Шымкент',
    avatarColor: 'from-amber-400 to-amber-700',
    initials: 'БН',
  },
]

export function Testimonials() {
  const { t } = useTranslation()

  return (
    <section className="relative py-20 sm:py-28">
      <Container size="wide">
        <SectionHeader title={t('testimonials.title')} subtitle={t('testimonials.subtitle')} />

        <div className="mt-14 grid gap-5 md:grid-cols-3">
          {items.map((it, i) => (
            <motion.div
              key={it.author}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              className="glass glass-hover relative flex h-full flex-col rounded-2xl p-6"
            >
              <Quote size={28} className="text-emerald-400/40" />
              <p className="mt-3 flex-1 text-pretty text-sm leading-relaxed text-text-primary">
                «{it.text}»
              </p>
              <div className="mt-6 flex items-center gap-3 border-t border-[var(--line)] pt-4">
                <div className={`flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br ${it.avatarColor} text-sm font-bold text-white`}>
                  {it.initials}
                </div>
                <div>
                  <div className="text-sm font-semibold text-text-primary">{it.author}</div>
                  <div className="text-xs text-text-muted">{it.role}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </Container>
    </section>
  )
}
