import request from 'supertest'
import type { RowDataPacket } from 'mysql2/promise'
import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { createApp } from '../src/app.js'
import { FakeRunner } from '../src/modules/evaluacion/infrastructure/fake-runner.js'
import { construirPrompt } from '../src/modules/pistas-ia/domain/prompt.js'
import type { ContextoPista } from '../src/modules/pistas-ia/domain/puertos.js'
import { ClaudeHints } from '../src/modules/pistas-ia/infrastructure/claude-hints.js'
import { FakeHintProvider } from '../src/modules/pistas-ia/infrastructure/fake-hint-provider.js'
import { GeminiHints } from '../src/modules/pistas-ia/infrastructure/gemini-hints.js'
import { arbolPublicado, auth, crearUsuario, ejercicioBase, limpiarProgreso, limpiarUsuarios, pool, tokenDe } from './helpers.js'

// "BIEN" pasa todo; "OCULTO" pasa los visibles y falla los ocultos; "ERROR" lanza NameError; otro: respuesta incorrecta.
const fake = new FakeRunner((code, tests) =>
  tests.map((t, i) =>
    code.includes('BIEN') ? { passed: true, actual: t.expected, error: null, timedOut: false }
    : code.includes('OCULTO') && i === 0 ? { passed: true, actual: t.expected, error: null, timedOut: false }
    : code.includes('ERROR') ? { passed: false, actual: null, error: { type: 'NameError', message: "name 'z' is not defined", line: 2 }, timedOut: false }
    : { passed: false, actual: '0', error: null, timedOut: false }),
)
const ia = new FakeHintProvider()
const app = createApp(pool, { runner: fake, submitLimit: 1000, hintProvider: ia })
const appSinIa = createApp(pool, { runner: fake, submitLimit: 1000, hintProvider: null })

let est: string
let ej: number
const enviar = (code: string) => request(app).post(`/api/exercises/${ej}/submissions`).set(auth(est)).send({ code })
const pedir = (a = app, id = ej, t = est) => request(a).post(`/api/exercises/${id}/ai-hint`).set(auth(t))
const filas = async <T extends RowDataPacket>(sql: string) => (await pool.query<T[]>(sql))[0]

beforeEach(async () => {
  await limpiarProgreso()
  await pool.query('DELETE FROM modulo')
  await limpiarUsuarios()
  await crearUsuario('est@uptc.edu.co', 'student')
  await crearUsuario('doc@uptc.edu.co', 'teacher')
  est = await tokenDe('est@uptc.edu.co')
  const doc = await tokenDe('doc@uptc.edu.co')
  ej = (await arbolPublicado(doc, 'M1', [ejercicioBase({ hints: ['Pista fija 1', 'Pista fija 2'] })])).ejercicios[0]!
  ia.llamadas = []
  ia.respuesta = 'Mira qué devuelve tu función.'
})

afterAll(async () => {
  await limpiarProgreso()
  await pool.query('DELETE FROM modulo')
  await limpiarUsuarios()
})

