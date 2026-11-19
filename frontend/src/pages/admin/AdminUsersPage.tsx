import { useMemo, useState, type FormEvent } from 'react'
import { CircleAlert, Search, UserCheck, UserPlus, UserX } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { QueryView } from '@/components/layout/QueryView'
import { Avatar, Badge, Button, DataTable, Input, Modal, Select, useToast, type Column } from '@/components/ui'
import { useAuth } from '@/hooks/useAuth'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { useQuery } from '@/hooks/useQuery'
import { api } from '@/services/api'
import type { Role, User } from '@/types'
import { roleLabel } from '@/utils/format'

const ROLES: Role[] = ['student', 'teacher', 'admin']
const emptyForm = { name: '', email: '', password: '', role: 'student' as Role }
type FormErrors = Partial<Record<'name' | 'email' | 'password' | 'form', string>>

function validate(f: typeof emptyForm): FormErrors {
  const e: FormErrors = {}
  if (f.name.trim().length < 2) e.name = 'Escribe el nombre completo.'
  if (!/^[^\s@]+@uptc\.edu\.co$/i.test(f.email.trim())) e.email = 'Usa un correo @uptc.edu.co.'
  if (f.password.length < 8) e.password = 'Mínimo 8 caracteres.'
  return e
}

export default function AdminUsersPage() {
  useDocumentTitle('Usuarios')
  const q = useQuery(() => api.admin.users())
  const { user: me } = useAuth()
  const toast = useToast()
  const [text, setText] = useState('')
  const [role, setRole] = useState('all')
  const [state, setState] = useState('all')
  const [busy, setBusy] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [errors, setErrors] = useState<FormErrors>({})
  const [saving, setSaving] = useState(false)
  const [confirm, setConfirm] = useState<User | null>(null)

  const rows = useMemo(() => {
    const t = text.trim().toLowerCase()
    return (q.data ?? []).filter((u) =>
      (role === 'all' || u.role === role) &&
      (state === 'all' || (state === 'active' ? u.active : !u.active)) &&
      (!t || u.name.toLowerCase().includes(t) || u.email.toLowerCase().includes(t)),
    )
  }, [q.data, text, role, state])

  const change = async (u: User, changes: { role?: Role; active?: boolean }, done: string) => {
    setBusy(u.id)
    try {
      await api.admin.updateUser(u.id, changes)
      toast.show({ tone: 'success', title: done, text: u.name })
    } catch (e) {
      toast.show({ tone: 'error', title: 'No se pudo guardar el cambio', text: (e as Error).message })
    }
    setBusy(null)
    setConfirm(null)
  }

  const closeCreate = () => setCreating(false)
  const closeConfirm = () => setConfirm(null)

  const openCreate = () => { setForm(emptyForm); setErrors({}); setCreating(true) }

  const create = async (e: FormEvent) => {
    e.preventDefault()
    const errs = validate(form)
    setErrors(errs)
    if (Object.keys(errs).length) return
    setSaving(true)
    try {
      await api.admin.createUser(form)
      toast.show({ tone: 'success', title: 'Usuario creado', text: `${form.name.trim()} · ${roleLabel[form.role]}` })
      setCreating(false)
    } catch (err) {
      setErrors({ form: (err as Error).message })
    }
    setSaving(false)
  }

  const columns: Column<User>[] = [
    {
      key: 'name', header: 'Usuario', sortValue: (u) => u.name,
      render: (u) => (
        <span className="who">
          <Avatar name={u.name} size="sm" />
          <span><span className="who__name">{u.name}</span><span className="t-caption who__mail">{u.email}</span></span>
        </span>
      ),
    },
    {
      key: 'role', header: 'Rol', sortValue: (u) => u.role,
      render: (u) => (
        <Select label={`Rol de ${u.name}`} hideLabel value={u.role} disabled={u.id === me?.id || busy === u.id} onChange={(e) => change(u, { role: e.target.value as Role }, 'Rol actualizado')}>
          {ROLES.map((r) => <option key={r} value={r}>{roleLabel[r]}</option>)}
        </Select>
      ),
    },
    { key: 'state', header: 'Estado', sortValue: (u) => (u.active ? 1 : 0), render: (u) => (u.active ? <Badge tone="ok">Activo</Badge> : <Badge tone="err">Desactivado</Badge>) },
    { key: 'joined', header: 'Registro', sortValue: (u) => u.joinedAt, render: (u) => <span className="muted">{new Date(u.joinedAt).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' })}</span> },
    {
      key: 'actions', header: 'Acciones', align: 'end',
      render: (u) => {
        const self = u.id === me?.id
        return u.active ? (
          <Button size="sm" variant="ghost" iconLeft={<UserX size={15} aria-hidden />} disabled={self || busy === u.id} onClick={() => setConfirm(u)} title={self ? 'No puedes desactivar tu propia cuenta' : undefined} aria-label={`Desactivar a ${u.name}`}>Desactivar</Button>
        ) : (
          <Button size="sm" variant="secondary" iconLeft={<UserCheck size={15} aria-hidden />} loading={busy === u.id} onClick={() => change(u, { active: true }, 'Cuenta reactivada')} aria-label={`Activar a ${u.name}`}>Activar</Button>
        )
      },
    },
  ]

  return (
    <>
      <PageHeader
        title="Usuarios"
        description="Crea cuentas, cambia roles y desactiva a quien ya no deba entrar. Un usuario desactivado pierde el acceso de inmediato."
        actions={<Button variant="primary" iconLeft={<UserPlus size={16} aria-hidden />} onClick={openCreate}>Nuevo usuario</Button>}
      />
      <QueryView query={q} rows={4}>
        {(all) => (
          <>
            <div className="filters" role="search">
              <Input label="Buscar usuario" hideLabel type="search" leading={<Search size={16} />} placeholder="Buscar por nombre o correo" value={text} onChange={(e) => setText(e.target.value)} />
              <Select label="Rol" value={role} onChange={(e) => setRole(e.target.value)}>
                <option value="all">Todos los roles</option>
                {ROLES.map((r) => <option key={r} value={r}>{roleLabel[r]}</option>)}
              </Select>
              <Select label="Estado" value={state} onChange={(e) => setState(e.target.value)}>
                <option value="all">Todos</option>
                <option value="active">Activos</option>
                <option value="inactive">Desactivados</option>
              </Select>
            </div>
            <p className="t-caption" aria-live="polite">{rows.length} de {all.length} usuarios</p>
            <DataTable caption="Usuarios de la plataforma" columns={columns} rows={rows} rowKey={(u) => u.id} initialSort={{ key: 'name', dir: 'asc' }} empty={{ title: 'Ningún usuario coincide', text: 'Prueba con otro nombre o limpia los filtros.' }} />
          </>
        )}
      </QueryView>

      <Modal
        open={creating}
        title="Nuevo usuario"
        description="Solo correos institucionales (@uptc.edu.co)."
        onClose={closeCreate}
        footer={
          <>
            <Button variant="ghost" onClick={closeCreate}>Cancelar</Button>
            <Button type="submit" form="create-user" variant="primary" loading={saving}>Crear usuario</Button>
          </>
        }
      >
        <form id="create-user" className="stack" style={{ gap: 'var(--s-4)' }} onSubmit={create} noValidate>
          {errors.form && <p className="form-alert" role="alert"><CircleAlert size={16} aria-hidden /> {errors.form}</p>}
          <Input label="Nombre completo" name="name" autoComplete="off" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} error={errors.name} />
          <Input label="Correo institucional" type="email" name="email" autoComplete="off" placeholder="nombre.apellido@uptc.edu.co" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} error={errors.email} />
          <Input label="Contraseña inicial" type="password" name="password" autoComplete="new-password" hint="Mínimo 8 caracteres. Compártela por un canal seguro." value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} error={errors.password} />
          <Select label="Rol" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as Role })}>
            {ROLES.map((r) => <option key={r} value={r}>{roleLabel[r]}</option>)}
          </Select>
        </form>
      </Modal>

      <Modal
        open={!!confirm}
        title="Desactivar usuario"
        description={confirm ? `${confirm.name} · ${confirm.email}` : undefined}
        onClose={closeConfirm}
        footer={
          <>
            <Button variant="ghost" onClick={closeConfirm}>Cancelar</Button>
            <Button variant="danger" loading={!!confirm && busy === confirm.id} onClick={() => confirm && change(confirm, { active: false }, 'Cuenta desactivada')}>Desactivar</Button>
          </>
        }
      >
        <p>No podrá iniciar sesión y perderá el acceso de inmediato, aunque tenga la sesión abierta. Su progreso se conserva y puedes reactivarla cuando quieras.</p>
      </Modal>
    </>
  )
}
