import type { ReactNode } from 'react'
import { cn } from '@/utils/cn'

type BadgeVariant = 'green' | 'blue' | 'gold' | 'gray' | 'purple' | 'red'

interface BadgeProps {
  variant?: BadgeVariant
  children: ReactNode
  className?: string
  dot?: boolean
}

const variantClasses: Record<BadgeVariant, string> = {
  green: 'text-emerald-400 bg-emerald-500/15 border-emerald-500/30',
  blue: 'text-sky-400 bg-sky-500/15 border-sky-500/30',
  gold: 'text-amber-300 bg-amber-500/15 border-amber-500/30',
  gray: 'text-slate-400 bg-slate-500/15 border-slate-500/30',
  purple: 'text-violet-400 bg-violet-500/15 border-violet-500/30',
  red: 'text-red-400 bg-red-500/15 border-red-500/30',
}

const dotClasses: Record<BadgeVariant, string> = {
  green: 'bg-emerald-400',
  blue: 'bg-sky-400',
  gold: 'bg-amber-300',
  gray: 'bg-slate-400',
  purple: 'bg-violet-400',
  red: 'bg-red-400',
}

export function Badge({ variant = 'green', children, className, dot = false }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium',
        variantClasses[variant],
        className,
      )}
    >
      {dot && (
        <span className={cn('inline-block h-1.5 w-1.5 rounded-full animate-pulse-soft', dotClasses[variant])} />
      )}
      {children}
    </span>
  )
}
