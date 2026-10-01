import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { ArrowDown, ArrowUp, ChevronRight, Eye, EyeOff, Pencil, Plus, TerminalSquare } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { QueryView } from '@/components/layout/QueryView'
import { Badge, Button, ButtonLink, IconButton, Input, Modal, Textarea, Tooltip, useToast } from '@/components/ui'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { useQuery } from '@/hooks/useQuery'
import { api } from '@/services/api'
import { cx, difficultyLabel } from '@/utils/format'

type Kind = 'module' | 'lesson' | 'exercise'
type Edit =
  | { kind: 'module'; id?: string; title: string; summary: string }
  | { kind: 'lesson'; id?: string; moduleId: string; title: string; minutes: number }

function Controls({ kind, id, published, first, last, name, onEdit }: { kind: Kind; id: string; published: boolean; first: boolean; last: boolean; name: string; onEdit?: () => void }) {
  const toast = useToast()
  const toggle = async () => {
    await api.teacher.togglePublish(kind, id)
    toast.show({ tone: 'success', title: published ? 'Despublicado' : 'Publicado', text: name })
  }
  return (
    <div className="ctl">
      <Tooltip text="Subir"><IconButton label={`Subir ${name}`} size="sm" disabled={first} onClick={() => api.teacher.move(kind, id, -1)}><ArrowUp size={16} aria-hidden /></IconButton></Tooltip>
      <Tooltip text="Bajar"><IconButton label={`Bajar ${name}`} size="sm" disabled={last} onClick={() => api.teacher.move(kind, id, 1)}><ArrowDown size={16} aria-hidden /></IconButton></Tooltip>
      {kind === 'exercise' ? (
        <Tooltip text="Editar"><Link to={`/docente/ejercicios/${id}`} className="icon-btn icon-btn--sm" aria-label={`Editar ${name}`}><Pencil size={16} aria-hidden /></Link></Tooltip>
      ) : (
        <Tooltip text="Editar"><IconButton label={`Editar ${name}`} size="sm" onClick={onEdit}><Pencil size={16} aria-hidden /></IconButton></Tooltip>
      )}
      <Button size="sm" variant={published ? 'ghost' : 'secondary'} onClick={toggle} iconLeft={published ? <EyeOff size={15} aria-hidden /> : <Eye size={15} aria-hidden />}>
        {published ? 'Despublicar' : 'Publicar'}
      </Button>
    </div>
  )
}

