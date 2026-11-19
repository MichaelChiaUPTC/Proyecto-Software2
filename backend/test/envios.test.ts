import request from 'supertest'
import type { RowDataPacket } from 'mysql2/promise'
import { afterAll, beforeEach, describe, expect, it } from 'vitest'
import { createApp } from '../src/app.js'
import { FakeRunner } from '../src/modules/evaluacion/infrastructure/fake-runner.js'
import { AppError } from '../src/shared/errors.js'
import type { ProcesadorEventos } from '../src/modules/progreso/application/procesador-eventos.js'
import { arbolPublicado, auth, crearUsuario, ejercicioBase, limpiarProgreso, limpiarUsuarios, pool, tokenDe } from './helpers.js'

// Veredicto simulado: el código que contiene "BIEN" pasa todo; "ERROR" lanza NameError; "BUCLE" agota el tiempo.
const fake = new FakeRunner((code, tests) =>
  tests.map((t) =>
    code.includes('BUCLE') ? { passed: false, actual: null, error: null, timedOut: true }
    : code.includes('ERROR') ? { passed: false, actual: null, error: { type: 'NameError', message: "name 'z' is not defined", line: 2 }, timedOut: false }
    : code.includes('BIEN') ? { passed: true, actual: t.expected, error: null, timedOut: false }
    : { passed: false, actual: '0', error: null, timedOut: false }),
)
const app = createApp(pool, { runner: fake, submitLimit: 1000 })
const procesador = app.locals.procesador as ProcesadorEventos

let est: string
let doc: string
let arbol: Awaited<ReturnType<typeof arbolPublicado>>
let ej: number
const enviar = (id: number, code: string, hintsUsed = 0, token = est) => request(app).post(`/api/exercises/${id}/submissions`).set(auth(token)).send({ code, hintsUsed })
const filas = async <T extends RowDataPacket>(sql: string, p: unknown[] = []) => (await pool.query<T[]>(sql, p))[0]

beforeEach(async () => {
  await limpiarProgreso()
  await pool.query('DELETE FROM modulo')
  await limpiarUsuarios()
  await crearUsuario('est@uptc.edu.co', 'student')
  await crearUsuario('doc@uptc.edu.co', 'teacher')
  est = await tokenDe('est@uptc.edu.co')
  doc = await tokenDe('doc@uptc.edu.co')
  arbol = await arbolPublicado(doc, 'M1', [ejercicioBase()])
  ej = arbol.ejercicios[0]!
})

afterAll(async () => {
  await limpiarProgreso()
  await pool.query('DELETE FROM modulo')
  await limpiarUsuarios()
})

