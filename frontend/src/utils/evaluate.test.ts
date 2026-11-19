import { describe, expect, it } from 'vitest'
import { evaluate } from './evaluate'
import { exercisesSeed } from '@/mocks/exercises'
import type { Exercise } from '@/types'

const ex: Exercise = {
  ...exercisesSeed[0],
  starter: 'def doble(x):\n    pass\n',
  expectedAnswer: 'def doble(x):\n    return x * 2\n',
  tests: [{ input: 'doble(2)', expected: '4' }, { input: 'doble(0)', expected: '0' }],
  rules: [],
  successNote: '¡Bien!',
}

describe('utils/evaluate (modo demostración)', () => {
  it('la solución esperada de cada ejercicio del catálogo demo aprueba', () => {
    for (const e of exercisesSeed) expect(evaluate(e, e.expectedAnswer).passed, e.title).toBe(true)
  })

  it('el código inicial de cada ejercicio no aprueba', () => {
    for (const e of exercisesSeed) expect(evaluate(e, e.starter).passed, e.title).toBe(false)
  })

  it('una función vacía pide empezar por el retorno', () => {
    const r = evaluate(ex, ex.starter)
    expect(r).toMatchObject({ passed: false, concept: 'Retorno de valores', testsPassed: 0, testsTotal: 2 })
  })

  it('detecta el «:» faltante e indica la línea', () => {
    const r = evaluate(ex, 'def doble(x)\n    return x * 2')
    expect(r).toMatchObject({ passed: false, line: 1, concept: 'Sintaxis de bloques' })
    expect(r.message).toMatch(/dos puntos|«:»/)
  })

  it('detecta comillas y paréntesis sin cerrar', () => {
    expect(evaluate(ex, 'def doble(x):\n    return "hola').concept).toBe('Cadenas de texto')
    expect(evaluate(ex, 'def doble(x):\n    return (x * 2').concept).toBe('Paréntesis')
    expect(evaluate(ex, 'def doble(x):\n    return x * 2)').concept).toBe('Paréntesis')
  })

  it('detecta un bloque sin indentar', () => {
    expect(evaluate(ex, 'def doble(x):\nreturn x * 2').concept).toBe('Indentación')
  })

  it('exige el nombre de la función', () => {
    const r = evaluate(ex, 'def duplicar(x):\n    return x * 2')
    expect(r).toMatchObject({ passed: false, concept: 'Definición de funciones' })
    expect(r.message).toContain('doble')
  })

  it('con reglas, falla en la primera que no se cumple y cuenta las anteriores como superadas', () => {
    const withRules: Exercise = { ...ex, tests: [...ex.tests, ...ex.tests], rules: [{ pattern: 'return', message: 'Falta return', concept: 'R' }, { pattern: '\\*', message: 'Falta multiplicar', concept: 'M' }] }
    const r = evaluate(withRules, 'def doble(x):\n    return x + x')
    expect(r).toMatchObject({ passed: false, message: 'Falta multiplicar', testsPassed: 2, testsTotal: 4, failedTests: [2, 3] })
  })

  it('sin reglas compara por similitud con la solución esperada y aprueba si se parece', () => {
    expect(evaluate(ex, 'def doble(x):\n    return 7 + 8 - 3').passed).toBe(false)
    expect(evaluate(ex, 'def doble(x):\n    return x * 2  # comentario').passed).toBe(true)
  })

  it('un resultado aprobado trae todos los casos y la nota de éxito', () => {
    expect(evaluate(ex, ex.expectedAnswer)).toMatchObject({ passed: true, message: '¡Bien!', testsPassed: 2, testsTotal: 2, failedTests: [] })
  })
})
