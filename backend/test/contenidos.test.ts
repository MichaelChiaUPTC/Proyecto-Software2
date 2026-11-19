import request from 'supertest'
import { beforeEach, describe, expect, it } from 'vitest'
import { app, crearUsuario, limpiarProgreso, limpiarUsuarios, pool, tokenDe } from './helpers.js'

const auth = (t: string) => ({ Authorization: `Bearer ${t}` })
const T = '/api/teacher/content'
let est: string
let doc: string

const ejercicio = (extra: object = {}) => ({
  title: 'Suma', statement: 'Suma dos números', difficulty: 'basic', starter: '# código', expectedAnswer: 'def suma(a, b): return a + b',
  hints: ['Usa +'], examples: [{ input: 'suma(1, 2)', expected: '3' }], constraints: ['enteros'],
  rules: [{ pattern: 'return', message: 'Falta return', concept: 'funciones' }], successNote: 'Bien',
  tests: [{ input: 'suma(1, 2)', expected: '3' }, { input: 'suma(5, 5)', expected: '10', hidden: true }], ...extra,
})

/** Crea módulo -> lección -> ejercicio con la API del docente (sin publicar). */
async function crearArbol(codigo = 'M1') {
  const m = (await request(app).post(`${T}/modules`).set(auth(doc)).send({ code: codigo, title: 'Módulo ' + codigo, summary: 'Resumen' })).body.module
  const l = (await request(app).post(`${T}/lessons`).set(auth(doc)).send({ moduleId: m.id, title: 'Lección', blocks: [{ type: 'p', text: 'Hola' }] })).body.lesson
  const e = (await request(app).post(`${T}/exercises`).set(auth(doc)).send({ lessonId: l.id, ...ejercicio() })).body.exercise
  return { m, l, e }
}
const publicar = (kind: string, id: number) => request(app).post(`${T}/${kind}/${id}/publish`).set(auth(doc))

beforeEach(async () => {
  await limpiarProgreso()
  await pool.query('DELETE FROM modulo')
  await limpiarUsuarios()
  await crearUsuario('est@uptc.edu.co', 'student')
  await crearUsuario('doc@uptc.edu.co', 'teacher')
  await crearUsuario('admin@uptc.edu.co', 'admin')
  est = await tokenDe('est@uptc.edu.co')
  doc = await tokenDe('doc@uptc.edu.co')
})

describe('acceso', () => {
  it('sin token responde 401 en el catálogo', async () => {
    expect((await request(app).get('/api/modules')).status).toBe(401)
    expect((await request(app).get(T)).status).toBe(401)
  })

  it('el estudiante recibe 403 en todos los endpoints del docente', async () => {
    const { m, e } = await crearArbol()
    const h = auth(est)
    expect((await request(app).get(T).set(h)).status).toBe(403)
    expect((await request(app).post(`${T}/modules`).set(h).send({})).status).toBe(403)
    expect((await request(app).put(`${T}/modules/${m.id}`).set(h).send({})).status).toBe(403)
    expect((await request(app).post(`${T}/lessons`).set(h).send({})).status).toBe(403)
    expect((await request(app).put(`${T}/exercises/${e.id}`).set(h).send({})).status).toBe(403)
    expect((await request(app).post(`${T}/exercises/${e.id}/publish`).set(h)).status).toBe(403)
    expect((await request(app).post(`${T}/modules/${m.id}/move`).set(h).send({ dir: 1 })).status).toBe(403)
  })

  it('el admin también puede gestionar contenido', async () => {
    const r = await request(app).post(`${T}/modules`).set(auth(await tokenDe('admin@uptc.edu.co'))).send({ code: 'A1', title: 'Admin' })
    expect(r.status).toBe(201)
  })
})

