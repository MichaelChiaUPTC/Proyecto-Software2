/** Lo único que sale hacia el modelo: sin solución, sin datos del usuario, sin entradas/esperados de casos ocultos. */
export interface ContextoPista {
  enunciado: string
  codigo: string
  caso:
    | { oculto: false; entrada: string; esperado: string; obtenido: string | null; error: string | null }
    | { oculto: true; error: string | null }
}

/** Puerto: devuelve el texto de la pista o lanza si no pudo (el servicio aplica el respaldo). */
export interface HintProvider {
  hint(contexto: ContextoPista): Promise<string>
}

export interface FalloIntento {
  oculto: boolean
  entrada: string
  esperado: string
  actual: string | null
  error: { type: string; message: string } | null
  timedOut: boolean
}

export interface IntentoFallido {
  id: number
  codigo: string
  fallos: FalloIntento[]
}

export interface Pista {
  texto: string
  fuente: 'ai' | 'fallback'
}

export interface PistaRepo {
  ultimoIntentoFallido(usuarioId: number, ejercicioId: number): Promise<IntentoFallido | null>
  deIntento(intentoId: number): Promise<Pista | null>
  /** Pistas de IA (fuente 'ai') del usuario desde las 00:00 de hoy. */
  contarIaHoy(usuarioId: number): Promise<number>
  /** Pistas ya pedidas por el usuario en ese ejercicio (de cualquier fuente). */
  contarDeEjercicio(usuarioId: number, ejercicioId: number): Promise<number>
  /** Guarda; si el intento ya tenía pista (carrera) devuelve la existente. */
  guardar(intentoId: number, usuarioId: number, p: Pista): Promise<Pista>
}
