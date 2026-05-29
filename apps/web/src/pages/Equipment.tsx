import { Seo } from '@/components/Seo'
import { EquipmentHero } from '@/components/sections/equipment/EquipmentHero'
import { EquipmentFeatures } from '@/components/sections/equipment/EquipmentFeatures'
import { EquipmentHardware } from '@/components/sections/equipment/EquipmentHardware'
import { EquipmentCalculator } from '@/components/sections/equipment/EquipmentCalculator'
import { EquipmentSteps } from '@/components/sections/equipment/EquipmentSteps'
import { EquipmentFAQ } from '@/components/sections/equipment/EquipmentFAQ'
import { EquipmentFinalCTA } from '@/components/sections/equipment/EquipmentFinalCTA'

export default function Equipment() {
  return (
    <>
      <Seo
        title="Biliardo — программа для бильярдного клуба в Казахстане | Автоматизация столов и баров"
        description="Управление столами, тарифами день/ночь, баром, отчётами и турнирами в одном приложении. Поставка оборудования, установка под ключ, обучение персонала. Лицензия пожизненная."
        keywords="программа для бильярдного клуба, автоматизация бильярда, бильярд Казахстан, ПО для бильярда, тарификатор бильярд, оборудование для бильярдного клуба"
        path="/"
      />
      <EquipmentHero />
      <EquipmentFeatures />
      <EquipmentHardware />
      <EquipmentCalculator />
      <EquipmentSteps />
      <EquipmentFAQ />
      <EquipmentFinalCTA />
    </>
  )
}
