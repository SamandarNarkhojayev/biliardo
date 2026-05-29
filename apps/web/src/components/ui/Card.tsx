import { motion, type HTMLMotionProps } from 'framer-motion'
import { cn } from '@/utils/cn'

interface CardProps extends HTMLMotionProps<'div'> {
  interactive?: boolean
  glow?: 'green' | 'gold' | 'blue' | null
}

const glowClasses = {
  green: 'hover:shadow-[var(--shadow-glow-green)] hover:border-emerald-400/30',
  gold: 'hover:shadow-[var(--shadow-glow-gold)] hover:border-amber-400/40',
  blue: 'hover:shadow-[var(--shadow-glow-blue)] hover:border-sky-400/30',
}

export function Card({ interactive = false, glow = null, className, children, ...props }: CardProps) {
  return (
    <motion.div
      className={cn(
        'glass rounded-2xl p-6',
        interactive && 'glass-hover cursor-pointer',
        interactive && glow && glowClasses[glow],
        className,
      )}
      {...props}
    >
      {children}
    </motion.div>
  )
}
