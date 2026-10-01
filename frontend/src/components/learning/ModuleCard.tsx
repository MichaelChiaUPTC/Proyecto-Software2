import { Link } from 'react-router-dom'
import { ArrowRight, Check } from 'lucide-react'
import type { ModuleOverview } from '@/services/api'
import { Badge } from '@/components/ui/Badge'
import { ProgressBar } from '@/components/ui/Progress'
import { CountUp } from '@/components/ui/CountUp'
import { ButtonLink } from '@/components/ui/Button'
import { plural } from '@/utils/format'

const statusLabel = { todo: 'No iniciado', progress: 'En progreso', done: 'Completado' } as const

/** Módulo destacado (en curso): composición amplia con acción primaria. */
export function ModuleFeature({ data, lessonTitle }: { data: ModuleOverview; lessonTitle?: string }) {
  const { module: m } = data
  return (
    <section className="mfeature" aria-labelledby={`mf-${m.id}`}>
      <div className="mfeature__main">
        <p className="mfeature__code mono">Módulo {m.code}</p>
        <h2 id={`mf-${m.id}`} className="t-display">{m.title}</h2>
        <p className="mfeature__desc">{m.summary}</p>
        <div className="mfeature__actions">
          <ButtonLink to={`/modulos/${m.id}`} variant="primary" iconRight={<ArrowRight size={16} aria-hidden />}>Continuar módulo</ButtonLink>
          {lessonTitle && <span className="t-caption">Sigue: {lessonTitle}</span>}
        </div>
      </div>
      <dl className="mfeature__side">
        <div>
          <dt className="t-label">Avance</dt>
          <dd>
            <span className="mfeature__pct"><CountUp value={data.pct} suffix="%" /></span>
            <ProgressBar value={data.pct} label={`Progreso del módulo ${m.title}`} />
          </dd>
        </div>
        <div className="mfeature__counts">
          <div><dt className="t-label">Lecciones</dt><dd className="num">{data.lessons}</dd></div>
          <div><dt className="t-label">Ejercicios</dt><dd className="num">{data.exercises}</dd></div>
        </div>
      </dl>
    </section>
  )
}

/** Fila de índice: número, título, resumen y estado. */
export function ModuleRow({ data }: { data: ModuleOverview }) {
  const { module: m } = data
  return (
    <li>
      <Link to={`/modulos/${m.id}`} className="mrow">
        <span className="mrow__code mono num" aria-hidden>{m.code}</span>
        <span className="mrow__main">
          <span className="mrow__title">{m.title}</span>
          <span className="mrow__desc">{m.summary}</span>
          <span className="mrow__counts t-caption">{plural(data.lessons, 'lección', 'lecciones')} · {plural(data.exercises, 'ejercicio', 'ejercicios')}</span>
        </span>
        <span className="mrow__state">
          {data.status === 'done' ? (
            <Badge icon={<Check size={13} strokeWidth={2.5} aria-hidden />}>{statusLabel.done}</Badge>
          ) : data.status === 'progress' ? (
            <Badge tone="accent">{statusLabel.progress}</Badge>
          ) : (
            <Badge>{statusLabel.todo}</Badge>
          )}
          {data.status !== 'todo' && data.status !== 'done' && <span className="mrow__pct num t-caption">{data.pct}%</span>}
        </span>
      </Link>
    </li>
  )
}
