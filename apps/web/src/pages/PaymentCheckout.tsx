import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { QRCodeSVG } from 'qrcode.react'
import { ShieldCheck, AlertTriangle, Loader2, ExternalLink, Copy } from 'lucide-react'
import type { Payment } from '@billiard/shared'
import { Container } from '@/components/ui/Container'
import { Button } from '@/components/ui/Button'
import { paymentApi } from '@/api/payment'
import { ApiException } from '@/api/client'
import { toast } from '@/components/ui/Toast'

const POLL_INTERVAL_MS = 3000

// bridge — оплата переводом на Kaspi Gold (детект по уведомлению с телефона).
const BRIDGE = import.meta.env.VITE_KASPI_MODE === 'bridge'
const GOLD_NUMBER = import.meta.env.VITE_KASPI_GOLD_NUMBER as string | undefined
const GOLD_NAME = import.meta.env.VITE_KASPI_GOLD_NAME as string | undefined
const GOLD_QR_URL = import.meta.env.VITE_KASPI_GOLD_QR_URL as string | undefined

function formatKzt(n: number): string {
  return new Intl.NumberFormat('ru-RU').format(n) + ' ₸'
}

/**
 * Реальный Kaspi-чекаут: рендерим QR (QrToken от Kaspi) и поллим статус.
 * Бэкенд при опросе сам ходит в Kaspi (payment/status) и финализирует платёж.
 * Кнопка имитации показывается только для STUB-провайдера (локальная разработка
 * без merchant-кредов Kaspi) — в live-режиме её нет.
 */
