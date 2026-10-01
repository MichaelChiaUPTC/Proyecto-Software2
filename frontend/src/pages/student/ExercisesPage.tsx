import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Check, Search } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { QueryView } from '@/components/layout/QueryView'
import { Badge, EmptyState, Input, Select } from '@/components/ui'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { useQuery } from '@/hooks/useQuery'
import { api } from '@/services/api'
import { difficultyLabel } from '@/utils/format'

export default function ExercisesPage() {
  useDocumentTitle('Ejercicios')
  const q = useQuery(() => api.catalog.exercises())
  const [text, setText] = useState('')
  const [state, setState] = useState('all')
  const [mod, setMod] = useState('all')

  const filtered = useMemo(() => {
    const t = text.trim().toLowerCase()
    return (q.data ?? []).filter((r) =>
      (state === 'all' || (state === 'solved' ? r.solved : !r.solved)) &&
      (mod === 'all' || r.module.id === mod) &&
      (!t || r.exercise.title.toLowerCase().includes(t) || r.exercise.statement.toLowerCase().includes(t)),
    )
  }, [q.data, text, state, mod])

  return (
    <>
      <PageHeader title="Ejercicios" description="Todos los ejercicios publicados, ordenados por módulo. Empieza por los pendientes." />
      <QueryView query={q} rows={5}>
        {(rows) => {
          const modules = [...new Map(rows.map((r) => [r.module.id, r.module])).values()]
          const pending = rows.filter((r) => !r.solved).length
          return (
            <>
              <div className="filters" role="search">
                <Input label="Buscar ejercicio" hideLabel type="search" placeholder="Buscar por título o enunciado" leading={<Search size={16} />} value={text} onChange={(e) => setText(e.target.value)} />
                <Select label="Estado" value={state} onChange={(e) => setState(e.target.value)}>
                  <option value="all">Todos ({rows.length})</option>
                  <option value="pending">Pendientes ({pending})</option>
                  <option value="solved">Resueltos ({rows.length - pending})</option>
                </Select>
                <Select label="Módulo" value={mod} onChange={(e) => setMod(e.target.value)}>
                  <option value="all">Todos los módulos</option>
                  {modules.map((m) => <option key={m.id} value={m.id}>{m.code} · {m.title}</option>)}
                </Select>
              </div>

              {filtered.length === 0 ? (
                <EmptyState title="Ningún ejercicio coincide" text="Prueba con otra palabra o quita algún filtro." />
              ) : (
                <ul className="exlist" aria-live="polite">
                  {filtered.map((r) => (
                    <li key={r.exercise.id}>
                      <Link to={`/ejercicios/${r.exercise.id}`} className="exrow">
                        <span className={r.solved ? 'exrow__mark exrow__mark--done' : 'exrow__mark'} aria-hidden>{r.solved && <Check size={12} strokeWidth={3} />}</span>
                        <span className="exrow__main">
                          <span className="exrow__title">{r.exercise.title}</span>
                          <span className="t-caption">Módulo {r.module.code} · {r.module.title}</span>
                        </span>
                        <span className="exrow__side">
                          <Badge>{difficultyLabel[r.exercise.difficulty]}</Badge>
                          {r.solved ? <Badge tone="ok">Resuelto</Badge> : r.attempts > 0 ? <Badge tone="accent">{r.attempts} {r.attempts === 1 ? 'intento' : 'intentos'}</Badge> : <span className="t-caption">Sin intentos</span>}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )
        }}
      </QueryView>
    </>
  )
}
