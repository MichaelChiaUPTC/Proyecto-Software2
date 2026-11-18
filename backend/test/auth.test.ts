import request from 'supertest'
import { beforeEach, describe, expect, it } from 'vitest'
import { createApp } from '../src/app.js'
import { app, CLAVE, crearUsuario, limpiarUsuarios, pool, tokenDe } from './helpers.js'

beforeEach(limpiarUsuarios)

describe('GET /api/health', () => {
  it('responde 200 con el estado de la BD', async () => {
    const r = await request(app).get('/api/health')
    expect(r.status).toBe(200)
    expect(r.body).toEqual({ status: 'ok', db: 'up' })
  })
})

describe('POST /api/auth/register', () => {
  const valido = { name: 'Ana Pérez', email: 'Ana@uptc.edu.co', password: CLAVE }

  it('registra un estudiante y devuelve token', async () => {
    const r = await request(app).post('/api/auth/register').send(valido)
    expect(r.status).toBe(201)
    expect(r.body.token).toBeTypeOf('string')
    expect(r.body.user).toMatchObject({ name: 'Ana Pérez', email: 'ana@uptc.edu.co', role: 'student', active: true })
    expect(r.body.user).not.toHaveProperty('hashContrasena')
  })

  it('no permite elegir el rol', async () => {
    const r = await request(app).post('/api/auth/register').send({ ...valido, role: 'admin' })
    expect(r.body.user.role).toBe('student')
  })

  it('rechaza correos fuera de @uptc.edu.co', async () => {
    const r = await request(app).post('/api/auth/register').send({ ...valido, email: 'ana@gmail.com' })
    expect(r.status).toBe(400)
    expect(r.body.error.code).toBe('CORREO_NO_INSTITUCIONAL')
  })

  it('rechaza contraseñas cortas con mensaje en español', async () => {
    const r = await request(app).post('/api/auth/register').send({ ...valido, password: '1234567' })
    expect(r.status).toBe(400)
    expect(r.body.error).toEqual({ code: 'DATOS_INVALIDOS', message: 'La contraseña debe tener al menos 8 caracteres.' })
  })

  it('rechaza cuerpos incompletos y JSON roto', async () => {
    expect((await request(app).post('/api/auth/register').send({})).status).toBe(400)
    const r = await request(app).post('/api/auth/register').set('Content-Type', 'application/json').send('{no es json')
    expect(r.status).toBe(400)
    expect(r.body.error.code).toBe('JSON_INVALIDO')
  })

  it('rechaza correos duplicados (sin importar mayúsculas)', async () => {
    await request(app).post('/api/auth/register').send(valido)
    const r = await request(app).post('/api/auth/register').send({ ...valido, email: 'ANA@uptc.edu.co' })
    expect(r.status).toBe(409)
    expect(r.body.error.code).toBe('CORREO_EXISTENTE')
  })

  it('guarda la contraseña con bcrypt, no en claro', async () => {
    await request(app).post('/api/auth/register').send(valido)
    const [rows] = await pool.query('SELECT hash_contrasena FROM usuario')
    expect((rows as { hash_contrasena: string }[])[0].hash_contrasena).toMatch(/^\$2[aby]\$/)
  })
})

describe('POST /api/auth/login', () => {
  beforeEach(async () => {
    await crearUsuario('ana@uptc.edu.co')
    await crearUsuario('baja@uptc.edu.co', 'student', false)
  })

  it('inicia sesión con credenciales correctas', async () => {
    const r = await request(app).post('/api/auth/login').send({ email: 'ANA@uptc.edu.co', password: CLAVE })
    expect(r.status).toBe(200)
    expect(r.body.token).toBeTypeOf('string')
    expect(r.body.user.email).toBe('ana@uptc.edu.co')
  })

  it('rechaza contraseña incorrecta y correo inexistente con el mismo mensaje', async () => {
    const a = await request(app).post('/api/auth/login').send({ email: 'ana@uptc.edu.co', password: 'incorrecta1' })
    const b = await request(app).post('/api/auth/login').send({ email: 'nadie@uptc.edu.co', password: CLAVE })
    expect(a.status).toBe(401)
    expect(b.status).toBe(401)
    expect(a.body).toEqual(b.body)
    expect(a.body.error.code).toBe('CREDENCIALES_INVALIDAS')
  })

  it('no deja entrar a un usuario inactivo', async () => {
    const r = await request(app).post('/api/auth/login').send({ email: 'baja@uptc.edu.co', password: CLAVE })
    expect(r.status).toBe(403)
    expect(r.body.error.code).toBe('USUARIO_INACTIVO')
  })

  it('limita los intentos fallidos', async () => {
    const limitada = createApp(pool, { loginLimit: 2 })
    const mal = () => request(limitada).post('/api/auth/login').send({ email: 'ana@uptc.edu.co', password: 'incorrecta1' })
    expect((await mal()).status).toBe(401)
    expect((await mal()).status).toBe(401)
    const r = await mal()
    expect(r.status).toBe(429)
    expect(r.body.error.code).toBe('DEMASIADOS_INTENTOS')
  })
})

describe('GET /api/auth/me', () => {
  it('devuelve el perfil con token válido', async () => {
    await crearUsuario('ana@uptc.edu.co', 'teacher')
    const r = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${await tokenDe('ana@uptc.edu.co')}`)
    expect(r.status).toBe(200)
    expect(r.body.user).toMatchObject({ email: 'ana@uptc.edu.co', role: 'teacher' })
  })

  it('exige token válido', async () => {
    expect((await request(app).get('/api/auth/me')).status).toBe(401)
    const r = await request(app).get('/api/auth/me').set('Authorization', 'Bearer basura')
    expect(r.status).toBe(401)
    expect(r.body.error.code).toBe('NO_AUTENTICADO')
  })

  it('un usuario desactivado pierde el acceso de inmediato, aunque su token siga vigente', async () => {
    await crearUsuario('ana@uptc.edu.co')
    const token = await tokenDe('ana@uptc.edu.co')
    await pool.query("UPDATE usuario SET activo = FALSE WHERE correo = 'ana@uptc.edu.co'")
    const r = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${token}`)
    expect(r.status).toBe(403)
    expect(r.body.error.code).toBe('USUARIO_INACTIVO')
  })
})

describe('rutas desconocidas', () => {
  it('devuelven 404 con el formato de error', async () => {
    const r = await request(app).get('/api/nada')
    expect(r.status).toBe(404)
    expect(r.body.error.code).toBe('NO_ENCONTRADO')
  })
})
