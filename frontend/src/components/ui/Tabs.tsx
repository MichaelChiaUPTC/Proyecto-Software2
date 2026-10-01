import { useId, useRef, type KeyboardEvent, type ReactNode } from 'react'
import { cx } from '@/utils/format'

export interface TabItem {
  id: string
  label: string
  badge?: ReactNode
}

export function Tabs({ items, value, onChange, label, className }: { items: TabItem[]; value: string; onChange: (id: string) => void; label: string; className?: string }) {
  const base = useId()
  const refs = useRef<(HTMLButtonElement | null)[]>([])

  const onKey = (e: KeyboardEvent, i: number) => {
    const move = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0
    if (!move && e.key !== 'Home' && e.key !== 'End') return
    e.preventDefault()
    const n = e.key === 'Home' ? 0 : e.key === 'End' ? items.length - 1 : (i + move + items.length) % items.length
    refs.current[n]?.focus()
    onChange(items[n].id)
  }

  return (
    <div role="tablist" aria-label={label} className={cx('tabs', className)}>
      {items.map((t, i) => (
        <button
          key={t.id}
          ref={(el) => { refs.current[i] = el }}
          role="tab"
          id={`${base}-${t.id}`}
          aria-selected={value === t.id}
          aria-controls={`${base}-panel-${t.id}`}
          tabIndex={value === t.id ? 0 : -1}
          className="tabs__tab"
          onClick={() => onChange(t.id)}
          onKeyDown={(e) => onKey(e, i)}
        >
          {t.label}
          {t.badge}
        </button>
      ))}
    </div>
  )
}
