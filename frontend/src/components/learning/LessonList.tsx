import { Link } from 'react-router-dom'
import { ArrowRight, Check, TerminalSquare } from 'lucide-react'
import type { PathItem } from '@/services/api'
import { Badge } from '@/components/ui/Badge'
import { ButtonLink } from '@/components/ui/Button'
import { cx, difficultyLabel } from '@/utils/format'

const statusText = { done: 'Completado', current: 'Siguiente paso', todo: 'Pendiente' } as const

/**
 * Ruta de aprendizaje: lo completado → lo que sigue → lo pendiente.
 * El estado se comunica con forma (marca, anillo, vacío) y con texto accesible, no solo con color.
 */
export function LessonList({ items, compact }: { items: PathItem[]; compact?: boolean }) {
  return (
    <ol className={cx('path', compact && 'path--compact')}>
      {items.map((it) => (
        <li key={it.id} className={cx('path__item', `path__item--${it.status}`, it.kind === 'exercise' && 'path__item--exercise')}>
          <span className="path__node" aria-hidden>
            {it.status === 'done' ? <Check size={12} strokeWidth={3} /> : it.status === 'current' ? <span className="path__dot" /> : null}
          </span>
          <div className="path__body">
            <Link to={it.to} className="path__link">
              {it.kind === 'exercise' && <TerminalSquare size={15} aria-hidden className="path__kind" />}
              <span className="path__title">{it.title}</span>
              <span className="sr-only"> — {it.kind === 'lesson' ? 'Lección' : 'Ejercicio'}, {statusText[it.status]}</span>
            </Link>
            <div className="path__meta">
              {it.kind === 'lesson' ? (
                <span className="t-caption">{it.meta}</span>
              ) : (
                <>
                  <Badge>{difficultyLabel[it.difficulty]}</Badge>
                  {it.attempts > 0 && it.status !== 'done' && <span className="t-caption">{it.attempts} {it.attempts === 1 ? 'intento' : 'intentos'}</span>}
                </>
              )}
              {it.status === 'current' && <Badge tone="accent">Siguiente paso</Badge>}
            </div>
            {it.status === 'current' && !compact && (
              <ButtonLink to={it.to} variant="primary" size="sm" iconRight={<ArrowRight size={16} aria-hidden />} className="path__cta">
                {it.kind === 'lesson' ? 'Empezar lección' : 'Ir al ejercicio'}
              </ButtonLink>
            )}
          </div>
        </li>
      ))}
    </ol>
  )
}
