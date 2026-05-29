import confetti from 'canvas-confetti'

/**
 * Залп конфетти при успешной регистрации на турнир.
 * Цвета — из дизайн-токенов: emerald + sky + gold.
 */
export function fireRegistrationConfetti(): void {
  const colors = ['#10b981', '#34d399', '#38bdf8', '#fbbf24']
  const defaults = {
    origin: { y: 0.7 },
    colors,
    scalar: 0.9,
    ticks: 200,
  }

  // Левый залп
  void confetti({
    ...defaults,
    particleCount: 60,
    angle: 60,
    spread: 60,
    origin: { x: 0.15, y: 0.7 },
  })
  // Правый залп
  void confetti({
    ...defaults,
    particleCount: 60,
    angle: 120,
    spread: 60,
    origin: { x: 0.85, y: 0.7 },
  })
  // Центральный взрыв (с задержкой для эффекта)
  setTimeout(() => {
    void confetti({
      ...defaults,
      particleCount: 80,
      spread: 110,
      startVelocity: 35,
      origin: { x: 0.5, y: 0.5 },
    })
  }, 200)
}
