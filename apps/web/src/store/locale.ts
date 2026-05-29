import { useEffect } from 'react'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import i18n from 'i18next'

export type Locale = 'ru' | 'kz'

interface LocaleState {
  locale: Locale
  setLocale: (locale: Locale) => void
}

export const useLocaleStore = create<LocaleState>()(
  persist(
    (set) => ({
      locale: 'ru',
      setLocale: (locale) => set({ locale }),
    }),
    { name: 'billiard.locale' },
  ),
)

/** Синхронизирует i18next и <html lang> с выбранной локалью. */
export function useApplyLocale(): void {
  const locale = useLocaleStore((s) => s.locale)
  useEffect(() => {
    if (i18n.language !== locale) i18n.changeLanguage(locale)
    document.documentElement.setAttribute('lang', locale)
  }, [locale])
}
