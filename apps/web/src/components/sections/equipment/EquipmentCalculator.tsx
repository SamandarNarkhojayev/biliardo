import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Minus, Plus, Printer, Monitor, MessageCircle, Check } from 'lucide-react'
import { Container } from '@/components/ui/Container'
import { Card } from '@/components/ui/Card'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { Button } from '@/components/ui/Button'
import { cn } from '@/utils/cn'
import {
  buildWhatsAppLink,
  formatTenge,
  MAX_TABLES,
  PRICE_MONOBLOCK,
  PRICE_PER_TABLE,
  PRICE_PRINTER,
} from './config'

export function EquipmentCalculator() {
  const [tables, setTables] = useState(8)
  const [printer, setPrinter] = useState(true)
  const [monoblock, setMonoblock] = useState(false)

  const tablesCost = tables * PRICE_PER_TABLE
  const printerCost = printer ? PRICE_PRINTER : 0
  const monoblockCost = monoblock ? PRICE_MONOBLOCK : 0
  const total = tablesCost + printerCost + monoblockCost

  const message = useMemo(() => {
    const lines = [
      'Здравствуйте! Хочу оборудование для бильярдного клуба:',
      '',
      `• Столы: ${tables} × ${formatTenge(PRICE_PER_TABLE)} = ${formatTenge(tablesCost)}`,
    ]
    if (printer) lines.push(`• Принтер чеков: ${formatTenge(PRICE_PRINTER)}`)
    if (monoblock) lines.push(`• Моноблок: ${formatTenge(PRICE_MONOBLOCK)}`)
    lines.push('', `Итого: ${formatTenge(total)}`, '', 'Подскажите по срокам и установке.')
    return lines.join('\n')
  }, [tables, printer, monoblock, tablesCost, total])

  const setTablesClamped = (v: number) =>
    setTables(Math.min(MAX_TABLES, Math.max(1, Math.round(v))))

  return (
    <section id="calculator" className="relative py-20 sm:py-28">
      <Container size="wide">
        <SectionHeader
          eyebrow="Калькулятор"
          title={<>Посчитайте <span className="text-gradient-green">стоимость</span> для вашего клуба</>}
          subtitle="Укажите количество столов и выберите оборудование. Мгновенно увидите итоговую цену и сразу отправите расчёт нам в WhatsApp."
        />

        <div className="mt-14 grid gap-6 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <Card className="h-full">
              <div>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-semibold text-text-primary">Количество столов</h3>
                    <p className="mt-1 text-sm text-text-muted">
                      {formatTenge(PRICE_PER_TABLE)} за стол · максимум {MAX_TABLES}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold tracking-tight text-text-primary">{tables}</div>
                    <div className="text-xs uppercase tracking-wider text-text-muted">столов</div>
                  </div>
                </div>

                <div className="mt-6 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setTablesClamped(tables - 1)}
                    aria-label="Меньше столов"
                    className="ring-focus inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[var(--line-strong)] bg-[var(--surface-elevated)] text-text-primary transition hover:bg-[var(--surface-card-hover)] disabled:opacity-40"
                    disabled={tables <= 1}
                  >
                    <Minus size={18} />
                  </button>

                  <input
                    type="range"
                    min={1}
                    max={MAX_TABLES}
                    value={tables}
                    onChange={(e) => setTablesClamped(Number(e.target.value))}
                    className="h-2 w-full cursor-pointer appearance-none rounded-full bg-[var(--surface-elevated)] accent-emerald-400"
                    style={{
                      background: `linear-gradient(to right, #10b981 0%, #10b981 ${((tables - 1) / (MAX_TABLES - 1)) * 100}%, var(--surface-elevated) ${((tables - 1) / (MAX_TABLES - 1)) * 100}%, var(--surface-elevated) 100%)`,
                    }}
                  />

                  <button
                    type="button"
                    onClick={() => setTablesClamped(tables + 1)}
                    aria-label="Больше столов"
                    className="ring-focus inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[var(--line-strong)] bg-[var(--surface-elevated)] text-text-primary transition hover:bg-[var(--surface-card-hover)] disabled:opacity-40"
                    disabled={tables >= MAX_TABLES}
                  >
                    <Plus size={18} />
                  </button>
                </div>

                <div className="mt-3 flex justify-between text-xs text-text-muted">
                  <span>1</span>
                  <span>{MAX_TABLES}</span>
                </div>
              </div>

              <div className="mt-8 grid gap-3 sm:grid-cols-2">
                <OptionToggle
                  active={printer}
                  onToggle={() => setPrinter((v) => !v)}
                  icon={<Printer size={20} />}
                  title="Принтер чеков"
                  price={`+${formatTenge(PRICE_PRINTER)}`}
                  desc="Термопринтер 80 мм для чеков клиенту"
                />
                <OptionToggle
                  active={monoblock}
                  onToggle={() => setMonoblock((v) => !v)}
                  icon={<Monitor size={20} />}
                  title="Моноблок"
                  price={`+${formatTenge(PRICE_MONOBLOCK)}`}
                  desc="Сенсорный моноблок с предустановкой"
                />
              </div>
            </Card>
          </div>

          <div className="lg:col-span-5">
            <Card className="sticky top-24 h-full">
              <div className="text-xs uppercase tracking-wider text-text-muted">Ваш расчёт</div>

              <ul className="mt-4 space-y-3 border-b border-[var(--line)] pb-4">
                <Row
                  label={`Столы × ${tables}`}
                  sub={`${formatTenge(PRICE_PER_TABLE)} за стол`}
                  value={formatTenge(tablesCost)}
                />
                <motion.div
                  initial={false}
                  animate={{ opacity: printer ? 1 : 0.4 }}
                  transition={{ duration: 0.2 }}
                >
                  <Row
                    label="Принтер чеков"
                    sub={printer ? 'включено' : 'не выбрано'}
                    value={printer ? formatTenge(PRICE_PRINTER) : '—'}
                  />
                </motion.div>
                <motion.div
                  initial={false}
                  animate={{ opacity: monoblock ? 1 : 0.4 }}
                  transition={{ duration: 0.2 }}
                >
                  <Row
                    label="Моноблок"
                    sub={monoblock ? 'включено' : 'не выбрано'}
                    value={monoblock ? formatTenge(PRICE_MONOBLOCK) : '—'}
                  />
                </motion.div>
              </ul>

              <div className="mt-5 flex items-end justify-between">
                <div className="text-sm text-text-secondary">Итого</div>
                <motion.div
                  key={total}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25 }}
                  className="text-4xl font-bold tracking-tight text-gradient-green"
                >
                  {formatTenge(total)}
                </motion.div>
              </div>

              <a
                href={buildWhatsAppLink(message)}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-6 block"
              >
                <Button
                  variant="primary"
                  size="lg"
                  fullWidth
                  leftIcon={<MessageCircle size={18} />}
                >
                  Отправить в WhatsApp
                </Button>
              </a>

              <p className="mt-3 text-center text-xs text-text-muted">
                Расчёт уйдёт нам сообщением — обсудим сроки и установку
              </p>
            </Card>
          </div>
        </div>
      </Container>
    </section>
  )
}

