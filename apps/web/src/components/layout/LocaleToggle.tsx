import { motion } from 'framer-motion'
import { useLocaleStore, type Locale } from '@/store/locale'
import { cn } from '@/utils/cn'

const locales: { code: Locale; label: string }[] = [
  { code: 'kz', label: 'KZ' },
  { code: 'ru', label: 'RU' },
]

export function LocaleToggle() {
  const { locale, setLocale } = useLocaleStore()

  return (
    <div className="relative inline-flex items-center rounded-full border border-[var(--line-strong)] bg-[var(--surface-card)] p-0.5 text-xs font-semibold">
      {locales.map((l) => {
        const active = locale === l.code
        return (
          <button
            key={l.code}
            onClick={() => setLocale(l.code)}
            className={cn(
              'relative z-10 px-3 py-1.5 transition-colors ring-focus rounded-full',
              active ? 'text-bg-primary' : 'text-text-secondary hover:text-text-primary',
            )}
            aria-pressed={active}
          >
            {active && (
              <motion.span
                layoutId="locale-pill"
                className="absolute inset-0 -z-10 rounded-full bg-emerald-400"
                transition={{ type: 'spring', stiffness: 360, damping: 28 }}
              />
            )}
            {l.label}
          </button>
        )
      })}
    </div>
  )
}
