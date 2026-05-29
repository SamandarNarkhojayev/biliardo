import { LegalLayout } from '@/components/LegalLayout'
import { Button } from '@/components/ui/Button'
import { MessageCircle, Send, Phone, MapPin } from 'lucide-react'
import { buildWhatsAppLink } from '@/components/sections/equipment/config'

export default function Contacts() {
  return (
    <LegalLayout
      title="Контакты Biliardo"
      eyebrow="Контакты"
      description="Свяжитесь с нами любым удобным способом. Ответим в рабочее время по Шымкенту (UTC+5)."
      path="/contacts"
    >
      <div className="not-prose mt-6 grid gap-3 sm:grid-cols-2">
        <a
          href={buildWhatsAppLink('Здравствуйте! Хочу связаться с Biliardo.')}
          target="_blank"
          rel="noopener noreferrer"
          className="not-prose rounded-2xl border border-[var(--line-strong)] bg-[var(--surface-card)] p-5 transition hover:bg-[var(--surface-card-hover)]"
        >
          <div className="flex items-center gap-2 text-emerald-400"><MessageCircle size={18} /><span className="text-sm font-semibold text-text-primary">WhatsApp</span></div>
          <div className="mt-2 text-sm text-text-secondary">+7 706 686 94 14</div>
          <div className="mt-1 text-xs text-text-muted">Ответим быстрее всего</div>
        </a>
        <a
          href="https://t.me/aa_Q_q_1"
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-2xl border border-[var(--line-strong)] bg-[var(--surface-card)] p-5 transition hover:bg-[var(--surface-card-hover)]"
        >
          <div className="flex items-center gap-2 text-emerald-400"><Send size={18} /><span className="text-sm font-semibold text-text-primary">Telegram</span></div>
          <div className="mt-2 text-sm text-text-secondary">@aa_Q_q_1</div>
          <div className="mt-1 text-xs text-text-muted">Удобно для документов и скриншотов</div>
        </a>
        <a
          href="tel:+77066869414"
          className="rounded-2xl border border-[var(--line-strong)] bg-[var(--surface-card)] p-5 transition hover:bg-[var(--surface-card-hover)]"
        >
          <div className="flex items-center gap-2 text-emerald-400"><Phone size={18} /><span className="text-sm font-semibold text-text-primary">Телефон</span></div>
          <div className="mt-2 text-sm text-text-secondary">+7 706 686 94 14</div>
          <div className="mt-1 text-xs text-text-muted">Будни 10:00–20:00 (UTC+5)</div>
        </a>
        <a
          href="https://2gis.kz/shymkent/search/%D0%94%D1%83%D0%BB%D0%B0%D1%82%D0%B8%20162"
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-2xl border border-[var(--line-strong)] bg-[var(--surface-card)] p-5 transition hover:bg-[var(--surface-card-hover)]"
        >
          <div className="flex items-center gap-2 text-emerald-400"><MapPin size={18} /><span className="text-sm font-semibold text-text-primary">2ГИС</span></div>
          <div className="mt-2 text-sm text-text-secondary">ул. Дулати 162, Шымкент</div>
          <div className="mt-1 text-xs text-text-muted">Открыть карту в 2ГИС</div>
        </a>
      </div>

      <h2>Адрес</h2>
      <p>
        ул. Дулати 162, г. Шымкент, Казахстан.{' '}
        <a
          href="https://2gis.kz/shymkent/search/%D0%94%D1%83%D0%BB%D0%B0%D1%82%D0%B8%20162"
          target="_blank"
          rel="noopener noreferrer"
        >
          Посмотреть на карте 2ГИС
        </a>
        .
      </p>

      <h2>Часы работы</h2>
      <p>Пн–Сб: 10:00 — 20:00 (по Шымкенту, UTC+5). Воскресенье — выходной, но WhatsApp работает.</p>

      <div className="not-prose mt-8 flex flex-wrap gap-3">
        <a
          href={buildWhatsAppLink('Здравствуйте! Хочу узнать про Biliardo.')}
          target="_blank"
          rel="noopener noreferrer"
        >
          <Button variant="primary" size="lg" leftIcon={<MessageCircle size={16} />}>
            Написать в WhatsApp
          </Button>
        </a>
      </div>
    </LegalLayout>
  )
}