export default function ContentPage() {
  useDocumentTitle('Gestión de contenido')
  const q = useQuery(() => api.teacher.content())
  const toast = useToast()
  const [open, setOpen] = useState<Record<string, boolean>>({ m05: true })
  const [edit, setEdit] = useState<Edit | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const save = async (e: FormEvent) => {
    e.preventDefault()
    if (!edit) return
    if (!edit.title.trim()) { setError('El título es obligatorio.'); return }
    setSaving(true)
    if (edit.kind === 'module') await api.teacher.saveModule({ id: edit.id, title: edit.title.trim(), summary: edit.summary.trim() })
    else await api.teacher.saveLesson({ id: edit.id, moduleId: edit.moduleId, title: edit.title.trim(), minutes: Math.max(1, edit.minutes) })
    setSaving(false)
    toast.show({ tone: 'success', title: edit.id ? 'Cambios guardados' : 'Creado como borrador', text: edit.title })
    setEdit(null)
    setError('')
  }

  return (
    <>
      <PageHeader
        title="Gestión de contenido"
        description="Módulos → lecciones → ejercicios. Lo que no está publicado no lo ven los estudiantes."
        actions={<Button variant="primary" iconLeft={<Plus size={16} aria-hidden />} onClick={() => { setError(''); setEdit({ kind: 'module', title: '', summary: '' }) }}>Nuevo módulo</Button>}
      />
      <QueryView query={q} rows={4}>
        {({ modules, lessons, exercises }) => (
          <ul className="ctree">
            {modules.map((m, mi) => {
              const ls = lessons.filter((l) => l.moduleId === m.id).sort((a, b) => a.order - b.order)
              const es = exercises.filter((x) => x.moduleId === m.id).sort((a, b) => a.order - b.order)
              const isOpen = !!open[m.id]
              return (
                <li key={m.id} className="ctree__module">
                  <div className="ctree__row ctree__row--module">
                    <button className="ctree__toggle" aria-expanded={isOpen} aria-controls={`c-${m.id}`} onClick={() => setOpen((o) => ({ ...o, [m.id]: !o[m.id] }))}>
                      <ChevronRight size={16} aria-hidden className={cx('chev', isOpen && 'chev--open')} />
                      <span className="mono muted num">{m.code}</span>
                      <span className="ctree__title">{m.title}</span>
                      <span className="t-caption">{ls.length} lecc. · {es.length} ejerc.</span>
                    </button>
                    <Badge tone={m.published ? 'ok' : 'neutral'}>{m.published ? 'Publicado' : 'Borrador'}</Badge>
                    <Controls kind="module" id={m.id} name={m.title} published={m.published} first={mi === 0} last={mi === modules.length - 1} onEdit={() => { setError(''); setEdit({ kind: 'module', id: m.id, title: m.title, summary: m.summary }) }} />
                  </div>

                  {isOpen && (
                    <div id={`c-${m.id}`} className="ctree__children">
                      {ls.map((l, li) => (
                        <div key={l.id}>
                          <div className="ctree__row">
                            <span className="ctree__title ctree__title--lesson">{l.title}<span className="t-caption"> · {l.minutes} min</span></span>
                            <Badge tone={l.published ? 'ok' : 'neutral'}>{l.published ? 'Publicada' : 'Borrador'}</Badge>
                            <Controls kind="lesson" id={l.id} name={l.title} published={l.published} first={li === 0} last={li === ls.length - 1} onEdit={() => { setError(''); setEdit({ kind: 'lesson', id: l.id, moduleId: m.id, title: l.title, minutes: l.minutes }) }} />
                          </div>
                          {es.filter((x) => x.lessonId === l.id).map((x) => {
                            const idx = es.indexOf(x)
                            return (
                              <div key={x.id} className="ctree__row ctree__row--exercise">
                                <span className="ctree__title ctree__title--exercise"><TerminalSquare size={14} aria-hidden /> {x.title}<span className="t-caption"> · {difficultyLabel[x.difficulty]}</span></span>
                                <Badge tone={x.published ? 'ok' : 'neutral'}>{x.published ? 'Publicado' : 'Borrador'}</Badge>
                                <Controls kind="exercise" id={x.id} name={x.title} published={x.published} first={idx === 0} last={idx === es.length - 1} />
                              </div>
                            )
                          })}
                        </div>
                      ))}
                      <div className="ctree__add">
                        <Button size="sm" variant="ghost" iconLeft={<Plus size={15} aria-hidden />} onClick={() => { setError(''); setEdit({ kind: 'lesson', moduleId: m.id, title: '', minutes: 8 }) }}>Agregar lección</Button>
                        <ButtonLink size="sm" variant="ghost" to={`/docente/ejercicios/nuevo?modulo=${m.id}`} iconLeft={<Plus size={15} aria-hidden />}>Agregar ejercicio</ButtonLink>
                      </div>
                    </div>
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </QueryView>

      <Modal
        open={!!edit}
        onClose={() => setEdit(null)}
        title={edit ? `${edit.id ? 'Editar' : 'Nuevo'} ${edit.kind === 'module' ? 'módulo' : 'lección'}` : ''}
        description={edit && !edit.id ? 'Se crea como borrador. Publícalo cuando tenga contenido.' : undefined}
        footer={<><Button variant="ghost" onClick={() => setEdit(null)}>Cancelar</Button><Button variant="primary" type="submit" form="content-form" loading={saving}>Guardar</Button></>}
      >
        {edit && (
          <form id="content-form" onSubmit={save} className="stack" style={{ gap: 'var(--s-4)' }} noValidate>
            <Input label="Título" value={edit.title} onChange={(e) => setEdit({ ...edit, title: e.target.value })} error={error} placeholder={edit.kind === 'module' ? 'Ej. Cadenas de texto' : 'Ej. Anidamiento de condicionales'} />
            {edit.kind === 'module' ? (
              <Textarea label="Descripción corta" rows={3} value={edit.summary} onChange={(e) => setEdit({ ...edit, summary: e.target.value })} hint="Una o dos frases que expliquen qué aprenderá el estudiante." />
            ) : (
              <Input label="Duración de lectura (minutos)" type="number" min={1} max={60} value={edit.minutes} onChange={(e) => setEdit({ ...edit, minutes: Number(e.target.value) })} />
            )}
          </form>
        )}
      </Modal>
    </>
  )
}
