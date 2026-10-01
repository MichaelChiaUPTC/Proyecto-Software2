import { useMemo, useState } from 'react'
import { Check, Copy } from 'lucide-react'
import { highlight } from '@/utils/highlight'
import { cx } from '@/utils/format'

export function HighlightedLines({ code, errorLine }: { code: string; errorLine?: number }) {
  const lines = useMemo(() => highlight(code), [code])
  return (
    <>
      {lines.map((tokens, i) => (
        <span key={i} className={cx('cl', errorLine === i + 1 && 'cl--error')}>
          {tokens.length === 0 ? '​' : tokens.map((t, j) => (t.kind === 'plain' ? t.text : <span key={j} className={`tk tk--${t.kind}`}>{t.text}</span>))}
          {'\n'}
        </span>
      ))}
    </>
  )
}

interface CodeBlockProps {
  code: string
  caption?: string
  lineNumbers?: boolean
  label?: string
}

export function CodeBlock({ code, caption, lineNumbers, label = 'Código de ejemplo' }: CodeBlockProps) {
  const [copied, setCopied] = useState(false)
  const showNumbers = lineNumbers ?? code.split('\n').length > 3
  const count = code.split('\n').length

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1800)
    } catch {
      /* portapapeles no disponible */
    }
  }

  return (
    <figure className="codeblock">
      <div className="codeblock__box">
        <button className="codeblock__copy" onClick={copy} aria-label={copied ? 'Código copiado' : 'Copiar código'}>
          {copied ? <Check size={15} aria-hidden /> : <Copy size={15} aria-hidden />}
          <span aria-live="polite">{copied ? 'Copiado' : 'Copiar'}</span>
        </button>
        <pre className="codeblock__pre" tabIndex={0} aria-label={label}>
          {showNumbers && (
            <span className="codeblock__nums" aria-hidden>
              {Array.from({ length: count }, (_, i) => i + 1).join('\n')}
            </span>
          )}
          <code className="codeblock__code"><HighlightedLines code={code} /></code>
        </pre>
      </div>
      {caption && <figcaption className="t-caption">{caption}</figcaption>}
    </figure>
  )
}
