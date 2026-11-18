import type { Catalogo } from '../../progreso/domain/progreso.js'
import type { DatosEstudiante } from './reporte.js'

export interface ConteoContenido { modulosTotal: number; modulosPublicados: number; leccionesPublicadas: number; ejerciciosPublicados: number }

export interface ReporteRepo {
  catalogo(): Promise<Catalogo>
  conteos(): Promise<ConteoContenido>
  /** Estudiantes activos (opcionalmente de un grupo; `null` = sin grupo) con su progreso agregado. */
  estudiantes(grupo?: string | null): Promise<DatosEstudiante[]>
}
