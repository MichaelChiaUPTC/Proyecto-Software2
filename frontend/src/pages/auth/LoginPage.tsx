import { useState, type FormEvent } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { ArrowRight, CircleAlert, Eye, EyeOff } from 'lucide-react'
import { Brand } from '@/components/layout/Logo'
import { Button, Input } from '@/components/ui'
import { HighlightedLines } from '@/components/learning/CodeBlock'
import { useAuth } from '@/hooks/useAuth'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'

const SAMPLE = `def es_par(n):
    if n % 2 == 0:
        return True
    else:
        return False`

export default function LoginPage() {
  useDocumentTitle('Ingresar')
  const { user, login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation() as { state?: { from?: string } }

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [show, setShow] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<{ email?: string; password?: string; form?: string }>({})
  const [forgot, setForgot] = useState(false)

  if (user) return <Navigate to={user.role === 'student' ? '/' : '/docente'} replace />

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    const next: typeof errors = {}
    if (!email.trim()) next.email = 'Escribe tu correo institucional.'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) next.email = 'Revisa el formato: nombre@uptc.edu.co.'
    if (!password) next.password = 'Escribe tu contraseña.'
    setErrors(next)
    if (Object.keys(next).length) return
    setLoading(true)
    try {
      const u = await login(email, password)
      navigate(location.state?.from && u.role === 'student' ? location.state.from : u.role === 'student' ? '/' : '/docente', { replace: true })
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

          {errors.form && (
            <p className="form-alert" role="alert"><CircleAlert size={16} aria-hidden /> {errors.form}</p>
          )}

          <div className="stack" style={{ gap: 'var(--s-4)' }}>
            <Input label="Correo institucional" type="email" name="email" autoComplete="username" inputMode="email" placeholder="nombre.apellido@uptc.edu.co" value={email} onChange={(e) => setEmail(e.target.value)} error={errors.email} />
            <Input
              label="Contraseña"
              type={show ? 'text' : 'password'}
              name="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={errors.password}
              trailing={
                <button type="button" className="icon-btn icon-btn--sm" onClick={() => setShow((s) => !s)} aria-label={show ? 'Ocultar contraseña' : 'Mostrar contraseña'} aria-pressed={show}>
                  {show ? <EyeOff size={17} aria-hidden /> : <Eye size={17} aria-hidden />}
                </button>
              }
            />
          </div>

          <div className="stack" style={{ gap: 'var(--s-4)' }}>
            <Button type="submit" variant="primary" block loading={loading} iconRight={<ArrowRight size={16} aria-hidden />}>
              {loading ? 'Verificando…' : 'Ingresar'}
            </Button>
            <div className="login__aux">
              <button type="button" className="link-btn" onClick={() => setForgot((f) => !f)} aria-expanded={forgot}>¿Olvidaste tu contraseña?</button>
            </div>
            {forgot && (
              <p className="login__forgot t-caption" role="note">
                Para restablecerla, escribe a soporte con tu correo institucional. En esta demostración no se envían mensajes.
              </p>
            )}
          </div>
        </form>

        <p className="login__demo t-caption">
          Demostración: cualquier correo <span className="mono">@uptc.edu.co</span> con una contraseña de 6 o más caracteres. Si empieza por <span className="mono">docente</span>, entras como docente.
        </p>
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
