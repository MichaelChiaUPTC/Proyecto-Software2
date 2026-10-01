import { useState, type FormEvent } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { Check, Circle, Plus, Trash2 } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { QueryView } from '@/components/layout/QueryView'
import { CodeEditor } from '@/components/exercises/CodeEditor'
import { Button, Card, IconButton, Input, Select, Textarea, useToast } from '@/components/ui'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { useQuery } from '@/hooks/useQuery'
import { api } from '@/services/api'
import type { Difficulty, Exercise, Lesson, Module, TestCase } from '@/types'

interface Form {
  title: string
  moduleId: string
  lessonId: string
  difficulty: Difficulty
  published: boolean
  statement: string
  goal: string
  expectedAnswer: string
  tests: TestCase[]
  hints: string[]
}

type Errors = Partial<Record<'title' | 'moduleId' | 'lessonId' | 'statement' | 'expectedAnswer' | 'tests', string>>

const slug = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 24)

export default function ExerciseEditorPage() {
  const { id } = useParams()
  const q = useQuery(() => api.teacher.content())
  useDocumentTitle(id ? 'Editar ejercicio' : 'Nuevo ejercicio')

  return (
    <QueryView query={q} rows={4}>
      {(c) => {
        const existing = id ? c.exercises.find((e) => e.id === id) : undefined
        if (id && !existing) return <p role="alert">No encontramos ese ejercicio.</p>
        return <EditorForm key={existing?.id ?? 'new'} existing={existing} modules={c.modules} lessons={c.lessons} allExercises={c.exercises} />
      }}
    </QueryView>
  )
}

