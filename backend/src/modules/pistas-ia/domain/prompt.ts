import type { ContextoPista } from './puertos.js'

export const SISTEMA =
  'Eres un tutor de programación para estudiantes principiantes de Python. Responde siempre en español. ' +
  'Orienta al estudiante hacia el error sin dar el código de la solución ni la línea corregida. ' +
  'No escribas bloques de código. Máximo 3 frases.'

export function construirPrompt(c: ContextoPista): string {
  const err = c.caso.error ? ` Error: ${c.caso.error}` : ''
  const caso = c.caso.oculto
    ? `Falló un caso de prueba oculto.${err}`
    : `Caso fallido: entrada ${c.caso.entrada}; esperado ${c.caso.esperado}; obtenido ${c.caso.obtenido ?? 'nada'}.${err}`
  return `Enunciado del ejercicio:\n${c.enunciado}\n\nCódigo del estudiante:\n${c.codigo}\n\n${caso}\n\nDa una pista breve.`
}

/** Una respuesta con bloque de código se descarta: podría regalar la solución. */
export const tieneBloqueDeCodigo = (t: string) => t.includes('```')
