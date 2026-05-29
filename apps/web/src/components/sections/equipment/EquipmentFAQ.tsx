import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown } from 'lucide-react'
import { Container } from '@/components/ui/Container'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { cn } from '@/utils/cn'

const faq = [
  {
    q: 'Это разовая оплата или подписка?',
    a: 'Это разовая оплата за стол. Лицензия пожизненная, обновления программы — бесплатно. Никаких ежемесячных платежей.',
  },
  {
    q: 'Можно начать только с программы и докупить оборудование позже?',
    a: 'Да. Многие клубы стартуют только с программой, а принтер чеков или моноблок добавляют, когда выйдут на стабильный поток клиентов.',
  },
  {
    q: 'Подойдёт ли программа для маленького клуба?',
    a: 'Да. Программа одинаково удобна и для 2-х столов, и для 35-ти. Цена считается за фактическое количество столов.',
  },
  {
    q: 'Нужен ли интернет для работы?',
    a: 'Нет. Программа работает на локальном компьютере и не зависит от интернета. Интернет нужен только для обновлений и удалённой поддержки.',
  },
  {
    q: 'Что входит в установку?',
    a: 'Привезём оборудование, подключим к компьютеру или поставим моноблок, настроим тарифы под ваш клуб, подключим управление светом столов, обучим персонал.',
  },
  {
    q: 'А если что-то сломается?',
    a: 'На железо — гарантия от производителя. По программе — поддержка остаётся: подключаемся удалённо и помогаем.',
  },
]

const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: faq.map((item) => ({
    '@type': 'Question',
    name: item.q,
    acceptedAnswer: {
      '@type': 'Answer',
      text: item.a,
    },
  })),
}

export function EquipmentFAQ() {
  return (
    <section id="faq" className="relative py-20 sm:py-28">
      <script
        type="application/ld+json"
        // FAQPage schema → rich snippets в Google.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <Container size="default">
        <SectionHeader
          eyebrow="Вопросы и ответы"
          title="Часто спрашивают"
          subtitle="Если не нашли ответ — напишите в WhatsApp, ответим лично."
        />

        <div className="mt-12 space-y-3">
          {faq.map((item, i) => (
            <FAQItem key={item.q} q={item.q} a={item.a} index={i} />
          ))}
        </div>
      </Container>
    </section>
  )
}

function FAQItem({ q, a, index }: { q: string; a: string; index: number }) {
  const [open, setOpen] = useState(false)
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.4, delay: index * 0.04 }}
      className={cn(
        'glass rounded-2xl transition',
        open && 'border-emerald-400/30',
      )}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="ring-focus flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
      >
        <span className="text-base font-semibold text-text-primary">{q}</span>
        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className={cn(
            'inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg',
            open ? 'bg-emerald-500/15 text-emerald-300' : 'bg-[var(--surface-elevated)] text-text-secondary',
          )}
        >
          <ChevronDown size={18} />
        </motion.span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
            className="overflow-hidden"
          >
            <p className="px-5 pb-5 text-sm leading-relaxed text-text-secondary">{a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
