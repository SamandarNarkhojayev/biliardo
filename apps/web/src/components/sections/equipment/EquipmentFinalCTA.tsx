import { motion } from 'framer-motion'
import { MessageCircle, Calculator, Phone } from 'lucide-react'
import { Container } from '@/components/ui/Container'
import { Button } from '@/components/ui/Button'
import { buildWhatsAppLink, WHATSAPP_NUMBER } from './config'

const message =
  'Здравствуйте! Хочу подключить программу для бильярдного клуба. Подскажите, с чего начать.'

const phoneDisplay = '+7 (706) 686-94-14'

export function EquipmentFinalCTA() {
  return (
    <section className="relative py-20 sm:py-28">
      <Container size="default">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
          className="relative overflow-hidden rounded-3xl border border-emerald-400/20 bg-gradient-to-br from-emerald-500/15 via-emerald-500/5 to-sky-500/10 p-8 sm:p-12 lg:p-16"
        >
          <div
            className="bg-grid absolute inset-0 -z-10 [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_75%)]"
            aria-hidden
          />
          <div className="absolute -right-32 -top-32 h-80 w-80 rounded-full bg-emerald-500/20 blur-3xl" aria-hidden />
          <div className="absolute -bottom-32 -left-32 h-80 w-80 rounded-full bg-sky-500/15 blur-3xl" aria-hidden />

          <div className="relative max-w-2xl">
            <h2 className="text-balance text-3xl font-bold tracking-tight text-text-primary sm:text-4xl md:text-5xl">
              Запустим ваш клуб <span className="text-gradient-green">на новой системе</span>
            </h2>
            <p className="mt-5 text-pretty text-base leading-relaxed text-text-secondary sm:text-lg">
              Считайте стоимость в калькуляторе и пишите в WhatsApp. Ответим лично, обсудим
              сроки, состав комплекта и установку под ключ.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a
                href={buildWhatsAppLink(message)}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button variant="primary" size="lg" leftIcon={<MessageCircle size={18} />} fullWidth>
                  Написать в WhatsApp
                </Button>
              </a>
              <a href="#calculator">
                <Button variant="secondary" size="lg" leftIcon={<Calculator size={18} />} fullWidth>
                  К калькулятору
                </Button>
              </a>
            </div>

            <a
              href={`tel:+${WHATSAPP_NUMBER}`}
              className="mt-6 inline-flex items-center gap-2 text-sm text-text-secondary transition hover:text-text-primary"
            >
              <Phone size={16} className="text-emerald-400" />
              <span>Позвонить: {phoneDisplay}</span>
            </a>
          </div>
        </motion.div>
      </Container>
    </section>
  )
}
