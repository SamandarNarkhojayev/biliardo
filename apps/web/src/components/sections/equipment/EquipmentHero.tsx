import { motion } from 'framer-motion'
import { ArrowRight, Cpu, Calculator, MessageCircle } from 'lucide-react'
import { Container } from '@/components/ui/Container'
import { Button } from '@/components/ui/Button'
import { buildWhatsAppLink } from './config'

const initialMessage =
  'Здравствуйте! Хочу узнать подробнее об автоматизации бильярдного клуба.'

export function EquipmentHero() {
  return (
    <section className="relative overflow-hidden">
      <div className="bg-mesh absolute inset-0 -z-10" aria-hidden />
      <div
        className="bg-grid absolute inset-0 -z-10 [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_70%)]"
        aria-hidden
      />

      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden" aria-hidden>
        {[
          { size: 6, top: '14%', left: '10%', delay: 0 },
          { size: 4, top: '70%', left: '18%', delay: 2 },
          { size: 8, top: '22%', left: '85%', delay: 1 },
          { size: 5, top: '64%', left: '76%', delay: 3 },
          { size: 3, top: '88%', left: '48%', delay: 4 },
        ].map((o, i) => (
          <span
            key={i}
            className="absolute rounded-full bg-emerald-400/40 blur-sm animate-float-slow"
            style={{
              width: o.size,
              height: o.size,
              top: o.top,
              left: o.left,
              animationDelay: `${o.delay}s`,
            }}
          />
        ))}
      </div>

      <Container size="wide" className="pt-12 pb-20 sm:pt-20 sm:pb-28 lg:pt-28 lg:pb-32">
        <div className="grid items-center gap-12 lg:grid-cols-12 lg:gap-10">
          <div className="lg:col-span-7">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-300"
            >
              <Cpu size={12} />
              Автоматизация бильярдного клуба
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.05 }}
              className="mt-5 text-balance text-4xl font-extrabold leading-[1.05] tracking-[-0.02em] text-text-primary sm:text-5xl md:text-6xl lg:text-[64px] lg:leading-[1.05]"
            >
              Программа для клуба,
              <br />
              <span className="text-gradient-green">которая управляет столами</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.15 }}
              className="mt-6 max-w-2xl text-pretty text-base leading-relaxed text-text-secondary sm:text-lg"
            >
              Старт и стоп игры одной кнопкой, тарифы день/ночь, бар, отчёты и турниры — в
              одном приложении. Подключаем оборудование, настраиваем под ваш клуб и обучаем
              персонал. Лицензия пожизненная, без скрытых платежей.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.25 }}
              className="mt-8 flex flex-col gap-3 sm:flex-row"
            >
              <a href="#calculator">
                <Button
                  variant="primary"
                  size="lg"
                  rightIcon={<ArrowRight size={18} />}
                  fullWidth
                >
                  <Calculator size={18} className="mr-1" />
                  Рассчитать стоимость
                </Button>
              </a>
              <a
                href={buildWhatsAppLink(initialMessage)}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button variant="secondary" size="lg" fullWidth leftIcon={<MessageCircle size={18} />}>
                  Написать в WhatsApp
                </Button>
              </a>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="mt-12 grid max-w-xl grid-cols-3 gap-6 border-t border-[var(--line)] pt-8"
            >
              <Stat value="10 000 ₸" label="за стол" />
              <Stat value="до 35" label="столов" />
              <Stat value="∞" label="лицензия" />
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2, ease: [0.4, 0, 0.2, 1] }}
            className="lg:col-span-5"
          >
            <HeroPreview />
          </motion.div>
        </div>
      </Container>
    </section>
  )
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <div className="text-2xl font-bold tracking-tight text-text-primary sm:text-3xl">
        {value}
      </div>
      <div className="mt-1 text-xs uppercase tracking-wider text-text-muted sm:text-sm">
        {label}
      </div>
    </div>
  )
}

function HeroPreview() {
  return (
    <div className="glass relative overflow-hidden rounded-3xl p-5 shadow-[0_30px_80px_-30px_rgba(16,185,129,0.45)]">
      <div className="flex items-center gap-1.5 pb-4">
        <span className="h-2.5 w-2.5 rounded-full bg-red-500/80" />
        <span className="h-2.5 w-2.5 rounded-full bg-amber-400/80" />
        <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/80" />
        <span className="ml-3 text-xs text-text-muted">Biliardo · Столы</span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {[
          { name: 'Стол №1', state: 'active', time: '01:24:18', cost: '4 100 ₸' },
          { name: 'Стол №2', state: 'idle', time: '—', cost: '0 ₸' },
          { name: 'Стол №3', state: 'active', time: '00:42:05', cost: '2 050 ₸' },
          { name: 'Стол №4', state: 'paused', time: '00:18:30', cost: '950 ₸' },
        ].map((tbl) => (
          <div
            key={tbl.name}
            className="rounded-2xl border border-[var(--line)] bg-[var(--surface-elevated)] p-4"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-text-primary">{tbl.name}</span>
              <StateDot state={tbl.state} />
            </div>
            <div className="mt-3 font-mono text-xl font-bold tracking-tight text-text-primary">
              {tbl.time}
            </div>
            <div className="mt-1 text-xs text-text-muted">{tbl.cost}</div>
          </div>
        ))}
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2 text-center">
        <MiniStat label="Сегодня" value="184 200 ₸" />
        <MiniStat label="Бар" value="32 500 ₸" />
        <MiniStat label="Сессий" value="27" />
      </div>
    </div>
  )
}

function StateDot({ state }: { state: string }) {
  const map: Record<string, { color: string; label: string }> = {
    active: { color: 'bg-emerald-400', label: 'Идёт' },
    idle: { color: 'bg-slate-500', label: 'Свободен' },
    paused: { color: 'bg-amber-400', label: 'Пауза' },
  }
  const { color, label } = map[state] ?? map.idle
  return (
    <span className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-text-muted">
      <span className={`h-1.5 w-1.5 rounded-full ${color} animate-pulse-soft`} />
      {label}
    </span>
  )
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-[var(--line)] bg-[var(--surface-card)] py-2">
      <div className="text-xs text-text-muted">{label}</div>
      <div className="mt-0.5 text-sm font-semibold text-text-primary">{value}</div>
    </div>
  )
}
