import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { Match, Participant } from '@billiard/shared'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'

interface Props {
  open: boolean
  match: Match | null
  p1?: Participant
  p2?: Participant
  onClose: () => void
  onSave: (score1: number, score2: number) => void
}

export function MatchScoreModal({ open, match, p1, p2, onClose, onSave }: Props) {
  const { t } = useTranslation()
  const [score1, setScore1] = useState(0)
  const [score2, setScore2] = useState(0)

  useEffect(() => {
    if (open && match) {
      setScore1(match.score1 ?? 0)
      setScore2(match.score2 ?? 0)
    }
  }, [open, match])

  const canSave = score1 !== score2 && (score1 > 0 || score2 > 0)

  return (
    <Modal open={open} onClose={onClose} size="sm" title={t('match_modal.title')}>
      <div className="px-6 py-5">
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
          <PlayerScore name={p1?.name ?? t('match_modal.tbd')} value={score1} onChange={setScore1} />
          <span className="text-2xl font-bold text-text-muted">:</span>
          <PlayerScore name={p2?.name ?? t('match_modal.tbd')} value={score2} onChange={setScore2} />
        </div>

        <p className="mt-5 text-center text-xs text-text-muted">
          {t('match_modal.hint')}
        </p>

        <div className="mt-5 flex gap-3">
          <Button variant="secondary" fullWidth onClick={onClose}>{t('match_modal.cancel')}</Button>
          <Button
            variant="primary"
            fullWidth
            disabled={!canSave}
            onClick={() => onSave(score1, score2)}
          >
            {t('match_modal.save')}
          </Button>
        </div>
      </div>
    </Modal>
  )
}

function PlayerScore({ name, value, onChange }: { name: string; value: number; onChange: (v: number) => void }) {
  return (
    <div className="text-center">
      <div className="mb-2 truncate text-sm font-medium text-text-primary">{name}</div>
      <div className="inline-flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => onChange(Math.max(0, value - 1))}
          className="ring-focus inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--line-strong)] bg-[var(--surface-card)] text-text-secondary hover:text-text-primary"
        >−</button>
        <input
          type="number"
          min={0}
          value={value}
          onChange={(e) => onChange(Math.max(0, Number(e.target.value) || 0))}
          className="ring-focus w-14 rounded-lg border border-[var(--line-strong)] bg-[var(--surface-input)] py-2 text-center text-lg font-bold text-text-primary focus:border-emerald-400/70 focus:outline-none"
        />
        <button
          type="button"
          onClick={() => onChange(value + 1)}
          className="ring-focus inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--line-strong)] bg-[var(--surface-card)] text-text-secondary hover:text-text-primary"
        >+</button>
      </div>
    </div>
  )
}
