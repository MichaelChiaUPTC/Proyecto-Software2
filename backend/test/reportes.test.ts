import request from 'supertest'
import { afterAll, beforeEach, describe, expect, it } from 'vitest'
import { createApp } from '../src/app.js'
import { FakeRunner } from '../src/modules/evaluacion/infrastructure/fake-runner.js'
import { aCsv, type FilaEstudiante } from '../src/modules/reportes/domain/reporte.js'
import { arbolPublicado, auth, crearUsuario, ejercicioBase, limpiarProgreso, limpiarUsuarios, pool, tokenDe } from './helpers.js'

// El código que contiene "BIEN" pasa todos los casos; cualquier otro falla.
const fake = new FakeRunner((code, tests) => tests.map((t) => (code.includes('BIEN') ? { passed: true, actual: t.expected, error: null, timedOut: false } : { passed: false, actual: '0', error: null, timedOut: false })))
const app = createApp(pool, { runner: fake, submitLimit: 1000 })

let doc: string
let ana: string
let arbol: Awaited<ReturnType<typeof arbolPublicado>>
const enviar = (id: number, code: string, token: string) => request(app).post(`/api/exercises/${id}/submissions`).set(auth(token)).send({ code, hintsUsed: 0 })
const fila = (rows: FilaEstudiante[], correo: string) => rows.find((r) => r.email === correo)!

beforeEach(async () => {
  await limpiarProgreso()
  await pool.query('DELETE FROM modulo')
  await limpiarUsuarios()
  await crearUsuario('doc@uptc.edu.co', 'teacher')
  await crearUsuario('admin@uptc.edu.co', 'admin')
  await crearUsuario('ana@uptc.edu.co', 'student')
  await crearUsuario('beto@uptc.edu.co', 'student')
  await crearUsuario('cami@uptc.edu.co', 'student')
  await crearUsuario('baja@uptc.edu.co', 'student', false)
  await pool.query("UPDATE usuario SET nombre = 'Ana', grupo = 'Grupo 01' WHERE correo = 'ana@uptc.edu.co'")
  await pool.query("UPDATE usuario SET nombre = 'Beto', grupo = 'Grupo 02' WHERE correo = 'beto@uptc.edu.co'")
  await pool.query("UPDATE usuario SET nombre = 'Cami', grupo = NULL WHERE correo = 'cami@uptc.edu.co'")
  doc = await tokenDe('doc@uptc.edu.co')
  ana = await tokenDe('ana@uptc.edu.co')
  // Un módulo con 1 lección y 2 ejercicios (3 elementos): resolver 1 ejercicio = 33 %.
  arbol = await arbolPublicado(doc, '01', [ejercicioBase({ title: 'Uno' }), ejercicioBase({ title: 'Dos' })])
})

afterAll(async () => {
  await limpiarProgreso()
  await pool.query('DELETE FROM modulo')
  await limpiarUsuarios()
})

describe('permisos', () => {
  it.each(['/api/teacher/dashboard', '/api/teacher/reports', '/api/teacher/reports.csv'])('%s exige sesión y rol docente o admin', async (ruta) => {
    expect((await request(app).get(ruta)).status).toBe(401)
    expect((await request(app).get(ruta).set(auth(ana))).status).toBe(403)
    expect((await request(app).get(ruta).set(auth(doc))).status).toBe(200)
    expect((await request(app).get(ruta).set(auth(await tokenDe('admin@uptc.edu.co')))).status).toBe(200)
  })
})

describe('GET /teacher/reports', () => {
  it('calcula progreso, éxito, última actividad y módulo actual con datos reales', async () => {
    await enviar(arbol.ejercicios[0]!, 'MAL', ana)
    await enviar(arbol.ejercicios[0]!, 'BIEN', ana)
    const r = await request(app).get('/api/teacher/reports').set(auth(doc))
    expect(r.status).toBe(200)
    const rows: FilaEstudiante[] = r.body.students
    expect(rows.map((x) => x.email)).toEqual(['ana@uptc.edu.co', 'beto@uptc.edu.co', 'cami@uptc.edu.co']) // ordenados por nombre; sin el desactivado
    expect(fila(rows, 'ana@uptc.edu.co')).toMatchObject({
      name: 'Ana', group: 'Grupo 01', progress: 33, solved: 1, totalExercises: 2, successRate: 50, attempts: 2, currentModule: '01 · Módulo 01',
    })
    expect(Date.now() - new Date(fila(rows, 'ana@uptc.edu.co').lastActivity).getTime()).toBeLessThan(60_000)
    // Sin actividad: 0 % y la última actividad es la fecha de registro.
    expect(fila(rows, 'beto@uptc.edu.co')).toMatchObject({ progress: 0, solved: 0, successRate: 0, group: 'Grupo 02' })
    expect(fila(rows, 'cami@uptc.edu.co').group).toBe('Sin grupo')
  })

  it('cuenta las lecciones completadas y marca el curso terminado', async () => {
    await request(app).post(`/api/lessons/${arbol.leccionId}/complete`).set(auth(ana))
    for (const e of arbol.ejercicios) await enviar(e, 'BIEN', ana)
    const rows: FilaEstudiante[] = (await request(app).get('/api/teacher/reports').set(auth(doc))).body.students
    expect(fila(rows, 'ana@uptc.edu.co')).toMatchObject({ progress: 100, solved: 2, successRate: 100, currentModule: 'Curso completado' })
  })

  it('filtra por grupo, incluido «Sin grupo»', async () => {
    const por = async (g: string) => (await request(app).get('/api/teacher/reports').query({ group: g }).set(auth(doc))).body.students.map((x: FilaEstudiante) => x.email)
    expect(await por('Grupo 01')).toEqual(['ana@uptc.edu.co'])
    expect(await por('Sin grupo')).toEqual(['cami@uptc.edu.co'])
    expect(await por('No existe')).toEqual([])
    expect((await request(app).get('/api/teacher/reports').query({ group: 'x'.repeat(81) }).set(auth(doc))).status).toBe(400)
  })

  it('un estudiante desactivado deja de aparecer y vuelve al reactivarlo', async () => {
    await pool.query("UPDATE usuario SET activo = 0 WHERE correo = 'ana@uptc.edu.co'")
    const r = await request(app).get('/api/teacher/reports').set(auth(doc))
    expect(r.body.students.map((x: FilaEstudiante) => x.email)).not.toContain('ana@uptc.edu.co')
  })
})

