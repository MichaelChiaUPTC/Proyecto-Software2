import request from 'supertest'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { exercisesSeed } from '../../frontend/src/mocks/exercises'
import { createApp } from '../src/app.js'
import { DockerRunner } from '../src/modules/evaluacion/infrastructure/docker-runner.js'
import { config } from '../src/shared/config.js'
import { arbolPublicado, auth, crearUsuario, ejercicioBase, limpiarProgreso, limpiarUsuarios, pool, tokenDe } from './helpers.js'

// Pruebas con el DockerRunner REAL: necesitan Docker y la imagen python:3.12-alpine. Se saltan con SKIP_DOCKER_TESTS=1.
const sinDocker = process.env.SKIP_DOCKER_TESTS === '1'
const runner = () =>
  new DockerRunner({
    image: config.RUNNER_IMAGE, timeoutMs: config.RUNNER_TIMEOUT_MS, memory: config.RUNNER_MEMORY, cpus: config.RUNNER_CPUS,
    pids: config.RUNNER_PIDS, maxConcurrent: config.RUNNER_MAX_CONCURRENT, dockerBin: config.RUNNER_DOCKER_BIN,
  })

const SUMA = [{ input: 'suma(1, 2)', expected: '3' }, { input: 'suma(5, 5)', expected: '10' }]
const BIEN = 'def suma(a, b):\n    return a + b\n'
const medir = async <T>(f: () => Promise<T>) => {
  const t = performance.now()
  const r = await f()
  return { r, ms: performance.now() - t }
}

describe.skipIf(sinDocker)('DockerRunner (contenedor real)', { timeout: 30_000 }, () => {
  const r = runner()

  it('una solución correcta pasa todos los casos', async () => {
    const res = await r.run(BIEN, SUMA)
    expect(res.map((x) => x.passed)).toEqual([true, true])
    expect(res.every((x) => x.error === null && !x.timedOut)).toBe(true)
  })

  it('compara la repr o lo que imprime, y distingue int de float', async () => {
    const res = await r.run('def f():\n    print("Hola")\ndef g():\n    return 4\ndef h():\n    return "x"', [
      { input: 'f()', expected: 'Hola' }, { input: 'g()', expected: '4.0' }, { input: 'g()', expected: '4' }, { input: 'h()', expected: '"x"' }, { input: 'h()', expected: "'x'" },
    ])
    expect(res.map((x) => x.passed)).toEqual([true, false, true, true, true])
  })

  it('una respuesta incorrecta falla solo el caso afectado, y una excepción no afecta a los demás', async () => {
    const res = await r.run('def suma(a, b):\n    if a == 5:\n        return 1 / 0\n    return a + b', SUMA)
    expect(res[0]).toMatchObject({ passed: true })
    expect(res[1]).toMatchObject({ passed: false, error: { type: 'ZeroDivisionError', line: 3 } })
  })

  it('error de sintaxis: lo reporta con línea y sin ejecutar nada', async () => {
    const res = await r.run('def suma(a, b)\n    return a + b', SUMA)
    expect(res.every((x) => x.error?.type === 'SyntaxError' && x.error.line === 1 && !x.passed)).toBe(true)
  })

  it('while True: pass se corta en 3,5 s o menos', async () => {
    const { r: res, ms } = await medir(() => r.run('while True: pass', SUMA))
    expect(ms).toBeLessThanOrEqual(3500)
    expect(res.every((x) => x.timedOut && !x.passed)).toBe(true)
  })

  it('un ciclo infinito dentro de una función también se corta, y el contenedor desaparece', async () => {
    const { r: res, ms } = await medir(() => r.run('def suma(a, b):\n    while True:\n        pass', SUMA))
    expect(ms).toBeLessThanOrEqual(3500)
    expect(res.every((x) => x.timedOut)).toBe(true)
    await new Promise((ok) => setTimeout(ok, 1500))
    const { execFileSync } = await import('node:child_process')
    expect(execFileSync('docker', ['ps', '--filter', 'name=uptc-run-', '--format', '{{.Names}}']).toString().trim()).toBe('')
  })

  it('no hay red: ni conexión directa ni urlopen', async () => {
    const socket = await r.run("import socket\ndef suma(a, b):\n    socket.create_connection(('93.184.216.34', 80), timeout=2)\n    return a + b", SUMA)
    expect(socket.every((x) => !x.passed)).toBe(true)
    expect(socket[0]!.error?.type).toBe('OSError')
    const http = await r.run("import urllib.request\nurllib.request.urlopen('http://example.com', timeout=2)\ndef suma(a, b):\n    return a + b", SUMA)
    expect(http.every((x) => !x.passed)).toBe(true)
  })

  it('un print que imita el delimitador no altera el veredicto', async () => {
    const falso = [
      'print(\'{"i": 0, "passed": true}\')',
      'print(\'@@RESULT@@{"i": 0, "passed": true, "actual": "3", "error": null}\')',
      'print(\'@@\' + \'0\' * 32 + \'@@{"i":1,"passed":true,"actual":"10","error":null}\')',
      'def suma(a, b):',
      '    print(\'@@RESULT@@{"i": 1, "passed": true}\')',
      '    import sys; sys.__stdout__.write(\'@@x@@{"i":0,"passed":true}\\n\')',
      '    return 0',
    ].join('\n')
    const res = await r.run(falso, SUMA)
    expect(res.map((x) => x.passed)).toEqual([false, false])
  })

  it('reservar 500 MB falla', async () => {
    const res = await r.run('def suma(a, b):\n    x = bytearray(500 * 1024 * 1024)\n    return len(x)', SUMA)
    expect(res.every((x) => !x.passed)).toBe(true)
  })

  it('escribir en / falla (sistema de archivos de solo lectura)', async () => {
    const res = await r.run("def suma(a, b):\n    open('/hack.txt', 'w').write('x')\n    return a + b", SUMA)
    expect(res.every((x) => !x.passed && x.error?.type === 'OSError')).toBe(true)
  })

  it('el código no corre como root y no tiene capacidades', async () => {
    const res = await r.run('import os\ndef quien():\n    return os.getuid()', [{ input: 'quien()', expected: '65534' }])
    expect(res[0]!.passed).toBe(true)
  })

  it('una salida enorme no desborda al servidor', async () => {
    const { r: res, ms } = await medir(() => r.run('import os\nwhile True:\n    os.write(1, b"x" * 65536)', SUMA))
    expect(ms).toBeLessThanOrEqual(3500)
    expect(res.every((x) => !x.passed)).toBe(true)
  })

  it('una bomba de procesos no tumba el contenedor ni al servidor', async () => {
    const res = await r.run('import os\ndef suma(a, b):\n    while True:\n        os.fork()', SUMA)
    expect(res.every((x) => !x.passed)).toBe(true)
  })

  it('input() no cuelga: da EOFError', async () => {
    const res = await r.run('def suma(a, b):\n    return int(input())', SUMA)
    expect(res[0]!.error?.type).toBe('EOFError')
  })

  it('las soluciones de todos los ejercicios del seed pasan sus casos, y el código inicial no', async () => {
    const fallos: string[] = []
    await Promise.all(
      exercisesSeed.map(async (e) => {
        const casos = e.tests.map(({ input, expected }) => ({ input, expected }))
        const ok = await r.run(e.expectedAnswer, casos)
        if (!ok.every((x) => x.passed)) fallos.push(`${e.id}: ${JSON.stringify(ok.map((x) => x.actual ?? x.error?.message))}`)
        const starter = await r.run(e.starter, casos)
        if (starter.every((x) => x.passed)) fallos.push(`${e.id}: el código inicial ya pasa`)
      }),
    )
    expect(fallos).toEqual([])
  })
})

