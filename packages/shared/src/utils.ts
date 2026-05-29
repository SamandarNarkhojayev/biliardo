import type { CreatePaymentResponse, FreeByAutomationResponse } from './types.js'

/** Простой cuid-подобный генератор (без зависимостей). */
export function cuid(): string {
  return 'c' + Date.now().toString(36) + Math.random().toString(36).slice(2, 10)
}

/** Type-guard: бэкенд вернул «бесплатно по автоматизации» вместо платёжного заказа. */
export function isFreeByAutomation(r: CreatePaymentResponse): r is FreeByAutomationResponse {
  return 'free' in r && r.free === true
}
