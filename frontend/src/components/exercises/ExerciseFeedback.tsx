import { Link } from 'react-router-dom'
import { ArrowRight, BookOpen, CheckCircle2, CircleAlert, Lightbulb, Loader2, Sparkles, TerminalSquare } from 'lucide-react'
import type { AiHint, SubmitResult, SubmitStatus } from '@/types'
import { Badge } from '@/components/ui/Badge'
import { Button, ButtonLink } from '@/components/ui/Button'

/** Estado de la pista pedida a la IA para el último intento fallido. */
export type AiHintState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'ok'; hint: AiHint }
  | { status: 'error'; message: string }

interface Props {
  status: SubmitStatus
  result: SubmitResult | null
  hint?: { index: number; total: number; text: string } | null
  lessonLink?: { to: string; title: string } | null
  nextLink?: { to: string; label: string } | null
  /** Solo en modo API: si se pasa, el intento fallido ofrece «Pedir ayuda a la IA». */
  ai?: { state: AiHintState; onAsk: () => void }
}

/**
 * Zona de retroalimentación. Siempre explica qué concepto revisar; nunca se limita a «Incorrecto».
 * Es una región aria-live para que lectores de pantalla anuncien el resultado.
 */
export function ExerciseFeedback({ status, result, hint, lessonLink, nextLink, ai }: Props) {
  return (
    <div className={`feedback feedback--${status}`} role="status" aria-live="polite">
      {status === 'initial' && (
        <div className="feedback__row">
          <TerminalSquare size={18} aria-hidden className="feedback__icon" />
          <div>
            <p className="feedback__title">Escribe tu solución…</p>
            <p className="feedback__text">Cuando estés listo, envíala. Te diremos qué funciona y qué conviene revisar.</p>
          </div>
        </div>
      )}

      {status === 'running' && (
        <div className="feedback__row">
          <Loader2 size={18} aria-hidden className="feedback__icon spin" />
          <div>
            <p className="feedback__title">Evaluando…</p>
            <p className="feedback__text">Ejecutando tu función con los casos de prueba.</p>
          </div>
        </div>
      )}

      {status === 'success' && result && (
        <div className="feedback__row">
          <CheckCircle2 size={20} aria-hidden className="feedback__icon feedback__icon--pop" />
          <div className="feedback__main">
            <p className="feedback__title">Correcto</p>
            <p className="feedback__text">{result.message}</p>
            <p className="feedback__meta num">
              {result.testsPassed} de {result.testsTotal} casos de prueba
              {result.pointsGained > 0 && <> · <strong>+{result.pointsGained} puntos</strong></>}
            </p>
            {nextLink && (
              <ButtonLink to={nextLink.to} variant="primary" size="sm" iconRight={<ArrowRight size={16} aria-hidden />}>{nextLink.label}</ButtonLink>
            )}
          </div>
        </div>
      )}

      {status === 'error' && result && (
        <div className="feedback__row">
          <CircleAlert size={20} aria-hidden className="feedback__icon" />
          <div className="feedback__main">
            <p className="feedback__title">Hay un problema</p>
            <p className="feedback__text">{result.message}</p>
            {result.concept && (
              <p className="feedback__concept">
                <BookOpen size={14} aria-hidden /> Concepto para revisar: <strong>{result.concept}</strong>
                {lessonLink && <> · <Link to={lessonLink.to}>{lessonLink.title}</Link></>}
              </p>
            )}
            <p className="feedback__meta num">{result.testsPassed} de {result.testsTotal} casos de prueba</p>
            {ai && <AiHelp {...ai} />}
          </div>
        </div>
      )}

      {status === 'hint' && hint && (
        <div className="feedback__row">
          <Lightbulb size={20} aria-hidden className="feedback__icon" />
          <div className="feedback__main">
            <p className="feedback__title">Pista {hint.index} de {hint.total}</p>
            <p className="feedback__text">{hint.text}</p>
          </div>
        </div>
      )}
    </div>
  )
}

function AiHelp({ state, onAsk }: { state: AiHintState; onAsk: () => void }) {
  if (state.status === 'ok') {
    const ai = state.hint.source === 'ai'
    return (
      <div className="feedback__ai">
        <p className="feedback__ai-head">
          <Badge tone={ai ? 'accent' : 'neutral'} icon={<Sparkles size={13} aria-hidden />}>{ai ? 'Pista de la IA' : 'Pista del curso'}</Badge>
        </p>
        <p className="feedback__text">{state.hint.hint}</p>
        <p className="t-caption">{ai ? 'Generada por una IA: puede equivocarse y no incluye la solución.' : 'La IA no estuvo disponible; esta pista viene del curso.'}</p>
      </div>
    )
  }
  return (
    <div className="feedback__ai">
      <Button size="sm" variant="secondary" iconLeft={<Sparkles size={15} aria-hidden />} loading={state.status === 'loading'} onClick={onAsk}>
        {state.status === 'loading' ? 'Pensando…' : 'Pedir ayuda a la IA'}
      </Button>
      {state.status === 'error' && <p className="feedback__ai-error" role="alert">{state.message}</p>}
    </div>
  )
}
