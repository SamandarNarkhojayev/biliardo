import { motion } from 'framer-motion'

/**
 * Decorative SVG mockup of a tournament bracket. Animated lines + match cards.
 * Pure SVG — no external assets. Used in Hero section.
 */
export function HeroBracket() {
  const lineDraw = {
    initial: { pathLength: 0, opacity: 0 },
    animate: { pathLength: 1, opacity: 1 },
  }

  return (
    <div className="relative w-full">
      <div className="relative overflow-hidden rounded-2xl border border-[var(--line-strong)] bg-[var(--surface-card)] backdrop-blur-xl shadow-[0_30px_80px_-20px_rgba(0,0,0,0.5)]">
        {/* Window chrome */}
        <div className="flex items-center justify-between border-b border-[var(--line)] px-4 py-3">
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-red-500/70" />
            <span className="h-2.5 w-2.5 rounded-full bg-amber-400/70" />
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500/70" />
          </div>
          <div className="hidden text-xs text-text-muted sm:block">
            biliardo.kz / tournaments / autumn-cup
          </div>
          <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-300">
            <span className="h-1.5 w-1.5 animate-pulse-soft rounded-full bg-emerald-400" /> LIVE
          </div>
        </div>

        <div className="relative p-5 sm:p-7">
          <svg viewBox="0 0 600 360" className="w-full">
            {/* Connecting lines */}
            <g stroke="rgba(16,185,129,0.55)" strokeWidth="2" fill="none">
              <motion.path d="M 175 60 L 220 60 L 220 105 L 265 105" variants={lineDraw}
                initial="initial" animate="animate" transition={{ duration: 0.8, delay: 0.3 }} />
              <motion.path d="M 175 150 L 220 150 L 220 105" variants={lineDraw}
                initial="initial" animate="animate" transition={{ duration: 0.8, delay: 0.4 }} />
              <motion.path d="M 175 230 L 220 230 L 220 275 L 265 275" variants={lineDraw}
                initial="initial" animate="animate" transition={{ duration: 0.8, delay: 0.5 }} />
              <motion.path d="M 175 320 L 220 320 L 220 275" variants={lineDraw}
                initial="initial" animate="animate" transition={{ duration: 0.8, delay: 0.6 }} />
              <motion.path d="M 405 105 L 450 105 L 450 190 L 495 190" variants={lineDraw}
                initial="initial" animate="animate" transition={{ duration: 0.8, delay: 1.0 }} />
              <motion.path d="M 405 275 L 450 275 L 450 190" variants={lineDraw}
                initial="initial" animate="animate" transition={{ duration: 0.8, delay: 1.1 }} />
            </g>

            {/* Round 1 — left column */}
            <Match x={20} y={40} top="Алмат А." bot="Дауlет К." score={[5, 3]} winner="top" delay={0} />
            <Match x={20} y={130} top="Жанибек" bot="Айдос" score={[5, 4]} winner="top" delay={0.05} />
            <Match x={20} y={210} top="Серик" bot="Бахыт Н." score={[2, 5]} winner="bot" delay={0.1} />
            <Match x={20} y={300} top="Нурлан" bot="Тимур" score={[5, 1]} winner="top" delay={0.15} />

            {/* Round 2 — middle column */}
            <Match x={265} y={85} top="Алмат А." bot="Жанибек" score={[5, 2]} winner="top" delay={0.7} />
            <Match x={265} y={255} top="Бахыт Н." bot="Нурлан" score={[3, 5]} winner="bot" delay={0.8} />

            {/* Final — right column */}
            <Match x={495} y={170} top="Алмат А." bot="Нурлан" score={[null, null]} live delay={1.4} />
          </svg>
        </div>

        {/* glow */}
        <div className="pointer-events-none absolute -bottom-32 left-1/2 h-64 w-2/3 -translate-x-1/2 rounded-full bg-emerald-500/20 blur-3xl" />
      </div>
    </div>
  )
}

interface MatchProps {
  x: number; y: number
  top: string; bot: string
  score: [number | null, number | null]
  winner?: 'top' | 'bot'
  live?: boolean
  delay?: number
}

function Match({ x, y, top, bot, score, winner, live, delay = 0 }: MatchProps) {
  const w = 155
  const h = 50
  const winnerStroke = winner === 'top' ? 'top' : winner === 'bot' ? 'bot' : null

  return (
    <motion.g
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4, delay, ease: [0.4, 0, 0.2, 1] }}
    >
      {/* card background */}
      <rect
        x={x} y={y} width={w} height={h} rx="8"
        fill="rgba(255,255,255,0.04)"
        stroke={live ? 'rgba(16,185,129,0.7)' : 'rgba(255,255,255,0.10)'}
        strokeWidth={live ? 1.5 : 1}
      />
      {live && (
        <motion.rect
          x={x} y={y} width={w} height={h} rx="8" fill="none"
          stroke="rgba(16,185,129,1)" strokeWidth="1.5"
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      )}
      {/* divider */}
      <line x1={x + 8} y1={y + h / 2} x2={x + w - 8} y2={y + h / 2} stroke="rgba(255,255,255,0.06)" />
      {/* names */}
      <text x={x + 10} y={y + 16} fill={winnerStroke === 'top' ? '#10b981' : '#e2e8f0'} fontSize="10" fontWeight={winnerStroke === 'top' ? 700 : 500} fontFamily="Inter, sans-serif">
        {top}
      </text>
      <text x={x + 10} y={y + 38} fill={winnerStroke === 'bot' ? '#10b981' : '#e2e8f0'} fontSize="10" fontWeight={winnerStroke === 'bot' ? 700 : 500} fontFamily="Inter, sans-serif">
        {bot}
      </text>
      {/* scores */}
      <text x={x + w - 12} y={y + 16} fill={winnerStroke === 'top' ? '#10b981' : '#94a3b8'} fontSize="11" fontWeight="700" fontFamily="Inter, sans-serif" textAnchor="end">
        {score[0] ?? '–'}
      </text>
      <text x={x + w - 12} y={y + 38} fill={winnerStroke === 'bot' ? '#10b981' : '#94a3b8'} fontSize="11" fontWeight="700" fontFamily="Inter, sans-serif" textAnchor="end">
        {score[1] ?? '–'}
      </text>
    </motion.g>
  )
}
