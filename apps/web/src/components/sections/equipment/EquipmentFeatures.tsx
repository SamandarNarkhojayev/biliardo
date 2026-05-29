import { motion } from 'framer-motion'
import {
  LayoutDashboard,
  Wine,
  Tag,
  BarChart3,
  Trophy,
  Users,
  Printer,
  Zap,
  Clock,
  type LucideIcon,
} from 'lucide-react'
import { Container } from '@/components/ui/Container'
import { Card } from '@/components/ui/Card'
import { SectionHeader } from '@/components/ui/SectionHeader'

interface Feature {
  icon: LucideIcon
  accent: string
  bg: string
  title: string
  desc: string
}

const features: Feature[] = [
  {
    icon: LayoutDashboard,
    accent: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    title: 'Управление столами',
    desc: 'Старт и стоп игры одной кнопкой, режимы «по времени», «по сумме» и «свободно». Таймер, стоимость и история — в реальном времени.',
  },
  {
    icon: Tag,
    accent: 'text-sky-400',
    bg: 'bg-sky-500/10',
    title: 'Гибкие тарифы',
    desc: 'Разные цены день/ночь и по дням недели. Можно настроить отдельные тарифы для каждого стола и применять акции.',
  },
  {
    icon: Wine,
    accent: 'text-violet-400',
    bg: 'bg-violet-500/10',
    title: 'Бар и продажи',
    desc: 'Каталог напитков и закусок, продажи на стол или на вынос. Списание остатков и итоги по позициям в отчёте.',
  },
  {
    icon: Trophy,
    accent: 'text-amber-300',
    bg: 'bg-amber-500/10',
    title: 'Турниры',
    desc: 'Создание сетки на нужное число игроков, ведение результатов прямо в приложении. Отдельный экран для зрителей.',
  },
  {
    icon: BarChart3,
    accent: 'text-fuchsia-400',
    bg: 'bg-fuchsia-500/10',
    title: 'Отчёты и смены',
    desc: 'Выручка по столам и бару, отчёт по смене, экспорт. Видно, кто из персонала открывал и закрывал смену.',
  },
  {
    icon: Users,
    accent: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    title: 'Пользователи и роли',
    desc: 'Администратор, кассир, бармен — у каждого свой доступ. Логирование действий и быстрая смена пользователя.',
  },
  {
    icon: Printer,
    accent: 'text-sky-400',
    bg: 'bg-sky-500/10',
    title: 'Печать чеков',
    desc: 'Печать чека гостю в один клик: время игры, тариф, бар, итог. Поддержка 80-мм термопринтера.',
  },
  {
    icon: Zap,
    accent: 'text-amber-300',
    bg: 'bg-amber-500/10',
    title: 'Свет столов',
    desc: 'Включение света над столом автоматически при старте сессии и выключение при завершении. Экономия и порядок.',
  },
  {
    icon: Clock,
    accent: 'text-violet-400',
    bg: 'bg-violet-500/10',
    title: 'Работает офлайн',
    desc: 'Десктопное приложение, не зависит от интернета. Все данные — локально. Обновления приходят автоматически.',
  },
]

const container = { animate: { transition: { staggerChildren: 0.06 } } }
const item = {
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.4, 0, 0.2, 1] } },
}

export function EquipmentFeatures() {
  return (
    <section id="features" className="relative py-20 sm:py-28">
      <Container size="wide">
        <SectionHeader
          eyebrow="Возможности"
          title={<>Всё, что нужно бильярдному клубу — <span className="text-gradient-green">в одном приложении</span></>}
          subtitle="Программа закрывает учёт столов, бар, тарифы, отчёты и турниры. Не нужно держать несколько систем — одна программа управляет всем клубом."
        />

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
              <motion.div key={f.title} variants={item}>
                <Card interactive glow="green" className="h-full">
                  <div className={`inline-flex h-12 w-12 items-center justify-center rounded-xl ${f.bg} ${f.accent}`}>
                    <Icon size={22} />
                  </div>
                  <h3 className="mt-5 text-lg font-semibold text-text-primary">{f.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-text-secondary">{f.desc}</p>
                </Card>
              </motion.div>
            )
          })}
        </motion.div>
      </Container>
    </section>
  )
}