export default function PaymentCheckout() {
  const { t } = useTranslation()
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [payment, setPayment] = useState<Payment | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [devPaying, setDevPaying] = useState(false)
  const timerRef = useRef<number | undefined>(undefined)

  const stopPolling = useCallback(() => {
    if (timerRef.current) {
      window.clearInterval(timerRef.current)
      timerRef.current = undefined
    }
  }, [])

  useEffect(() => {
    if (!id) return
    let cancelled = false

    const load = async (): Promise<void> => {
      try {
        const r = await paymentApi.getPayment(id)
        if (cancelled) return
        setPayment(r.payment)
        if (r.payment.status !== 'PENDING') stopPolling()
      } catch (e) {
        if (cancelled) return
        setError(e instanceof ApiException ? e.message : 'Платёж не найден')
        stopPolling()
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void load()
    timerRef.current = window.setInterval(() => void load(), POLL_INTERVAL_MS)
    return () => {
      cancelled = true
      stopPolling()
    }
  }, [id, stopPolling])

  // Успех — уводим на страницу результата.
  useEffect(() => {
    if (payment?.status === 'COMPLETED' && id) {
      navigate(`/payment/return?paymentId=${id}`, { replace: true })
    }
  }, [payment?.status, id, navigate])

  async function devComplete(): Promise<void> {
    if (!id) return
    setDevPaying(true)
    try {
      await paymentApi.stubComplete(id)
      navigate(`/payment/return?paymentId=${id}`, { replace: true })
    } catch (e) {
      setError(e instanceof ApiException ? e.message : 'Не удалось завершить платёж')
      setDevPaying(false)
    }
  }

  if (loading) {
    return (
      <Container size="narrow" className="py-20">
        <div className="h-80 animate-pulse rounded-3xl border border-[var(--line)] bg-[var(--surface-card)]" />
      </Container>
    )
  }

  if (error || !payment) {
    return (
      <Container size="narrow" className="py-20">
        <div className="rounded-3xl border border-[var(--line)] bg-[var(--surface-card)] p-8 text-center">
          <AlertTriangle className="mx-auto text-amber-400" size={36} />
          <p className="mt-4 text-text-secondary">{error ?? 'Платёж не найден'}</p>
          <Button variant="secondary" onClick={() => navigate('/pricing')} className="mt-5">
            {t('payment.back_to_pricing')}
          </Button>
        </div>
      </Container>
    )
  }

  if (payment.status === 'COMPLETED') {
    return (
      <Container size="narrow" className="py-20">
        <div className="rounded-3xl border border-emerald-400/40 bg-[var(--surface-card)] p-8 text-center">
          <ShieldCheck className="mx-auto text-emerald-400" size={48} />
          <h2 className="mt-4 text-xl font-bold text-text-primary">{t('payment.already_completed')}</h2>
          <Button variant="primary" onClick={() => navigate('/me?tab=mine')} className="mt-6">
            {t('payment.to_dashboard')}
          </Button>
        </div>
      </Container>
    )
  }

  if (payment.status === 'FAILED' || payment.status === 'EXPIRED') {
    return (
      <Container size="narrow" className="py-20">
        <div className="rounded-3xl border border-rose-400/40 bg-[var(--surface-card)] p-8 text-center">
          <AlertTriangle className="mx-auto text-rose-400" size={40} />
          <h2 className="mt-4 text-xl font-bold text-text-primary">
            {payment.status === 'EXPIRED' ? t('payment.expired_title') : t('payment.return_failed')}
          </h2>
          <p className="mt-2 text-sm text-text-secondary">{t('payment.return_failed_hint')}</p>
          <Button variant="primary" onClick={() => navigate('/pricing')} className="mt-6">
            {t('payment.try_again')}
          </Button>
        </div>
      </Container>
    )
  }

  // PENDING — ждём оплату.
  const isStub = payment.provider === 'STUB'
  const amountStr = formatKzt(payment.amountKzt)

  const copy = (value: string): void => {
    void navigator.clipboard?.writeText(value)
    toast.success(t('payment.copied'))
  }

  return (
    <section className="relative py-12 sm:py-16">
      <div className="bg-mesh absolute inset-0 -z-10 opacity-40" aria-hidden />
      <Container size="narrow" className="max-w-md">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="rounded-3xl border border-[var(--line)] bg-[var(--surface-card)] p-7 text-center backdrop-blur-md sm:p-9"
        >
          {BRIDGE ? (
            // ── Оплата переводом на Kaspi Gold ──
            <>
              <h1 className="text-2xl font-bold tracking-tight text-text-primary">
                {t('payment.transfer_title')}
              </h1>
              <p className="mt-2 text-sm text-text-secondary">{t('payment.transfer_hint')}</p>

              {GOLD_QR_URL && (
                <div className="mx-auto mt-6 w-fit rounded-2xl bg-white p-3 shadow-lg">
                  <img src={GOLD_QR_URL} alt="Kaspi QR" loading="lazy" decoding="async" width="208" height="208" className="h-52 w-52 object-contain" />
                </div>
              )}

              {/* Точная сумма */}
              <button
                type="button"
                onClick={() => copy(String(payment.amountKzt))}
                className="ring-focus group mt-6 flex w-full items-center justify-between rounded-2xl border border-emerald-400/40 bg-emerald-400/10 px-4 py-4 text-left"
              >
                <span>
                  <span className="block text-xs text-text-muted">{t('payment.transfer_amount')}</span>
                  <span className="block text-2xl font-bold text-text-primary">{amountStr}</span>
                </span>
                <Copy size={18} className="shrink-0 text-text-muted group-hover:text-emerald-300" />
              </button>

              {/* Реквизиты получателя */}
              {GOLD_NUMBER && (
                <button
                  type="button"
                  onClick={() => copy(GOLD_NUMBER)}
                  className="ring-focus group mt-3 flex w-full items-center justify-between rounded-2xl border border-[var(--line)] bg-bg-primary/40 px-4 py-3 text-left"
                >
                  <span>
                    <span className="block text-xs text-text-muted">{t('payment.transfer_to')}</span>
                    <span className="block font-semibold text-text-primary">{GOLD_NUMBER}</span>
                    {GOLD_NAME && <span className="block text-xs text-text-secondary">{GOLD_NAME}</span>}
                  </span>
                  <Copy size={18} className="shrink-0 text-text-muted group-hover:text-text-primary" />
                </button>
              )}

              <p className="mt-4 rounded-xl border border-amber-400/30 bg-amber-400/10 px-3 py-2 text-xs text-amber-200">
                {t('payment.transfer_exact_warning')}
              </p>
            </>
          ) : (
            // ── Официальный Kaspi QR (live) ──
            <>
              <h1 className="text-2xl font-bold tracking-tight text-text-primary">{t('payment.scan_title')}</h1>
              <p className="mt-2 text-sm text-text-secondary">{t('payment.scan_hint')}</p>

              {payment.qrCode || payment.paymentUrl ? (
                <div className="mx-auto mt-6 w-fit rounded-2xl bg-white p-4 shadow-lg">
                  <QRCodeSVG value={payment.qrCode ?? payment.paymentUrl ?? ''} size={208} level="M" marginSize={0} />
                </div>
              ) : (
                <div className="mx-auto mt-6 flex h-[240px] w-[240px] items-center justify-center rounded-2xl border border-[var(--line)] text-sm text-text-muted">
                  QR недоступен
                </div>
              )}

              <div className="mt-6 flex items-baseline justify-between rounded-2xl border border-[var(--line)] bg-bg-primary/40 px-4 py-3 text-sm">
                <span className="text-text-muted">{payment.planCode}</span>
                <span className="text-lg font-bold text-text-primary">{amountStr}</span>
              </div>

              {payment.paymentUrl && (
                <a href={payment.paymentUrl} target="_blank" rel="noopener noreferrer" className="mt-5 block">
                  <Button variant="secondary" fullWidth leftIcon={<ExternalLink size={16} />}>
                    {t('payment.open_in_kaspi')}
                  </Button>
                </a>
              )}
            </>
          )}

          <div className="mt-5 inline-flex items-center gap-2 text-sm text-text-secondary">
            <Loader2 className="animate-spin text-emerald-400" size={16} />
            {t('payment.waiting')}
          </div>

          {/* Только для локальной разработки (stub). */}
          {isStub && (
            <Button
              variant="ghost"
              fullWidth
              loading={devPaying}
              onClick={() => void devComplete()}
              className="mt-3 border border-dashed border-amber-400/40 text-amber-300"
            >
              {t('payment.dev_complete')}
            </Button>
          )}

          <Button variant="ghost" fullWidth onClick={() => navigate('/pricing')} className="mt-3">
            {t('payment.cancel')}
          </Button>
        </motion.div>
      </Container>
    </section>
  )
}
