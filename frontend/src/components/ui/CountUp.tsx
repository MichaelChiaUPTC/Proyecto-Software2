import { useEffect, useRef, useState } from 'react'

const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

/** Anima un número desde su valor anterior (0 al montar) hasta el valor esperado. */
export function useCountUp(target: number, duration = 1000, delay = 120): number {
  const [value, setValue] = useState(0)
  const from = useRef(0)

  useEffect(() => {
    if (reduced()) {
      setValue(target)
      from.current = target
      return
    }
    const start = from.current
    let raf = 0
    let t0 = 0
    const timer = window.setTimeout(() => {
      const tick = (now: number) => {
        if (!t0) t0 = now
        const p = Math.min(1, (now - t0) / duration)
        const eased = p === 1 ? 1 : 1 - Math.pow(2, -10 * p) // ease-out exponencial
        const v = start + (target - start) * eased
        from.current = v
        setValue(v)
        if (p < 1) raf = requestAnimationFrame(tick)
      }
      raf = requestAnimationFrame(tick)
    }, start === 0 ? delay : 0)
    return () => {
      window.clearTimeout(timer)
      cancelAnimationFrame(raf)
    }
  }, [target, duration, delay])

  return value
}

export function CountUp({ value, suffix = '', duration }: { value: number; suffix?: string; duration?: number }) {
  const v = useCountUp(value, duration)
  return (
    <span className="num" role="text" aria-label={`${value}${suffix}`}>
      <span aria-hidden>{Math.round(v)}{suffix}</span>
    </span>
  )
}