function OptionToggle({
  active,
  onToggle,
  icon,
  title,
  price,
  desc,
}: {
  active: boolean
  onToggle: () => void
  icon: React.ReactNode
  title: string
  price: string
  desc: string
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={active}
      className={cn(
        'ring-focus group relative flex flex-col items-start gap-2 rounded-2xl border p-4 text-left transition',
        active
          ? 'border-emerald-400/40 bg-emerald-500/10 shadow-[var(--shadow-glow-green)]'
          : 'border-[var(--line)] bg-[var(--surface-card)] hover:bg-[var(--surface-card-hover)]',
      )}
    >
      <div className="flex w-full items-start justify-between">
        <div
          className={cn(
            'inline-flex h-10 w-10 items-center justify-center rounded-xl transition',
            active ? 'bg-emerald-500/20 text-emerald-300' : 'bg-[var(--surface-elevated)] text-text-secondary',
          )}
        >
          {icon}
        </div>
        <span
          className={cn(
            'inline-flex h-6 w-6 items-center justify-center rounded-md border transition',
            active
              ? 'border-emerald-400 bg-emerald-500 text-[#0a0f1c]'
              : 'border-[var(--line-strong)] bg-transparent text-transparent',
          )}
        >
          <Check size={14} strokeWidth={3} />
        </span>
      </div>
      <div className="mt-1 flex w-full items-baseline justify-between gap-2">
        <span className="text-sm font-semibold text-text-primary">{title}</span>
        <span className={cn('text-sm font-semibold', active ? 'text-emerald-300' : 'text-text-muted')}>
          {price}
        </span>
      </div>
      <span className="text-xs text-text-muted">{desc}</span>
    </button>
  )
}

function Row({ label, sub, value }: { label: string; sub: string; value: string }) {
  return (
    <li className="flex items-start justify-between gap-4">
      <div>
        <div className="text-sm font-medium text-text-primary">{label}</div>
        <div className="text-xs text-text-muted">{sub}</div>
      </div>
      <div className="font-mono text-sm font-semibold text-text-primary">{value}</div>
    </li>
  )
}
