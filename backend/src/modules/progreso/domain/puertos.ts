import type { Catalogo, Progreso } from './progreso.js'

export interface Snapshot {
  catalogo: Catalogo
  progreso: Progreso
  titulos: { ejercicios: Map<number, string>; lecciones: Map<number, string> }
}

export interface ProgresoRepo {
  snapshot(usuarioId: number): Promise<Snapshot>
  /** Inserta la lección completada y el evento LeccionCompletada en una transacción. Devuelve false si ya estaba. */
  completarLeccion(usuarioId: number, leccionId: number): Promise<boolean>
  /** Asegura que las definiciones de insignias existan en la tabla `insignia`. */
  asegurarInsignias(): Promise<void>
  /**
   * Toma el siguiente evento pendiente (IntentoAprobado / LeccionCompletada), calcula con `otorgar` las insignias nuevas
   * del usuario, las guarda con sus eventos InsigniaObtenida y marca el evento como procesado, todo en una transacción.
   * Devuelve false si no había eventos pendientes.
   */
  procesarSiguiente(otorgar: (s: Snapshot) => string[]): Promise<boolean>
  /** Id del último evento InsigniaObtenida del usuario (marca para saber cuáles son nuevas). */
  marcaInsignias(usuarioId: number): Promise<number>
  /** Nombres de las insignias que el usuario obtuvo después de `marca`. */
  insigniasDesde(usuarioId: number, marca: number): Promise<string[]>
}

/** Lo que necesita el módulo de evaluación del de progreso: aplicar los eventos y saber qué insignias salieron. */
export interface Gamificacion {
  marca(usuarioId: number): Promise<number>
  procesarPendientes(): Promise<number>
  nuevas(usuarioId: number, marca: number): Promise<string[]>
}
