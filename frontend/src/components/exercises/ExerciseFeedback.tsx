import { Link } from 'react-router-dom'
import { ArrowRight, BookOpen, CheckCircle2, CircleAlert, Lightbulb, Loader2, TerminalSquare } from 'lucide-react'
import type { SubmitResult, SubmitStatus } from '@/types'
import { ButtonLink } from '@/components/ui/Button'

interface Props {
  status: SubmitStatus
  result: SubmitResult | null
  hint?: { index: number; total: number; text: string } | null
  lessonLink?: { to: string; title: string } | null
  nextLink?: { to: string; label: string } | null
}

/**
 * Zona de retroalimentación. Siempre explica qué concepto revisar; nunca se limita a «Incorrecto».
 * Es una región aria-live para que lectores de pantalla anuncien el resultado.
 */
export function ExerciseFeedback({ status, result, hint, lessonLink, nextLink }: Props) {
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
