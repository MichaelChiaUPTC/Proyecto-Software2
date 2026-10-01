import { useEffect, useId, useRef, useState, type KeyboardEvent, type ReactNode } from 'react'
import { cx } from '@/utils/format'

export type MenuEntry =
  | { type: 'item'; label: string; icon?: ReactNode; onSelect: () => void; checked?: boolean; danger?: boolean }
  | { type: 'separator' }
  | { type: 'heading'; label: string }

interface DropdownProps {
  trigger: (p: { open: boolean; props: Record<string, unknown> }) => ReactNode
  entries: MenuEntry[]
  align?: 'start' | 'end'
  placement?: 'top' | 'bottom'
  label: string
}

export function Dropdown({ trigger, entries, align = 'start', placement = 'bottom', label }: DropdownProps) {
  const [open, setOpen] = useState(false)
  const root = useRef<HTMLDivElement>(null)
  const menu = useRef<HTMLDivElement>(null)
  const id = useId()

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => !root.current?.contains(e.target as Node) && setOpen(false)
    document.addEventListener('mousedown', onDown)
    menu.current?.querySelector<HTMLElement>('[role^="menuitem"]')?.focus()
    return () => document.removeEventListener('mousedown', onDown)
  }, [open])

  const items = () => [...(menu.current?.querySelectorAll<HTMLElement>('[role^="menuitem"]') ?? [])]

  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      setOpen(false)
      root.current?.querySelector<HTMLElement>('[aria-haspopup]')?.focus()
    }
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault()
      const list = items()
      const i = list.indexOf(document.activeElement as HTMLElement)
      const n = e.key === 'ArrowDown' ? (i + 1) % list.length : (i - 1 + list.length) % list.length
      list[n]?.focus()
    }
    if (e.key === 'Tab') setOpen(false)
  }

  return (
    <div className="dropdown" ref={root} onKeyDown={onKey}>
      {trigger({ open, props: { 'aria-haspopup': 'menu', 'aria-expanded': open, 'aria-controls': open ? id : undefined, onClick: () => setOpen((o) => !o) } })}
      {open && (
        <div ref={menu} id={id} role="menu" aria-label={label} className={cx('menu', `menu--${align}`, `menu--${placement}`)}>
          {entries.map((en, i) =>
            en.type === 'separator' ? (
              <div key={i} role="separator" className="menu__sep" />
            ) : en.type === 'heading' ? (
              <div key={i} className="menu__heading" role="presentation">{en.label}</div>
            ) : (
              <button
                key={i}
                role={en.checked === undefined ? 'menuitem' : 'menuitemradio'}
                aria-checked={en.checked}
                className={cx('menu__item', en.danger && 'menu__item--danger')}
                onClick={() => { en.onSelect(); setOpen(false) }}
              >
                {en.icon}
                <span>{en.label}</span>
                {en.checked && <span className="menu__check" aria-hidden>✓</span>}
              </button>
            ),
          )}
        </div>
      )}
    </div>
  )
}
