import { Link } from 'react-router-dom'
import { Check } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { QueryView } from '@/components/layout/QueryView'
import { ActivityList } from '@/components/progress/ActivityList'
import { Badge, CountUp, ProgressBar, ProgressRing } from '@/components/ui'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { useQuery } from '@/hooks/useQuery'
import { api } from '@/services/api'

const label = { todo: 'No iniciado', progress: 'En progreso', done: 'Completado' } as const

export default function ProgressPage() {
  useDocumentTitle('Progreso')
  const q = useQuery(() => api.student.progress())

  return (
    <>
      <PageHeader title="Progreso" description="Dónde estás en el curso y qué te falta para terminarlo." />
      <QueryView query={q} rows={4}>
        {(d) => (
          <>
            <section className="overall" aria-labelledby="overall-title">
              <ProgressRing value={d.overallPct} size={112} stroke={9} label="Progreso general del curso" />
              <div className="overall__text">
                <h2 id="overall-title" className="t-h2">
                  {d.modulesCompleted} de {d.modulesTotal} módulos completados
                </h2>
                <p className="muted">
                  Has resuelto {d.solved} de {d.totalExercises} ejercicios y leído {d.lessonsDone} lecciones. Te quedan {d.pendingExercises} ejercicios por resolver.
                </p>
              </div>
              <dl className="dl overall__dl">
                <div><dt>Ejercicios completados</dt><dd><CountUp value={d.solved} /></dd></div>
                <div><dt>Ejercicios pendientes</dt><dd><CountUp value={d.pendingExercises} /></dd></div>
                <div>
                  <dt>Tasa de éxito</dt>
                  <dd><CountUp value={d.successRate} suffix="%" /></dd>
                </div>
              </dl>
            </section>
            <p className="t-caption overall__note">La tasa de éxito es la proporción de envíos correctos sobre el total de envíos ({d.attemptsCount} en total).</p>

            <section className="section" aria-labelledby="by-module">
              <div className="section__head"><h2 id="by-module" className="t-h3">Por módulo</h2></div>
              <ul className="modprog">
                {d.modules.map((m) => (
                  <li key={m.module.id}>
                    <Link to={`/modulos/${m.module.id}`} className="modprog__row">
                      <span className="mono muted num modprog__code">{m.module.code}</span>
                      <span className="modprog__title">{m.module.title}</span>
                      <span className="modprog__bar"><ProgressBar value={m.pct} label={`Progreso de ${m.module.title}`} size="sm" tone={m.status === 'done' ? 'ink' : 'accent'} /></span>
                      <span className="modprog__count t-caption num">{m.stats.doneE}/{m.stats.exercises} ejercicios</span>
                      <span className="modprog__state">
                        {m.status === 'done' ? <Badge icon={<Check size={13} strokeWidth={2.5} aria-hidden />}>{label.done}</Badge> : m.status === 'progress' ? <Badge tone="accent">{label.progress}</Badge> : <Badge>{label.todo}</Badge>}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>

            <section className="section" aria-labelledby="recent">
              <div className="section__head"><h2 id="recent" className="t-h3">Actividad reciente</h2></div>
              <ActivityList items={d.activity} />
            </section>
          </>
        )}
      </QueryView>
    </>
  )
}
