import { Navigate, Outlet, useLocation, useMatch } from 'react-router-dom'
import { MobileTabBar, MobileTopBar, Sidebar } from '@/components/layout/Sidebar'
import { useAuth } from '@/hooks/useAuth'
import type { Role } from '@/types'

/**
 * Estructura de aplicación de escritorio: barra lateral + contenido con ancho controlado.
 * En móvil se sustituye por barra superior + barra de pestañas inferior.
 * Las vistas de trabajo (lección, ejercicio) ceden la barra inferior para ganar espacio.
 */
export function AppLayout({ role }: { role: Role }) {
  const { user } = useAuth()
  const location = useLocation()
  const focusLesson = useMatch('/lecciones/:id')
  const focusExercise = useMatch('/ejercicios/:id')
  const focusTeacherEditor = useMatch('/docente/ejercicios/:id')

  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />
  if (user.role !== role) return <Navigate to={user.role === 'student' ? '/' : '/docente'} replace />

  const workspace = !!focusExercise
  const hideTabs = !!(focusLesson || focusExercise || focusTeacherEditor)

  return (
    <div className="shell">
      <a href="#contenido" className="skip">Saltar al contenido</a>
      <Sidebar user={user} />
      <MobileTopBar user={user} />
      <main id="contenido" className={workspace ? 'main main--workspace' : 'main'} tabIndex={-1}>
        <div key={location.pathname} className={workspace ? 'page page--wide page-enter' : 'page page-enter'}>
          <Outlet />
        </div>
      </main>
      {!hideTabs && <MobileTabBar user={user} />}
    </div>
  )
}