describe('POST /exercises/:id/submissions', () => {
  it('exige sesión y rol estudiante', async () => {
    expect((await request(app).post(`/api/exercises/${ej}/submissions`).send({ code: 'x' })).status).toBe(401)
    expect((await enviar(ej, 'BIEN', 0, doc)).status).toBe(403)
  })

  it('valida el cuerpo y el ejercicio', async () => {
    expect((await enviar(999999, 'BIEN')).status).toBe(404)
    expect((await enviar(ej, '')).status).toBe(400)
    const grande = await enviar(ej, 'x'.repeat(20_001))
    expect(grande.status).toBe(400)
    expect(grande.body.error.message).toContain('demasiado largo')
    expect((await request(app).post(`/api/exercises/${ej}/submissions`).set(auth(est)).send({ code: 'x', hintsUsed: 'mucho' })).status).toBe(400)
    expect((await request(app).post('/api/exercises/abc/submissions').set(auth(est)).send({ code: 'x' })).status).toBe(400)
  })

  it('un ejercicio sin publicar no se puede enviar', async () => {
    await request(app).post(`/api/teacher/content/exercises/${ej}/publish`).set(auth(doc))
    expect((await enviar(ej, 'BIEN')).status).toBe(404)
  })

  it('aprueba: da puntos, insignias, guarda el intento y deja los eventos procesados', async () => {
    const r = await enviar(ej, 'BIEN', 0)
    expect(r.status).toBe(200)
    expect(r.body).toMatchObject({ passed: true, title: 'Correcto', message: 'Bien hecho', testsPassed: 2, testsTotal: 2, failedTests: [], pointsGained: 10 })
    expect(r.body.newBadges).toEqual(['Primer paso', 'A la primera'])

    const intentos = await filas('SELECT resultado, pistas_usadas, retroalimentacion FROM intento')
    expect(intentos).toHaveLength(1)
    expect(intentos[0]).toMatchObject({ resultado: 1, pistas_usadas: 0, retroalimentacion: 'Bien hecho' })
    const eventos = await filas('SELECT tipo, procesado FROM evento_outbox ORDER BY id')
    expect(eventos.map((e) => e.tipo)).toEqual(['IntentoAprobado', 'InsigniaObtenida', 'InsigniaObtenida'])
    expect(eventos[0]!.procesado).not.toBeNull()
    expect(await filas('SELECT 1 FROM usuario_insignia')).toHaveLength(2)
  })

  it('la segunda aprobación no repite puntos, insignias ni eventos', async () => {
    await enviar(ej, 'BIEN')
    const r = await enviar(ej, 'BIEN')
    expect(r.body).toMatchObject({ passed: true, pointsGained: 0, newBadges: [] })
    expect(await filas("SELECT 1 FROM evento_outbox WHERE tipo = 'IntentoAprobado'")).toHaveLength(1)
    expect(await filas('SELECT 1 FROM intento')).toHaveLength(2)
  })

  it('con pistas o tras fallar no hay "A la primera"; tras 3 intentos hay "Persistente"', async () => {
    const f1 = await enviar(ej, 'mal')
    expect(f1.body).toMatchObject({ passed: false, pointsGained: 0, newBadges: [] })
    await enviar(ej, 'mal')
    const r = await enviar(ej, 'BIEN', 2)
    expect(r.body.newBadges).toEqual(['Primer paso', 'Persistente'])
    expect(r.body.pointsGained).toBe(10)
  })

  it('reprueba: indica el caso visible fallido y no filtra los ocultos', async () => {
    const r = await enviar(ej, 'mal')
    expect(r.body).toMatchObject({ passed: false, title: 'Hay un problema', testsPassed: 0, testsTotal: 2, failedTests: [0] })
    expect(r.body.message).toContain('suma(1, 2)')
    expect(JSON.stringify(r.body)).not.toContain('suma(5, 5)')
    expect(await filas('SELECT 1 FROM evento_outbox')).toHaveLength(0)
    const [guardado] = await filas('SELECT detalle FROM intento')
    expect(guardado!.detalle).toEqual([
      { indice: 0, oculto: false, entrada: 'suma(1, 2)', esperado: '3', actual: '0', error: null, timedOut: false },
      { indice: 1, oculto: true, entrada: 'suma(5, 5)', esperado: '10', actual: '0', error: null, timedOut: false },
    ])
  })

  it('solo falla el caso oculto: mensaje genérico', async () => {
    const parcial = new FakeRunner((_c, tests) => tests.map((t, i) => ({ passed: i === 0, actual: i === 0 ? t.expected : '7', error: null, timedOut: false })))
    const a = createApp(pool, { runner: parcial, submitLimit: 1000 })
    const r = await request(a).post(`/api/exercises/${ej}/submissions`).set(auth(est)).send({ code: 'return x' })
    expect(r.body).toMatchObject({ passed: false, testsPassed: 1, testsTotal: 2, failedTests: [] })
    expect(r.body.message).toContain('no se muestran')
    expect(JSON.stringify(r.body)).not.toMatch(/suma\(5, 5\)|"7"/)
  })

  it('traduce errores de Python y el tiempo agotado', async () => {
    const e = await enviar(ej, 'ERROR')
    expect(e.body).toMatchObject({ passed: false, line: 2, concept: 'Variables' })
    expect(e.body.message).toContain('«z»')
    const t = await enviar(ej, 'BUCLE')
    expect(t.body).toMatchObject({ passed: false, title: 'Tiempo agotado' })
  })

  it('entrega al runner todos los casos, incluidos los ocultos', async () => {
    fake.llamadas.length = 0
    await enviar(ej, 'BIEN')
    expect(fake.llamadas[0]!.tests.map((t) => t.input)).toEqual(['suma(1, 2)', 'suma(5, 5)'])
  })

  it('limita los envíos por usuario', async () => {
    const limitada = createApp(pool, { runner: fake, submitLimit: 2 })
    const post = () => request(limitada).post(`/api/exercises/${ej}/submissions`).set(auth(est)).send({ code: 'mal' })
    expect((await post()).status).toBe(200)
    expect((await post()).status).toBe(200)
    const r = await post()
    expect(r.status).toBe(429)
    expect(r.body.error.code).toBe('DEMASIADOS_ENVIOS')
  })

  it('si el runner no está disponible responde 503 y no guarda el intento', async () => {
    const roto = createApp(pool, { runner: new FakeRunner(() => { throw new AppError(503, 'EJECUTOR_NO_DISPONIBLE', 'no disponible') }), submitLimit: 1000 })
    const r = await request(roto).post(`/api/exercises/${ej}/submissions`).set(auth(est)).send({ code: 'x' })
    expect(r.status).toBe(503)
    expect(await filas('SELECT 1 FROM intento')).toHaveLength(0)
  })
})

