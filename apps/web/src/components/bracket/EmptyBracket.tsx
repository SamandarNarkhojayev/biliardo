import { useTranslation } from 'react-i18next'

interface Props {
  /** Если true — показывает текст для организатора, иначе для зрителя/игрока. */
  isOrganizer?: boolean
}

export function EmptyBracket({ isOrganizer }: Props) {
  const { t } = useTranslation()
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[var(--line-strong)] bg-[var(--surface-card)] py-16 text-center">
      <div className="text-text-secondary">{t('bracket.empty_title')}</div>
      <div className="mt-1 text-xs text-text-muted">
        {isOrganizer ? t('bracket.empty_hint_organizer') : t('bracket.empty_hint_player')}
      </div>
    </div>
  )
}
