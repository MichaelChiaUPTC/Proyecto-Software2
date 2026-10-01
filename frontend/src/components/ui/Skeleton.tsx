import type { CSSProperties } from 'react'

export function Skeleton({ w = '100%', h = 14, r }: { w?: number | string; h?: number | string; r?: number }) {
  const style: CSSProperties = { width: w, height: h, borderRadius: r }
  return <span className="skeleton" style={style} aria-hidden />
}

/** Estructura de carga genérica de una página, con el mismo ritmo vertical que el contenido real. */
export function PageSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="stack" style={{ gap: 'var(--s-5)' }} role="status" aria-label="Cargando contenido">
      <div className="stack" style={{ gap: 'var(--s-3)' }}>
        <Skeleton w={120} h={12} />
        <Skeleton w="55%" h={32} r={8} />
        <Skeleton w="70%" h={14} />
      </div>
      {Array.from({ length: rows }, (_, i) => (
        <Skeleton key={i} h={64} r={12} />
      ))}
    </div>
  )
}
