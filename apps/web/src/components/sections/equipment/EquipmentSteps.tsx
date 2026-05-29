import { motion } from 'framer-motion'
import { MessageCircle, Wrench, GraduationCap, ShieldCheck } from 'lucide-react'
import { Container } from '@/components/ui/Container'
import { SectionHeader } from '@/components/ui/SectionHeader'

const steps = [
  {
    icon: MessageCircle,
    title: 'Заявка',
    desc: 'Напишите в WhatsApp с расчётом из калькулятора. Уточним количество столов, режим работы и адрес клуба.',
  },
  {
    icon: Wrench,
    title: 'Установка',
    desc: 'Привезём оборудование и подключим. Настроим тарифы день/ночь, печать чеков и связку света со столами.',
  },
  {
    icon: GraduationCap,
    title: 'Обучение',
    desc: 'Покажем администратору и барменам, как работать со столами, баром и сменами. Передадим короткую инструкцию.',
  },
  {
    icon: ShieldCheck,
    title: 'Поддержка',
    desc: 'Остаёмся на связи: помогаем с настройками, обновлениями и нестандартными ситуациями. Гарантия на железо.',
  },
]

const howToJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'HowTo',
  name: 'Как подключить программу для бильярдного клуба Biliardo',
  description: 'Процесс подключения автоматизации бильярдного клуба от заявки до запуска: программа, оборудование, обучение и поддержка.',
  totalTime: 'P3D',
  step: steps.map((s, i) => ({
    '@type': 'HowToStep',
    position: i + 1,
    name: s.title,
    text: s.desc,
  })),
}

export function EquipmentSteps() {
  return (
    <section className="relative py-20 sm:py-28">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(howToJsonLd) }}
      />
      <Container size="wide">
        <SectionHeader
          eyebrow="Как мы работаем"
          title={<>От заявки до запуска — <span className="text-gradient-green">за несколько дней</span></>}
          subtitle="Делаем под ключ: программа, оборудование, обучение и поддержка."
        />

        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, i) => {
            const Icon = step.icon
            return (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-80px' }}
                transition={{ duration: 0.5, delay: i * 0.08, ease: [0.4, 0, 0.2, 1] }}
                className="glass relative h-full rounded-2xl p-6"
              >
                <div className="absolute right-4 top-4 text-5xl font-bold leading-none text-text-primary/5">
                  {String(i + 1).padStart(2, '0')}
                </div>
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
                  <Icon size={22} />
                </div>
                <h3 className="mt-5 text-lg font-semibold text-text-primary">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-text-secondary">{step.desc}</p>
              </motion.div>
            )
          })}
        </div>
      </Container>
    </section>
  )
}
