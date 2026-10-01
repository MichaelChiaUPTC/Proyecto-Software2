import { Link } from 'react-router-dom'
import { ArrowRight, TerminalSquare } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { QueryView } from '@/components/layout/QueryView'
import { LessonList } from '@/components/learning/LessonList'
import { ActivityList } from '@/components/progress/ActivityList'
import { BadgeIcon } from '@/components/achievements/Achievement'
import { Badge, ButtonLink, Card, CountUp, EmptyState, ProgressBar } from '@/components/ui'
import { useAuth } from '@/hooks/useAuth'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { useQuery } from '@/hooks/useQuery'
import { api } from '@/services/api'
import { difficultyLabel, greeting, shortDate } from '@/utils/format'

export default function DashboardPage() {
  useDocumentTitle('Inicio')
  const { user } = useAuth()
  const q = useQuery(() => api.student.home())
  const first = user?.name.split(' ')[0] ?? ''

  return (
    <QueryView query={q} rows={3}>
      {(d) => {
        const { target, current } = d
        const pathItems = d.path
        const idx = pathItems.findIndex((i) => i.status === 'current')
        const slice = pathItems.slice(Math.max(0, idx - 1), Math.max(0, idx - 1) + 4)

        return (
          <>
            <PageHeader
              title={`${greeting()}, ${first}`}
              description={target ? <>Vas por el módulo {target.module.code} de 08 y llevas el <span className="num">{d.overallPct}%</span> del curso.</> : 'Completaste todos los módulos disponibles. Repasa o practica lo que quieras.'}
            />

            <div className="dash">
              <div className="dash__main">
                {target && current ? (
                  <Card pad="lg" className="continue" aria-labelledby="continue-title">
                    <div className="continue__head">
                      <div>
                        <p className="t-label">Continuar aprendiendo</p>
                        <h2 id="continue-title" className="t-h2 continue__title">
                          <span className="mono muted">{target.module.code}</span> {target.module.title}
                        </h2>
                      </div>
                      <span className="continue__pct"><CountUp value={current.pct} suffix="%" /></span>
                    </div>
                    <ProgressBar value={current.pct} label={`Progreso del módulo ${target.module.title}`} size="lg" />
                    <div className="continue__now">
                      <p className="t-label">{target.kind === 'lesson' ? 'Lección actual' : 'Ejercicio actual'}</p>
                      <p className="continue__lesson">{target.title}</p>
                    </div>
                    <div className="continue__actions">
                      <ButtonLink to={target.to} variant="primary" iconRight={<ArrowRight size={16} aria-hidden />}>Continuar</ButtonLink>
                      <ButtonLink to={`/modulos/${target.module.id}`} variant="ghost">Ver módulo</ButtonLink>
                    </div>
                    {slice.length > 0 && (
                      <div className="continue__path">
                        <LessonList items={slice} compact />
                      </div>
                    )}
                  </Card>
                ) : (
                  <EmptyState title="Estás al día" text="No tienes módulos pendientes. Practica ejercicios sueltos cuando quieras." action={<ButtonLink to="/ejercicios" variant="secondary">Ver ejercicios</ButtonLink>} />
                )}

                {d.nextExercise && (
                  <section className="next-ex" aria-labelledby="next-ex-title">
                    <div className="next-ex__icon" aria-hidden><TerminalSquare size={20} /></div>
                    <div className="next-ex__body">
                      <p className="t-label" id="next-ex-title">Próximo ejercicio</p>
                      <p className="next-ex__title">{d.nextExercise.exercise.title}</p>
                      <p className="t-caption">{d.nextExercise.exercise.goal}</p>
                    </div>
                    <div className="next-ex__side">
                      <Badge>{difficultyLabel[d.nextExercise.exercise.difficulty]}</Badge>
                      <ButtonLink to={`/ejercicios/${d.nextExercise.exercise.id}`} variant="secondary" size="sm">Practicar</ButtonLink>
                    </div>
                  </section>
                )}

                <section aria-labelledby="activity-title" className="section">
                  <div className="section__head">
                    <h2 id="activity-title" className="t-h3">Actividad reciente</h2>
                    <Link to="/progreso" className="t-caption">Ver todo</Link>
                  </div>
                  {d.activity.length ? <ActivityList items={d.activity} /> : <p className="t-caption">Aún no hay actividad. Tu primer ejercicio aparecerá aquí.</p>}
                </section>
              </div>

              <aside className="dash__aside" aria-label="Resumen personal">
                <section className="summary">
                  <h2 className="t-h3">Tu avance</h2>
                  <div className="summary__big">
                    <span className="summary__num"><CountUp value={d.points} duration={1300} /></span>
                    <span className="t-caption">puntos acumulados</span>
                  </div>
                  <ProgressBar value={d.overallPct} label="Progreso general del curso" tone="ink" />
                  <dl className="dl">
                    <div><dt>Curso completado</dt><dd><CountUp value={d.overallPct} suffix="%" /></dd></div>
                    <div><dt>Ejercicios resueltos</dt><dd><CountUp value={d.solved} /> de {d.totalExercises}</dd></div>
                    <div><dt>Envíos correctos</dt><dd><CountUp value={d.successRate} suffix="%" /></dd></div>
                  </dl>
                </section>

                <section className="summary">
                  <div className="section__head">
                    <h2 className="t-h3">Insignias recientes</h2>
                    <Link to="/insignias" className="t-caption">Ver colección</Link>
                  </div>
                  {d.recentBadges.length ? (
                    <ul className="minibadges">
                      {d.recentBadges.map((b) => (
                        <li key={b.id}>
                          <BadgeIcon id={b.id} earned size={18} />
                          <span>
                            <span className="minibadges__name">{b.name}</span>
                            <span className="t-caption">{shortDate(b.earnedAt!)}</span>
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="t-caption">Resuelve tu primer ejercicio para obtener «Primer paso».</p>
                  )}
                </section>
              </aside>
            </div>
          </>
        )
      }}
    </QueryView>
  )
}
