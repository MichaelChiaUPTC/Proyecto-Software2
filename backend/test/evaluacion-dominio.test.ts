import { describe, expect, it } from 'vitest'
import { syntaxProblem, traducirError } from '../src/modules/evaluacion/domain/mensajes.js'
import type { ResultadoCaso } from '../src/modules/evaluacion/domain/runner.js'
import { evaluar } from '../src/modules/evaluacion/domain/veredicto.js'
import { FakeRunner } from '../src/modules/evaluacion/infrastructure/fake-runner.js'
import { interpretar } from '../src/modules/evaluacion/infrastructure/docker-runner.js'
import { badgeDefs } from '../src/modules/progreso/domain/insignias.js'
import {
  armarProgreso, badgeViews, buildPath, computeContext, computePoints, moduleStats, newlyEarned, POINTS, stats,
  type Catalogo, type Progreso,
} from '../src/modules/progreso/domain/progreso.js'

const ok: ResultadoCaso = { passed: true, actual: '1', error: null, timedOut: false }
const mal = (actual = '0'): ResultadoCaso => ({ passed: false, actual, error: null, timedOut: false })
const ex = {
  tests: [{ input: 'f(1)', expected: '1', hidden: false }, { input: 'f(2)', expected: '2', hidden: false }, { input: 'f(99)', expected: '99', hidden: true }],
  successNote: 'Muy bien',
}

describe('veredicto', () => {
  it('aprueba cuando todos los casos pasan', () => {
    const v = evaluar(ex, 'def f(x):\n    return x', [ok, ok, ok])
    expect(v.evaluacion).toMatchObject({ passed: true, title: 'Correcto', message: 'Muy bien', testsPassed: 3, testsTotal: 3, failedTests: [] })
  })

  it('un caso visible fallido muestra lo esperado y lo obtenido, e indica su índice entre los visibles', () => {
    const v = evaluar(ex, 'def f(x):\n    return 0', [ok, mal('0'), ok])
    expect(v.evaluacion.passed).toBe(false)
    expect(v.evaluacion.failedTests).toEqual([1])
    expect(v.evaluacion.message).toContain('f(2)')
    expect(v.evaluacion.message).toContain('se esperaba 2')
    expect(v.evaluacion.testsPassed).toBe(2)
  })

  it('un caso oculto fallido no revela entrada ni salida y no aparece en failedTests', () => {
    const v = evaluar(ex, 'def f(x):\n    return x', [ok, ok, mal('5')])
    expect(v.evaluacion.failedTests).toEqual([])
    expect(v.evaluacion.testsPassed).toBe(2)
    expect(JSON.stringify(v.evaluacion)).not.toMatch(/99|f\(99\)/)
    expect(v.evaluacion.message).toContain('no se muestran')
    expect(v.fallos[0]).toMatchObject({ oculto: true, entrada: 'f(99)' }) // el detalle interno sí lo conserva (Fase 3b)
  })

  it('tiempo agotado', () => {
    const t: ResultadoCaso = { passed: false, actual: null, error: null, timedOut: true }
    const v = evaluar(ex, 'while True: pass', [t, t, t])
    expect(v.evaluacion.title).toBe('Tiempo agotado')
    expect(v.evaluacion.message).toMatch(/3 segundos/)
    expect(v.evaluacion.testsPassed).toBe(0)
  })

  it('código vacío', () => {
    const v = evaluar(ex, 'def f(x):\n    pass', [mal('None'), mal('None'), mal('None')])
    expect(v.evaluacion.message).toContain('la función está vacía')
  })

  it('traduce errores de Python con su línea', () => {
    const err = (type: string, message: string, line: number | null = 3): ResultadoCaso => ({ passed: false, actual: null, timedOut: false, error: { type, message, line } })
    const msg = (r: ResultadoCaso) => evaluar(ex, 'def f(x):\n    y = 1\n    return z', [r, r, r]).evaluacion
    expect(msg(err('NameError', "name 'z' is not defined"))).toMatchObject({ line: 3, concept: 'Variables' })
    expect(msg(err('NameError', "name 'z' is not defined")).message).toContain('«z»')
    expect(msg(err('ZeroDivisionError', 'division by zero')).message).toContain('división entre cero')
    expect(msg(err('TypeError', "unsupported operand type(s) for +: 'int' and 'str'")).message).toContain('int(), float() o str()')
    expect(msg(err('IndexError', 'list index out of range')).message).toContain('empiezan en 0')
    expect(msg(err('RecursionError', 'maximum recursion depth exceeded')).concept).toBe('Recursión')
    expect(msg(err('EOFError', 'EOF when reading a line')).message).toContain('input()')
    expect(msg(err('Rarisimo', 'x')).message).toContain('Rarisimo')
  })

  it('NameError de la función pedida indica que debe llamarse igual', () => {
    const p = traducirError({ type: 'NameError', message: "name 'f' is not defined", line: null }, 'def g(x): return x', 'f(1)')
    expect(p.message).toContain('no define la función «f»')
  })
})