describe('visibilidad para el estudiante', () => {
  it('no ve nada no publicado', async () => {
    const { m, l, e } = await crearArbol()
    const h = auth(est)
    expect((await request(app).get('/api/modules').set(h)).body.modules).toEqual([])
    expect((await request(app).get(`/api/modules/${m.id}`).set(h)).status).toBe(404)
    expect((await request(app).get(`/api/lessons/${l.id}`).set(h)).status).toBe(404)
    expect((await request(app).get(`/api/exercises/${e.id}`).set(h)).status).toBe(404)
    expect((await request(app).get('/api/exercises').set(h)).body.exercises).toEqual([])
  })

  it('un hijo publicado dentro de un módulo no publicado sigue oculto', async () => {
    const { m, l, e } = await crearArbol()
    expect((await publicar('exercises', e.id)).status).toBe(200)
    expect((await publicar('lessons', l.id)).status).toBe(200)
    const h = auth(est)
    expect((await request(app).get(`/api/lessons/${l.id}`).set(h)).status).toBe(404)
    expect((await request(app).get(`/api/exercises/${e.id}`).set(h)).status).toBe(404)
    await publicar('modules', m.id)
    expect((await request(app).get(`/api/lessons/${l.id}`).set(h)).status).toBe(200)
    expect((await request(app).get(`/api/exercises/${e.id}`).set(h)).status).toBe(200)
  })

  it('el detalle del módulo solo trae lecciones y ejercicios publicados, ordenados', async () => {
    const { m, l, e } = await crearArbol()
    const l2 = (await request(app).post(`${T}/lessons`).set(auth(doc)).send({ moduleId: m.id, title: 'Borrador', blocks: [] })).body.lesson
    await publicar('exercises', e.id)
    await publicar('lessons', l.id)
    await publicar('modules', m.id)
    const r = await request(app).get(`/api/modules/${m.id}`).set(auth(est))
    expect(r.status).toBe(200)
    expect(r.body.module).toMatchObject({ id: m.id, code: 'M1', published: true })
    expect(r.body.lessons.map((x: { id: number }) => x.id)).toEqual([l.id])
    expect(r.body.lessons[0].blocks).toEqual([{ type: 'p', text: 'Hola' }])
    expect(r.body.exercises.map((x: { id: number }) => x.id)).toEqual([e.id])
    expect(l2.published).toBe(false)
  })

  it('no filtra solución, reglas ni casos ocultos', async () => {
    const { m, l, e } = await crearArbol()
    await publicar('exercises', e.id)
    await publicar('lessons', l.id)
    await publicar('modules', m.id)
    const h = auth(est)
    const detalle = (await request(app).get(`/api/exercises/${e.id}`).set(h)).body.exercise
    expect(detalle).toMatchObject({ id: e.id, lessonId: l.id, moduleId: m.id, difficulty: 'basic', title: 'Suma' })
    expect(detalle.tests).toEqual([{ input: 'suma(1, 2)', expected: '3' }])
    const crudo = JSON.stringify([
      detalle,
      (await request(app).get('/api/exercises').set(h)).body,
      (await request(app).get(`/api/modules/${m.id}`).set(h)).body,
    ])
    expect(crudo).not.toContain('expectedAnswer')
    expect(crudo).not.toContain('def suma')
    expect(crudo).not.toContain('rules')
    expect(crudo).not.toContain('Falta return')
    expect(crudo).not.toContain('suma(5, 5)')
    expect(crudo).not.toContain('hidden')
  })

  it('filtra la lista de ejercicios por lección y valida ids', async () => {
    const { m, l, e } = await crearArbol()
    await publicar('exercises', e.id)
    await publicar('lessons', l.id)
    await publicar('modules', m.id)
    const h = auth(est)
    expect((await request(app).get(`/api/exercises?lessonId=${l.id}`).set(h)).body.exercises).toHaveLength(1)
    expect((await request(app).get(`/api/exercises?lessonId=${l.id + 999}`).set(h)).body.exercises).toHaveLength(0)
    expect((await request(app).get('/api/modules/abc').set(h)).status).toBe(400)
    expect((await request(app).get('/api/modules/99999').set(h)).status).toBe(404)
  })
})

