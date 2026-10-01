import { PageHeader } from '@/components/layout/PageHeader'
import { QueryView } from '@/components/layout/QueryView'
import { ModuleFeature, ModuleRow } from '@/components/learning/ModuleCard'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { useQuery } from '@/hooks/useQuery'
import { api } from '@/services/api'
import { plural } from '@/utils/format'

export default function ModulesPage() {
  useDocumentTitle('Módulos')
  const q = useQuery(async () => {
    const [mods, home] = await Promise.all([api.catalog.modules(), api.student.home()])
    return { mods, target: home.target }
  })

  return (
    <QueryView query={q} rows={5}>
      {({ mods, target }) => {
        const currentId = target?.module.id
        const current = mods.find((m) => m.module.id === currentId)
        const done = mods.filter((m) => m.status === 'done')
        const rest = mods.filter((m) => m.module.id !== currentId && m.status !== 'done')
        return (
          <>
            <PageHeader title="Módulos" description={`Ocho módulos, del primer programa a las estructuras de datos. Has completado ${done.length}.`} />

            {current && <ModuleFeature data={current} lessonTitle={target?.title} />}

            {rest.length > 0 && (
              <section className="section" aria-labelledby="next-mods">
                <div className="section__head"><h2 id="next-mods" className="t-h3">Siguientes · {plural(rest.length, 'módulo', 'módulos')}</h2></div>
                <ul className="mindex">{rest.map((m) => <ModuleRow key={m.module.id} data={m} />)}</ul>
              </section>
            )}

            {done.length > 0 && (
              <section className="section" aria-labelledby="done-mods">
                <div className="section__head"><h2 id="done-mods" className="t-h3">Completados · {done.length}</h2></div>
                <ul className="mindex mindex--done">{done.map((m) => <ModuleRow key={m.module.id} data={m} />)}</ul>
              </section>
            )}
          </>
        )
      }}
    </QueryView>
  )
}
