import { useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Lightbulb, Play, RotateCcw } from 'lucide-react'
import { QueryView } from '@/components/layout/QueryView'
import { Breadcrumb } from '@/components/layout/Breadcrumb'
import { CodeEditor } from '@/components/exercises/CodeEditor'
import { ExerciseFeedback } from '@/components/exercises/ExerciseFeedback'
import { TestList } from '@/components/exercises/TestList'
import { CodeBlock } from '@/components/learning/CodeBlock'
import { ActivityList } from '@/components/progress/ActivityList'
import { Badge, Button, Tabs, useToast } from '@/components/ui'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { useQuery } from '@/hooks/useQuery'
import { api } from '@/services/api'
import type { Exercise, SubmitResult, SubmitStatus } from '@/types'
import { difficultyLabel } from '@/utils/format'

const draftKey = (id: string) => `logica.draft.${id}`
const loadDraft = (e: Exercise) => {
  try { return localStorage.getItem(draftKey(e.id)) ?? e.starter } catch { return e.starter }
}

export default function ExercisePage() {
  const { id = '' } = useParams()
  const q = useQuery(() => api.catalog.exercise(id), [id])
  useDocumentTitle(q.data?.exercise.title)

  return (
    <QueryView query={q} rows={3}>
      {(d) => <Workspace key={d.exercise.id} data={d} />}
    </QueryView>
  )
}

type Data = Awaited<ReturnType<typeof api.catalog.exercise>>

