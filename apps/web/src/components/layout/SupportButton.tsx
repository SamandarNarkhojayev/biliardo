import { MessageCircle } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { buildWhatsAppLink } from '@/components/sections/equipment/config'

const SUPPORT_MESSAGE = 'Здравствуйте! Нужна помощь с Biliardo.'

/** Плавающая кнопка «Написать в поддержку» — открывает WhatsApp. Видна на всех страницах. */
export function SupportButton() {
  const { t } = useTranslation()
  return (
    <a
      href={buildWhatsAppLink(SUPPORT_MESSAGE)}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={t('support.button')}
      title={t('support.button')}
      className="ring-focus group fixed bottom-5 right-5 z-30 flex h-14 items-center justify-center rounded-full bg-emerald-500 px-4 text-bg-primary shadow-lg shadow-emerald-500/30 ring-1 ring-emerald-400/30 transition-colors hover:bg-emerald-400"
    >
      <MessageCircle size={24} className="shrink-0" />
      <span className="hidden max-w-0 overflow-hidden whitespace-nowrap text-sm font-semibold transition-all duration-300 group-hover:ml-2.5 group-hover:max-w-[200px] sm:block">
        {t('support.button')}
      </span>
    </a>
  )
}
