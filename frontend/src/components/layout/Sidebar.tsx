import { Fragment } from 'react'
import { NavLink } from 'react-router-dom'
import type { User } from '@/types'
import { Brand } from './Logo'
import { UserMenu } from './UserMenu'
import { mobileNav, navByRole } from './nav'

export function Sidebar({ user }: { user: User }) {
  const groups = navByRole[user.role]
  return (
    <aside className="sidebar" aria-label="Barra lateral">
      <div className="sidebar__brand">
        <NavLink to={user.role === 'student' ? '/' : '/docente'} aria-label="lógica UPTC, ir al inicio"><Brand /></NavLink>
      </div>
      <nav className="sidebar__nav" aria-label="Navegación principal">
        {groups.map((g, gi) => (
          <Fragment key={gi}>
            {gi > 0 && <hr className="sidebar__sep" />}
            <ul>
              {g.map(({ to, label, icon: Icon, end }) => (
                <li key={to}>
                  <NavLink to={to} end={end} className="navlink">
                    <Icon size={18} aria-hidden />
                    <span>{label}</span>
                  </NavLink>
                </li>
              ))}
            </ul>
          </Fragment>
        ))}
      </nav>
      <div className="sidebar__foot">
        <UserMenu user={user} variant="sidebar" />
      </div>
    </aside>
  )
}

export function MobileTopBar({ user }: { user: User }) {
  return (
    <header className="topbar">
      <Brand />
      <UserMenu user={user} variant="compact" />
    </header>
  )
}

export function MobileTabBar({ user }: { user: User }) {
  return (
    <nav className="tabbar" aria-label="Navegación principal">
      {mobileNav[user.role].map(({ to, label, icon: Icon, end }) => (
        <NavLink key={to} to={to} end={end} className="tabbar__link">
          <Icon size={20} aria-hidden />
          <span>{label}</span>
        </NavLink>
      ))}
    </nav>
  )
}
