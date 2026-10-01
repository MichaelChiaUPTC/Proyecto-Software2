import type { ReactNode } from 'react'

export function EmptyState({ icon, title, text, action }: { icon?: ReactNode; title: string; text?: string; action?: ReactNode }) {
  return (
    <div className="empty">
      {icon && <div className="empty__icon" aria-hidden>{icon}</div>}
      <p className="t-h3">{title}</p>
      {text && <p className="t-caption empty__text">{text}</p>}
      {action}
    </div>
  )
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="empty" role="alert">
      <p className="t-h3">No pudimos cargar esta vista</p>
      <p className="t-caption empty__text">{message}</p>
      {onRetry && <button className="btn btn--secondary btn--md" onClick={onRetry}>Reintentar</button>}
    </div>
  )
}