describe('CRUD del docente', () => {
  it('lista todo (incluye borradores, solución y casos ocultos)', async () => {
    const { e } = await crearArbol()
    const r = await request(app).get(T).set(auth(doc))
    expect(r.status).toBe(200)
    expect(r.body.modules).toHaveLength(1)
    expect(r.body.lessons).toHaveLength(1)
    const ej = r.body.exercises.find((x: { id: number }) => x.id === e.id)
    expect(ej.expectedAnswer).toContain('def suma')
    expect(ej.tests).toEqual([{ input: 'suma(1, 2)', expected: '3', hidden: false }, { input: 'suma(5, 5)', expected: '10', hidden: true }])
    expect(ej.rules).toHaveLength(1)
  })

  it('crea y edita módulo, lección (bloques JSON) y ejercicio (reemplaza casos)', async () => {
    const { m, l, e } = await crearArbol()
    expect(m).toMatchObject({ order: 1, published: false })

    const m2 = await request(app).put(`${T}/modules/${m.id}`).set(auth(doc)).send({ code: 'M1', title: 'Nuevo título', summary: 'otro' })
    expect(m2.body.module).toMatchObject({ title: 'Nuevo título', summary: 'otro' })

    const blocks = [
      { type: 'h', id: 'intro', text: 'Intro' },
      { type: 'code', code: 'print(1)', caption: 'ej' },
      { type: 'flow', steps: [{ kind: 'start', label: 'Inicio' }, { kind: 'decision', label: '¿x?', yes: 'a', no: 'b' }] },
      { type: 'list', items: ['a', 'b'] },
      { type: 'callout', title: 'Ojo', text: 'texto' },
    ]
    const l2 = await request(app).put(`${T}/lessons/${l.id}`).set(auth(doc)).send({ title: 'L2', minutes: 12, blocks })
    expect(l2.body.lesson).toMatchObject({ title: 'L2', minutes: 12, moduleId: m.id })
    expect(l2.body.lesson.blocks).toEqual(blocks)

    const e2 = await request(app).put(`${T}/exercises/${e.id}`).set(auth(doc)).send(ejercicio({ title: 'Resta', difficulty: 'advanced', tests: [{ input: 'f(1)', expected: '1' }] }))
    expect(e2.status).toBe(200)
    expect(e2.body.exercise).toMatchObject({ id: e.id, title: 'Resta', difficulty: 'advanced', lessonId: l.id })
    expect(e2.body.exercise.tests).toEqual([{ input: 'f(1)', expected: '1', hidden: false }])
  })

  it('devuelve 404 al editar o crear sobre ids inexistentes', async () => {
    const h = auth(doc)
    expect((await request(app).put(`${T}/modules/99999`).set(h).send({ code: 'X', title: 'X' })).status).toBe(404)
    expect((await request(app).post(`${T}/lessons`).set(h).send({ moduleId: 99999, title: 'X', blocks: [] })).status).toBe(404)
    expect((await request(app).post(`${T}/exercises`).set(h).send({ lessonId: 99999, ...ejercicio() })).status).toBe(404)
    expect((await request(app).post(`${T}/exercises/99999/publish`).set(h)).status).toBe(404)
    expect((await request(app).post(`${T}/otros/1/publish`).set(h)).status).toBe(400)
  })

  it('rechaza código de módulo duplicado con 409', async () => {
    await crearArbol('DUP')
    const r = await request(app).post(`${T}/modules`).set(auth(doc)).send({ code: 'DUP', title: 'Otro' })
    expect(r.status).toBe(409)
  })

  it('valida las entradas con zod', async () => {
    const h = auth(doc)
    const { l, e } = await crearArbol()
    const mal = async (ruta: string, cuerpo: object, metodo: 'post' | 'put' = 'post') => (await request(app)[metodo](ruta).set(h).send(cuerpo)).body.error?.code
    expect(await mal(`${T}/modules`, { code: '', title: 'x' })).toBe('DATOS_INVALIDOS')
    expect(await mal(`${T}/modules`, { code: 'X'.repeat(11), title: 'x' })).toBe('DATOS_INVALIDOS')
    expect(await mal(`${T}/modules`, { code: 'X', title: 'x'.repeat(101) })).toBe('DATOS_INVALIDOS')
    expect(await mal(`${T}/lessons`, { moduleId: 1, title: 'x', blocks: [{ type: 'video' }] })).toBe('DATOS_INVALIDOS')
    expect(await mal(`${T}/lessons/${l.id}`, { title: 'x', blocks: [{ type: 'p', text: 'a'.repeat(5001) }] }, 'put')).toBe('DATOS_INVALIDOS')
    expect(await mal(`${T}/exercises/${e.id}`, ejercicio({ difficulty: 'baja' }), 'put')).toBe('DATOS_INVALIDOS')
    expect(await mal(`${T}/exercises/${e.id}`, ejercicio({ rules: [{ pattern: '(', message: 'm', concept: 'c' }] }), 'put')).toBe('DATOS_INVALIDOS')
    expect(await mal(`${T}/exercises/${e.id}`, ejercicio({ tests: [{ input: '', expected: '1' }] }), 'put')).toBe('DATOS_INVALIDOS')
    expect(await mal(`${T}/modules/${l.id}/move`, { dir: 2 })).toBe('DATOS_INVALIDOS')
  })
})

