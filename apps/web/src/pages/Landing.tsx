import { Seo } from '@/components/Seo'
import { Hero } from '@/components/sections/Hero'
import { Features } from '@/components/sections/Features'
import { HowItWorks } from '@/components/sections/HowItWorks'
import { Pricing } from '@/components/sections/Pricing'
import { LiveTournaments } from '@/components/sections/LiveTournaments'
import { Testimonials } from '@/components/sections/Testimonials'
import { FinalCTA } from '@/components/sections/FinalCTA'
import { FREE_TOURNAMENTS } from '@/config/flags'

export default function Landing() {
  return (
    <>
      <Seo
        title="Biliardo — турниры по бильярду без боли | Платформа для клубов и игроков"
        description="Создай турнир за 2 минуты. Игроки регистрируются сами, сетка строится автоматически. 6 форматов сетки, real-time обновления, поддержка клубов в Казахстане."
        keywords="турниры по бильярду, бильярдный турнир, сетка турнира, регистрация на турнир, бильярдная платформа, бильярд Казахстан"
        path="/club"
      />
      <Hero />
      <Features />
      <HowItWorks />
      {/* Блок тарифов скрыт на время промо (FREE_TOURNAMENTS). */}
      {!FREE_TOURNAMENTS && <Pricing />}
      <LiveTournaments />
      <Testimonials />
      <FinalCTA />
    </>
  )
}
