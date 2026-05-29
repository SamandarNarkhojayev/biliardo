import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react'
import type { Payment } from '@billiard/shared'
import { Container } from '@/components/ui/Container'
import { Button } from '@/components/ui/Button'
import { paymentApi } from '@/api/payment'

const POLL_INTERVAL_MS = 1500
const MAX_POLLS = 20

/**
 * Возврат с Kaspi: поллим статус платежа, пока не получим финальный.
 * Kaspi редиректит сюда после оплаты — webhook к этому моменту мог ещё не дойти.
 */
export default function PaymentReturn() {
  const { t } = useTranslation()
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const paymentId = params.get('paymentId')

  const [payment, setPayment] = useState<Payment | null>(null)
  const [polls, setPolls] = useState(0)

  useEffect(() => {
    if (!paymentId) return
    let cancelled = false
    let timer: number | undefined

    const tick = async (): Promise<void> => {
      try {
        const r = await paymentApi.getPayment(paymentId)
        if (cancelled) return
        setPayment(r.payment)
        if (r.payment.status === 'PENDING') {
          setPolls((p) => p + 1)
        }
      } catch {
        if (!cancelled) setPolls((p) => p + 1)
      }
    }

    void tick()
    timer = window.setInterval(() => void tick(), POLL_INTERVAL_MS)

    return () => {
      cancelled = true
      if (timer) window.clearInterval(timer)
    }
  }, [paymentId])

  useEffect(() => {
    if (polls >= MAX_POLLS && payment?.status === 'PENDING') {
      // Стоп — webhook не дошёл, пользователь увидит "обработка"
    }
  }, [polls, payment])

  if (!paymentId) {
    return (
      <Container size="narrow" className="py-20">
        <div className="rounded-3xl border border-[var(--line)] bg-[var(--surface-card)] p-8 text-center">
          <XCircle className="mx-auto text-rose-400" size={36} />
          <p className="mt-4 text-text-secondary">{t('payment.return_no_id')}</p>
          <Button variant="secondary" onClick={() => navigate('/pricing')} className="mt-5">
            {t('payment.back_to_pricing')}
          </Button>
        </div>
      </Container>
    )
  }

  const status = payment?.status ?? 'PENDING'

  return (
    <section className="relative py-16 sm:py-24">
      <div className="bg-mesh absolute inset-0 -z-10 opacity-40" aria-hidden />
      <Container size="narrow" className="max-w-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="rounded-3xl border border-[var(--line)] bg-[var(--surface-card)] p-8 text-center backdrop-blur-md sm:p-10"
        >
          {status === 'PENDING' && (
            <>
              <Loader2 className="mx-auto animate-spin text-emerald-400" size={48} />
              <h1 className="mt-5 text-xl font-bold text-text-primary sm:text-2xl">
                {t('payment.return_processing')}
              </h1>
              <p className="mt-2 text-sm text-text-secondary">
                {polls >= MAX_POLLS
                  ? t('payment.return_processing_long')
                  : t('payment.return_processing_hint')}
              </p>
            </>
          )}
          {status === 'COMPLETED' && (
            <>
              <CheckCircle2 className="mx-auto text-emerald-400" size={56} />
              <h1 className="mt-5 text-2xl font-bold text-text-primary">
                {t('payment.return_success')}
              </h1>
              <p className="mt-2 text-sm text-text-secondary">{t('payment.return_success_hint')}</p>
              <Button variant="primary" onClick={() => navigate('/me?tab=mine')} className="mt-6">
                {t('payment.to_dashboard')}
              </Button>
            </>
          )}
          {(status === 'FAILED' || status === 'EXPIRED') && (
            <>
              <XCircle className="mx-auto text-rose-400" size={56} />
              <h1 className="mt-5 text-2xl font-bold text-text-primary">
                {t(status === 'EXPIRED' ? 'payment.return_expired' : 'payment.return_failed')}
              </h1>
              <p className="mt-2 text-sm text-text-secondary">{t('payment.return_failed_hint')}</p>
              <Button variant="primary" onClick={() => navigate('/pricing')} className="mt-6">
                {t('payment.try_again')}
              </Button>
            </>
          )}
        </motion.div>
      </Container>
    </section>
  )
}
