import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { ExerciseFeedback, type AiHintState } from './ExerciseFeedback'
import type { SubmitResult } from '@/types'

const failed: SubmitResult = { passed: false, title: 'Hay un problema', message: 'Falta el return.', concept: 'Retorno de valores', testsPassed: 1, testsTotal: 3, failedTests: [1, 2], newBadges: [], pointsGained: 0 }
const passed: SubmitResult = { ...failed, passed: true, title: 'Correcto', message: 'Muy bien.', testsPassed: 3, failedTests: [], pointsGained: 10 }

const setup = (props: Partial<Parameters<typeof ExerciseFeedback>[0]> = {}) =>
  render(<MemoryRouter><ExerciseFeedback status="error" result={failed} {...props} /></MemoryRouter>)

const idle: AiHintState = { status: 'idle' }

describe('ExerciseFeedback', () => {
  it('es una región aria-live y, de inicio, invita a escribir', () => {
    render(<MemoryRouter><ExerciseFeedback status="initial" result={null} /></MemoryRouter>)
    expect(screen.getByRole('status')).toHaveAttribute('aria-live', 'polite')
    expect(screen.getByText('Escribe tu solución…')).toBeInTheDocument()
  })

  it('un fallo explica el problema y el concepto a revisar, con enlace a la lección', () => {
    setup({ lessonLink: { to: '/lecciones/3', title: 'Funciones' } })
    expect(screen.getByText('Falta el return.')).toBeInTheDocument()
    expect(screen.getByText('Retorno de valores')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Funciones' })).toHaveAttribute('href', '/lecciones/3')
    expect(screen.getByText('1 de 3 casos de prueba')).toBeInTheDocument()
  })

  it('sin la prop `ai` (modo demostración) no hay botón de IA', () => {
    setup()
    expect(screen.queryByRole('button', { name: /ayuda a la IA/i })).toBeNull()
  })

  it('en modo API ofrece «Pedir ayuda a la IA» y llama a onAsk al pulsar', async () => {
    const onAsk = vi.fn()
    setup({ ai: { state: idle, onAsk } })
    await userEvent.click(screen.getByRole('button', { name: 'Pedir ayuda a la IA' }))
    expect(onAsk).toHaveBeenCalledOnce()
  })

  it('mientras carga, el botón queda deshabilitado y dice «Pensando…»', () => {
    setup({ ai: { state: { status: 'loading' }, onAsk: () => {} } })
    const b = screen.getByRole('button', { name: /Pensando/ })
    expect(b).toBeDisabled()
    expect(b).toHaveAttribute('aria-busy', 'true')
  })

  it('una pista de la IA lleva su etiqueta y el aviso de que puede equivocarse', () => {
    setup({ ai: { state: { status: 'ok', hint: { hint: 'Piensa qué devuelve la función.', source: 'ai' } }, onAsk: () => {} } })
    expect(screen.getByText('Pista de la IA')).toBeInTheDocument()
    expect(screen.getByText('Piensa qué devuelve la función.')).toBeInTheDocument()
    expect(screen.getByText(/puede equivocarse/)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /ayuda a la IA/i })).toBeNull()
  })

  it('la pista de respaldo se rotula como «del curso»', () => {
    setup({ ai: { state: { status: 'ok', hint: { hint: 'Repasa la lección.', source: 'fallback' } }, onAsk: () => {} } })
    expect(screen.getByText('Pista del curso')).toBeInTheDocument()
    expect(screen.getByText(/La IA no estuvo disponible/)).toBeInTheDocument()
  })

  it('un error al pedir la pista se anuncia con role=alert y permite reintentar', () => {
    setup({ ai: { state: { status: 'error', message: 'Llegaste al límite diario.' }, onAsk: () => {} } })
    expect(screen.getByRole('alert')).toHaveTextContent('Llegaste al límite diario.')
    expect(screen.getByRole('button', { name: 'Pedir ayuda a la IA' })).toBeEnabled()
  })

  it('un acierto muestra puntos y el botón al siguiente paso, sin ayuda de IA', () => {
    render(<MemoryRouter><ExerciseFeedback status="success" result={passed} nextLink={{ to: '/ejercicios/4', label: 'Siguiente ejercicio' }} ai={{ state: idle, onAsk: () => {} }} /></MemoryRouter>)
    expect(screen.getByText('Correcto')).toBeInTheDocument()
    expect(screen.getByText('+10 puntos')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Siguiente ejercicio/ })).toHaveAttribute('href', '/ejercicios/4')
    expect(screen.queryByRole('button', { name: /ayuda a la IA/i })).toBeNull()
  })

  it('una pista fija numerada', () => {
    render(<MemoryRouter><ExerciseFeedback status="hint" result={null} hint={{ index: 2, total: 3, text: 'Usa un if.' }} /></MemoryRouter>)
    expect(screen.getByText('Pista 2 de 3')).toBeInTheDocument()
  })
})
