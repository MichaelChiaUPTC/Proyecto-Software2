import { useParams } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { QueryView } from '@/components/layout/QueryView'
import { Breadcrumb } from '@/components/layout/Breadcrumb'
import { LessonList } from '@/components/learning/LessonList'
import { ButtonLink, ProgressBar } from '@/components/ui'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { useQuery } from '@/hooks/useQuery'
import { api } from '@/services/api'
import { plural } from '@/utils/format'

export default function ModuleDetailPage() {
  const { id = '' } = useParams()
  const q = useQuery(() => api.catalog.moduleDetail(id), [id])
  useDocumentTitle(q.data?.module.title)

  return (
    <QueryView query={q} rows={5}>
      {(d) => {
        const current = d.path.find((i) => i.status === 'current')
        const doneCount = d.path.filter((i) => i.status === 'done').length
        return (
          <>
            <Breadcrumb items={[{ label: 'Módulos', to: '/modulos' }, { label: `Módulo ${d.module.code}` }]} />
            <header className="mhead">
              <p className="mono muted">Módulo {d.module.code}</p>
              <h1 className="t-display">{d.module.title}</h1>
              <p className="mhead__desc">{d.module.summary}</p>
              <div className="mhead__progress">
                <ProgressBar value={d.pct} label={`Progreso del módulo ${d.module.title}`} />
                <p className="t-caption num">{doneCount} de {d.path.length} pasos · {d.pct}%</p>
              </div>
            </header>

            <div className="mdetail">
              <section aria-labelledby="path-title">
                <h2 id="path-title" className="t-h3 mdetail__title">Ruta de aprendizaje</h2>
                <LessonList items={d.path} />
              </section>

              <aside className="mdetail__aside" aria-label="Resumen del módulo">
                <dl className="dl">
                  <div><dt>Lecciones</dt><dd className="num">{d.lessons}</dd></div>
                  <div><dt>Ejercicios</dt><dd className="num">{d.exercises}</dd></div>
                  <div><dt>Completado</dt><dd className="num">{plural(doneCount, 'paso', 'pasos')}</dd></div>
                </dl>
                {current ? (
                  <ButtonLink to={current.to} variant="primary" block iconRight={<ArrowRight size={16} aria-hidden />}>
                    {doneCount === 0 ? 'Empezar módulo' : 'Continuar'}
                  </ButtonLink>
                ) : (
                  <p className="t-caption">Módulo completado. Puedes repasar cualquier paso cuando quieras.</p>
                )}
              </aside>
            </div>
          </>
        )
      }}
    </QueryView>
  )
}
