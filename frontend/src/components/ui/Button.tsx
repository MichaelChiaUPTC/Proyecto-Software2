import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react'
import { Link, type LinkProps } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { cx } from '@/utils/format'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'
type Size = 'sm' | 'md'

interface Common {
  variant?: Variant
  size?: Size
  loading?: boolean
  iconLeft?: ReactNode
  iconRight?: ReactNode
  block?: boolean
}

export type ButtonProps = Common & ButtonHTMLAttributes<HTMLButtonElement>

function inner({ loading, iconLeft, iconRight, children }: Pick<Common, 'loading' | 'iconLeft' | 'iconRight'> & { children?: ReactNode }) {
  return (
    <>
      {loading ? <Loader2 className="spin" size={16} aria-hidden /> : iconLeft}
      {children && <span>{children}</span>}
      {!loading && iconRight}
    </>
  )
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'secondary', size = 'md', loading, iconLeft, iconRight, block, className, children, disabled, type = 'button', ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={cx('btn', `btn--${variant}`, `btn--${size}`, block && 'btn--block', className)}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...rest}
    >
      {inner({ loading, iconLeft, iconRight, children })}
    </button>
  )
})

export function ButtonLink({ variant = 'secondary', size = 'md', iconLeft, iconRight, block, className, children, ...rest }: Common & LinkProps) {
  return (
    <Link className={cx('btn', `btn--${variant}`, `btn--${size}`, block && 'btn--block', className)} {...rest}>
      {inner({ iconLeft, iconRight, children })}
    </Link>
  )
}

export function IconButton({ label, children, className, size = 'md', ...rest }: ButtonHTMLAttributes<HTMLButtonElement> & { label: string; size?: 'sm' | 'md' }) {
  return (
    <button type="button" className={cx('icon-btn', size === 'sm' && 'icon-btn--sm', className)} aria-label={label} {...rest}>
      {children}
    </button>
  )
}
