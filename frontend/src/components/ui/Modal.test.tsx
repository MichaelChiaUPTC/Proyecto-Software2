import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Modal } from './Modal'

describe('Modal', () => {
  it('no pinta nada cerrado y, abierto, es un diálogo modal etiquetado por su título', () => {
    const { rerender } = render(<Modal open={false} title="Nuevo" onClose={() => {}}>x</Modal>)
    expect(screen.queryByRole('dialog')).toBeNull()
    rerender(<Modal open title="Nuevo usuario" description="Datos básicos" onClose={() => {}}>x</Modal>)
    expect(screen.getByRole('dialog', { name: 'Nuevo usuario' })).toHaveAttribute('aria-modal', 'true')
  })

  it('al abrir, el foco va al primer campo; Escape y el botón «Cerrar» llaman a onClose', async () => {
    const onClose = vi.fn()
    const user = userEvent.setup()
    render(<Modal open title="T" onClose={onClose}><input aria-label="Nombre" /></Modal>)
    expect(screen.getByLabelText('Nombre')).toHaveFocus()
    await user.keyboard('{Escape}')
    await user.click(screen.getByRole('button', { name: 'Cerrar' }))
    expect(onClose).toHaveBeenCalledTimes(2)
  })

  it('el foco queda atrapado: Tab desde el último elemento vuelve al primero, y Shift+Tab al revés', async () => {
    const user = userEvent.setup()
    render(<Modal open title="T" onClose={() => {}} footer={<button>Guardar</button>}><input aria-label="Nombre" /></Modal>)
    const guardar = screen.getByRole('button', { name: 'Guardar' })
    const cerrar = screen.getByRole('button', { name: 'Cerrar' })
    guardar.focus()
    await user.tab()
    expect(cerrar).toHaveFocus()
    await user.tab({ shift: true })
    expect(guardar).toHaveFocus()
  })

  it('regresión: escribir (re-renderizar con un onClose nuevo) no devuelve el foco al primer campo', async () => {
    const user = userEvent.setup()
    function Host() {
      const [a, setA] = useState('')
      const [b, setB] = useState('')
      return (
        <Modal open title="T" onClose={() => setA('')}>
          <input aria-label="A" value={a} onChange={(e) => setA(e.target.value)} />
          <input aria-label="B" value={b} onChange={(e) => setB(e.target.value)} />
        </Modal>
      )
    }
    render(<Host />)
    await user.click(screen.getByLabelText('B'))
    await user.keyboard('hola')
    expect(screen.getByLabelText('B')).toHaveValue('hola')
    expect(screen.getByLabelText('B')).toHaveFocus()
  })

  it('al cerrar devuelve el foco al elemento que lo abrió y restaura el scroll', async () => {
    const user = userEvent.setup()
    function Host() {
      const [open, setOpen] = useState(false)
      return (
        <>
          <button onClick={() => setOpen(true)}>Abrir</button>
          <Modal open={open} title="T" onClose={() => setOpen(false)}><input aria-label="Nombre" /></Modal>
        </>
      )
    }
    render(<Host />)
    const abrir = screen.getByRole('button', { name: 'Abrir' })
    await user.click(abrir)
    expect(document.body.style.overflow).toBe('hidden')
    await user.keyboard('{Escape}')
    expect(abrir).toHaveFocus()
    expect(document.body.style.overflow).toBe('')
  })
})
