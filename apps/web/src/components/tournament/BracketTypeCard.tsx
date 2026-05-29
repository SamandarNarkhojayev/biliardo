import { useTranslation } from 'react-i18next'
import { Check } from 'lucide-react'
import type { BracketType } from '@billiard/shared'
import { cn } from '@/utils/cn'

/**
 * Карточка типа сетки с визуальной мини-диаграммой и описанием для wizard'а
 * создания турнира. Каждый тип нарисован SVG-схемой, чтобы пользователь видел
 * структуру до того, как нажмёт кнопку.
 */

interface Props {
  type: BracketType
  active: boolean
  onClick: () => void
}

export function BracketTypeCard({ type, active, onClick }: Props) {
  const { t } = useTranslation()
  const Diagram = DIAGRAMS[type]
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'ring-focus group relative overflow-hidden rounded-2xl border p-4 text-left transition-all',
        active
          ? 'border-emerald-400/70 bg-emerald-500/[0.08] shadow-[0_0_0_1px_rgba(16,185,129,0.25),0_0_30px_-10px_rgba(16,185,129,0.6)]'
          : 'border-[var(--line)] bg-[var(--surface-card)] hover:border-[var(--line-strong)] hover:bg-[var(--surface-card-hover)]',
      )}
    >
      {active && (
        <div className="absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-full bg-emerald-400 text-bg-primary">
          <Check size={14} strokeWidth={3} />
        </div>
      )}

      <div className={cn(
        'flex h-20 items-center justify-center rounded-xl transition-colors',
        active ? 'bg-emerald-500/5' : 'bg-[var(--surface-elevated)]',
      )}>
        <Diagram active={active} />
      </div>

      <div className="mt-3">
        <div className="font-semibold text-text-primary">{t(`bracket_type.${type}`)}</div>
        <div className="mt-1 text-xs leading-relaxed text-text-secondary">
          {t(`bracket_type_desc.${type}`)}
        </div>
      </div>

      <div className="mt-2 inline-flex items-center gap-1 rounded-full bg-[var(--surface-elevated)] px-2 py-0.5 text-[10px] uppercase tracking-wider text-text-muted">
        {t(`bracket_type_best_for.${type}`)}
      </div>
    </button>
  )
}

/* ── SVG diagrams ────────────────────────────────────────────── */

interface DiagramProps {
  active: boolean
}

const COLOR_OFF = 'rgb(148 163 184 / 0.55)'
const COLOR_ON = 'rgb(52 211 153)'

function pickColor(active: boolean): string {
  return active ? COLOR_ON : COLOR_OFF
}

function SingleElim({ active }: DiagramProps) {
  const c = pickColor(active)
  return (
    <svg viewBox="0 0 120 60" className="h-full">
      {/* Round 1: 4 matches */}
      {[0, 1, 2, 3].map((i) => (
        <rect key={i} x={4} y={4 + i * 14} width={20} height={8} rx={2} fill={c} opacity={0.55} />
      ))}
      {/* Round 2: 2 matches */}
      {[0, 1].map((i) => (
        <rect key={i} x={50} y={11 + i * 28} width={20} height={8} rx={2} fill={c} opacity={0.8} />
      ))}
      {/* Final */}
      <rect x={96} y={26} width={20} height={8} rx={2} fill={c} />
      {/* connectors */}
      <g stroke={c} strokeWidth={1} fill="none" opacity={0.5}>
        <path d="M24 8 L37 8 L37 22 L24 22" />
        <path d="M24 36 L37 36 L37 22 L24 22" />
        <path d="M37 22 L50 15" />
        <path d="M24 8+28=36" />
        <path d="M24 50 L37 50 L37 22+28=50" />
        <path d="M70 15 L83 15 L83 30 L70 30" />
        <path d="M70 43 L83 43 L83 30" />
        <path d="M83 30 L96 30" />
      </g>
    </svg>
  )
}

function DoubleElim({ active }: DiagramProps) {
  const c = pickColor(active)
  return (
    <svg viewBox="0 0 120 60" className="h-full">
      {/* Winners bracket — top */}
      <text x={2} y={9} fontSize="6" fill={c} opacity={0.7}>W</text>
      {[0, 1].map((i) => <rect key={i} x={12} y={5 + i * 8} width={16} height={6} rx={1.5} fill={c} opacity={0.7} />)}
      <rect x={36} y={8} width={16} height={6} rx={1.5} fill={c} opacity={0.85} />
      {/* Losers bracket — bottom */}
      <text x={2} y={42} fontSize="6" fill={c} opacity={0.7}>L</text>
      {[0, 1].map((i) => <rect key={i} x={12} y={37 + i * 8} width={16} height={6} rx={1.5} fill={c} opacity={0.55} />)}
      <rect x={36} y={41} width={16} height={6} rx={1.5} fill={c} opacity={0.7} />
      <rect x={60} y={32} width={16} height={6} rx={1.5} fill={c} opacity={0.85} />
      {/* Grand final */}
      <rect x={92} y={24} width={20} height={8} rx={2} fill={c} />
      <text x={96} y={47} fontSize="6" fill={c} opacity={0.85}>GF</text>
      {/* Crown */}
      <text x={104} y={20} fontSize="9">👑</text>
    </svg>
  )
}

