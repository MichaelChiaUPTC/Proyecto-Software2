import { useEffect, useState } from 'react'
import { cx } from '@/utils/format'
import { useCountUp } from './CountUp'

/** Arranca en 0 y pasa al valor real tras el primer pintado, para que la transición CSS se vea. */
function useGrow(v: number) {
  const [w, setW] = useState(0)
  useEffect(() => {
    const id = window.setTimeout(() => setW(v), 140)
    return () => window.clearTimeout(id)
  }, [v])
  return w
}

export function ProgressBar({ value, label, size = 'md', tone = 'accent' }: { value: number; label: string; size?: 'sm' | 'md' | 'lg'; tone?: 'accent' | 'ink' }) {
  const v = Math.max(0, Math.min(100, value))
  const w = useGrow(v)
  return (
    <div className={cx('pbar', `pbar--${size}`, `pbar--${tone}`)} role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={v}>
      <div className="pbar__fill" style={{ width: `${w}%` }} />
    </div>
  )
}

export function ProgressRing({ value, size = 96, stroke = 8, label }: { value: number; size?: number; stroke?: number; label: string }) {
  const v = Math.max(0, Math.min(100, value))
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const shown = useGrow(v)
  const n = useCountUp(v, 1100)
  return (
    <div className="ring" style={{ width: size, height: size }} role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={v}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden>
        <circle cx={size / 2} cy={size / 2} r={r} className="ring__track" strokeWidth={stroke} fill="none" />
        <circle cx={size / 2} cy={size / 2} r={r} className="ring__fill" strokeWidth={stroke} fill="none" strokeDasharray={c} strokeDashoffset={c * (1 - shown / 100)} strokeLinecap="round" transform={`rotate(-90 ${size / 2} ${size / 2})`} />
      </svg>
      <span className="ring__value num" aria-hidden>{Math.round(n)}%</span>
    </div>
  )
}
