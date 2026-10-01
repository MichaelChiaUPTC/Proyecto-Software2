import { PageHeader } from '@/components/layout/PageHeader'
import { QueryView } from '@/components/layout/QueryView'
import { Achievement } from '@/components/achievements/Achievement'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { useQuery } from '@/hooks/useQuery'
import { api } from '@/services/api'

export default function BadgesPage() {
  useDocumentTitle('Insignias')
  const q = useQuery(() => api.student.badges())

  return (
    <QueryView query={q} rows={4}>
      {(badges) => {
        const earned = badges.filter((b) => b.earnedAt).sort((a, b) => b.earnedAt!.localeCompare(a.earnedAt!))
        const locked = badges.filter((b) => !b.earnedAt).sort((a, b) => b.current / b.target - a.current / a.target)
        const recentCut = Date.now() - 36e5
        return (
          <>
            <PageHeader title="Insignias" description={`Has obtenido ${earned.length} de ${badges.length}. Cada una marca un hito real de tu práctica.`} />

            <section className="section" aria-labelledby="earned">
              <div className="section__head"><h2 id="earned" className="t-h3">Obtenidas · {earned.length}</h2></div>
              {earned.length ? (
                <ul className="achgrid">{earned.map((b) => <Achievement key={b.id} badge={b} fresh={new Date(b.earnedAt!).getTime() > recentCut} />)}</ul>
              ) : (
                <p className="t-caption">Todavía no tienes insignias. Resuelve tu primer ejercicio para obtener la primera.</p>
              )}
            </section>

            {locked.length > 0 && (
              <section className="section" aria-labelledby="locked">
                <div className="section__head"><h2 id="locked" className="t-h3">Por desbloquear · {locked.length}</h2></div>
                <ul className="achgrid">{locked.map((b) => <Achievement key={b.id} badge={b} />)}</ul>
              </section>
            )}
          </>
        )
      }}
    </QueryView>
  )
}
