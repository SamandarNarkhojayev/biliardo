import { forwardRef, useId, useState, type InputHTMLAttributes, type ReactNode } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { cn } from '@/utils/cn'

interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string
  hint?: string
  error?: string | null
  leftIcon?: ReactNode
  rightSlot?: ReactNode
  size?: 'md' | 'lg'
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, hint, error, leftIcon, rightSlot, className, size = 'md', id, type, ...rest }, ref) => {
    const reactId = useId()
    const inputId = id ?? reactId
    const [revealPassword, setRevealPassword] = useState(false)
    const isPassword = type === 'password'
    const effectiveType = isPassword ? (revealPassword ? 'text' : 'password') : type

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="mb-1.5 block text-xs font-medium text-text-secondary"
          >
            {label}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-text-muted">
              {leftIcon}
            </span>
          )}
          <input
            id={inputId}
            ref={ref}
            type={effectiveType}
            aria-invalid={!!error}
            className={cn(
              'w-full rounded-xl bg-[var(--surface-input)] text-text-primary placeholder:text-text-muted',
              'border transition-[border-color,box-shadow,background] duration-150',
              'border-[var(--line-strong)] hover:border-[color-mix(in_oklab,var(--color-text-secondary)_25%,transparent)]',
              'focus:outline-none focus:border-emerald-400/70 focus:bg-[var(--surface-card)]',
              'focus:shadow-[0_0_0_3px_rgba(16,185,129,0.18)]',
              error && 'border-red-500/60 focus:border-red-500 focus:shadow-[0_0_0_3px_rgba(239,68,68,0.2)]',
              size === 'lg' ? 'h-13 px-4 text-base' : 'h-11 px-3.5 text-sm',
              leftIcon && (size === 'lg' ? 'pl-12' : 'pl-10'),
              (rightSlot || isPassword) && (size === 'lg' ? 'pr-12' : 'pr-10'),
              className,
            )}
            {...rest}
          />
          {(rightSlot || isPassword) && (
            <span className="absolute inset-y-0 right-2.5 flex items-center text-text-muted">
              {isPassword ? (
                <button
                  type="button"
                  onClick={() => setRevealPassword((v) => !v)}
                  aria-label={revealPassword ? 'Скрыть пароль' : 'Показать пароль'}
                  className="ring-focus inline-flex h-8 w-8 items-center justify-center rounded-lg text-text-muted hover:text-text-primary hover:bg-[var(--surface-card)]"
                >
                  {revealPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              ) : (
                rightSlot
              )}
            </span>
          )}
        </div>
        {(error || hint) && (
          <div className={cn('mt-1.5 text-xs', error ? 'text-red-400' : 'text-text-muted')}>
            {error ?? hint}
          </div>
        )}
      </div>
    )
  },
)
Input.displayName = 'Input'
