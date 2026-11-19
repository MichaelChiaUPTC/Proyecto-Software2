import { codigoVacio, MENSAJE_TIEMPO, traducirError } from './mensajes.js'
import type { ResultadoCaso } from './runner.js'

export interface EjercicioEvaluable {
  tests: { input: string; expected: string; hidden: boolean }[]
  successNote: string
}

/** Misma forma que `Evaluation` del frontend. */
export interface Evaluacion {
  passed: boolean
  title: string
  message: string
  concept?: string
  line?: number
  testsPassed: number
  testsTotal: number
  /** Índices dentro de la lista de casos VISIBLES (la que recibe el estudiante). */
  failedTests: number[]
}

/** Detalle interno (no se envía al estudiante): lo necesita la Fase 3b (pistas con IA). */
export interface FalloCaso {
  indice: number
  oculto: boolean
  entrada: string
  esperado: string
  actual: string | null
  error: { type: string; message: string; line: number | null } | null
  timedOut: boolean
}

export interface Veredicto {
  evaluacion: Evaluacion
  fallos: FalloCaso[]
}

export function evaluar(ex: EjercicioEvaluable, code: string, resultados: ResultadoCaso[]): Veredicto {
  const total = ex.tests.length
  const fallos: FalloCaso[] = []
  const visibles: number[] = [] // índice de caso -> posición entre los visibles
  let vis = 0
  ex.tests.forEach((t, i) => {
    visibles[i] = t.hidden ? -1 : vis++
    const r = resultados[i]!
    if (!r.passed) fallos.push({ indice: i, oculto: t.hidden, entrada: t.input, esperado: t.expected, actual: r.actual, error: r.error, timedOut: r.timedOut })
  })
  const testsPassed = total - fallos.length
  const failedTests = fallos.filter((f) => !f.oculto).map((f) => visibles[f.indice]!)
  const base = { testsPassed, testsTotal: total, failedTests }

  if (fallos.length === 0) {
    return { fallos, evaluacion: { passed: true, title: 'Correcto', message: ex.successNote, ...base } }
  }
  const mal = (message: string, concept?: string, line?: number, title = 'Hay un problema'): Veredicto => ({
    fallos,
    evaluacion: { passed: false, title, message, concept, line, ...base },
  })

  if (fallos.some((f) => f.timedOut)) return mal(MENSAJE_TIEMPO, 'Ciclos', undefined, 'Tiempo agotado')
  if (codigoVacio(code)) return mal('Todavía no hay una solución: la función está vacía. Empieza por decidir qué debe devolver.', 'Retorno de valores')

  const conError = fallos.find((f) => f.error)
  if (conError?.error) {
    const p = traducirError(conError.error, code, conError.oculto ? undefined : conError.entrada)
    return mal(p.message, p.concept, p.line)
  }

  // Respuesta incorrecta. Del caso visible se puede mostrar lo esperado y lo obtenido; de los ocultos, nada.
  const visible = fallos.find((f) => !f.oculto)
  if (visible) {
    return mal(`Con ${visible.entrada} se esperaba ${visible.esperado}, pero tu código dio ${visible.actual ?? 'nada'}.`, 'Enunciado del problema')
  }
  const n = fallos.length
  return mal(
    `Tu solución pasa los ejemplos visibles, pero falla en ${n === 1 ? 'otro caso de prueba' : `otros ${n} casos de prueba`} que no se muestran. Piensa en valores límite: cero, negativos, listas vacías o textos distintos.`,
    'Casos límite',
  )
}
