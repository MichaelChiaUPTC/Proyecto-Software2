import type { FlowStep } from '@/types'

/**
 * Diagrama de flujo vertical dibujado con SVG. Cada decisión muestra sus dos salidas con texto
 * ("Sí" / "No"), no solo con color.
 */
export function FlowDiagram({ steps, caption }: { steps: FlowStep[]; caption?: string }) {
  const W = 420
  const cx = 150
  const rowH = 96
  const H = steps.length * rowH + 20

  return (
    <figure className="flow">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Diagrama de flujo: ${steps.map((s) => s.label).join(' → ')}`} className="flow__svg">
        <defs>
          <marker id="flow-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M0 1 L9 5 L0 9" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </marker>
        </defs>
        {steps.map((s, i) => {
          const y = 14 + i * rowH
          const next = i < steps.length - 1
          return (
            <g key={i}>
              {s.kind === 'decision' ? (
                <>
                  <polygon points={`${cx},${y} ${cx + 100},${y + 30} ${cx},${y + 60} ${cx - 100},${y + 30}`} className="flow__shape flow__shape--decision" />
                  <text x={cx} y={y + 34} textAnchor="middle" className="flow__text mono">{s.label}</text>
                  {s.yes && (
                    <>
                      <line x1={cx + 100} y1={y + 30} x2={cx + 150} y2={y + 30} className="flow__line" markerEnd="url(#flow-arrow)" />
                      <text x={cx + 106} y={y + 22} className="flow__tag">Sí</text>
                      <text x={cx + 156} y={y + 34} className="flow__side">{s.yes}</text>
                    </>
                  )}
                  {s.no && next && (
                    <text x={cx + 8} y={y + 76} className="flow__tag">No · {s.no}</text>
                  )}
                </>
              ) : (
                <>
                  <rect x={cx - 70} y={y + 8} width={140} height={44} rx={s.kind === 'action' ? 6 : 22} className={`flow__shape flow__shape--${s.kind}`} />
                  <text x={cx} y={y + 35} textAnchor="middle" className="flow__text">{s.label}</text>
                </>
              )}
              {next && <line x1={cx} y1={y + (s.kind === 'decision' ? 60 : 52)} x2={cx} y2={y + rowH + (steps[i + 1].kind === 'decision' ? 0 : 8) - 2} className="flow__line" markerEnd="url(#flow-arrow)" />}
            </g>
          )
        })}
      </svg>
      {caption && <figcaption className="t-caption">{caption}</figcaption>}
    </figure>
  )
}