function EditorForm({ existing, modules, lessons, allExercises }: { existing?: Exercise; modules: Module[]; lessons: Lesson[]; allExercises: Exercise[] }) {
  const navigate = useNavigate()
  const toast = useToast()
  const [params] = useSearchParams()

  const [f, setF] = useState<Form>(() =>
    existing
      ? { title: existing.title, moduleId: existing.moduleId, lessonId: existing.lessonId, difficulty: existing.difficulty, published: existing.published, statement: existing.statement, goal: existing.goal, expectedAnswer: existing.expectedAnswer, tests: existing.tests, hints: existing.hints }
      : { title: '', moduleId: params.get('modulo') ?? '', lessonId: '', difficulty: 'basic', published: false, statement: '', goal: '', expectedAnswer: 'def solucion(x):\n    # Escribe la respuesta esperada\n    return x\n', tests: [{ input: '', expected: '' }], hints: [''] },
  )
  const [errors, setErrors] = useState<Errors>({})
  const [saving, setSaving] = useState(false)
  const set = <K extends keyof Form>(k: K, v: Form[K]) => setF((p) => ({ ...p, [k]: v }))

  const moduleLessons = lessons.filter((l) => l.moduleId === f.moduleId).sort((a, b) => a.order - b.order)
  const validTests = f.tests.filter((t) => t.input.trim() && t.expected.trim())

  const checks = [
    { ok: !!f.title.trim() && !!f.statement.trim(), label: 'Título y enunciado completos' },
    { ok: !!f.moduleId && !!f.lessonId, label: 'Módulo y lección asignados' },
    { ok: validTests.length > 0, label: 'Al menos un caso de prueba válido' },
    { ok: f.expectedAnswer.includes('def ') && f.expectedAnswer.includes('return'), label: 'Respuesta esperada con función y return' },
  ]
  const ready = checks.every((c) => c.ok)

  const validate = (): Errors => {
    const e: Errors = {}
    if (!f.title.trim()) e.title = 'Escribe un título claro, por ejemplo «Par o impar».'
    if (!f.moduleId) e.moduleId = 'Elige el módulo al que pertenece.'
    if (!f.lessonId) e.lessonId = 'Elige la lección con la que se relaciona.'
    if (!f.statement.trim()) e.statement = 'El enunciado es obligatorio.'
    if (!f.expectedAnswer.trim()) e.expectedAnswer = 'Incluye la respuesta esperada.'
    if (f.published && validTests.length === 0) e.tests = 'Para publicar, define al menos un caso de prueba con entrada y resultado.'
    return e
  }

  const save = async (e: FormEvent) => {
    e.preventDefault()
    const errs = validate()
    setErrors(errs)
    if (Object.keys(errs).length) { toast.show({ tone: 'error', title: 'Revisa el formulario', text: 'Hay campos por completar.' }); return }
    setSaving(true)
    const sig = /def\s+\w+\s*\([^)]*\)\s*:/.exec(f.expectedAnswer)?.[0] ?? 'def solucion():'
    const order = existing?.order ?? Math.max(0, ...allExercises.filter((x) => x.moduleId === f.moduleId).map((x) => x.order)) + 1
    const ex: Exercise = {
      id: existing?.id ?? `${f.moduleId}-${slug(f.title) || 'nuevo'}-${Date.now().toString(36)}`,
      moduleId: f.moduleId, lessonId: f.lessonId, order,
      title: f.title.trim(), statement: f.statement.trim(), goal: f.goal.trim() || 'Resolver el problema planteado.',
      difficulty: f.difficulty, published: f.published,
      examples: validTests.slice(0, 2), constraints: existing?.constraints ?? ['Respeta el nombre de la función.'],
      hints: f.hints.map((h) => h.trim()).filter(Boolean),
      starter: existing?.starter ?? `${sig}\n    # Escribe tu solución aquí\n    pass\n`,
      expectedAnswer: f.expectedAnswer, tests: validTests, rules: existing?.rules ?? [],
      successNote: existing?.successNote ?? 'Tu solución cumple los casos de prueba.',
    }
    await api.teacher.saveExercise(ex)
    toast.show({ tone: 'success', title: existing ? 'Ejercicio actualizado' : 'Ejercicio creado', text: ex.published ? 'Visible para los estudiantes.' : 'Guardado como borrador.' })
    navigate('/docente/ejercicios')
  }

  return (
    <form onSubmit={save} noValidate>
      <PageHeader
        title={existing ? 'Editar ejercicio' : 'Nuevo ejercicio'}
        crumbs={[{ label: 'Ejercicios', to: '/docente/ejercicios' }, { label: existing ? existing.title : 'Nuevo' }]}
        description="Define el problema, la respuesta esperada y cómo se valida. Los estudiantes verán el enunciado, los ejemplos y las pistas."
      />

      <div className="eform">
        <div className="eform__main">
          <fieldset className="fset">
            <legend className="t-h3">Datos generales</legend>
            <Input label="Título" value={f.title} onChange={(e) => set('title', e.target.value)} error={errors.title} placeholder="Par o impar" />
            <div className="grid-2">
              <Select label="Módulo" value={f.moduleId} onChange={(e) => { set('moduleId', e.target.value); set('lessonId', '') }} error={errors.moduleId}>
                <option value="">Elige un módulo…</option>
                {modules.map((m) => <option key={m.id} value={m.id}>{m.code} · {m.title}</option>)}
              </Select>
              <Select label="Lección relacionada" value={f.lessonId} onChange={(e) => set('lessonId', e.target.value)} disabled={!f.moduleId} error={errors.lessonId} hint={!f.moduleId ? 'Primero elige el módulo.' : undefined}>
                <option value="">Elige una lección…</option>
                {moduleLessons.map((l) => <option key={l.id} value={l.id}>{l.order}. {l.title}</option>)}
              </Select>
            </div>
            <div className="grid-2">
              <Select label="Dificultad" value={f.difficulty} onChange={(e) => set('difficulty', e.target.value as Difficulty)}>
                <option value="basic">Básico</option>
                <option value="medium">Intermedio</option>
                <option value="advanced">Avanzado</option>
              </Select>
              <Select label="Estado" value={f.published ? 'pub' : 'draft'} onChange={(e) => set('published', e.target.value === 'pub')}>
                <option value="draft">Borrador</option>
                <option value="pub">Publicado</option>
              </Select>
            </div>
          </fieldset>

          <fieldset className="fset">
            <legend className="t-h3">Enunciado</legend>
            <Textarea label="Descripción del problema" rows={4} value={f.statement} onChange={(e) => set('statement', e.target.value)} error={errors.statement} placeholder="Escribe la función es_par(n) que devuelva True si n es par…" />
            <Input label="Objetivo de aprendizaje" value={f.goal} onChange={(e) => set('goal', e.target.value)} hint="Una frase: qué concepto practica el estudiante." />
          </fieldset>

          <fieldset className="fset">
            <legend className="t-h3">Respuesta esperada</legend>
            <div className="eform__code">
              <CodeEditor value={f.expectedAnswer} onChange={(v) => set('expectedAnswer', v)} label="Respuesta esperada en Python" minLines={6} />
            </div>
            {errors.expectedAnswer && <p className="field__msg field__msg--error" role="alert">{errors.expectedAnswer}</p>}
          </fieldset>

          <fieldset className="fset">
            <legend className="t-h3">Casos de prueba</legend>
            <ul className="rows">
              {f.tests.map((t, i) => (
                <li key={i} className="rows__item rows__item--tests">
                  <Input label={`Entrada del caso ${i + 1}`} hideLabel placeholder="es_par(4)" className="mono" value={t.input} onChange={(e) => set('tests', f.tests.map((x, j) => (j === i ? { ...x, input: e.target.value } : x)))} />
                  <span aria-hidden className="rows__arrow">→</span>
                  <Input label={`Resultado esperado del caso ${i + 1}`} hideLabel placeholder="True" className="mono" value={t.expected} onChange={(e) => set('tests', f.tests.map((x, j) => (j === i ? { ...x, expected: e.target.value } : x)))} />
                  <IconButton label={`Quitar caso ${i + 1}`} size="sm" disabled={f.tests.length === 1} onClick={() => set('tests', f.tests.filter((_, j) => j !== i))}><Trash2 size={16} aria-hidden /></IconButton>
                </li>
              ))}
            </ul>
            {errors.tests && <p className="field__msg field__msg--error" role="alert">{errors.tests}</p>}
            <Button size="sm" variant="secondary" iconLeft={<Plus size={15} aria-hidden />} onClick={() => set('tests', [...f.tests, { input: '', expected: '' }])}>Agregar caso</Button>
          </fieldset>

          <fieldset className="fset">
            <legend className="t-h3">Pistas</legend>
            <p className="t-caption">De la más general a la más concreta. El estudiante las ve una por una.</p>
            <ul className="rows">
              {f.hints.map((h, i) => (
                <li key={i} className="rows__item">
                  <Input label={`Pista ${i + 1}`} hideLabel placeholder={`Pista ${i + 1}`} value={h} onChange={(e) => set('hints', f.hints.map((x, j) => (j === i ? e.target.value : x)))} />
                  <IconButton label={`Quitar pista ${i + 1}`} size="sm" disabled={f.hints.length === 1} onClick={() => set('hints', f.hints.filter((_, j) => j !== i))}><Trash2 size={16} aria-hidden /></IconButton>
                </li>
              ))}
            </ul>
            <Button size="sm" variant="secondary" iconLeft={<Plus size={15} aria-hidden />} onClick={() => set('hints', [...f.hints, ''])}>Agregar pista</Button>
          </fieldset>
        </div>

        <aside className="eform__aside">
          <Card pad="md" className="eform__sticky" aria-labelledby="ready-title">
            <h2 id="ready-title" className="t-h3">Antes de publicar</h2>
            <ul className="checklist">
              {checks.map((c) => (
                <li key={c.label} className={c.ok ? 'is-ok' : undefined}>
                  {c.ok ? <Check size={15} strokeWidth={2.5} aria-hidden /> : <Circle size={15} aria-hidden />}
                  <span>{c.label}<span className="sr-only">{c.ok ? ' (listo)' : ' (pendiente)'}</span></span>
                </li>
              ))}
            </ul>
            <div className="stack" style={{ gap: 'var(--s-2)' }}>
              <Button type="submit" variant="primary" block loading={saving}>{existing ? 'Guardar cambios' : 'Crear ejercicio'}</Button>
              <Button variant="ghost" block onClick={() => navigate('/docente/ejercicios')}>Cancelar</Button>
            </div>
            {!ready && <p className="t-caption">Puedes guardar como borrador aunque falten cosas. Para publicar, completa la lista.</p>}
          </Card>
        </aside>
      </div>
    </form>
  )
}