describe('GET /teacher/dashboard', () => {
  it('resume actividad, atención, contenido y distribución por módulo', async () => {
    await enviar(arbol.ejercicios[0]!, 'BIEN', ana)
    // Beto se registró hace 20 días y nunca practicó: inactivo.
    await pool.query("UPDATE usuario SET fecha_creacion = NOW() - INTERVAL 20 DAY WHERE correo = 'beto@uptc.edu.co'")
    const r = await request(app).get('/api/teacher/dashboard').set(auth(doc))
    expect(r.status).toBe(200)
    const d = r.body
    expect(d).toMatchObject({ total: 3, active: 2, published: 1, modulesTotal: 1, lessonsPublished: 1, exercisesPublished: 2, avg: 11 })
    expect(d.rows).toHaveLength(3)
    // Solo Beto (20 días sin actividad); Cami es nueva y no ha intentado nada, así que su 0 % no cuenta.
    expect(d.attention.map((x: FilaEstudiante) => x.email)).toEqual(['beto@uptc.edu.co'])
    expect(d.perModule).toEqual([{ module: expect.objectContaining({ id: arbol.moduloId, code: '01', published: true }), students: 3 }])
    expect(d.recent[0].email).toBe('ana@uptc.edu.co')
  })

  it('sin estudiantes no divide entre cero', async () => {
    await pool.query("DELETE FROM usuario WHERE rol = 'student'")
    const r = await request(app).get('/api/teacher/dashboard').set(auth(doc))
    expect(r.body).toMatchObject({ total: 0, active: 0, avg: 0, rows: [], attention: [], recent: [] })
  })
})

describe('GET /teacher/reports.csv', () => {
  it('descarga UTF-8 con BOM, cabeceras en español y filtro por grupo', async () => {
    const r = await request(app).get('/api/teacher/reports.csv').query({ group: 'Grupo 01' }).set(auth(doc)).buffer(true).parse((res, cb) => {
      const partes: Buffer[] = []
      res.on('data', (c: Buffer) => partes.push(c))
      res.on('end', () => cb(null, Buffer.concat(partes)))
    })
    expect(r.status).toBe(200)
    expect(r.headers['content-type']).toContain('text/csv')
    expect(r.headers['content-type']).toContain('utf-8')
    expect(r.headers['content-disposition']).toContain('attachment')
    const buf = r.body as Buffer
    expect([...buf.subarray(0, 3)]).toEqual([0xef, 0xbb, 0xbf])
    const lineas = buf.toString('utf8').slice(1).trimEnd().split('\r\n')
    expect(lineas[0]).toBe('"Estudiante","Correo","Grupo","Progreso (%)","Ejercicios resueltos","Total ejercicios","Éxito (%)","Última actividad","Módulo actual"')
    expect(lineas).toHaveLength(2)
    expect(lineas[1]).toMatch(/^"Ana","ana@uptc\.edu\.co","Grupo 01","0","0","2","0","\d{4}-\d{2}-\d{2}T[\d:.]+Z","01 · Módulo 01"$/)
  })

  it('escapa comillas y neutraliza fórmulas de hoja de cálculo', () => {
    const base: FilaEstudiante = { id: 1, name: '=HYPERLINK("x")', email: 'a@uptc.edu.co', group: 'G "1"', progress: 1, solved: 1, totalExercises: 2, successRate: 3, attempts: 4, lastActivity: '2026-01-01T00:00:00.000Z', currentModule: '+x' }
    const lineas = aCsv([base]).split('\r\n')
    expect(lineas[1]).toBe(`"'=HYPERLINK(""x"")","a@uptc.edu.co","G ""1""","1","1","2","3","2026-01-01T00:00:00.000Z","'+x"`)
  })
})
