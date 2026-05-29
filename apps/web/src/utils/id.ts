/** Простой cuid-подобный генератор. */
export function cuid(): string {
  return 'c' + Date.now().toString(36) + Math.random().toString(36).slice(2, 10)
}

/** Простой хэш (НЕ криптостойкий, для frontend-mock). */
export function hashPassword(password: string): string {
  let h = 5381
  for (let i = 0; i < password.length; i++) {
    h = ((h << 5) + h + password.charCodeAt(i)) | 0
  }
  return 'h_' + (h >>> 0).toString(36)
}
