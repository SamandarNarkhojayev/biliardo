import { useEffect, useState } from 'react'
import { useInView } from 'framer-motion'
import type { RefObject } from 'react'

interface Options {
  duration?: number
  start?: number
}

/** Анимирует число от 0 (или start) до target, запускается когда ref попадает во viewport. */
export function useAnimatedCounter(
  ref: RefObject<HTMLElement | null>,
  target: number,
  { duration = 1800, start = 0 }: Options = {},
): number {
  const inView = useInView(ref, { once: true, margin: '-50px' })
  const [value, setValue] = useState<number>(start)

  useEffect(() => {
    if (!inView) return
    let raf = 0
    const startedAt = performance.now()
    const tick = (now: number) => {
      const elapsed = now - startedAt
      const t = Math.min(1, elapsed / duration)
      const eased = 1 - Math.pow(1 - t, 3) // easeOutCubic
      setValue(Math.round(start + (target - start) * eased))
      if (t < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [inView, target, duration, start])

  return value
}
