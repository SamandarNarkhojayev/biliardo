import { useTranslation } from 'react-i18next'
import { NavLink } from 'react-router-dom'
import { Send, MapPin, Phone, MessageCircle } from 'lucide-react'
import { Container } from '@/components/ui/Container'
import { Logo } from './Logo'
import { WHATSAPP_NUMBER, buildWhatsAppLink } from '@/components/sections/equipment/config'
import { FREE_TOURNAMENTS } from '@/config/flags'
import { cn } from '@/utils/cn'

const TELEGRAM_HANDLE = 'aa_Q_q_1'
const ADDRESS_2GIS_URL =
  'https://2gis.kz/shymkent/search/%D0%94%D1%83%D0%BB%D0%B0%D1%82%D0%B8%20162'

export function Footer() {
  const { t } = useTranslation()
  const year = new Date().getFullYear()

  const columns = [
    {
      title: t('footer.product'),
      links: [
        { label: t('footer.links.tournaments'), to: '/tournaments' },
        // Ссылка на тарифы скрыта на время промо (FREE_TOURNAMENTS).
        ...(FREE_TOURNAMENTS ? [] : [{ label: t('footer.links.pricing'), to: '/pricing' }]),
        { label: t('footer.links.features'), to: '/#features' },
      ],
    },
    {
      title: t('footer.company'),
      links: [
        { label: t('footer.links.about'), to: '/about' },
        { label: t('footer.links.blog'), to: '/blog' },
        { label: t('footer.links.contacts'), to: '/contacts' },
      ],
    },
    {
      title: t('footer.support'),
      links: [
        { label: t('footer.links.help'), to: '/help' },
        { label: t('footer.links.terms'), to: '/terms' },
        { label: t('footer.links.privacy'), to: '/privacy' },
      ],
    },
  ]

  return (
    <footer className="relative mt-24 border-t border-[var(--line)] bg-bg-secondary/50 backdrop-blur-sm">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-400/40 to-transparent" />
      <Container size="wide" className="py-14">
        <div className="grid gap-10 md:grid-cols-12">
          <div className="md:col-span-5">
            <Logo />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-text-secondary">
              {t('footer.tagline')}
            </p>

            {/* Прямые контакты — WhatsApp / Telegram / Email / Phone */}
            <div className="mt-5 space-y-2 text-sm">
              <a
                href={buildWhatsAppLink('Здравствуйте! Хочу узнать про Biliardo.')}
                target="_blank"
                rel="noopener noreferrer"
                className="ring-focus inline-flex items-center gap-2 text-text-secondary transition-colors hover:text-text-primary"
              >
                <MessageCircle size={14} className="text-emerald-400" />
                WhatsApp +7 706 686 94 14
              </a>
              <a
                href={`https://t.me/${TELEGRAM_HANDLE}`}
                target="_blank"
                rel="noopener noreferrer"
                className="ring-focus block text-text-secondary transition-colors hover:text-text-primary"
              >
                <span className="inline-flex items-center gap-2">
                  <Send size={14} className="text-emerald-400" />
                  Telegram @{TELEGRAM_HANDLE}
                </span>
              </a>
              <a
                href={`tel:+${WHATSAPP_NUMBER}`}
                className="ring-focus block text-text-secondary transition-colors hover:text-text-primary"
              >
                <span className="inline-flex items-center gap-2">
                  <Phone size={14} className="text-emerald-400" />
                  +7 706 686 94 14
                </span>
              </a>
              <a
                href={ADDRESS_2GIS_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="ring-focus block text-text-secondary transition-colors hover:text-text-primary"
              >
                <span className="inline-flex items-center gap-2">
                  <MapPin size={14} className="text-emerald-400" />
                  ул. Дулати 162, Шымкент · 2ГИС
                </span>
              </a>
            </div>
          </div>

          {columns.map((col) => (
            <div key={col.title} className="md:col-span-2">
              <h4 className="text-sm font-semibold text-text-primary">{col.title}</h4>
              <ul className="mt-4 space-y-2.5">
                {col.links.map((link) => {
                  const isHash = link.to.includes('#')
                  return (
                    <li key={link.label}>
                      <NavLink
                        to={link.to}
                        end={link.to === '/'}
                        className={({ isActive }) =>
                          cn(
                            'text-sm transition-colors',
                            isActive && !isHash
                              ? 'font-semibold text-emerald-500'
                              : 'text-text-secondary hover:text-text-primary',
                          )
                        }
                      >
                        {link.label}
                      </NavLink>
                    </li>
                  )
                })}
              </ul>
            </div>
          ))}

          <div className="md:col-span-1" />
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-[var(--line)] pt-6 text-xs text-text-muted sm:flex-row sm:items-center sm:justify-between">
          <span>{t('footer.rights', { year })}</span>
        </div>
      </Container>
    </footer>
  )
}
