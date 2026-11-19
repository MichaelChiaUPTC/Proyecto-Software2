import type { Dificultad } from '../../progreso/domain/progreso.js'
import type { FalloCaso } from './veredicto.js'

export interface NuevoIntento {
  usuarioId: number
  ejercicioId: number
  codigo: string
  passed: boolean
  mensaje: string
  pistasUsadas: number
  /** Casos fallidos (solo uso interno). */
  fallos: FalloCaso[]
  dificultad: Dificultad
}

export interface IntentoRepo {
  /**
   * Guarda el intento y, si aprueba por primera vez, el evento IntentoAprobado, en una sola transacción.
   * Devuelve el id del intento y si fue la primera aprobación del ejercicio por ese usuario.
   */
  registrar(i: NuevoIntento): Promise<{ intentoId: number; primeraAprobacion: boolean }>
}