describe('mensajes de sintaxis (portados del frontend)', () => {
  it('falta el «:»', () => {
    expect(syntaxProblem('def f(x)\n    return x')).toMatchObject({ line: 1, concept: 'Sintaxis de bloques' })
  })
  it('comillas sin cerrar', () => {
    expect(syntaxProblem('x = "hola\nprint(x)')).toMatchObject({ line: 1, concept: 'Cadenas de texto' })
  })
  it('paréntesis sin cerrar y de más', () => {
    expect(syntaxProblem('print((1 + 2)')).toMatchObject({ concept: 'Paréntesis' })
    expect(syntaxProblem('print(1))')).toMatchObject({ concept: 'Paréntesis' })
  })
  it('falta indentación', () => {
    expect(syntaxProblem('def f(x):\nreturn x')).toMatchObject({ line: 2, concept: 'Indentación' })
  })
  it('código válido no da pista', () => {
    expect(syntaxProblem('def f(x):\n    return x  # ok\n')).toBeNull()
  })
  it('un SyntaxError real usa la pista amigable si la encuentra, y si no, el mensaje de Python', () => {
    expect(traducirError({ type: 'SyntaxError', message: "expected ':'", line: 1 }, 'if x\n    pass').message).toContain('le falta el «:»')
    expect(traducirError({ type: 'IndentationError', message: 'unexpected indent', line: 2 }, 'x = 1\n    y = 2').concept).toBe('Indentación')
    expect(traducirError({ type: 'SyntaxError', message: 'invalid syntax', line: 1 }, 'x = = 1').message).toContain('invalid syntax')
  })
})

describe('interpretación de la salida del contenedor', () => {
  const nonce = '@@abc@@'
  const tests = [{ input: 'f(1)', expected: '1' }, { input: 'f(2)', expected: '2' }]
  const s = { agotado: false, desbordado: false, codigoSalida: 0 }

  it('ignora líneas que no empiezan con el nonce (el estudiante no puede falsificar resultados)', () => {
    const salida = [
      '@@RESULT@@{"i":0,"passed":true}',
      `${nonce.slice(0, -1)}{"i":0,"passed":true}`, // nonce incompleto
      `${nonce}{"i":0,"passed":false,"actual":"7","error":null}`,
      'texto cualquiera',
    ].join('\n')
    const r = interpretar(salida, nonce, tests, s)
    expect(r[0]).toMatchObject({ passed: false, actual: '7' })
    expect(r[1]!.error?.type).toBe('EjecucionInterrumpida') // no llegó resultado
  })

  it('error fatal se aplica a todos los casos, y el timeout marca los casos pendientes', () => {
    const fatal = `${nonce}{"fatal":{"type":"SyntaxError","message":"x","line":1}}`
    expect(interpretar(fatal, nonce, tests, s).every((c) => c.error?.type === 'SyntaxError')).toBe(true)
    expect(interpretar('', nonce, tests, { ...s, agotado: true }).every((c) => c.timedOut)).toBe(true)
    expect(interpretar('', nonce, tests, { ...s, codigoSalida: 137 })[0]!.error?.message).toContain('memoria')
  })

  it('passed solo es verdadero sin error', () => {
    const l = `${nonce}{"i":0,"passed":true,"actual":"1","error":{"type":"X","message":"m","line":null}}`
    expect(interpretar(l, nonce, tests, s)[0]!.passed).toBe(false)
  })
})

describe('FakeRunner', () => {
  it('registra las llamadas', async () => {
    const f = FakeRunner.todos(true)
    const r = await f.run('x', [{ input: 'a', expected: 'b' }])
    expect(r[0]!.passed).toBe(true)
    expect(f.llamadas).toHaveLength(1)
  })
})

/* ───────── gamificación ───────── */

const catalogo: Catalogo = {
  modules: [
    { id: 1, order: 1, code: '01', title: 'Uno', summary: '' },
    { id: 2, order: 2, code: '05', title: 'Condicionales', summary: '' },
  ],
  lessons: [
    { id: 10, moduleId: 1, order: 1, title: 'L1', minutes: 5 },
    { id: 20, moduleId: 2, order: 1, title: 'L2', minutes: 5 },
  ],
  exercises: [
    { id: 100, moduleId: 1, lessonId: 10, order: 1, title: 'E1', goal: '', difficulty: 'basic' },
    { id: 101, moduleId: 1, lessonId: 10, order: 2, title: 'E2', goal: '', difficulty: 'medium' },
    { id: 200, moduleId: 2, lessonId: 20, order: 1, title: 'E3', goal: '', difficulty: 'advanced' },
  ],
}
const d = (s: string) => new Date(`2026-11-0${s}T10:00:00Z`)
const intento = (id: number, ejercicioId: number, resultado: boolean, pistas = 0) => ({ id, ejercicioId, fecha: d(String(id)), resultado, pistas, retro: null })
const progreso = (intentos: ReturnType<typeof intento>[], lecciones: number[] = [], insignias: string[] = []): Progreso =>
  armarProgreso(intentos, lecciones.map((id) => ({ id, fecha: d('9') })), insignias.map((codigo) => ({ codigo, fecha: d('9') })))