describe('POST /exercises/:id/ai-hint', () => {
  it('exige sesión y rol estudiante', async () => {
    expect((await request(app).post(`/api/exercises/${ej}/ai-hint`)).status).toBe(401)
    expect((await pedir(app, ej, await tokenDe('doc@uptc.edu.co'))).status).toBe(403)
    expect((await pedir(app, 999999)).status).toBe(404)
  })

  it('sin intento fallido responde 422', async () => {
    const r = await pedir()
    expect(r.status).toBe(422)
    expect(r.body.error.message).toContain('Primero envía')
    await enviar('BIEN')
    expect((await pedir()).status).toBe(422) // solo hay un intento aprobado
    expect(ia.llamadas).toHaveLength(0)
  })

  it('devuelve la pista de IA, la guarda y no vuelve a llamar por el mismo intento', async () => {
    await enviar('codigo malo')
    const r = await pedir()
    expect(r.status).toBe(200)
    expect(r.body).toEqual({ hint: 'Mira qué devuelve tu función.', source: 'ai' })
    ia.respuesta = 'otra cosa'
    expect((await pedir()).body.hint).toBe('Mira qué devuelve tu función.')
    expect(ia.llamadas).toHaveLength(1)
    expect(await filas('SELECT fuente FROM pista_ia')).toHaveLength(1)
    // nuevo intento fallido -> nueva pista
    await enviar('otro malo')
    expect((await pedir()).body.hint).toBe('otra cosa')
  })

  it('usa el último intento de la BD: contexto con enunciado, código y caso visible, sin solución ni datos personales', async () => {
    await enviar('primero malo')
    await enviar('def suma(a, b): return 0 # ultimo')
    await pedir()
    const c = ia.llamadas[0]!
    expect(c.codigo).toContain('# ultimo')
    expect(c.enunciado).toBe('Suma dos números')
    expect(c.caso).toMatchObject({ oculto: false, entrada: 'suma(1, 2)', esperado: '3', obtenido: '0' })
    const todo = JSON.stringify(c) + construirPrompt(c)
    expect(todo).not.toContain('def suma(a, b): return a + b') // expectedAnswer
    expect(todo).not.toContain('Usuario student')
    expect(todo).not.toContain('est@uptc.edu.co')
    expect(todo).not.toContain('suma(5, 5)') // entrada del caso oculto
  })

  it('si el caso fallido es oculto no se envía su entrada ni su esperado', async () => {
    await enviar('OCULTO')
    await pedir()
    const c = ia.llamadas[0]!
    expect(c.caso).toEqual({ oculto: true, error: null })
    const p = construirPrompt(c)
    expect(p).toContain('caso de prueba oculto')
    expect(p).not.toContain('suma(5, 5)')
    expect(p).not.toContain('10')
  })

  it('incluye el error de Python', async () => {
    await enviar('ERROR')
    await pedir()
    expect((ia.llamadas[0]!.caso as { error: string }).error).toBe("NameError: name 'z' is not defined")
  })

  it('sin proveedor usa las pistas fijas en orden y luego repite la última', async () => {
    const hints: string[] = []
    for (let i = 0; i < 3; i++) {
      await enviar(`malo ${i}`)
      const r = await pedir(appSinIa)
      expect(r.body.source).toBe('fallback')
      hints.push(r.body.hint)
    }
    expect(hints).toEqual(['Pista fija 1', 'Pista fija 2', 'Pista fija 2'])
  })

  it('respaldo si el proveedor falla, responde vacío o devuelve un bloque de código', async () => {
    for (const resp of [new Error('timeout'), '   ', 'Prueba así:\n```python\nreturn a + b\n```']) {
      ia.respuesta = resp
      await enviar('malo')
      const r = await pedir()
      expect(r.status).toBe(200)
      expect(r.body.source).toBe('fallback')
    }
  })

  it('límite de 10 pistas de IA por usuario y día (429)', async () => {
    for (let i = 0; i < 11; i++) await enviar(`malo ${i}`)
    const [u] = await filas('SELECT id_usuario FROM usuario WHERE correo = "est@uptc.edu.co"')
    const ids = await filas('SELECT id_intento FROM intento ORDER BY id_intento')
    for (const i of ids.slice(0, 10)) {
      await pool.execute("INSERT INTO pista_ia (id_intento, id_usuario, texto, fuente) VALUES (?, ?, 'x', 'ai')", [i.id_intento, u!.id_usuario])
    }
    const r = await pedir()
    expect(r.status).toBe(429)
    expect(r.body.error.code).toBe('LIMITE_PISTAS_IA')
    expect(ia.llamadas).toHaveLength(0)
    // un intento que ya tenía pista devuelve la guardada aunque se haya llegado al límite
    await pool.query("UPDATE pista_ia SET fecha = NOW() - INTERVAL 2 DAY")
    expect((await pedir()).status).toBe(200)
  })
})

describe('adaptadores (fetch simulado)', () => {
  const ctx: ContextoPista = { enunciado: 'E', codigo: 'c', caso: { oculto: true, error: null } }
  const resp = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status })

  it('Gemini: URL, clave en cabecera, instrucción de sistema y extracción del texto', async () => {
    const f = vi.fn().mockResolvedValue(resp({ candidates: [{ content: { parts: [{ text: ' Hola ' }] } }] }))
    const t = await new GeminiHints({ apiKey: 'K', model: 'm-1', timeoutMs: 1000, fetchFn: f }).hint(ctx)
    expect(t).toBe('Hola')
    const [url, init] = f.mock.calls[0]!
    expect(url).toBe('https://generativelanguage.googleapis.com/v1beta/models/m-1:generateContent')
    expect(init.headers['x-goog-api-key']).toBe('K')
    const body = JSON.parse(init.body)
    expect(body.systemInstruction.parts[0].text).toContain('Máximo 3 frases')
    expect(body.contents[0].parts[0].text).toContain('caso de prueba oculto')
  })

  it('Claude: cabeceras, modelo y extracción del texto', async () => {
    const f = vi.fn().mockResolvedValue(resp({ content: [{ type: 'text', text: 'Pista' }] }))
    const t = await new ClaudeHints({ apiKey: 'K', model: 'claude-haiku-5-5', timeoutMs: 1000, fetchFn: f }).hint(ctx)
    expect(t).toBe('Pista')
    const [url, init] = f.mock.calls[0]!
    expect(url).toBe('https://api.anthropic.com/v1/messages')
    expect(init.headers).toMatchObject({ 'x-api-key': 'K', 'anthropic-version': '2023-06-01' })
    expect(JSON.parse(init.body)).toMatchObject({ model: 'claude-haiku-5-5', system: expect.stringContaining('tutor') })
  })

  it('error HTTP y timeout lanzan (el servicio los convierte en respaldo)', async () => {
    const mal = vi.fn().mockResolvedValue(resp({}, 500))
    await expect(new GeminiHints({ apiKey: 'K', model: 'm', timeoutMs: 1000, fetchFn: mal }).hint(ctx)).rejects.toThrow('500')
    await expect(new ClaudeHints({ apiKey: 'K', model: 'm', timeoutMs: 1000, fetchFn: mal }).hint(ctx)).rejects.toThrow('500')
    const colgado = ((_u: unknown, init: RequestInit) =>
      new Promise((_r, rej) => init.signal!.addEventListener('abort', () => rej(init.signal!.reason)))) as unknown as typeof fetch
    await expect(new ClaudeHints({ apiKey: 'K', model: 'm', timeoutMs: 30, fetchFn: colgado }).hint(ctx)).rejects.toThrow()
  })
})
