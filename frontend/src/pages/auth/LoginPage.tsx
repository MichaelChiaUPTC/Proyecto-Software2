import { useState, type FormEvent } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { ArrowRight, CircleAlert, Eye, EyeOff } from 'lucide-react'
import { Brand } from '@/components/layout/Logo'
import { Button, Input, Tabs } from '@/components/ui'
import { HighlightedLines } from '@/components/learning/CodeBlock'
import { useAuth } from '@/hooks/useAuth'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { isApiMode } from '@/services/api'
import { homeFor } from '@/utils/format'

const SAMPLE = `def es_par(n):
    if n % 2 == 0:
        return True
    else:
        return False`

type Mode = 'login' | 'register'
type Errors = { name?: string; email?: string; password?: string; confirm?: string; form?: string }

function validate(mode: Mode, f: { name: string; email: string; password: string; confirm: string }): Errors {
  const e: Errors = {}
  if (mode === 'register' && f.name.trim().length < 2) e.name = 'Escribe tu nombre completo.'
  if (!f.email.trim()) e.email = 'Escribe tu correo institucional.'
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email)) e.email = 'Revisa el formato: nombre@uptc.edu.co.'
  else if (mode === 'register' && !/^[^\s@]+@uptc\.edu\.co$/i.test(f.email.trim())) e.email = 'Solo se permiten correos @uptc.edu.co.'
  if (!f.password) e.password = 'Escribe tu contraseña.'
  else if (mode === 'register' && f.password.length < 8) e.password = 'Usa al menos 8 caracteres.'
  if (mode === 'register' && f.confirm !== f.password) e.confirm = 'Las contraseñas no coinciden.'
  return e
}

export default function LoginPage() {
  const { user, login, register } = useAuth()
  const [mode, setMode] = useState<Mode>('login')
  useDocumentTitle(mode === 'login' ? 'Ingresar' : 'Crear cuenta')
  const navigate = useNavigate()
  const location = useLocation() as { state?: { from?: string } }

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [confirm, setConfirm] = useState('')
  const [password, setPassword] = useState('')
  const [show, setShow] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Errors>({})
  const [forgot, setForgot] = useState(false)

  if (user) return <Navigate to={homeFor(user.role)} replace />

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    const next = validate(mode, { name, email, password, confirm })
    setErrors(next)
    if (Object.keys(next).length) return
    setLoading(true)
    try {
      const u = mode === 'login' ? await login(email, password) : await register(name, email, password)
      navigate(location.state?.from && u.role === 'student' ? location.state.from : homeFor(u.role), { replace: true })
    } catch (err) {
      setErrors({ form: (err as Error).message })
      setLoading(false)
    }
  }

  return (
    <div className="login">
      <div className="login__main">
        <div className="login__brand"><Brand /></div>

        <form className="login__form" onSubmit={submit} noValidate aria-labelledby="login-title">
          <div className="stack" style={{ gap: 'var(--s-2)' }}>
            <h1 id="login-title" className="t-display">Practica un poco cada día.</h1>
            <p className="login__lead">Ejercicios de programación básica con retroalimentación inmediata, para estudiar a tu ritmo entre clase y clase.</p>
          </div>

          {isApiMode && (
            <Tabs label="Acceso" value={mode} onChange={(v) => { setMode(v as Mode); setErrors({}) }} items={[{ id: 'login', label: 'Ingresar' }, { id: 'register', label: 'Crear cuenta' }]} />
          )}

          {errors.form && (
            <p className="form-alert" role="alert"><CircleAlert size={16} aria-hidden /> {errors.form}</p>
          )}

          <div className="stack" style={{ gap: 'var(--s-4)' }}>
            {mode === 'register' && <Input label="Nombre completo" name="name" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} error={errors.name} />}
            <Input label="Correo institucional" type="email" name="email" autoComplete="username" inputMode="email" placeholder="nombre.apellido@uptc.edu.co" value={email} onChange={(e) => setEmail(e.target.value)} error={errors.email} />
            <Input
              label="Contraseña"
              type={show ? 'text' : 'password'}
              name="password"
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              hint={mode === 'register' && !errors.password ? 'Mínimo 8 caracteres.' : undefined}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={errors.password}
              trailing={
                <button type="button" className="icon-btn icon-btn--sm" onClick={() => setShow((s) => !s)} aria-label={show ? 'Ocultar contraseña' : 'Mostrar contraseña'} aria-pressed={show}>
                  {show ? <EyeOff size={17} aria-hidden /> : <Eye size={17} aria-hidden />}
                </button>
              }
            />
            {mode === 'register' && (
              <Input label="Confirmar contraseña" type={show ? 'text' : 'password'} name="confirm" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} error={errors.confirm} />
            )}
          </div>

          <div className="stack" style={{ gap: 'var(--s-4)' }}>
            <Button type="submit" variant="primary" block loading={loading} iconRight={<ArrowRight size={16} aria-hidden />}>
              {loading ? 'Verificando…' : mode === 'login' ? 'Ingresar' : 'Crear cuenta'}
            </Button>
            {mode === 'login' && (
              <div className="login__aux">
                <button type="button" className="link-btn" onClick={() => setForgot((f) => !f)} aria-expanded={forgot}>¿Olvidaste tu contraseña?</button>
              </div>
            )}
            {mode === 'login' && forgot && (
              <p className="login__forgot t-caption" role="note">
                Para restablecerla, escribe a soporte con tu correo institucional. En esta demostración no se envían mensajes.
              </p>
            )}
          </div>
        </form>

        {!isApiMode && (
          <p className="login__demo t-caption">
            Demostración: cualquier correo <span className="mono">@uptc.edu.co</span> con una contraseña de 6 o más caracteres. Si empieza por <span className="mono">docente</span>, entras como docente.
          </p>
        )}
      </div>

      <aside className="login__side" aria-hidden>
        <div className="loginpanel">
          <div className="loginpanel__bar">
            <span className="mono">es_par.py</span>
            <span className="loginpanel__tag">Ejercicio 05 · Par o impar</span>
          </div>
          <pre className="loginpanel__code"><code><HighlightedLines code={SAMPLE} /></code></pre>
          <div className="loginpanel__result">
            <p className="loginpanel__title">Correcto</p>
            <p>Cuando el residuo de dividir entre 2 es 0, el número es par. Este patrón sirve para cualquier divisibilidad.</p>
            <p className="t-caption num">4 de 4 casos de prueba · +10 puntos</p>
          </div>
        </div>
      </aside>
    </div>
  )
}