const ganadas = (p: Progreso) => newlyEarned(p, computeContext(p, catalogo))

describe('puntos', () => {
  it('suma por dificultad la primera vez que se resuelve + 5 por lección', () => {
    const p = progreso([intento(1, 100, true), intento(2, 100, true), intento(3, 101, false), intento(4, 200, true)], [10])
    expect(computePoints(p, catalogo)).toBe(POINTS.basic + POINTS.advanced + POINTS.lesson)
  })
  it('sin actividad son 0', () => expect(computePoints(progreso([]), catalogo)).toBe(0))
})

describe('reglas de insignias', () => {
  it('definiciones portadas del frontend', () => {
    expect(badgeDefs.map((b) => b.id)).toEqual(['primer-paso', 'constante', 'algoritmo', 'a-la-primera', 'lector', 'persistente', 'mitad-del-camino', 'decisiones', 'bucle', 'ruta-completa'])
  })
  it('primer paso y a la primera con un acierto limpio', () => {
    expect(ganadas(progreso([intento(1, 100, true)]))).toEqual(['primer-paso', 'a-la-primera'])
  })
  it('con pistas o varios intentos no hay "a la primera"; con 3 o más intentos hay "persistente"', () => {
    expect(ganadas(progreso([intento(1, 100, true, 2)]))).toEqual(['primer-paso'])
    expect(ganadas(progreso([intento(1, 100, false), intento(2, 100, true)]))).toEqual(['primer-paso'])
    expect(ganadas(progreso([intento(1, 100, false), intento(2, 100, false), intento(3, 100, true)]))).toEqual(['primer-paso', 'persistente'])
  })
  it('completar un módulo (lecciones y ejercicios) da "algoritmo"; el módulo 05 da "decisiones"', () => {
    const casi = progreso([intento(1, 100, true), intento(2, 101, true)], [])
    expect(ganadas(casi)).not.toContain('algoritmo')
    const m1 = progreso([intento(1, 100, true), intento(2, 101, true)], [10])
    expect(ganadas(m1)).toContain('algoritmo')
    expect(ganadas(m1)).not.toContain('decisiones')
    const ambos = progreso([intento(1, 100, true), intento(2, 101, true), intento(3, 200, true)], [10, 20])
    expect(ganadas(ambos)).toEqual(expect.arrayContaining(['algoritmo', 'decisiones']))
  })
  it('no repite insignias ya otorgadas', () => {
    expect(ganadas(progreso([intento(1, 100, true)], [], ['primer-paso']))).toEqual(['a-la-primera'])
  })
  it('"constante" necesita 5 ejercicios resueltos', () => {
    const cuatro = progreso([100, 101, 200, 201].map((e, i) => intento(i + 1, e, true)))
    expect(ganadas(cuatro)).not.toContain('constante')
    const cinco = progreso([100, 101, 200, 201, 202].map((e, i) => intento(i + 1, e, true)))
    expect(ganadas(cinco)).toContain('constante')
  })
})

describe('estado de progreso', () => {
  it('moduleStats, stats, ruta y vistas de insignias', () => {
    const p = progreso([intento(1, 100, false), intento(2, 100, true)], [10])
    expect(moduleStats(1, p, catalogo)).toMatchObject({ doneL: 1, doneE: 1, total: 3, pct: 67, status: 'progress' })
    expect(stats(p, catalogo)).toMatchObject({ solved: 1, totalExercises: 3, successRate: 50, attemptsCount: 2, points: 15 })
    const ruta = buildPath(1, p, catalogo)
    expect(ruta.map((i) => [i.kind, i.id, i.status])).toEqual([['lesson', 10, 'done'], ['exercise', 100, 'done'], ['exercise', 101, 'current']])
    const vistas = badgeViews(p, computeContext(p, catalogo))
    expect(vistas.find((b) => b.id === 'constante')).toMatchObject({ current: 1, target: 5 })
  })
  it('bestHints es el de la pasada que lo resolvió', () => {
    const p = progreso([intento(1, 100, false, 1), intento(2, 100, true, 2), intento(3, 100, true, 0)])
    expect(p.exercises[100]).toEqual({ solved: true, attempts: 3, bestHints: 2 })
  })
})