describe('reglas de publicación', () => {
  it('un ejercicio sin casos de prueba no se publica (422)', async () => {
    const { l } = await crearArbol()
    const vacio = (await request(app).post(`${T}/exercises`).set(auth(doc)).send({ lessonId: l.id, ...ejercicio({ tests: [] }) })).body.exercise
    const r = await publicar('exercises', vacio.id)
    expect(r.status).toBe(422)
    expect(r.body.error.code).toBe('EJERCICIO_SIN_CASOS')
    expect(r.body.error.message).toMatch(/caso de prueba/)
    // al agregar un caso ya se puede
    await request(app).put(`${T}/exercises/${vacio.id}`).set(auth(doc)).send(ejercicio({ tests: [{ input: 'f()', expected: '1' }] }))
    expect((await publicar('exercises', vacio.id)).body.item.published).toBe(true)
  })

  it('un ejercicio publicado no puede quedarse sin casos', async () => {
    const { e } = await crearArbol()
    await publicar('exercises', e.id)
    const r = await request(app).put(`${T}/exercises/${e.id}`).set(auth(doc)).send(ejercicio({ tests: [] }))
    expect(r.status).toBe(422)
  })

  it('un módulo sin lecciones no se publica (422)', async () => {
    const m = (await request(app).post(`${T}/modules`).set(auth(doc)).send({ code: 'V', title: 'Vacío' })).body.module
    const r = await publicar('modules', m.id)
    expect(r.status).toBe(422)
    expect(r.body.error.code).toBe('MODULO_SIN_LECCIONES')
  })

  it('publish alterna publicado y borrador', async () => {
    const { m, l } = await crearArbol()
    expect((await publicar('lessons', l.id)).body.item.published).toBe(true)
    expect((await publicar('lessons', l.id)).body.item.published).toBe(false)
    expect((await publicar('modules', m.id)).body.item.published).toBe(true)
    expect((await publicar('modules', m.id)).body.item.published).toBe(false)
  })
})

describe('mover', () => {
  const ordenes = (items: { id: number; order: number }[]) => items.sort((a, b) => a.order - b.order).map((x) => x.id)

  it('intercambia módulos globalmente y es no-op en los extremos', async () => {
    const a = (await crearArbol('A')).m
    const b = (await crearArbol('B')).m
    const mover = (id: number, dir: number) => request(app).post(`${T}/modules/${id}/move`).set(auth(doc)).send({ dir })
    expect(ordenes((await mover(b.id, -1)).body.modules)).toEqual([b.id, a.id])
    expect(ordenes((await mover(b.id, -1)).body.modules)).toEqual([b.id, a.id])
    expect(ordenes((await mover(b.id, 1)).body.modules)).toEqual([a.id, b.id])
  })

  it('mueve lecciones solo dentro de su módulo', async () => {
    const { m, l } = await crearArbol('A')
    const otro = (await crearArbol('B')).l
    const l2 = (await request(app).post(`${T}/lessons`).set(auth(doc)).send({ moduleId: m.id, title: 'Segunda', blocks: [] })).body.lesson
    const r = await request(app).post(`${T}/lessons/${l2.id}/move`).set(auth(doc)).send({ dir: -1 })
    const deM = r.body.lessons.filter((x: { moduleId: number }) => x.moduleId === m.id)
    expect(ordenes(deM)).toEqual([l2.id, l.id])
    expect(r.body.lessons.find((x: { id: number }) => x.id === otro.id).order).toBe(1)
  })

  it('mueve ejercicios dentro de su lección', async () => {
    const { l, e } = await crearArbol()
    const e2 = (await request(app).post(`${T}/exercises`).set(auth(doc)).send({ lessonId: l.id, ...ejercicio({ title: 'Otro' }) })).body.exercise
    expect(e2.order).toBe(2)
    const r = await request(app).post(`${T}/exercises/${e.id}/move`).set(auth(doc)).send({ dir: 1 })
    expect(ordenes(r.body.exercises)).toEqual([e2.id, e.id])
  })

  it('el estudiante ve el nuevo orden', async () => {
    const a = (await crearArbol('A'))
    const b = (await crearArbol('B'))
    for (const x of [a, b]) {
      await publicar('exercises', x.e.id)
      await publicar('lessons', x.l.id)
      await publicar('modules', x.m.id)
    }
    await request(app).post(`${T}/modules/${b.m.id}/move`).set(auth(doc)).send({ dir: -1 })
    const r = await request(app).get('/api/modules').set(auth(est))
    expect(r.body.modules.map((x: { id: number }) => x.id)).toEqual([b.m.id, a.m.id])
  })
})
