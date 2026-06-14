/**
 * Удаляет seed-данные демо-CLUB аккаунта из БД, чтобы web-отчёты не показывали
 * фейковые цифры поверх реальных данных, присланных с десктоп-приложения.
 *
 * Удаляет:
 *  - все ClubSessionRecord с externalId начинающимся на 'seed-' (это создаёт seed-demo-club)
 *  - snapshot демо-аккаунта (чтобы Tables показал реальное состояние от desktop'а)
 *
 * Не удаляет:
 *  - сам User-аккаунт (если ты его используешь для подключения реального desktop'а)
 *  - реальные сессии (без префикса seed-)
 *
 * Запуск (из services/club):
 *   npm run clear:demo-club
 *
 * По умолчанию работает с phone=+77001112233 (демо-аккаунт). Чтобы удалить
 * сессии для другого CLUB-аккаунта — поставь DEMO_PHONE.
 */
import { PrismaClient } from '../src/_prisma/index.js'

const prisma = new PrismaClient()

const PHONE = process.env.DEMO_PHONE ?? '+77001112233'

async function main(): Promise<void> {
  const users = await prisma.$queryRawUnsafe<{ id: string; name: string }[]>(
    `SELECT id, name FROM auth."User" WHERE phone = $1 LIMIT 1`,
    PHONE,
  )
  if (users.length === 0) {
    console.log(`✗ Пользователь ${PHONE} не найден.`)
    return
  }
  const user = users[0]!
  console.log(`Найден аккаунт: ${user.name} (${user.id})`)

  // Удаляем seed-сессии (только те, у кого externalId начинается с 'seed-').
  const deletedSessions = await prisma.clubSessionRecord.deleteMany({
    where: { clubId: user.id, externalId: { startsWith: 'seed-' } },
  })
  console.log(`✓ Удалено seed-сессий: ${deletedSessions.count}`)

  // Удаляем сам snapshot — при следующем sync с десктопа он создастся заново.
  const deletedSnapshot = await prisma.clubSyncSnapshot.deleteMany({
    where: { clubId: user.id },
  })
  console.log(`✓ Удалено snapshot'ов: ${deletedSnapshot.count}`)

  // Подсчёт оставшихся реальных сессий (для информации).
  const remaining = await prisma.clubSessionRecord.count({ where: { clubId: user.id } })
  console.log(`ℹ Осталось сессий (реальных, не seed): ${remaining}`)

  console.log('\nГотово. Теперь:')
  console.log(' 1. Web Tables покажет «Не подключено» пока десктоп не сделает первый sync')
  console.log(' 2. Web Reports покажет только реальные данные с десктопа')
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => void prisma.$disconnect())
