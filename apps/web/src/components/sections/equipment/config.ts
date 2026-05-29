export const WHATSAPP_NUMBER = '77066869414'

export const PRICE_PER_TABLE = 10_000
export const PRICE_PRINTER = 50_000
export const PRICE_MONOBLOCK = 120_000
export const MAX_TABLES = 35

export function buildWhatsAppLink(message: string) {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`
}

export function formatTenge(value: number) {
  return `${value.toLocaleString('ru-RU')} ₸`
}