describe('procesador de eventos', () => {
  it('es idempotente: reprocesar el mismo evento no duplica insignias ni eventos', async () => {
    await enviar(ej, 'BIEN')
    const antes = await filas('SELECT id, tipo FROM evento_outbox ORDER BY id')
    await pool.query("UPDATE evento_outbox SET procesado = NULL WHERE tipo = 'IntentoAprobado'")
    expect(await procesador.procesarPendientes()).toBe(1)
    expect(await procesador.procesarPendientes()).toBe(0)
    expect(await filas('SELECT 1 FROM usuario_insignia')).toHaveLength(2)
    expect(await filas('SELECT id FROM evento_outbox ORDER BY id')).toHaveLength(antes.length)
  })

  it('el respaldo recupera eventos que quedaron pendientes (p. ej. caída tras el commit)', async () => {
    const [u] = await filas('SELECT id_usuario FROM usuario WHERE correo = ?', ['est@uptc.edu.co'])
    await pool.query("INSERT INTO intento (id_usuario, id_ejercicio, codigo, resultado) VALUES (?, ?, 'x', 1)", [u!.id_usuario, ej])
    await pool.query("INSERT INTO evento_outbox (tipo, payload) VALUES ('IntentoAprobado', ?)", [JSON.stringify({ usuarioId: u!.id_usuario, ejercicioId: ej })])
    expect(await procesador.procesarPendientes()).toBe(1)
    const b = await request(app).get('/api/me/badges').set(auth(est))
    expect(b.body.badges.filter((x: { earnedAt?: string }) => x.earnedAt).map((x: { id: string }) => x.id)).toEqual(expect.arrayContaining(['primer-paso', 'a-la-primera']))
    expect(await filas("SELECT 1 FROM evento_outbox WHERE tipo = 'IntentoAprobado' AND procesado IS NULL")).toHaveLength(0)
  })

  it('un evento con payload inválido se marca como procesado sin bloquear la cola', async () => {
    await pool.query("INSERT INTO evento_outbox (tipo, payload) VALUES ('IntentoAprobado', '{}')")
    expect(await procesador.procesarPendientes()).toBe(1)
    expect(await filas("SELECT 1 FROM evento_outbox WHERE tipo = 'IntentoAprobado' AND procesado IS NULL")).toHaveLength(0)
  })

  it('las definiciones de insignias quedan en la tabla `insignia`', async () => {
    await procesador.procesarPendientes()
    expect((await filas('SELECT codigo FROM insignia')).length).toBe(10)
  })
})

