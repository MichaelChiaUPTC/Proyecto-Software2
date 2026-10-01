import type { ReactNode } from 'react'
import { cx, initials } from '@/utils/format'

export type BadgeTone = 'neutral' | 'accent' | 'ok' | 'err'

/** Etiqueta de estado. Siempre lleva texto (y opcionalmente icono): nunca depende solo del color. */
export function Badge({ tone = 'neutral', icon, children }: { tone?: BadgeTone; icon?: ReactNode; children: ReactNode }) {
  return (
    <span className={cx('badge', `badge--${tone}`)}>
      {icon}
      {children}
    </span>
  )
}

export function Avatar({ name, size = 'md' }: { name: string; size?: 'sm' | 'md' | 'lg' | 'xl' }) {
  return (
    <span className={cx('avatar', `avatar--${size}`)} aria-hidden>
      {initials(name)}
    </span>
  )
}
