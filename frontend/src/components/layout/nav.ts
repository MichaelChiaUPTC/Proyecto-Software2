import { Award, BarChart3, BookOpen, FolderTree, House, LayoutDashboard, Table2, TerminalSquare, User, FilePenLine, type LucideIcon } from 'lucide-react'
import type { Role } from '@/types'

export interface NavItem {
  to: string
  label: string
  icon: LucideIcon
  end?: boolean
}

export const navByRole: Record<Role, NavItem[][]> = {
  student: [
    [
      { to: '/', label: 'Inicio', icon: House, end: true },
      { to: '/modulos', label: 'Módulos', icon: BookOpen },
      { to: '/ejercicios', label: 'Ejercicios', icon: TerminalSquare },
    ],
    [
      { to: '/progreso', label: 'Progreso', icon: BarChart3 },
      { to: '/insignias', label: 'Insignias', icon: Award },
      { to: '/perfil', label: 'Perfil', icon: User },
    ],
  ],
  teacher: [
    [
      { to: '/docente', label: 'Panel', icon: LayoutDashboard, end: true },
      { to: '/docente/contenido', label: 'Contenido', icon: FolderTree },
      { to: '/docente/ejercicios', label: 'Ejercicios', icon: FilePenLine },
    ],
    [{ to: '/docente/reportes', label: 'Reportes', icon: Table2 }],
  ],
}

/** Destinos de la barra inferior en móvil (máx. 5). */
export const mobileNav: Record<Role, NavItem[]> = {
  student: [
    { to: '/', label: 'Inicio', icon: House, end: true },
    { to: '/modulos', label: 'Módulos', icon: BookOpen },
    { to: '/ejercicios', label: 'Práctica', icon: TerminalSquare },
    { to: '/progreso', label: 'Progreso', icon: BarChart3 },
    { to: '/perfil', label: 'Perfil', icon: User },
  ],
  teacher: [
    { to: '/docente', label: 'Panel', icon: LayoutDashboard, end: true },
    { to: '/docente/contenido', label: 'Contenido', icon: FolderTree },
    { to: '/docente/ejercicios', label: 'Ejercicios', icon: FilePenLine },
    { to: '/docente/reportes', label: 'Reportes', icon: Table2 },
  ],
}
