import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react'
import { Award, CheckCircle2, Info, TriangleAlert, X } from 'lucide-react'

type Tone = 'info' | 'success' | 'error' | 'badge'
interface ToastItem {
  id: number
  tone: Tone
  title: string
  text?: string
}

interface ToastApi {
  show: (t: Omit<ToastItem, 'id'>) => void
}

const Ctx = createContext<ToastApi | null>(null)
const icons = { info: Info, success: CheckCircle2, error: TriangleAlert, badge: Award }

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([])
  const seq = useRef(0)

  const dismiss = useCallback((id: number) => setItems((l) => l.filter((t) => t.id !== id)), [])
  const show = useCallback(
    (t: Omit<ToastItem, 'id'>) => {
      const id = ++seq.current
      setItems((l) => [...l.slice(-2), { ...t, id }])
      window.setTimeout(() => dismiss(id), t.tone === 'badge' ? 6000 : 4500)
    },
    [dismiss],
  )
  const api = useMemo(() => ({ show }), [show])

  return (
    <Ctx.Provider value={api}>
      {children}
      <div className="toasts" role="region" aria-label="Notificaciones" aria-live="polite">
        {items.map((t) => {
          const Icon = icons[t.tone]
          return (
            <div key={t.id} className={`toast toast--${t.tone}`}>
              <Icon size={18} aria-hidden className="toast__icon" />
              <div className="toast__body">
                <p className="toast__title">{t.title}</p>
                {t.text && <p className="toast__text">{t.text}</p>}
              </div>
              <button className="icon-btn icon-btn--sm" onClick={() => dismiss(t.id)} aria-label="Cerrar notificación">
                <X size={16} aria-hidden />
              </button>
            </div>
          )
        })}
      </div>
    </Ctx.Provider>
  )
}

export function useToast() {
  const v = useContext(Ctx)
  if (!v) throw new Error('useToast debe usarse dentro de ToastProvider')
  return v
}