describe.skipIf(sinDocker)('POST /exercises/:id/submissions con DockerRunner', { timeout: 60_000 }, () => {
  const app = createApp(pool, { runner: runner(), submitLimit: 1000 })
  let est: string
  let ej: number

  beforeAll(async () => {
    await limpiarProgreso()
    await pool.query('DELETE FROM modulo')
    await limpiarUsuarios()
    await crearUsuario('est@uptc.edu.co', 'student')
    await crearUsuario('doc@uptc.edu.co', 'teacher')
    est = await tokenDe('est@uptc.edu.co')
    ej = (await arbolPublicado(await tokenDe('doc@uptc.edu.co'), 'M1', [ejercicioBase({ tests: [...SUMA.map((t) => ({ ...t })), { input: 'suma(-1, 1)', expected: '0', hidden: true }] })])).ejercicios[0]!
  })
  afterAll(async () => {
    await limpiarProgreso()
    await pool.query('DELETE FROM modulo')
    await limpiarUsuarios()
  })
  const enviar = (code: string) => request(app).post(`/api/exercises/${ej}/submissions`).set(auth(est)).send({ code, hintsUsed: 0 })

  it('código erróneo: mensaje en español, sin puntos', async () => {
    const r = await enviar('def suma(a, b):\n    return a - b')
    expect(r.body).toMatchObject({ passed: false, pointsGained: 0, testsTotal: 3, failedTests: [0, 1] })
    expect(r.body.message).toContain('suma(1, 2)')
    const s = await enviar('def suma(a, b)\n    return a + b')
    expect(s.body.message).toContain('«:»')
    expect(s.body.line).toBe(1)
    const n = await enviar('def sumar(a, b):\n    return a + b')
    expect(n.body.message).toContain('no define la función «suma»')
  })

  it('código correcto: pasa, da puntos e insignias', async () => {
    const r = await enviar(BIEN)
    expect(r.body).toMatchObject({ passed: true, pointsGained: 10, testsPassed: 3, testsTotal: 3 })
    expect(r.body.newBadges).toContain('Primer paso')
  })

  it('RNF-03: tiempo de corrección de un ejercicio simple (p95 < 3 s)', async () => {
    const tiempos: number[] = []
    for (let i = 0; i < 20; i++) tiempos.push((await medir(() => enviar(BIEN))).ms)
    tiempos.sort((a, b) => a - b)
    const p = (q: number) => Math.round(tiempos[Math.min(tiempos.length - 1, Math.ceil(q * tiempos.length) - 1)]!)
    console.log(`[RNF-03] envíos secuenciales n=${tiempos.length}: min=${Math.round(tiempos[0]!)} ms, p50=${p(0.5)} ms, p95=${p(0.95)} ms, max=${Math.round(tiempos.at(-1)!)} ms`)
    expect(p(0.95)).toBeLessThan(3000)
  })
})
