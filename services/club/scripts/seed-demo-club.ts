/**
 * Демо-сид: создаёт CLUB-аккаунт с «подключённым API» — наполняет ClubSyncSnapshot
 * (8 столов с разными статусами + сегодняшняя выручка) и историю сессий за 30 дней.
 *
 * Запуск (из services/club):
 *   npm run seed:demo-club
 *
 * Логин по умолчанию: +77001112233 / demoClub12345
 * После сида дашборд по адресу http://localhost:5173/club/dashboard/tables покажет
 * зелёный статус online — потому что syncedAt = now() (< ONLINE_THRESHOLD_SECONDS).
 * Через минуту перейдёт в offline-with-last-sync. Хочешь «живой» — запусти повторно.
 */
import { randomBytes } from 'node:crypto'
import bcrypt from 'bcrypt'
import { PrismaClient } from '../src/_prisma/index.js'

const prisma = new PrismaClient()

const PHONE = process.env.DEMO_PHONE ?? '+77001112233'
const PASSWORD = process.env.DEMO_PASSWORD ?? 'demoClub12345'
const API_PASSWORD = process.env.DEMO_API_PASSWORD ?? 'desktopApi12345'
const CLUB_NAME = process.env.DEMO_CLUB_NAME ?? 'Biliard Demo Club'
const NAME = process.env.DEMO_NAME ?? 'Demo Club Owner'

function cuid(): string {
  // Достаточно уникально для сидера; не строгий cuid v1, но в DB колонка просто String.
  return 'c' + Date.now().toString(36) + randomBytes(8).toString('hex')
}

function ms(unit: 's' | 'm' | 'h' | 'd', n: number): number {
  const factor = unit === 's' ? 1000 : unit === 'm' ? 60_000 : unit === 'h' ? 3_600_000 : 86_400_000
  return n * factor
}

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10)
}

interface TableSession {
  startTime: number
  mode: 'time' | 'amount' | 'unlimited'
  plannedDuration: number | null
}
interface TableSnap {
  id: number
  name: string
  status: 'free' | 'occupied' | 'reserved' | 'maintenance'
  lightOn: boolean
  session: (TableSession & { tariffName?: string | null; currentTableCost?: number; currentBarCost?: number }) | null
  pricePerHour?: number
  reservation?: { customerName?: string | null; customerPhone?: string | null; reservedFor?: number; notes?: string | null } | null
}

function buildTables(): TableSnap[] {
  const now = Date.now()
  return [
    { id: 1, name: 'Стол 1', status: 'occupied', lightOn: true, pricePerHour: 2000,
      session: { startTime: now - ms('h', 1), mode: 'time', plannedDuration: 120, tariffName: 'Стандарт', currentTableCost: 2000, currentBarCost: 1100 } },
    { id: 2, name: 'Стол 2', status: 'occupied', lightOn: true, pricePerHour: 2000,
      session: { startTime: now - ms('m', 25), mode: 'unlimited', plannedDuration: null, currentTableCost: 833, currentBarCost: 0 } },
    { id: 3, name: 'Стол 3 VIP', status: 'occupied', lightOn: true, pricePerHour: 3500,
      session: { startTime: now - ms('m', 45), mode: 'amount', plannedDuration: null, tariffName: 'VIP пакет', currentTableCost: 2625, currentBarCost: 3500 } },
    { id: 4, name: 'Стол 4', status: 'free', lightOn: false, pricePerHour: 2000, session: null },
    { id: 5, name: 'Стол 5', status: 'free', lightOn: false, pricePerHour: 2000, session: null },
    { id: 6, name: 'Стол 6', status: 'occupied', lightOn: true, pricePerHour: 2000,
      session: { startTime: now - ms('m', 15), mode: 'time', plannedDuration: 60, currentTableCost: 500, currentBarCost: 600 } },
    { id: 7, name: 'Стол 7', status: 'reserved', lightOn: false, pricePerHour: 2000, session: null,
      reservation: { customerName: 'Айдар Кенесов', customerPhone: '+7 (701) 555-12-34', reservedFor: now + ms('h', 2), notes: null } },
    { id: 8, name: 'Стол 8', status: 'maintenance', lightOn: false, pricePerHour: 2000, session: null },
  ]
}

interface SessionRow {
  externalId: string
  tableId: number
  tableName: string
  mode: 'time' | 'amount' | 'unlimited'
  startTime: Date
  endTime: Date
  duration: number
  tableCost: number
  barCost: number
  totalCost: number
  date: string
}

function buildHistory(): SessionRow[] {
  // Детерминированный PRNG — каждый прогон даёт одинаковую историю.
  let seed = 42
  const rnd = () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280 }
  const pick = <T,>(arr: T[]): T => arr[Math.floor(rnd() * arr.length)]!

  const tables = [
    { id: 1, name: 'Стол 1' }, { id: 2, name: 'Стол 2' }, { id: 3, name: 'Стол 3 VIP' },
    { id: 4, name: 'Стол 4' }, { id: 5, name: 'Стол 5' }, { id: 6, name: 'Стол 6' },
  ]
  const modes: SessionRow['mode'][] = ['time', 'amount', 'unlimited']

  const out: SessionRow[] = []
  const now = Date.now()
  // 30 дней × 3-6 сессий/день
  for (let dayOffset = 0; dayOffset < 30; dayOffset++) {
    const sessionsToday = 3 + Math.floor(rnd() * 4)
    for (let i = 0; i < sessionsToday; i++) {
      const t = pick(tables)
      const mode = pick(modes)
      const hourOfDay = 12 + Math.floor(rnd() * 12) // 12:00..23:59
      const duration = 30 + Math.floor(rnd() * 150) // 30..180 минут
      const start = new Date(now - ms('d', dayOffset))
      start.setHours(hourOfDay, Math.floor(rnd() * 60), 0, 0)
      const end = new Date(start.getTime() + ms('m', duration))
      const tableCost = duration * (40 + Math.floor(rnd() * 30)) // 40-70 ₸/мин
      const barCost = Math.floor(rnd() * 5000) // 0-5000 ₸
      out.push({
        externalId: `seed-${isoDate(start)}-${t.id}-${i}`,
        tableId: t.id,
        tableName: t.name,
        mode,
        startTime: start,
        endTime: end,
        duration,
        tableCost,
        barCost,
        totalCost: tableCost + barCost,
        date: isoDate(start),
      })
    }
  }
  return out
}

