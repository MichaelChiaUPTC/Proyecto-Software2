import { useNavigate } from 'react-router-dom'
import { LogOut, Monitor, Moon, RotateCcw, Settings, Sun } from 'lucide-react'
import { Avatar } from '@/components/ui/Badge'
import { Dropdown } from '@/components/ui/Dropdown'
import { IconButton } from '@/components/ui/Button'
import { useToast } from '@/components/ui/Toast'
import { useAuth } from '@/hooks/useAuth'
import { useTheme } from '@/hooks/useTheme'
import { resetDemoData } from '@/services/stores'
import type { User } from '@/types'

/** Bloque de usuario con el menú de configuración: tema, datos de demostración y cierre de sesión. */
export function UserMenu({ user, variant }: { user: User; variant: 'sidebar' | 'compact' }) {
  const { pref, setPref } = useTheme()
  const { logout } = useAuth()
  const navigate = useNavigate()
  const toast = useToast()

  const entries = [
    { type: 'heading' as const, label: 'Tema' },
    { type: 'item' as const, label: 'Claro', icon: <Sun size={16} aria-hidden />, checked: pref === 'light', onSelect: () => setPref('light') },
    { type: 'item' as const, label: 'Oscuro', icon: <Moon size={16} aria-hidden />, checked: pref === 'dark', onSelect: () => setPref('dark') },
    { type: 'item' as const, label: 'Según el sistema', icon: <Monitor size={16} aria-hidden />, checked: pref === 'system', onSelect: () => setPref('system') },
    { type: 'separator' as const },
    { type: 'item' as const, label: 'Restablecer datos de demostración', icon: <RotateCcw size={16} aria-hidden />, onSelect: () => { resetDemoData(); toast.show({ tone: 'info', title: 'Datos restablecidos' }) } },
    { type: 'item' as const, label: 'Cerrar sesión', icon: <LogOut size={16} aria-hidden />, danger: true, onSelect: async () => { await logout(); navigate('/login') } },
  ]

  if (variant === 'compact') {
    return (
      <Dropdown label="Cuenta y configuración" align="end" entries={entries} trigger={({ props }) => (
        <button className="avatar-btn" aria-label={`Cuenta de ${user.name}`} {...props}><Avatar name={user.name} size="sm" /></button>
      )} />
    )
  }

  return (
    <div className="usercard">
      <Avatar name={user.name} />
      <div className="usercard__who">
        <p className="usercard__name">{user.name}</p>
        <p className="usercard__role">{user.role === 'student' ? 'Estudiante' : 'Docente'}</p>
      </div>
      <Dropdown label="Configuración" align="start" placement="top" entries={entries} trigger={({ props }) => (
        <IconButton label="Configuración" size="sm" {...props}><Settings size={18} aria-hidden /></IconButton>
      )} />
    </div>
  )
}
