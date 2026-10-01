import { cloneElement, useId, useState, type ReactElement } from 'react'

/** Tooltip accesible: aparece con hover y foco, y se descarta con Escape. */
export function Tooltip({ text, children, side = 'top' }: { text: string; children: ReactElement<Record<string, unknown>>; side?: 'top' | 'bottom' }) {
  const id = useId()
  const [open, setOpen] = useState(false)
  return (
    <span
      className="tip"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
      onKeyDown={(e) => e.key === 'Escape' && setOpen(false)}
    >
      {cloneElement(children, { 'aria-describedby': open ? id : undefined })}
      {open && (
        <span id={id} role="tooltip" className={`tip__bubble tip__bubble--${side}`}>
          {text}
        </span>
      )}
    </span>
  )
}
