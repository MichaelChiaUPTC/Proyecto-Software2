import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Check } from 'lucide-react'
import { QueryView } from '@/components/layout/QueryView'
import { Breadcrumb } from '@/components/layout/Breadcrumb'
import { LessonContent, lessonHeadings } from '@/components/learning/LessonContent'
import { Button, ButtonLink, ProgressBar, useToast } from '@/components/ui'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { useQuery } from '@/hooks/useQuery'
import { api } from '@/services/api'

function useActiveHeading(ids: string[]) {
  const [active, setActive] = useState(ids[0] ?? '')
  useEffect(() => {
    if (ids.length === 0) return
    const obs = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0]
        if (visible) setActive(visible.target.id)
      },
      { rootMargin: '-10% 0px -70% 0px' },
    )
    ids.forEach((id) => {
      const el = document.getElementById(id)
      if (el) obs.observe(el)
    })
    return () => obs.disconnect()
  }, [ids.join('|')]) // eslint-disable-line react-hooks/exhaustive-deps
  return active
}

export default function LessonPage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const toast = useToast()
  const q = useQuery(() => api.catalog.lesson(id), [id])
  const [busy, setBusy] = useState(false)
  useDocumentTitle(q.data?.lesson.title)

  const headings = q.data ? lessonHeadings(q.data.lesson.blocks) : []
  const active = useActiveHeading(headings.map((h) => h.id))

  useEffect(() => { window.scrollTo({ top: 0 }) }, [id])

  const proceed = async () => {
    if (!q.data) return
    setBusy(true)
    const res = await api.student.completeLesson(q.data.lesson.id)
    res.newBadges.forEach((n) => toast.show({ tone: 'badge', title: 'Insignia desbloqueada', text: n }))
    setBusy(false)
    navigate(res.next ? res.next.to : `/modulos/${q.data.module.id}`)
  }

  return (
    <QueryView query={q} rows={4}>
      {(d) => {
        const { lesson, module: m } = d
        return (
          <div className="lesson">
            <div className="lesson__article">
              <Breadcrumb items={[{ label: 'Módulos', to: '/modulos' }, { label: `Módulo ${m.code}`, to: `/modulos/${m.id}` }, { label: lesson.title }]} />
              <header className="lesson__head">
                <p className="t-caption">Lección {lesson.order} · {lesson.minutes} min de lectura{d.done && <> · <span className="done-tag"><Check size={13} strokeWidth={2.5} aria-hidden /> Completada</span></>}</p>
                <h1 className="t-display">{lesson.title}</h1>
              </header>

              <details className="toc-mobile">
                <summary>En esta lección</summary>
                <ul>{headings.map((h) => <li key={h.id}><a href={`#${h.id}`}>{h.text}</a></li>)}</ul>
              </details>

              <LessonContent blocks={lesson.blocks} />

              <nav className="lesson__nav" aria-label="Navegación de la lección">
                {d.prev ? (
                  <ButtonLink to={d.prev.to} variant="secondary" iconLeft={<ArrowLeft size={16} aria-hidden />}>Anterior</ButtonLink>
                ) : <span />}
                <Button variant="primary" onClick={proceed} loading={busy} iconRight={<ArrowRight size={16} aria-hidden />}>
                  {d.next ? (d.next.kind === 'exercise' ? 'Continuar al ejercicio' : 'Continuar') : 'Terminar módulo'}
                </Button>
              </nav>
            </div>

            <aside className="lesson__aside" aria-label="Índice y progreso">
              <div className="lesson__sticky">
                <p className="t-label">En esta lección</p>
                <ul className="toc">
                  {headings.map((h) => (
                    <li key={h.id}>
                      <a href={`#${h.id}`} aria-current={active === h.id ? 'true' : undefined} className="toc__link">{h.text}</a>
                    </li>
                  ))}
                </ul>
                <div className="lesson__progress">
                  <p className="t-caption num">Paso {d.position} de {d.total} del módulo</p>
                  <ProgressBar value={(d.position / d.total) * 100} label="Posición en el módulo" size="sm" tone="ink" />
                  <Link to={`/modulos/${m.id}`} className="t-caption">Ver ruta del módulo</Link>
                </div>
              </div>
            </aside>
          </div>
        )
      }}
    </QueryView>
  )
}
