import { Link } from 'react-router-dom'
import { PageHeader } from '@/components/layout/PageHeader'
import { QueryView } from '@/components/layout/QueryView'
import { Avatar, ButtonLink, CountUp, ProgressBar } from '@/components/ui'
import { useAuth } from '@/hooks/useAuth'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { useQuery } from '@/hooks/useQuery'
import { api } from '@/services/api'
import { daysSince, relativeTime } from '@/utils/format'

export default function TeacherDashboardPage() {
  useDocumentTitle('Panel docente')
  const { user } = useAuth()
  const q = useQuery(() => api.teacher.dashboard())

  return (
    <>
      <PageHeader
        title="Panel docente"
        description={`${user?.name.replace('Profesor ', 'Profesor ')} · Programación Básica`}
        actions={<ButtonLink to="/docente/reportes" variant="secondary">Ver reportes</ButtonLink>}
      />
      <QueryView query={q} rows={3}>
        {(d) => {
          const maxStudents = Math.max(1, ...d.perModule.map((m) => m.students))
          return (
            <>
              <dl className="facts">
                <div><dt>Estudiantes activos</dt><dd><CountUp value={d.active} /><span className="facts__of"> de {d.total}</span></dd><p className="t-caption">con actividad en los últimos 7 días</p></div>
                <div><dt>Módulos publicados</dt><dd><CountUp value={d.published} /><span className="facts__of"> de {d.modulesTotal}</span></dd><p className="t-caption">{d.lessonsPublished} lecciones · {d.exercisesPublished} ejercicios</p></div>
                <div><dt>Progreso promedio</dt><dd><CountUp value={d.avg} suffix="%" /></dd><p className="t-caption">del curso completo</p></div>
                <div><dt>Requieren atención</dt><dd><CountUp value={d.attention.length} /></dd><p className="t-caption">inactivos o con baja tasa de éxito</p></div>
              </dl>

              <div className="tdash">
                <section aria-labelledby="attn" className="section">
                  <div className="section__head">
                    <h2 id="attn" className="t-h3">Estudiantes que requieren atención</h2>
                    <Link to="/docente/reportes" className="t-caption">Ver todos</Link>
                  </div>
                  <ul className="attn">
                    {d.attention.map((s) => {
                      const days = daysSince(s.lastActivity)
                      const reasons = [days >= 7 ? `Sin actividad hace ${days} días` : null, s.successRate < 40 ? `Éxito del ${s.successRate}%` : null].filter(Boolean).join(' · ')
                      return (
                        <li key={s.id} className="attn__row">
                          <Avatar name={s.name} size="sm" />
                          <div className="attn__who">
                            <p className="attn__name">{s.name}</p>
                            <p className="t-caption">{reasons}</p>
                          </div>
                          <div className="attn__bar"><ProgressBar value={s.progress} label={`Progreso de ${s.name}`} size="sm" tone="ink" /><span className="t-caption num">{s.progress}%</span></div>
                        </li>
                      )
                    })}
                  </ul>
                </section>

                <aside className="tdash__aside">
                  <section aria-labelledby="where" className="section">
                    <div className="section__head"><h2 id="where" className="t-h3">Dónde está el grupo</h2></div>
                    <ul className="dist">
                      {d.perModule.map((m) => (
                        <li key={m.module.id}>
                          <span className="mono muted num">{m.module.code}</span>
                          <span className="dist__title">{m.module.title}</span>
                          <span className="dist__bar" aria-hidden><span style={{ width: `${(m.students / maxStudents) * 100}%` }} /></span>
                          <span className="num dist__n">{m.students}<span className="sr-only"> estudiantes</span></span>
                        </li>
                      ))}
                    </ul>
                  </section>
                </aside>
              </div>

              <section aria-labelledby="recent" className="section">
                <div className="section__head"><h2 id="recent" className="t-h3">Actividad reciente</h2></div>
                <ul className="activity">
                  {d.recent.map((s) => (
                    <li key={s.id} className="activity__item">
                      <Avatar name={s.name} size="sm" />
                      <div className="activity__text">
                        <p className="activity__title">{s.name}</p>
                        <p className="t-caption">Trabaja en el módulo {s.currentModule}</p>
                      </div>
                      <time className="t-caption activity__time" dateTime={s.lastActivity}>{relativeTime(s.lastActivity)}</time>
                    </li>
                  ))}
                </ul>
              </section>
            </>
          )
        }}
      </QueryView>
    </>
  )
}
