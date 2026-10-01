import type { Exercise } from '@/types'

export interface Evaluation {
  passed: boolean
  title: string
  message: string
  concept?: string
  line?: number
  testsPassed: number
  testsTotal: number
  failedTests: number[]
}

const BLOCK_START = /^\s*(def|if|elif|else|for|while)\b/

function stripComments(code: string): string {
  return code
    .split('\n')
    .map((l) => l.replace(/\s+#.*$/, '').replace(/^\s*#.*$/, ''))
    .join('\n')
}

/** Chequeos sintácticos superficiales (simulan los errores más comunes de Python). */
function syntaxProblem(code: string): { message: string; line: number; concept: string } | null {
  const lines = code.split('\n')
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i]
    if (BLOCK_START.test(l) && l.trim() && !l.trimEnd().endsWith(':')) {
      return { line: i + 1, message: `A la línea ${i + 1} le falta el «:» al final. Toda línea que abre un bloque (def, if, elif, else, for, while) termina en dos puntos.`, concept: 'Sintaxis de bloques' }
    }
    const quotes = (l.match(/"/g) ?? []).length
    if (quotes % 2 === 1) return { line: i + 1, message: `En la línea ${i + 1} hay unas comillas sin cerrar. Cada texto necesita comillas de apertura y de cierre.`, concept: 'Cadenas de texto' }
  }
  let depth = 0
  for (const ch of code) {
    if (ch === '(' || ch === '[') depth++
    if (ch === ')' || ch === ']') depth--
    if (depth < 0) return { line: 1, message: 'Hay un paréntesis o corchete de cierre sin su apertura.', concept: 'Paréntesis' }
  }
  if (depth > 0) return { line: 1, message: 'Hay un paréntesis o corchete que nunca se cierra.', concept: 'Paréntesis' }
  // un bloque abierto sin cuerpo indentado
  for (let i = 0; i < lines.length - 1; i++) {
    if (BLOCK_START.test(lines[i]) && lines[i].trimEnd().endsWith(':')) {
      const next = lines.slice(i + 1).find((x) => x.trim())
      const indent = (s: string) => s.length - s.trimStart().length
      if (next && indent(next) <= indent(lines[i])) {
        return { line: i + 2, message: `Después de la línea ${i + 1} el código debe ir indentado. En Python la indentación indica qué instrucciones pertenecen al bloque.`, concept: 'Indentación' }
      }
    }
  }
  return null
}

const tokens = (s: string) => new Set(stripComments(s).match(/[A-Za-z_]+|\d+(?:\.\d+)?|[^\sA-Za-z_\d]/g) ?? [])

function similarity(a: string, b: string): number {
  const ta = tokens(a)
  const tb = tokens(b)
  const inter = [...ta].filter((t) => tb.has(t)).length
  const union = new Set([...ta, ...tb]).size
  return union === 0 ? 0 : inter / union
}

export function evaluate(ex: Exercise, rawCode: string): Evaluation {
  const total = Math.max(ex.tests.length, 1)
  const fail = (message: string, concept?: string, line?: number, ratio = 0): Evaluation => {
    const ok = Math.min(Math.floor(ratio * total), total - 1)
    return {
      passed: false,
      title: 'Hay un problema',
      message,
      concept,
      line,
      testsPassed: ok,
      testsTotal: total,
      failedTests: Array.from({ length: total - ok }, (_, i) => ok + i),
    }
  }

  const code = stripComments(rawCode)
  const body = code.split('\n').filter((l) => l.trim() && !/^\s*def\b/.test(l) && !/^\s*pass\s*$/.test(l))
  if (body.length === 0) return fail('Todavía no hay una solución: la función está vacía. Empieza por decidir qué debe devolver.', 'Retorno de valores')

  const syntax = syntaxProblem(rawCode)
  if (syntax) return fail(syntax.message, syntax.concept, syntax.line)

  const starterName = /def\s+(\w+)/.exec(ex.starter)?.[1] ?? /def\s+(\w+)/.exec(ex.expectedAnswer)?.[1]
  if (starterName && !new RegExp(`def\\s+${starterName}\\s*\\(`).test(code)) {
    return fail(`La función debe llamarse ${starterName}. Los nombres deben coincidir exactamente para que se pueda probar.`, 'Definición de funciones')
  }

  if (ex.rules.length > 0) {
    for (let i = 0; i < ex.rules.length; i++) {
      const rule = ex.rules[i]
      if (!new RegExp(rule.pattern).test(code)) return fail(rule.message, rule.concept, undefined, i / ex.rules.length)
    }
  } else if (similarity(code, ex.expectedAnswer) < 0.7) {
    return fail('Tu solución difiere bastante de lo esperado. Revisa el enunciado y los ejemplos antes de enviar de nuevo.', 'Enunciado del problema', undefined, 0.5)
  }

  return { passed: true, title: 'Correcto', message: ex.successNote, testsPassed: total, testsTotal: total, failedTests: [] }
}
