import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import type { Pool } from 'mysql2/promise'
import { z } from 'zod'
import { config } from '../../../shared/config.js'
import { AdminService } from '../application/admin-service.js'
import { AuthService } from '../application/auth-service.js'
import { ROLES } from '../domain/usuario.js'
import { crearRequireAuth, requireRole } from './auth-middleware.js'
import { MysqlUsuarioRepo } from './mysql-usuario-repo.js'
import { BcryptHasher, JwtTokens } from './seguridad.js'

const nombre = z.string({ error: 'El nombre es obligatorio.' }).trim().min(2, 'El nombre es demasiado corto.').max(100, 'El nombre es demasiado largo.')
const correo = z.string({ error: 'El correo es obligatorio.' }).trim().max(120, 'El correo es demasiado largo.').pipe(z.email('El correo no es válido.'))
const contrasena = z.string({ error: 'La contraseña es obligatoria.' }).min(8, 'La contraseña debe tener al menos 8 caracteres.').max(72, 'La contraseña es demasiado larga.')
const rol = z.enum(ROLES, { error: 'Rol inválido.' })
const idParam = z.coerce.number({ error: 'Identificador inválido.' }).int('Identificador inválido.').positive('Identificador inválido.')

const registroSchema = z.object({ name: nombre, email: correo, password: contrasena })
const loginSchema = z.object({ email: z.string({ error: 'El correo es obligatorio.' }), password: z.string({ error: 'La contraseña es obligatoria.' }).min(1) })
const crearSchema = z.object({ name: nombre, email: correo, password: contrasena, role: rol })
const cambiosSchema = z
  .object({ role: rol.optional(), active: z.boolean({ error: 'El estado activo debe ser verdadero o falso.' }).optional() })
  .refine((c) => c.role !== undefined || c.active !== undefined, { error: 'Indica el rol o el estado activo.' })

export function usuariosRouter(pool: Pool, opts: { loginLimit?: number } = {}): Router {
  const repo = new MysqlUsuarioRepo(pool)
  const hasher = new BcryptHasher(config.BCRYPT_COST)
  const tokens = new JwtTokens(config.JWT_SECRET, config.JWT_EXPIRES_IN)
  const auth = new AuthService(repo, hasher, tokens)
  const admin = new AdminService(repo, hasher)
  const requireAuth = crearRequireAuth(tokens, repo)

  // Solo cuentan los intentos fallidos.
  const limiteLogin = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: opts.loginLimit ?? config.LOGIN_RATE_LIMIT_MAX,
    skipSuccessfulRequests: true,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    handler: (_req, res) => {
      res.status(429).json({ error: { code: 'DEMASIADOS_INTENTOS', message: 'Demasiados intentos fallidos. Intenta de nuevo en unos minutos.' } })
    },
  })

  const router = Router()

  router.post('/auth/register', async (req, res) => {
    const b = registroSchema.parse(req.body)
    res.status(201).json(await auth.registrar({ nombre: b.name, correo: b.email, contrasena: b.password }))
  })
  router.post('/auth/login', limiteLogin, async (req, res) => {
    const b = loginSchema.parse(req.body)
    res.json(await auth.iniciarSesion(b.email, b.password))
  })
  router.get('/auth/me', requireAuth, async (req, res) => {
    res.json({ user: await auth.perfil(req.usuario!.id) })
  })

  const soloAdmin = [requireAuth, requireRole('admin')]
  router.get('/admin/users', ...soloAdmin, async (_req, res) => {
    res.json({ users: await admin.listar() })
  })
  router.post('/admin/users', ...soloAdmin, async (req, res) => {
    const b = crearSchema.parse(req.body)
    res.status(201).json({ user: await admin.crear({ nombre: b.name, correo: b.email, contrasena: b.password, rol: b.role }) })
  })
  router.patch('/admin/users/:id', ...soloAdmin, async (req, res) => {
    const id = idParam.parse(req.params.id)
    const c = cambiosSchema.parse(req.body)
    res.json({ user: await admin.actualizar(req.usuario!.id, id, { rol: c.role, activo: c.active }) })
  })

  return router
}
