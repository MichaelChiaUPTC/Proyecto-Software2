import { useId, useRef, type KeyboardEvent } from 'react'
import { HighlightedLines } from '@/components/learning/CodeBlock'

interface CodeEditorProps {
  value: string
  onChange: (v: string) => void
  onSubmit?: () => void
  label: string
  errorLine?: number
  readOnly?: boolean
  minLines?: number
  placeholder?: string
}

/**
 * Editor ligero: un textarea transparente sobre una capa con resaltado de sintaxis.
 * Tab indenta, Enter conserva la indentación y Ctrl/⌘ + Enter envía.
 */
export function CodeEditor({ value, onChange, onSubmit, label, errorLine, readOnly, minLines = 8, placeholder }: CodeEditorProps) {
  const ref = useRef<HTMLTextAreaElement>(null)
  const id = useId()
  const tabIndents = useRef(true)
  const lines = Math.max(value.split('\n').length, minLines)

  const edit = (next: string, caret: number) => {
    onChange(next)
    requestAnimationFrame(() => ref.current?.setSelectionRange(caret, caret))
  }

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    const ta = e.currentTarget
    const { selectionStart: s, selectionEnd: en } = ta
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault()
      onSubmit?.()
      return
    }
    if (e.key === 'Escape') {
      tabIndents.current = false
      return
    }
    if (e.key === 'Tab' && tabIndents.current && !e.shiftKey) {
      // Tab indenta. Con Esc primero, Tab vuelve a mover el foco (evita atrapar el teclado)
      e.preventDefault()
      edit(value.slice(0, s) + '    ' + value.slice(en), s + 4)
    } else if (e.key === 'Tab' && tabIndents.current && e.shiftKey) {
      const lineStart = value.lastIndexOf('\n', s - 1) + 1
      if (value.slice(lineStart, lineStart + 4) === '    ') {
        e.preventDefault()
        edit(value.slice(0, lineStart) + value.slice(lineStart + 4), Math.max(lineStart, s - 4))
      }
    } else if (e.key === 'Enter') {
      e.preventDefault()
      const lineStart = value.lastIndexOf('\n', s - 1) + 1
      const current = value.slice(lineStart, s)
      const indent = /^ */.exec(current)![0]
      const extra = current.trimEnd().endsWith(':') ? '    ' : ''
      const ins = '\n' + indent + extra
      edit(value.slice(0, s) + ins + value.slice(en), s + ins.length)
    }
  }

  return (
    <div className="editor">
      <div className="editor__gutter" aria-hidden>
        {Array.from({ length: lines }, (_, i) => (
          <span key={i} className={errorLine === i + 1 ? 'is-error' : undefined}>{i + 1}</span>
        ))}
      </div>
      <div className="editor__scroll">
        <div className="editor__stack">
          <pre className="editor__layer" aria-hidden>
            <HighlightedLines code={value} errorLine={errorLine} />
          </pre>
          <label htmlFor={id} className="sr-only">{label}</label>
          <textarea
            id={id}
            ref={ref}
            className="editor__input"
            value={value}
            readOnly={readOnly}
            placeholder={placeholder}
            spellCheck={false}
            autoCapitalize="off"
            autoComplete="off"
            autoCorrect="off"
            rows={lines}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={onKeyDown}
            onBlur={() => { tabIndents.current = true }}
          />
        </div>
      </div>
    </div>
  )
}
