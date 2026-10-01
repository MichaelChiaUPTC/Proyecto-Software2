import type { ReactNode } from 'react'
import { Breadcrumb, type Crumb } from './Breadcrumb'

interface PageHeaderProps {
  title: string
  description?: ReactNode
  crumbs?: Crumb[]
  actions?: ReactNode
}

export function PageHeader({ title, description, crumbs, actions }: PageHeaderProps) {
  return (
    <header className="pagehead">
      {crumbs && <Breadcrumb items={crumbs} />}
      <div className="pagehead__row">
        <div className="pagehead__text">
          <h1 className="t-h1">{title}</h1>
          {description && <p className="pagehead__desc">{description}</p>}
        </div>
        {actions && <div className="pagehead__actions">{actions}</div>}
      </div>
    </header>
  )
}
