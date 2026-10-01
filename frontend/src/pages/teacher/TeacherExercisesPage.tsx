import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Pencil, Plus, Search } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { QueryView } from '@/components/layout/QueryView'
import { Badge, ButtonLink, DataTable, Input, Select, type Column } from '@/components/ui'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { useQuery } from '@/hooks/useQuery'
import { api } from '@/services/api'
import type { Exercise, Module } from '@/types'
import { difficultyLabel } from '@/utils/format'

type Row = { exercise: Exercise; module: Module }

export default function TeacherExercisesPage() {
  useDocumentTitle('Gestión de ejercicios')
  const q = useQuery(() => api.teacher.content())
  const [text, setText] = useState('')
  const [mod, setMod] = useState('all')
  const [state, setState] = useState('all')

  const rows: Row[] = useMemo(() => {
    if (!q.data) return []
    const t = text.trim().toLowerCase()
    return q.data.exercises
      .map((exercise) => ({ exercise, module: q.data!.modules.find((m) => m.id === exercise.moduleId)! }))
      .filter((r) => (mod === 'all' || r.module.id === mod) && (state === 'all' || (state === 'pub' ? r.exercise.published : !r.exercise.published)) && (!t || r.exercise.title.toLowerCase().includes(t)))
      .sort((a, b) => a.module.order - b.module.order || a.exercise.order - b.exercise.order)
  }, [q.data, text, mod, state])

  const columns: Column<Row>[] = [
    { key: 'title', header: 'Ejercicio', sortValue: (r) => r.exercise.title, render: (r) => <Link to={`/docente/ejercicios/${r.exercise.id}`} className="cell-link">{r.exercise.title}</Link> },
    { key: 'module', header: 'Módulo', sortValue: (r) => r.module.order, render: (r) => <span className="muted"><span className="mono num">{r.module.code}</span> · {r.module.title}</span> },
    { key: 'difficulty', header: 'Dificultad', render: (r) => <Badge>{difficultyLabel[r.exercise.difficulty]}</Badge> },
    { key: 'tests', header: 'Casos', align: 'end', sortValue: (r) => r.exercise.tests.length, render: (r) => <span className="num">{r.exercise.tests.length}</span> },
    { key: 'state', header: 'Estado', render: (r) => <Badge tone={r.exercise.published ? 'ok' : 'neutral'}>{r.exercise.published ? 'Publicado' : 'Borrador'}</Badge> },
    { key: 'edit', header: 'Acciones', align: 'end', render: (r) => <Link to={`/docente/ejercicios/${r.exercise.id}`} className="btn btn--ghost btn--sm"><Pencil size={15} aria-hidden /><span>Editar</span></Link> },
  ]

  return (
    <>
      <PageHeader title="Ejercicios" description="Crea y ajusta los ejercicios con sus casos de prueba y pistas." actions={<ButtonLink to="/docente/ejercicios/nuevo" variant="primary" iconLeft={<Plus size={16} aria-hidden />}>Nuevo ejercicio</ButtonLink>} />
      <QueryView query={q} rows={4}>
        {({ modules }) => (
          <>
            <div className="filters" role="search">
              <Input label="Buscar ejercicio" hideLabel type="search" leading={<Search size={16} />} placeholder="Buscar por título" value={text} onChange={(e) => setText(e.target.value)} />
              <Select label="Módulo" value={mod} onChange={(e) => setMod(e.target.value)}>
                <option value="all">Todos los módulos</option>
                {modules.map((m) => <option key={m.id} value={m.id}>{m.code} · {m.title}</option>)}
              </Select>
              <Select label="Estado" value={state} onChange={(e) => setState(e.target.value)}>
                <option value="all">Todos</option>
                <option value="pub">Publicados</option>
                <option value="draft">Borradores</option>
              </Select>
            </div>
            <DataTable caption="Ejercicios del curso" columns={columns} rows={rows} rowKey={(r) => r.exercise.id} empty={{ title: 'No hay ejercicios con estos filtros', text: 'Quita algún filtro o crea un ejercicio nuevo.' }} />
          </>
        )}
      </QueryView>
    </>
  )
}
