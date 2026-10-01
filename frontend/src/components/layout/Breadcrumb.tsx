import { Fragment } from 'react'
import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'

export interface Crumb {
  label: string
  to?: string
}

export function Breadcrumb({ items }: { items: Crumb[] }) {
  return (
    <nav aria-label="Ruta de navegación" className="crumbs">
      <ol>
        {items.map((c, i) => (
          <Fragment key={i}>
            <li>
              {c.to && i < items.length - 1 ? <Link to={c.to}>{c.label}</Link> : <span aria-current={i === items.length - 1 ? 'page' : undefined}>{c.label}</span>}
            </li>
            {i < items.length - 1 && (
              <li aria-hidden className="crumbs__sep">
                <ChevronRight size={14} />
              </li>
            )}
          </Fragment>
        ))}
      </ol>
    </nav>
  )
}
