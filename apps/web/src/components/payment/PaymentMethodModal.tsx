import { useTranslation } from 'react-i18next'
import { MessageCircle, QrCode, ChevronRight, Clock } from 'lucide-react'
import type { Plan } from '@billiard/shared'
import { Modal } from '@/components/ui/Modal'

const KASPI_ENABLED = import.meta.env.VITE_KASPI_ENABLED === 'true'

interface PaymentMethodModalProps {
  plan: Plan | null
  open: boolean
  loading: boolean
  whatsappHref: string
  onClose: () => void
  onPayKaspi: () => void
}

function formatKzt(n: number): string {
  return new Intl.NumberFormat('ru-RU').format(n) + ' ₸'
}

export function PaymentMethodModal({
  plan,
  open,
  loading,
  whatsappHref,
  onClose,
  onPayKaspi,
}: PaymentMethodModalProps) {
  const { t } = useTranslation()
  if (!plan) return null

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t('pricing.modal_title', { name: plan.name })}
      description={t('pricing.modal_subtitle')}
      size="sm"
    >
      <div className="px-6 py-6">
        <div className="mb-5 flex items-baseline justify-between rounded-2xl border border-[var(--line)] bg-[var(--surface-card)] px-4 py-3">
          <span className="text-sm text-text-muted">{plan.name}</span>
          <span className="text-xl font-bold text-text-primary">{formatKzt(plan.priceKzt)}</span>
        </div>

        <div className="space-y-3">
          {/* Kaspi — реальная оплата. Включается флагом VITE_KASPI_ENABLED, когда есть мерчант-доступ. */}
          {KASPI_ENABLED ? (
            <button
              type="button"
              onClick={onPayKaspi}
              disabled={loading}
              className="ring-focus group flex w-full items-center gap-3 rounded-2xl border border-[#F14635]/50 bg-[#F14635]/10 px-4 py-3.5 text-left transition-colors hover:bg-[#F14635]/20 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F14635] text-white">
                <QrCode size={20} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-semibold text-text-primary">{t('pricing.pay_kaspi')}</span>
                <span className="block truncate text-xs text-text-muted">{t('pricing.pay_kaspi_hint')}</span>
              </span>
              <ChevronRight size={18} className="shrink-0 text-text-muted group-hover:text-text-primary" />
            </button>
          ) : (
            <div className="flex items-center gap-2 rounded-2xl border border-dashed border-[var(--line)] px-4 py-3 text-xs text-text-muted">
              <Clock size={14} className="shrink-0" />
              {t('pricing.kaspi_soon')}
            </div>
          )}

          {/* WhatsApp — ручная оплата с менеджером */}
          <a
            href={whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            className="ring-focus group flex w-full items-center gap-3 rounded-2xl border border-emerald-400/40 bg-emerald-400/10 px-4 py-3.5 text-left transition-colors hover:bg-emerald-400/20"
          >
            <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500 text-white">
              <MessageCircle size={20} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block font-semibold text-text-primary">{t('pricing.pay_whatsapp')}</span>
              <span className="block truncate text-xs text-text-muted">{t('pricing.pay_whatsapp_hint')}</span>
            </span>
            <ChevronRight size={18} className="shrink-0 text-text-muted group-hover:text-text-primary" />
          </a>
        </div>
      </div>
    </Modal>
  )
}
