import type { ErrorPython } from './runner.js'

export interface Pista {
  message: string
  line?: number
  concept: string
}

const BLOCK_START = /^\s*(def|if|elif|else|for|while)\b/

/**
 * Chequeos sintácticos superficiales de los errores más comunes (portado de frontend/src/utils/evaluate.ts).
 * Solo se usa cuando Python ya reportó un SyntaxError/IndentationError, para dar un mensaje más didáctico.
 */
export function syntaxProblem(code: string): Pista | null {
  const lines = code.split('\n')
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i]!
    if (BLOCK_START.test(l) && l.trim() && !l.replace(/\s+#.*$/, '').trimEnd().endsWith(':')) {
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
  for (let i = 0; i < lines.length - 1; i++) {
    if (BLOCK_START.test(lines[i]!) && lines[i]!.trimEnd().endsWith(':')) {
      const next = lines.slice(i + 1).find((x) => x.trim())
      const indent = (s: string) => s.length - s.trimStart().length
      if (next && indent(next) <= indent(lines[i]!)) {
        return { line: i + 2, message: `Después de la línea ${i + 1} el código debe ir indentado. En Python la indentación indica qué instrucciones pertenecen al bloque.`, concept: 'Indentación' }
      }
    }
  }
  return null
}

const nombreEntre = (m: string) => /'([^']+)'/.exec(m)?.[1]

const EN_LINEA = (line: number | null) => (line ? ` (línea ${line})` : '')

/** Traduce un error real de Python a un mensaje amigable en español. */
export function traducirError(e: ErrorPython, code: string, entradaCaso?: string): Pista {
  const line = e.line ?? undefined
  const donde = EN_LINEA(e.line)
  const m = e.message
  switch (e.type) {
    case 'SyntaxError':
    case 'IndentationError':
    case 'TabError': {
      const previa = syntaxProblem(code)
      if (previa) return previa
      if (e.type !== 'SyntaxError' || /indent/i.test(m)) {
        return { line, concept: 'Indentación', message: `Hay un problema de indentación${donde}. En Python las instrucciones de un mismo bloque deben empezar en la misma columna (usa 4 espacios y no mezcles tabuladores).` }
      }
      return { line, concept: 'Sintaxis', message: `Python no entiende una instrucción${donde}: ${m}. Revisa que no falten comillas, paréntesis o dos puntos.` }
    }
    case 'NameError': {
      const n = nombreEntre(m) ?? 'un nombre'
      if (entradaCaso && nombreEntre(m) && new RegExp(`^\\s*${n}\\s*\\(`).test(entradaCaso)) {
        return { concept: 'Definición de funciones', message: `Tu código no define la función «${n}». El nombre debe coincidir exactamente con el del enunciado para que se pueda probar.` }
      }
      return { line, concept: 'Variables', message: `El nombre «${n}» no está definido${donde}. Revisa que lo hayas escrito igual que al crearlo y que lo declares antes de usarlo.` }
    }
    case 'TypeError':
      if (/missing \d+ required positional argument|takes \d+ positional argument/.test(m)) {
        return { line, concept: 'Parámetros de funciones', message: `La función recibe un número distinto de parámetros al esperado${donde}. Revisa la firma que pide el enunciado.` }
      }
      return { line, concept: 'Tipos de datos', message: `Mezclaste tipos de datos que no se pueden combinar${donde}: ${m}. Revisa si necesitas convertir con int(), float() o str().` }
    case 'ZeroDivisionError':
      return { line, concept: 'Operadores aritméticos', message: `Hay una división entre cero${donde}. Comprueba el valor del divisor antes de dividir.` }
    case 'IndexError':
      return { line, concept: 'Listas', message: `Intentas acceder a una posición que no existe${donde}. Recuerda que los índices empiezan en 0 y llegan hasta longitud - 1.` }
    case 'KeyError':
      return { line, concept: 'Diccionarios', message: `Buscas una clave que no existe${donde}: ${m}.` }
    case 'ValueError':
      return { line, concept: 'Conversión de tipos', message: `Un valor no es válido para la operación${donde}: ${m}.` }
    case 'AttributeError':
      return { line, concept: 'Objetos y métodos', message: `Usas un método o atributo que ese tipo de dato no tiene${donde}: ${m}.` }
    case 'RecursionError':
      return { line, concept: 'Recursión', message: `La función se llama a sí misma sin terminar${donde}. Revisa el caso base de la recursión.` }
    case 'EOFError':
      return { line, concept: 'Entrada de datos', message: `Tu código intenta leer datos con input()${donde}. En los ejercicios la función recibe sus datos como parámetros; no uses input().` }
    case 'EjecucionInterrumpida':
      return { concept: 'Eficiencia', message: m }
    default:
      return { line, concept: 'Depuración', message: `Tu código lanzó un error${donde}: ${e.type}${m ? ` — ${m}` : ''}.` }
  }
}

export const MENSAJE_TIEMPO = 'Tu código tardó demasiado en ejecutarse (más de 3 segundos). Revisa si hay un ciclo que nunca termina: ¿la condición del while llega a ser falsa?'

/** El código no tiene instrucciones aparte de def/pass (portado de evaluate.ts). */
export function codigoVacio(code: string): boolean {
  const sinComentarios = code.split('\n').map((l) => l.replace(/\s+#.*$/, '').replace(/^\s*#.*$/, ''))
  return sinComentarios.filter((l) => l.trim() && !/^\s*def\b/.test(l) && !/^\s*pass\s*$/.test(l)).length === 0
}
