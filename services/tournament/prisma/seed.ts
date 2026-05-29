// Seed реальных публичных турниров для отображения на лендинге и в каталоге.
// Запуск: npm --workspace @billiard/tournament run seed
//
// Идемпотентность: каждый турнир заводится по фиксированному id (seed-*) через upsert.
// Повторный запуск перезаписывает данные, призовые места пересоздаются.

import { PrismaClient } from '../src/_prisma/index.js'

const prisma = new PrismaClient()

const GRADIENTS = [
  'from-emerald-500/30 via-emerald-700/20 to-bg-secondary',
  'from-sky-500/30 via-sky-700/20 to-bg-secondary',
  'from-violet-500/30 via-violet-700/20 to-bg-secondary',
  'from-amber-500/30 via-amber-700/20 to-bg-secondary',
  'from-fuchsia-500/30 via-fuchsia-700/20 to-bg-secondary',
  'from-rose-500/30 via-rose-700/20 to-bg-secondary',
]

const DAY = 86_400_000

const seedData = [
  {
    id: 'seed-almaty-autumn-cup',
    name: 'Осенний Кубок Алматы',
    organizerId: 'seed',
    organizerName: 'Клуб «Пирамида»',
    status: 'REGISTRATION' as const,
    bracketType: 'SINGLE_ELIMINATION' as const,
    maxParticipants: 32,
    participantCount: 24,
    isPublic: true,
    scheduledOffsetDays: 5,
    location: 'Клуб «Пирамида», ул. Абая 150',
    city: 'Алматы',
    prizeFund: 500_000,
    entryFee: 5000,
    coverGradient: GRADIENTS[0],
    prizes: [
      { place: 1, prize: '250 000 ₸ + кубок' },
      { place: 2, prize: '150 000 ₸' },
      { place: 3, prize: '100 000 ₸' },
    ],
  },
  {
    id: 'seed-shymkent-champion',
    name: 'Чемпионат клуба «Чемпион»',
    organizerId: 'seed',
    organizerName: 'Клуб «Чемпион»',
    status: 'ACTIVE' as const,
    bracketType: 'DOUBLE_ELIMINATION' as const,
    maxParticipants: 16,
    participantCount: 16,
    isPublic: true,
    scheduledOffsetDays: 1,
    location: 'Шымкент, пр. Тауке хана 15',
    city: 'Шымкент',
    prizeFund: 200_000,
    entryFee: 3000,
    coverGradient: GRADIENTS[1],
    prizes: [
      { place: 1, prize: '120 000 ₸' },
      { place: 2, prize: '50 000 ₸' },
      { place: 3, prize: '30 000 ₸' },
    ],
  },
  {
    id: 'seed-astana-open',
    name: 'Любительский Open',
    organizerId: 'seed',
    organizerName: 'Команда Open',
    status: 'REGISTRATION' as const,
    bracketType: 'ROUND_ROBIN' as const,
    maxParticipants: 12,
    participantCount: 8,
    isPublic: true,
    scheduledOffsetDays: 9,
    location: 'ТРЦ «Хан Шатыр», уровень 5',
    city: 'Астана',
    entryFee: 0,
    coverGradient: GRADIENTS[2],
    prizes: [{ place: 1, prize: 'Кубок и медали' }],
  },
  {
    id: 'seed-proleague-almaty-3',
    name: 'Pro-League Almaty Stage 3',
    organizerId: 'seed',
    organizerName: 'Pro-League KZ',
    status: 'REGISTRATION' as const,
    bracketType: 'SWISS' as const,
    maxParticipants: 64,
    participantCount: 41,
    isPublic: true,
    scheduledOffsetDays: 12,
    location: 'Клуб «Pro8», Алматы',
    city: 'Алматы',
    prizeFund: 1_500_000,
    entryFee: 10_000,
    coverGradient: GRADIENTS[4],
    prizes: [
      { place: 1, prize: '700 000 ₸' },
      { place: 2, prize: '400 000 ₸' },
      { place: 3, prize: '250 000 ₸' },
      { place: 4, prize: '150 000 ₸' },
    ],
  },
  {
    id: 'seed-park-hall',
    name: 'Турнир сети Park Hall',
    organizerId: 'seed',
    organizerName: 'Park Hall',
    status: 'REGISTRATION' as const,
    bracketType: 'GROUP_PLAYOFF' as const,
    maxParticipants: 24,
    participantCount: 12,
    isPublic: true,
    scheduledOffsetDays: 18,
    location: 'Караганда, ТРЦ Park Hall',
    city: 'Караганда',
    prizeFund: 250_000,
    entryFee: 4000,
    coverGradient: GRADIENTS[5],
    prizes: [
      { place: 1, prize: '150 000 ₸' },
      { place: 2, prize: '100 000 ₸' },
    ],
  },
  {
    id: 'seed-atyrau-corporate',
    name: 'Корпоративный турнир KazTransOil',
    organizerId: 'seed',
    organizerName: 'KazTransOil',
    status: 'COMPLETED' as const,
    bracketType: 'PAGE_PLAYOFF' as const,
    maxParticipants: 8,
    participantCount: 8,
    // непубличный — на лендинг не попадает (тест фильтра).
    isPublic: false,
    scheduledOffsetDays: -5,
    location: 'Атырау',
    city: 'Атырау',
    prizeFund: 100_000,
    coverGradient: GRADIENTS[3],
    prizes: [
      { place: 1, prize: '50 000 ₸' },
      { place: 2, prize: '30 000 ₸' },
    ],
  },
]

async function main(): Promise<void> {
  const now = Date.now()
  for (const t of seedData) {
    const { id, prizes, scheduledOffsetDays, ...rest } = t
    const scheduledAt = new Date(now + scheduledOffsetDays * DAY)

    await prisma.tournament.upsert({
      where: { id },
      create: {
        id,
        ...rest,
        scheduledAt,
        inviteCode: id, // фиксированный, чтобы upsert не плодил дубли
      },
      update: { ...rest, scheduledAt },
    })

    // Призовые места — переустановить полностью.
    await prisma.prizePlace.deleteMany({ where: { tournamentId: id } })
    if (prizes.length > 0) {
      await prisma.prizePlace.createMany({
        data: prizes.map((p) => ({ ...p, tournamentId: id })),
      })
    }
    console.log(`  seeded: ${t.name}`)
  }
  console.log(`\n✅ ${seedData.length} tournaments seeded`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