function Workspace({ data }: { data: Data }) {
  const { exercise: ex, module: m, lesson, next, history } = data
  const toast = useToast()
  const [code, setCode] = useState(() => loadDraft(ex))
  const [status, setStatus] = useState<SubmitStatus>('initial')
  const [result, setResult] = useState<SubmitResult | null>(null)
  const [hintsShown, setHintsShown] = useState(0)
  const [pane, setPane] = useState<'statement' | 'code'>('statement')
  const [side, setSide] = useState<'statement' | 'history'>('statement')
  const feedbackRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    try { localStorage.setItem(draftKey(ex.id), code) } catch { /* sin almacenamiento */ }
  }, [code, ex.id])

  const submit = async () => {
    if (status === 'running') return
    setStatus('running')
    try {
      const res = await api.exercises.submit(ex.id, code, hintsShown)
      setResult(res)
      setStatus(res.passed ? 'success' : 'error')
      res.newBadges.forEach((n) => toast.show({ tone: 'badge', title: 'Insignia desbloqueada', text: n }))
    } catch (e) {
      setStatus('initial')
      toast.show({ tone: 'error', title: 'No se pudo enviar', text: (e as Error).message })
    }
    feedbackRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  }

  const askHint = () => {
    const n = Math.min(hintsShown + 1, ex.hints.length)
    setHintsShown(n)
    setStatus('hint')
  }

  const reset = () => {
    setCode(ex.starter)
    setStatus('initial')
    setResult(null)
    toast.show({ tone: 'info', title: 'Editor restablecido' })
  }

  const fn = /def\s+(\w+)/.exec(ex.starter)?.[1] ?? 'solucion'
  const hint = hintsShown > 0 ? { index: hintsShown, total: ex.hints.length, text: ex.hints[hintsShown - 1] } : null
  const errorLine = status === 'error' ? result?.line : undefined

  return (
    <div className="xws">
      <div className="xws__top">
        <Breadcrumb items={[{ label: 'Ejercicios', to: '/ejercicios' }, { label: `Módulo ${m.code}`, to: `/modulos/${m.id}` }, { label: ex.title }]} />
        <Tabs
          className="xws__mobile-tabs"
          label="Vista del ejercicio"
          value={pane}
          onChange={(v) => setPane(v as 'statement' | 'code')}
          items={[{ id: 'statement', label: 'Enunciado' }, { id: 'code', label: 'Código' }]}
        />
      </div>

      <div className="xws__grid" data-pane={pane}>
        {/* Izquierda: enunciado */}
        <section className="xpane xpane--statement" aria-label="Enunciado">
          <div className="xpane__tabs">
            <Tabs label="Contenido del enunciado" value={side} onChange={(v) => setSide(v as 'statement' | 'history')} items={[{ id: 'statement', label: 'Enunciado' }, { id: 'history', label: 'Intentos', badge: history.length ? <span className="tabs__count num">{history.length}</span> : undefined }]} />
          </div>

          {side === 'statement' ? (
            <div className="xpane__scroll statement">
              <header>
                <div className="statement__meta">
                  <Badge>{difficultyLabel[ex.difficulty]}</Badge>
                  {data.solved && <Badge tone="ok">Resuelto</Badge>}
                </div>
                <h1 className="t-h1">{ex.title}</h1>
              </header>
              <p className="statement__text">{ex.statement}</p>

              <div className="statement__block">
                <h2 className="t-h3">Objetivo</h2>
                <p>{ex.goal}</p>
              </div>

              <div className="statement__block">
                <h2 className="t-h3">Ejemplos</h2>
                <CodeBlock code={ex.examples.map((e) => `${e.input}\n# → ${e.expected.replace(/\n/g, ' / ')}`).join('\n\n')} lineNumbers={false} label="Ejemplos de entrada y salida" />
              </div>

              <div className="statement__block">
                <h2 className="t-h3">Restricciones</h2>
                <ul className="bullets">{ex.constraints.map((c) => <li key={c}>{c}</li>)}</ul>
              </div>

              <div className="statement__block">
                <h2 className="t-h3">Pistas</h2>
                {hintsShown === 0 && <p className="t-caption">Intenta primero por tu cuenta. Las pistas se revelan una a una.</p>}
                <ol className="hints">
                  {ex.hints.slice(0, hintsShown).map((h, i) => (
                    <li key={i}><span className="hints__n num">{i + 1}</span><span>{h}</span></li>
                  ))}
                </ol>
                {hintsShown < ex.hints.length && (
                  <Button variant="secondary" size="sm" iconLeft={<Lightbulb size={16} aria-hidden />} onClick={askHint}>
                    Pedir una pista ({hintsShown}/{ex.hints.length})
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <div className="xpane__scroll">
              {history.length ? <ActivityList items={history.map((h) => ({ id: h.id, at: h.at, kind: 'exercise' as const, ok: h.passed, text: h.passed ? 'Solución correcta' : 'Intento sin éxito', detail: h.feedback }))} /> : <p className="t-caption">Todavía no has enviado intentos para este ejercicio.</p>}
            </div>
          )}
        </section>

        {/* Derecha: editor + resultado */}
        <section className="xpane xpane--code" aria-label="Editor de código">
          <div className="ide">
            <div className="ide__bar">
              <span className="ide__file mono">{fn}.py</span>
              <Button variant="ghost" size="sm" iconLeft={<RotateCcw size={15} aria-hidden />} onClick={reset}>Reiniciar</Button>
            </div>
            <CodeEditor value={code} onChange={setCode} onSubmit={submit} label={`Código de la función ${fn}`} errorLine={errorLine} minLines={9} />
            <div className="ide__actions">
              <p className="t-caption ide__hint"><kbd>Ctrl</kbd> + <kbd>Enter</kbd> para enviar · <kbd>Esc</kbd> y luego <kbd>Tab</kbd> para salir del editor</p>
              <Button variant="primary" onClick={submit} loading={status === 'running'} iconLeft={<Play size={15} aria-hidden />}>
                {status === 'running' ? 'Evaluando…' : 'Ejecutar y enviar'}
              </Button>
            </div>
          </div>

          <div ref={feedbackRef} className="xresult">
            <ExerciseFeedback
              status={status}
              result={result}
              hint={hint}
              lessonLink={lesson ? { to: `/lecciones/${lesson.id}`, title: `Repasar «${lesson.title}»` } : null}
              nextLink={next ? { to: next.to, label: next.kind === 'exercise' ? 'Siguiente ejercicio' : 'Siguiente lección' } : { to: `/modulos/${m.id}`, label: 'Volver al módulo' }}
            />
            <div className="xresult__tests">
              <h2 className="t-label">Casos de prueba</h2>
              <TestList tests={ex.tests} result={status === 'success' || status === 'error' ? result : null} />
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
