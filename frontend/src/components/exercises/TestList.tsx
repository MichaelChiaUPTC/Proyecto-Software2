import { Check, Minus, X } from 'lucide-react'
import type { SubmitResult, TestCase } from '@/types'

/** Casos de prueba con su estado (marca + texto, no solo color). */
export function TestList({ tests, result }: { tests: TestCase[]; result: SubmitResult | null }) {
  return (
    <ul className="tests" aria-label="Casos de prueba">
      {tests.map((t, i) => {
        const state = !result ? 'idle' : result.failedTests.includes(i) ? 'fail' : 'pass'
        return (
          <li key={i} className={`tests__item tests__item--${state}`}>
            <span className="tests__mark" aria-hidden>
              {state === 'pass' ? <Check size={13} strokeWidth={3} /> : state === 'fail' ? <X size={13} strokeWidth={3} /> : <Minus size={13} />}
            </span>
            <code className="tests__call">{t.input}</code>
            <span className="tests__arrow" aria-hidden>→</span>
            <code className="tests__exp">{t.expected}</code>
            <span className="sr-only">{state === 'pass' ? 'Pasó' : state === 'fail' ? 'Falló' : 'Sin ejecutar'}</span>
          </li>
        )
      })}
    </ul>
  )
}