describe('lecciones y progreso', () => {
  it('completar una lección: 404 si no existe, siguiente elemento, insignias y es idempotente', async () => {
    expect((await request(app).post('/api/lessons/999999/complete').set(auth(est))).status).toBe(404)
    expect((await request(app).post(`/api/lessons/${arbol.leccionId}/complete`)).status).toBe(401)
    const r = await request(app).post(`/api/lessons/${arbol.leccionId}/complete`).set(auth(est))
    expect(r.status).toBe(200)
    expect(r.body.next).toMatchObject({ kind: 'exercise', id: ej, status: 'current', to: `/ejercicios/${ej}` })
    expect(r.body.newBadges).toEqual([])
    const otra = await request(app).post(`/api/lessons/${arbol.leccionId}/complete`).set(auth(est))
    expect(otra.status).toBe(200)
    expect(await filas('SELECT 1 FROM leccion_completada')).toHaveLength(1)
    expect(await filas("SELECT 1 FROM evento_outbox WHERE tipo = 'LeccionCompletada'")).toHaveLength(1)
  })

  it('completar un módulo (lección + ejercicio) da la insignia "Algoritmo" y se refleja en progreso, home, perfil y actividad', async () => {
    const r1 = await enviar(ej, 'BIEN')
    expect(r1.body.newBadges).toEqual(['Primer paso', 'A la primera'])
    const lec = await request(app).post(`/api/lessons/${arbol.leccionId}/complete`).set(auth(est))
    expect(lec.body.newBadges).toEqual(['Algoritmo'])

    const prog = (await request(app).get('/api/me/progress').set(auth(est))).body
    expect(prog).toMatchObject({ overallPct: 100, solved: 1, totalExercises: 1, pendingExercises: 0, successRate: 100, points: 15, attemptsCount: 1, lessonsDone: 1, modulesCompleted: 1, modulesTotal: 1 })
    expect(prog.modules[0]).toMatchObject({ lessons: 1, exercises: 1, pct: 100, status: 'done' })
    expect(prog.modules[0].module.id).toBe(arbol.moduloId)
    expect(prog.activity.map((a: { kind: string }) => a.kind).sort()).toEqual(['badge', 'badge', 'badge', 'exercise', 'lesson'])

    const badges = (await request(app).get('/api/me/badges').set(auth(est))).body.badges
    expect(badges).toHaveLength(10)
    expect(badges.find((b: { id: string }) => b.id === 'algoritmo')).toMatchObject({ current: 1, target: 1 })
    expect(badges.find((b: { id: string }) => b.id === 'algoritmo').earnedAt).toBeTruthy()
    expect(badges.find((b: { id: string }) => b.id === 'lector')).toMatchObject({ current: 1, target: 10 })

    const act = (await request(app).get('/api/me/activity?limit=2').set(auth(est))).body.activity
    expect(act).toHaveLength(2)
    expect((await request(app).get('/api/me/activity?limit=0').set(auth(est))).status).toBe(400)

    const home = (await request(app).get('/api/me/home').set(auth(est))).body
    expect(home).toMatchObject({ points: 15, solved: 1, target: null, current: null, nextExercise: null })
    expect(home.recentBadges).toHaveLength(3)

    const perfil = (await request(app).get('/api/me/profile').set(auth(est))).body
    expect(perfil).toMatchObject({ points: 15, lessonsDone: 1, attemptsCount: 1 })
    expect(perfil.badges).toHaveLength(10)
    expect(perfil.history.length).toBeGreaterThan(0)
  })

  it('home de un estudiante nuevo: siguiente paso y ruta', async () => {
    const home = (await request(app).get('/api/me/home').set(auth(est))).body
    expect(home).toMatchObject({ points: 0, solved: 0, overallPct: 0, successRate: 0 })
    expect(home.target).toMatchObject({ kind: 'lesson', to: `/lecciones/${arbol.leccionId}` })
    expect(home.path.map((i: { kind: string }) => i.kind)).toEqual(['lesson', 'exercise'])
    expect(home.current).toMatchObject({ status: 'todo', pct: 0 })
  })

  it('historial de intentos de un ejercicio y detalle de módulo', async () => {
    await enviar(ej, 'mal', 1)
    await enviar(ej, 'BIEN', 0)
    const h = (await request(app).get(`/api/exercises/${ej}/attempts`).set(auth(est))).body
    expect(h).toMatchObject({ solved: true, attempts: 2, next: null })
    expect(h.history.map((a: { passed: boolean }) => a.passed)).toEqual([true, false])
    expect(h.history[1]).toMatchObject({ hintsUsed: 1, exerciseId: ej })
    expect((await request(app).get('/api/exercises/999999/attempts').set(auth(est))).status).toBe(404)
    const m = (await request(app).get(`/api/me/modules/${arbol.moduloId}`).set(auth(est))).body
    expect(m).toMatchObject({ lessons: 1, exercises: 1, status: 'progress' })
    expect(m.path).toHaveLength(2)
  })

  it('el progreso de un estudiante no se mezcla con el de otro', async () => {
    await crearUsuario('otro@uptc.edu.co', 'student')
    const otro = await tokenDe('otro@uptc.edu.co')
    await enviar(ej, 'BIEN')
    const p = (await request(app).get('/api/me/progress').set(auth(otro))).body
    expect(p).toMatchObject({ solved: 0, points: 0, attemptsCount: 0 })
  })

  it('los endpoints /me son solo para estudiantes', async () => {
    for (const ruta of ['/me/progress', '/me/badges', '/me/activity', '/me/home', '/me/profile']) {
      expect((await request(app).get(`/api${ruta}`)).status).toBe(401)
      expect((await request(app).get(`/api${ruta}`).set(auth(doc))).status).toBe(403)
    }
  })

  it('v_progreso refleja los intentos por usuario y módulo', async () => {
    await enviar(ej, 'mal')
    await enviar(ej, 'BIEN')
    const v = await filas('SELECT id_modulo, ejercicios_resueltos, intentos FROM v_progreso')
    expect(v).toHaveLength(1)
    expect(v[0]).toMatchObject({ id_modulo: arbol.moduloId, ejercicios_resueltos: 1, intentos: 2 })
  })
})
