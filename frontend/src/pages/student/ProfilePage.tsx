import { Link } from 'react-router-dom'
import { QueryView } from '@/components/layout/QueryView'
import { BadgeIcon } from '@/components/achievements/Achievement'
import { ActivityList } from '@/components/progress/ActivityList'
import { Avatar, CountUp, ProgressBar } from '@/components/ui'
import { useAuth } from '@/hooks/useAuth'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { useQuery } from '@/hooks/useQuery'
import { api } from '@/services/api'
import { shortDate } from '@/utils/format'

export default function ProfilePage() {
  useDocumentTitle('Perfil')
  const { user } = useAuth()
  const q = useQuery(() => api.student.profile())
  if (!user) return null

  return (
    <>
      <header className="profile">
        <Avatar name={user.name} size="xl" />
        <div className="profile__text">
          <h1 className="t-h1">{user.name}</h1>
          <p className="muted">{user.program}</p>
          <p className="t-caption">{user.semester}.º semestre · {user.group} · {user.email}</p>
        </div>
      </header>

      <QueryView query={q} rows={3}>
        {(d) => {
          const earned = d.badges.filter((b) => b.earnedAt)
          return (
            <div className="profile__grid">
              <section aria-labelledby="stats" className="section">
                <div className="section__head"><h2 id="stats" className="t-h3">Estadísticas</h2></div>
                <ProgressBar value={d.overallPct} label="Progreso general" tone="ink" />
                <dl className="dl dl--spaced">
                  <div><dt>Curso completado</dt><dd><CountUp value={d.overallPct} suffix="%" /></dd></div>
                  <div><dt>Puntos</dt><dd><CountUp value={d.points} /></dd></div>
                  <div><dt>Ejercicios resueltos</dt><dd className="num">{d.solved} de {d.totalExercises}</dd></div>
                  <div><dt>Envíos correctos</dt><dd><CountUp value={d.successRate} suffix="%" /></dd></div>
                  <div><dt>Lecciones completadas</dt><dd className="num">{d.lessonsDone}</dd></div>
                  <div><dt>En la plataforma desde</dt><dd>{shortDate(user.joinedAt)}</dd></div>
                </dl>

                <div className="section__head" style={{ marginTop: 'var(--s-6)' }}>
                  <h2 className="t-h3">Insignias · {earned.length}</h2>
                  <Link to="/insignias" className="t-caption">Ver colección</Link>
                </div>
                <ul className="minibadges minibadges--row">
                  {earned.map((b) => (
                    <li key={b.id}><BadgeIcon id={b.id} earned size={18} /><span className="minibadges__name">{b.name}</span></li>
                  ))}
                </ul>
              </section>

              <section aria-labelledby="hist" className="section">
                <div className="section__head"><h2 id="hist" className="t-h3">Historial de actividad</h2></div>
                <ActivityList items={d.history} />
              </section>
            </div>
          )
        }}
      </QueryView>
    </>
  )
}
