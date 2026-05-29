import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

export function Logo({ size = 'md' }: { size?: 'sm' | 'md' }) {
  const { t } = useTranslation()
  const dim = size === 'sm' ? 'h-8 w-10' : 'h-10 w-12'
  const text = size === 'sm' ? 'text-base' : 'text-lg'
  return (
    <Link to="/" className="group inline-flex items-center gap-2.5">
      <span className={`relative inline-flex ${dim} items-center justify-center transition group-hover:scale-[1.03]`}>
        <img
          src="/logo.svg"
          alt="Biliardo"
          width={size === 'sm' ? 40 : 48}
          height={size === 'sm' ? 32 : 40}
          className="h-full w-full select-none drop-shadow-[0_0_12px_rgba(16,185,129,0.0)] transition-[filter] duration-300 group-hover:drop-shadow-[0_0_14px_rgba(16,185,129,0.45)]"
          draggable={false}
        />
      </span>
      <span className={`font-bold tracking-tight text-text-primary ${text}`}>
        {t('brand')}
      </span>
    </Link>
  )
}
