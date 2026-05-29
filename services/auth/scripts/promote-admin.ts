/**
 * Промоут пользователя в супер-админа (role=ADMIN) по номеру телефона.
 *
 *   npm run auth:promote -- +77001234567
 *   (или из services/auth):  npm run promote -- +77001234567
 *
 * Телефон нормализуется так же, как в UI: оставляем цифры, '8'→'7', добавляем '+'.
 */
import { prisma } from '../src/prisma.js'

function normalizePhone(raw: string): string {
  let digits = raw.replace(/\D/g, '')
  if (digits.startsWith('8')) digits = '7' + digits.slice(1)
  if (!digits.startsWith('7')) digits = '7' + digits
  return '+' + digits
}

async function main(): Promise<void> {
  const arg = process.argv[2]
  if (!arg) {
    console.error('Usage: npm run auth:promote -- <phone>')
    process.exit(1)
  }
  const phone = normalizePhone(arg)
  const user = await prisma.user.findUnique({ where: { phone } })
  if (!user) {
    console.error(`❌ Пользователь с телефоном ${phone} не найден. Сначала зарегистрируйся в приложении.`)
    process.exit(1)
  }
  if (user.role === 'ADMIN') {
    console.log(`ℹ️  ${user.name} (${phone}) уже ADMIN.`)
    return
  }
  await prisma.user.update({ where: { id: user.id }, data: { role: 'ADMIN' } })
  console.log(`✅ ${user.name} (${phone}) теперь супер-админ (ADMIN). Перелогинься, чтобы обновить токен.`)
}

main()
  .catch((err) => { console.error(err); process.exit(1) })
  .finally(() => void prisma.$disconnect())
