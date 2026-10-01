import type { ElementType, HTMLAttributes, ReactNode } from 'react'
import { cx } from '@/utils/format'

type CardProps = HTMLAttributes<HTMLElement> & { as?: ElementType; pad?: 'none' | 'md' | 'lg'; children: ReactNode }

/** Superficie con borde sutil. Úsala solo para el elemento principal de una vista, no para cada bloque. */
export function Card({ as: Tag = 'section', pad = 'md', className, children, ...rest }: CardProps) {
  return (
    <Tag className={cx('card', `card--${pad}`, className)} {...rest}>
      {children}
    </Tag>
  )
}
