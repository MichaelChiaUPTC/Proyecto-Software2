import request from 'supertest'
import { beforeEach, describe, expect, it } from 'vitest'
import { app, CLAVE, crearUsuario, limpiarUsuarios, tokenDe } from './helpers.js'

const auth = (t: string) => ({ Authorization: `Bearer ${t}` })
let admin: string

async function idDe(correo: string): Promise<number> {
  const lista = await request(app).get('/api/admin/users').set(auth(admin))
  return lista.body.users.find((u: { email: string }) => u.email === correo).id
}

beforeEach(async () => {
  await limpiarUsuarios()
  await crearUsuario('admin@uptc.edu.co', 'admin')
  await crearUsuario('est@uptc.edu.co', 'student')
  await crearUsuario('doc@uptc.edu.co', 'teacher')
  admin = await tokenDe('admin@uptc.edu.co')
})

describe('control de acceso por rol', () => {
  it('sin token responde 401', async () => {
    expect((await request(app).get('/api/admin/users')).status).toBe(401)
  })

  it.each(['est@uptc.edu.co', 'doc@uptc.edu.co'])('%s recibe 403 en todas las rutas de admin', async (correo) => {
    const h = auth(await tokenDe(correo))
    const lista = await request(app).get('/api/admin/users').set(h)
    expect(lista.status).toBe(403)
    expect(lista.body.error.code).toBe('ACCESO_DENEGADO')
    expect((await request(app).post('/api/admin/users').set(h).send({})).status).toBe(403)
    expect((await request(app).patch('/api/admin/users/1').set(h).send({ active: false })).status).toBe(403)
  })
})

describe('/api/admin/users', () => {
  it('lista los usuarios', async () => {
    const r = await request(app).get('/api/admin/users').set(auth(admin))
    expect(r.status).toBe(200)
    expect(r.body.users).toHaveLength(3)
    expect(r.body.users[0]).not.toHaveProperty('hashContrasena')
  })

  it('crea un usuario con rol y este puede iniciar sesión', async () => {
    const nuevo = { name: 'Nuevo Docente', email: 'nuevo@uptc.edu.co', password: CLAVE, role: 'teacher' }
    const r = await request(app).post('/api/admin/users').set(auth(admin)).send(nuevo)
    expect(r.status).toBe(201)
    expect(r.body.user).toMatchObject({ email: 'nuevo@uptc.edu.co', role: 'teacher', active: true })
    expect(await tokenDe('nuevo@uptc.edu.co')).toBeTypeOf('string')
  })

  it('valida los datos al crear', async () => {
    const base = { name: 'X Y', email: 'x@uptc.edu.co', password: CLAVE, role: 'student' }
    const crear = (cuerpo: object) => request(app).post('/api/admin/users').set(auth(admin)).send(cuerpo)
    expect((await crear({ ...base, role: 'root' })).status).toBe(400)
    expect((await crear({ ...base, email: 'x@gmail.com' })).body.error.code).toBe('CORREO_NO_INSTITUCIONAL')
    expect((await crear({ ...base, email: 'est@uptc.edu.co' })).status).toBe(409)
  })

  it('desactivar es inmediato: el token vigente deja de servir y no puede volver a entrar', async () => {
    const est = await tokenDe('est@uptc.edu.co')
    const id = await idDe('est@uptc.edu.co')
    const r = await request(app).patch(`/api/admin/users/${id}`).set(auth(admin)).send({ active: false })
    expect(r.status).toBe(200)
    expect(r.body.user.active).toBe(false)
    expect((await request(app).get('/api/auth/me').set(auth(est))).status).toBe(403)
    expect((await request(app).post('/api/auth/login').send({ email: 'est@uptc.edu.co', password: CLAVE })).status).toBe(403)
  })

  it('el cambio de rol se aplica en el siguiente login', async () => {
    const id = await idDe('est@uptc.edu.co')
    const viejo = await tokenDe('est@uptc.edu.co')
    const r = await request(app).patch(`/api/admin/users/${id}`).set(auth(admin)).send({ role: 'admin' })
    expect(r.body.user.role).toBe('admin')
    expect((await request(app).get('/api/admin/users').set(auth(viejo))).status).toBe(403)
    expect((await request(app).get('/api/admin/users').set(auth(await tokenDe('est@uptc.edu.co')))).status).toBe(200)
  })

  it('valida el PATCH: id, cuerpo vacío, rol inválido y usuario inexistente', async () => {
    const h = auth(admin)
    expect((await request(app).patch('/api/admin/users/abc').set(h).send({ active: false })).status).toBe(400)
    expect((await request(app).patch('/api/admin/users/2').set(h).send({})).status).toBe(400)
    expect((await request(app).patch('/api/admin/users/2').set(h).send({ role: 'root' })).status).toBe(400)
    const r = await request(app).patch('/api/admin/users/9999').set(h).send({ active: false })
    expect(r.status).toBe(404)
    expect(r.body.error.code).toBe('USUARIO_NO_ENCONTRADO')
  })

  it('un admin no puede desactivarse ni quitarse el rol a sí mismo', async () => {
    const id = await idDe('admin@uptc.edu.co')
    const a = await request(app).patch(`/api/admin/users/${id}`).set(auth(admin)).send({ active: false })
    expect(a.status).toBe(400)
    expect(a.body.error.code).toBe('AUTOMODIFICACION_NO_PERMITIDA')
    expect((await request(app).patch(`/api/admin/users/${id}`).set(auth(admin)).send({ role: 'student' })).status).toBe(400)
  })
})
