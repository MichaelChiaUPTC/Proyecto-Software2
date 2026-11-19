import request from 'supertest'
import { afterAll, beforeEach, describe, expect, it } from 'vitest'
import { createApp } from '../src/app.js'
import { FakeRunner } from '../src/modules/evaluacion/infrastructure/fake-runner.js'
import { arbolPublicado, auth, crearUsuario, ejercicioBase, limpiarProgreso, limpiarUsuarios, pool, tokenDe } from './helpers.js'

const fake = new FakeRunner((code, tests) => tests.map((t) => (code.includes('BIEN') ? { passed: true, actual: t.expected, error: null, timedOut: false } : { passed: false, actual: '0', error: null, timedOut: false })))
const app = createApp(pool, { runner: fake, submitLimit: 1000 })

let est: string
let doc: string
let m1: Awaited<ReturnType<typeof arbolPublicado>>
let m2: Awaited<ReturnType<typeof arbolPublicado>>
const get = (ruta: string, token = est) => request(app).get(ruta).set(auth(token))
const enviar = (id: number, code: string) => request(app).post(`/api/exercises/${id}/submissions`).set(auth(est)).send({ code, hintsUsed: 0 })

beforeEach(async () => {
  await limpiarProgreso()
  await pool.query('DELETE FROM modulo')
  await limpiarUsuarios()
  await crearUsuario('est@uptc.edu.co', 'student')
  await crearUsuario('doc@uptc.edu.co', 'teacher')
  est = await tokenDe('est@uptc.edu.co')
  doc = await tokenDe('doc@uptc.edu.co')
  m1 = await arbolPublicado(doc, 'M1', [ejercicioBase({ title: 'Uno' }), ejercicioBase({ title: 'Dos' })])
  m2 = await arbolPublicado(doc, 'M2', [ejercicioBase({ title: 'Tres' })])
})

afterAll(async () => {
  await limpiarProgreso()
  await pool.query('DELETE FROM modulo')
  await limpiarUsuarios()
})

describe('GET /me/modules', () => {
  it('lista los módulos publicados con porcentaje y estado del estudiante', async () => {
    await enviar(m1.ejercicios[0]!, 'BIEN')
    const r = await get('/api/me/modules')
    expect(r.status).toBe(200)
    expect(r.body.modules).toHaveLength(2)
    expect(r.body.modules[0]).toMatchObject({ module: { id: m1.moduloId, code: 'M1' }, lessons: 1, exercises: 2, pct: 33, status: 'progress' })
    expect(r.body.modules[1]).toMatchObject({ module: { id: m2.moduloId }, pct: 0, status: 'todo' })
  })

  it('no incluye módulos sin publicar y exige rol estudiante', async () => {
    await request(app).post(`/api/teacher/content/modules/${m2.moduloId}/publish`).set(auth(doc))
    expect((await get('/api/me/modules')).body.modules).toHaveLength(1)
    expect((await get('/api/me/modules', doc)).status).toBe(403)
    expect((await request(app).get('/api/me/modules')).status).toBe(401)
  })
})

describe('GET /me/exercises', () => {
  it('lista los ejercicios en orden con solved e intentos, sin solución ni casos ocultos', async () => {
    await enviar(m1.ejercicios[0]!, 'MAL')
    await enviar(m1.ejercicios[0]!, 'BIEN')
    const r = await get('/api/me/exercises')
    expect(r.status).toBe(200)
    const lista = r.body.exercises
    expect(lista.map((x: { exercise: { title: string } }) => x.exercise.title)).toEqual(['Uno', 'Dos', 'Tres'])
    expect(lista[0]).toMatchObject({ solved: true, attempts: 2, module: { code: 'M1' }, exercise: { id: m1.ejercicios[0], statement: 'Suma dos números' } })
    expect(lista[1]).toMatchObject({ solved: false, attempts: 0 })
    expect(lista[0].exercise).not.toHaveProperty('expectedAnswer')
    expect(lista[0].exercise.tests).toHaveLength(1)
  })

  it('exige rol estudiante', async () => {
    expect((await get('/api/me/exercises', doc)).status).toBe(403)
  })
})

describe('GET /me/lessons/:id', () => {
  it('trae la lección con su módulo, posición y vecinos de la ruta', async () => {
    const r = await get(`/api/me/lessons/${m1.leccionId}`)
    expect(r.status).toBe(200)
    expect(r.body).toMatchObject({ lesson: { id: m1.leccionId, blocks: [{ type: 'p', text: 'Hola' }] }, module: { id: m1.moduloId }, done: false, position: 1, total: 3, prev: null })
    expect(r.body.next).toMatchObject({ kind: 'exercise', id: m1.ejercicios[0], to: `/ejercicios/${m1.ejercicios[0]}` })
    await request(app).post(`/api/lessons/${m1.leccionId}/complete`).set(auth(est))
    expect((await get(`/api/me/lessons/${m1.leccionId}`)).body.done).toBe(true)
  })

  it('404 si no existe o no está publicada; 400 si el id es inválido', async () => {
    expect((await get('/api/me/lessons/999999')).status).toBe(404)
    await request(app).post(`/api/teacher/content/lessons/${m2.leccionId}/publish`).set(auth(doc))
    expect((await get(`/api/me/lessons/${m2.leccionId}`)).status).toBe(404)
    expect((await get('/api/me/lessons/abc')).status).toBe(400)
  })
})

describe('GET /me/exercises/:id', () => {
  it('trae ejercicio, módulo, lección, siguiente e historial en una sola petición', async () => {
    const [uno, dos] = m1.ejercicios as [number, number]
    await enviar(uno, 'MAL')
    const r = await get(`/api/me/exercises/${uno}`)
    expect(r.status).toBe(200)
    expect(r.body).toMatchObject({
      exercise: { id: uno, title: 'Uno' }, module: { id: m1.moduloId }, lesson: { id: m1.leccionId }, solved: false, attempts: 1,
      next: { kind: 'exercise', id: dos },
    })
    expect(r.body.exercise).not.toHaveProperty('expectedAnswer')
    expect(r.body.exercise).not.toHaveProperty('rules')
    expect(r.body.history).toHaveLength(1)
    expect(r.body.history[0]).toMatchObject({ exerciseId: uno, passed: false })
  })

  it('404 si el ejercicio no existe o no está publicado; solo estudiantes', async () => {
    expect((await get('/api/me/exercises/999999')).status).toBe(404)
    await request(app).post(`/api/teacher/content/exercises/${m2.ejercicios[0]}/publish`).set(auth(doc))
    expect((await get(`/api/me/exercises/${m2.ejercicios[0]}`)).status).toBe(404)
    expect((await get(`/api/me/exercises/${m1.ejercicios[0]}`, doc)).status).toBe(403)
  })
})