async function findOrCreateClubUser(): Promise<string> {
  const found = await prisma.$queryRawUnsafe<{ id: string; accountType: string }[]>(
    `SELECT id, "accountType" FROM auth."User" WHERE phone = $1 LIMIT 1`,
    PHONE,
  )
  if (found.length > 0) {
    const u = found[0]!
    // Если случайно это PLAYER — переключаем в CLUB.
    if (u.accountType !== 'CLUB') {
      await prisma.$executeRawUnsafe(
        `UPDATE auth."User" SET "accountType"='CLUB', "clubName"=$2, "updatedAt"=now() WHERE id=$1`,
        u.id, CLUB_NAME,
      )
      console.log(`↻ User ${PHONE} переведён в CLUB (был ${u.accountType}).`)
    }
    // Перезаписываем пароль на демонстрационный, чтобы залогиниться было предсказуемо.
    const hash = await bcrypt.hash(PASSWORD, 12)
    await prisma.$executeRawUnsafe(
      `UPDATE auth."User" SET "passwordHash"=$2, "updatedAt"=now() WHERE id=$1`,
      u.id, hash,
    )
    return u.id
  }
  const id = cuid()
  const hash = await bcrypt.hash(PASSWORD, 12)
  await prisma.$executeRawUnsafe(
    `INSERT INTO auth."User"
      (id, phone, "passwordHash", name, role, "accountType", "clubName", "createdAt", "updatedAt")
     VALUES ($1, $2, $3, $4, 'ORGANIZER', 'CLUB', $5, now(), now())`,
    id, PHONE, hash, NAME, CLUB_NAME,
  )
  console.log(`+ Создан CLUB-аккаунт ${PHONE} (${id}).`)
  return id
}

async function setApiPassword(clubId: string): Promise<void> {
  // Эмуляция «подключённого desktop-приложения»: создаём ClubApiPassword.
  // Это переключает в UI статус «Автоматизация подключена» и делает турниры клуба бесплатными.
  const hash = await bcrypt.hash(API_PASSWORD, 10)
  const apiPwdId = cuid()
  // upsert: вставка с ON CONFLICT (userId) DO UPDATE — userId @unique.
  await prisma.$executeRawUnsafe(
    `INSERT INTO auth."ClubApiPassword" (id, "userId", "passwordHash", "createdAt", "updatedAt")
     VALUES ($1, $2, $3, now(), now())
     ON CONFLICT ("userId") DO UPDATE SET "passwordHash" = EXCLUDED."passwordHash", "updatedAt" = now()`,
    apiPwdId, clubId, hash,
  )
}

async function main(): Promise<void> {
  const clubId = await findOrCreateClubUser()
  await setApiPassword(clubId)
  console.log(`✓ API-пароль установлен (баннер «Автоматизация подключена»).`)

  const tables = buildTables()
  const revenue = { table: 125_000, bar: 47_500, total: 172_500, sessionsCount: 18 }

  await prisma.clubSyncSnapshot.upsert({
    where: { clubId },
    create: { clubId, tables: tables as unknown as object, revenue: revenue as unknown as object },
    update: { tables: tables as unknown as object, revenue: revenue as unknown as object, syncedAt: new Date() },
  })
  console.log(`✓ Snapshot записан (${tables.length} столов, syncedAt=now).`)

  const history = buildHistory()
  // Чистим предыдущие seed-сессии этого клуба, чтобы при повторном прогоне не дублировались.
  const deleted = await prisma.clubSessionRecord.deleteMany({
    where: { clubId, externalId: { startsWith: 'seed-' } },
  })
  if (deleted.count > 0) console.log(`- Удалено ${deleted.count} старых seed-сессий.`)

  await prisma.clubSessionRecord.createMany({
    data: history.map((s) => ({ clubId, ...s })),
    skipDuplicates: true,
  })
  console.log(`✓ Записано ${history.length} исторических сессий за 30 дней.`)

  console.log('\n— Готово —')
  console.log(`  Логин:        ${PHONE}`)
  console.log(`  Пароль:       ${PASSWORD}`)
  console.log(`  API-пароль:   ${API_PASSWORD}  (показывается в /me → Settings)`)
  console.log(`  Клуб:         ${CLUB_NAME}`)
  console.log(`  Дашборд:      http://localhost:5173/club/dashboard/tables`)
  console.log(`\n  Статус «online» держится ${process.env.ONLINE_THRESHOLD_SECONDS ?? '60'} секунд от syncedAt.`)
  console.log(`  Запусти скрипт повторно, чтобы освежить syncedAt.`)
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => void prisma.$disconnect())