function RoundRobin({ active }: DiagramProps) {
  const c = pickColor(active)
  const nodes = [
    { x: 60, y: 8 }, { x: 100, y: 20 }, { x: 100, y: 40 },
    { x: 60, y: 52 }, { x: 20, y: 40 }, { x: 20, y: 20 },
  ]
  return (
    <svg viewBox="0 0 120 60" className="h-full">
      <g stroke={c} strokeWidth={0.8} opacity={0.45}>
        {nodes.map((a, i) =>
          nodes.slice(i + 1).map((b, j) => (
            <line key={`${i}-${j}`} x1={a.x} y1={a.y} x2={b.x} y2={b.y} />
          )),
        )}
      </g>
      {nodes.map((n, i) => (
        <circle key={i} cx={n.x} cy={n.y} r={4.5} fill={c} />
      ))}
    </svg>
  )
}

function Swiss({ active }: DiagramProps) {
  const c = pickColor(active)
  return (
    <svg viewBox="0 0 120 60" className="h-full">
      {[0, 1, 2].map((round) => (
        <g key={round}>
          <text x={6 + round * 38} y={10} fontSize="6" fill={c} opacity={0.7}>R{round + 1}</text>
          {[0, 1, 2].map((i) => (
            <rect
              key={i}
              x={4 + round * 38}
              y={14 + i * 13}
              width={32}
              height={10}
              rx={2}
              fill={c}
              opacity={0.45 + round * 0.15}
            />
          ))}
        </g>
      ))}
    </svg>
  )
}

function GroupPlayoff({ active }: DiagramProps) {
  const c = pickColor(active)
  return (
    <svg viewBox="0 0 120 60" className="h-full">
      {/* Group A */}
      <rect x={4} y={6} width={30} height={22} rx={3} fill="none" stroke={c} strokeWidth={1} opacity={0.7} strokeDasharray="2 1.5" />
      <text x={6} y={12} fontSize="5" fill={c} opacity={0.75}>A</text>
      {[0, 1].map((i) => <rect key={i} x={8} y={15 + i * 6} width={22} height={4} rx={1} fill={c} opacity={0.65} />)}
      {/* Group B */}
      <rect x={4} y={32} width={30} height={22} rx={3} fill="none" stroke={c} strokeWidth={1} opacity={0.7} strokeDasharray="2 1.5" />
      <text x={6} y={38} fontSize="5" fill={c} opacity={0.75}>B</text>
      {[0, 1].map((i) => <rect key={i} x={8} y={41 + i * 6} width={22} height={4} rx={1} fill={c} opacity={0.65} />)}
      {/* Playoff */}
      <rect x={56} y={11} width={20} height={6} rx={1.5} fill={c} opacity={0.75} />
      <rect x={56} y={43} width={20} height={6} rx={1.5} fill={c} opacity={0.75} />
      <rect x={92} y={27} width={20} height={6} rx={1.5} fill={c} />
      {/* connectors */}
      <g stroke={c} strokeWidth={0.7} fill="none" opacity={0.5}>
        <path d="M34 17 L56 14" />
        <path d="M34 43 L56 46" />
        <path d="M76 14 L84 14 L84 30 L92 30" />
        <path d="M76 46 L84 46 L84 30" />
      </g>
    </svg>
  )
}

function PagePlayoff({ active }: DiagramProps) {
  const c = pickColor(active)
  return (
    <svg viewBox="0 0 120 60" className="h-full">
      {/* Page playoff structure: 4 sf → 2 → final */}
      <text x={4} y={9} fontSize="5" fill={c} opacity={0.7}>QF</text>
      <rect x={4} y={14} width={20} height={6} rx={1.5} fill={c} opacity={0.6} />
      <rect x={4} y={26} width={20} height={6} rx={1.5} fill={c} opacity={0.6} />
      <rect x={4} y={38} width={20} height={6} rx={1.5} fill={c} opacity={0.6} />
      <text x={36} y={9} fontSize="5" fill={c} opacity={0.7}>SF</text>
      <rect x={36} y={18} width={20} height={6} rx={1.5} fill={c} opacity={0.75} />
      <rect x={36} y={34} width={20} height={6} rx={1.5} fill={c} opacity={0.75} />
      <text x={68} y={9} fontSize="5" fill={c} opacity={0.7}>Pre-F</text>
      <rect x={68} y={26} width={20} height={6} rx={1.5} fill={c} opacity={0.85} />
      <text x={96} y={9} fontSize="5" fill={c} opacity={0.7}>F</text>
      <rect x={96} y={26} width={20} height={6} rx={1.5} fill={c} />
      <g stroke={c} strokeWidth={0.7} fill="none" opacity={0.5}>
        <path d="M24 17 L36 21" />
        <path d="M24 29 L36 37" />
        <path d="M24 41 L36 37" />
        <path d="M56 21 L68 29" />
        <path d="M56 37 L68 29" />
        <path d="M88 29 L96 29" />
      </g>
    </svg>
  )
}

const DIAGRAMS: Record<BracketType, React.FC<DiagramProps>> = {
  'single-elimination': SingleElim,
  'double-elimination': DoubleElim,
  'round-robin': RoundRobin,
  'swiss': Swiss,
  'group-playoff': GroupPlayoff,
  'page-playoff': PagePlayoff,
}
