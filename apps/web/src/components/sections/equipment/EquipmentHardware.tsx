import { motion } from 'framer-motion'
import { Printer, Monitor, Cpu, Check } from 'lucide-react'
import { Container } from '@/components/ui/Container'
import { Card } from '@/components/ui/Card'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { formatTenge, PRICE_MONOBLOCK, PRICE_PRINTER } from './config'

interface Hardware {
  icon: typeof Printer
  title: string
  price: string
  highlight: string
  bullets: string[]
  accent: 'gold' | 'green' | 'blue'
}

const items: Hardware[] = [
  {
    icon: Cpu,
    title: 'Программа Biliardo',
    price: '10 000 ₸',
    highlight: 'за стол',
    accent: 'green',
    bullets: [
      'Пожизненная лицензия на клуб',
      'Управление столами, баром, тарифами',
      'Турниры, отчёты, смены, роли',
      'Установка и настройка под ваш клуб',
      'Бесплатные обновления',
    ],
  },
  {
    icon: Printer,
    title: 'Принтер чеков',
    price: `+${formatTenge(PRICE_PRINTER)}`,
    highlight: 'опционально',
    accent: 'blue',
    bullets: [
      'Термопринтер 80 мм',
      'Печать чека за игру и бар',
      'Автообрезка чеков',
      'USB-подключение, plug & play',
    ],
  },
  {
    icon: Monitor,
    title: 'Сенсорный моноблок',
    price: `+${formatTenge(PRICE_MONOBLOCK)}`,
    highlight: 'опционально',
    accent: 'gold',
    bullets: [
      'Готовое рабочее место кассира',
      'Сенсорный экран 15.6"',
      'Программа предустановлена',
      'Не нужно покупать отдельный ПК',
    ],
  },
]

const accentClasses = {
  green: { iconBg: 'bg-emerald-500/10', iconText: 'text-emerald-400', glow: 'green' as const },
  blue: { iconBg: 'bg-sky-500/10', iconText: 'text-sky-400', glow: 'blue' as const },
  gold: { iconBg: 'bg-amber-500/10', iconText: 'text-amber-300', glow: 'gold' as const },
}

const container = { animate: { transition: { staggerChildren: 0.08 } } }
const item = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.4, 0, 0.2, 1] } },
}

export function EquipmentHardware() {
  return (
    <section className="relative py-20 sm:py-28">
      <Container size="wide">
        <SectionHeader
          eyebrow="Состав комплекта"
          title={<>Программа и <span className="text-gradient-gold">оборудование</span></>}
          subtitle="Можно взять только программу, а можно полный комплект «под ключ» — со всем железом, нужным для работы клуба."
        />

        <motion.div
          variants={container}
          initial="initial"
          whileInView="animate"
          viewport={{ once: true, margin: '-80px' }}
          className="mt-14 grid gap-5 lg:grid-cols-3"
        >
          {items.map((it) => {
            const Icon = it.icon
            const a = accentClasses[it.accent]
            return (
              <motion.div key={it.title} variants={item}>
                <Card interactive glow={a.glow} className="h-full">
                  <div className={`inline-flex h-12 w-12 items-center justify-center rounded-xl ${a.iconBg} ${a.iconText}`}>
                    <Icon size={22} />
                  </div>
                  <h3 className="mt-5 text-lg font-semibold text-text-primary">{it.title}</h3>
                  <div className="mt-3 flex items-baseline gap-2">
                    <span className="text-3xl font-bold tracking-tight text-text-primary">{it.price}</span>
                    <span className="text-xs uppercase tracking-wider text-text-muted">{it.highlight}</span>
                  </div>
                  <ul className="mt-5 space-y-2.5">
                    {it.bullets.map((b) => (
                      <li key={b} className="flex items-start gap-2.5 text-sm text-text-secondary">
                        <Check size={16} className="mt-0.5 shrink-0 text-emerald-400" />
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                </Card>
              </motion.div>
            )
          })}
        </motion.div>
      </Container>
    </section>
  )
}
