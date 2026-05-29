/** Нормализует телефон в формат +7XXXXXXXXXX (только цифры). */
export function normalizePhone(input: string): string {
  const digits = input.replace(/\D/g, '')
  if (digits.length === 0) return ''
  // Если ввели 11 цифр начиная с 8 → заменяем на 7
  let n = digits
  if (n.length === 11 && n.startsWith('8')) n = '7' + n.slice(1)
  if (n.length === 10) n = '7' + n
  if (!n.startsWith('7')) n = '7' + n
  return '+' + n.slice(0, 11)
}

/** Форматирует под маску +7 (XXX) XXX-XX-XX. */
export function formatPhone(input: string): string {
  const digits = input.replace(/\D/g, '').replace(/^8/, '7').replace(/^/, '')
  let d = digits
  if (d.length === 0) return ''
  if (!d.startsWith('7')) d = '7' + d
  d = d.slice(0, 11)

  const parts = ['+7']
  if (d.length > 1) parts.push(' (' + d.slice(1, 4))
  if (d.length >= 4) parts[parts.length - 1] += ')'
  if (d.length > 4) parts.push(' ' + d.slice(4, 7))
  if (d.length > 7) parts.push('-' + d.slice(7, 9))
  if (d.length > 9) parts.push('-' + d.slice(9, 11))
  return parts.join('')
}

export function isValidPhone(input: string): boolean {
  const digits = input.replace(/\D/g, '')
  return digits.length === 11 && (digits.startsWith('7') || digits.startsWith('8'))
}
