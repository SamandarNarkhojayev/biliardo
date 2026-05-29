import { forwardRef, type ReactNode } from 'react'
import { motion, type HTMLMotionProps } from 'framer-motion'
import { cn } from '@/utils/cn'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'gold'
type Size = 'sm' | 'md' | 'lg'

type MotionButtonProps = HTMLMotionProps<'button'>

interface ButtonProps extends Omit<MotionButtonProps, 'children'> {
  variant?: Variant
  size?: Size
  leftIcon?: ReactNode
  rightIcon?: ReactNode
  loading?: boolean
  fullWidth?: boolean
  children?: ReactNode
}

const variantClasses: Record<Variant, string> = {
  primary:
    'text-white bg-gradient-to-br from-emerald-400 via-accent-green to-emerald-600 shadow-[0_8px_30px_-8px_rgba(16,185,129,0.55)] hover:shadow-[0_12px_40px_-6px_rgba(16,185,129,0.7)] hover:brightness-110',
  secondary:
    'text-text-primary bg-[var(--surface-elevated)] border border-[var(--line-strong)] hover:bg-[var(--surface-card-hover)]',
  ghost:
    'text-text-secondary hover:text-text-primary hover:bg-[var(--surface-card)]',
  danger:
    'text-red-400 bg-red-500/10 border border-red-500/30 hover:bg-red-500/15',
  gold:
    'text-[#0a0f1c] bg-gradient-to-br from-amber-300 via-accent-gold to-amber-500 shadow-[0_8px_30px_-8px_rgba(251,191,36,0.55)] hover:brightness-110',
}

const sizeClasses: Record<Size, string> = {
  sm: 'h-9 px-4 text-sm rounded-lg gap-1.5',
  md: 'h-11 px-5 text-[15px] rounded-xl gap-2',
  lg: 'h-14 px-7 text-base rounded-2xl gap-2.5 font-semibold',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { variant = 'primary', size = 'md', leftIcon, rightIcon, loading, fullWidth, className, children, disabled, ...props },
    ref,
  ) => {
    return (
      <motion.button
        ref={ref}
        whileHover={{ y: -2 }}
        whileTap={{ scale: 0.97 }}
        transition={{ type: 'spring', stiffness: 400, damping: 22 }}
        disabled={disabled ?? loading}
        className={cn(
          'inline-flex items-center justify-center font-medium tracking-tight',
          'transition-[background,color,box-shadow,transform,filter] duration-200 ease-[cubic-bezier(0.4,0,0.2,1)]',
          'select-none ring-focus disabled:opacity-50 disabled:cursor-not-allowed',
          variantClasses[variant],
          sizeClasses[size],
          fullWidth && 'w-full',
          className,
        )}
        {...props}
      >
        {loading ? (
          <span className="inline-flex h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
        ) : (
          leftIcon
        )}
        {children}
        {!loading && rightIcon}
      </motion.button>
    )
  },
)
Button.displayName = 'Button'
