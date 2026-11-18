import { AppError } from '../../../shared/errors.js'
import type { ContenidoRepo } from '../../contenidos/domain/contenido.js'
import { POINTS } from '../../progreso/domain/progreso.js'
import type { Gamificacion } from '../../progreso/domain/puertos.js'
import type { IntentoRepo } from '../domain/puertos.js'
import type { CodeRunner } from '../domain/runner.js'
import { evaluar, type FalloCaso } from '../domain/veredicto.js'

/** Misma forma que `SubmitResult` del frontend. */
export interface SubmitResult {
  passed: boolean
  title: string
  message: string
  concept?: string
  line?: number
  testsPassed: number
  testsTotal: number
  failedTests: number[]
  newBadges: string[]
  pointsGained: number
}

export class EvaluacionService {
  constructor(
    private readonly contenido: ContenidoRepo,
    private readonly runner: CodeRunner,
    private readonly intentos: IntentoRepo,
    private readonly gamificacion: Gamificacion,
  ) {}

  /**
   * Ejecuta el código contra todos los casos (visibles y ocultos), guarda el intento y aplica la gamificación.
   * `fallos` es el detalle interno (qué caso falló y por qué) para la Fase 3b; no debe enviarse al estudiante.
   */
  async enviar(usuarioId: number, ejercicioId: number, codigo: string, pistasUsadas: number): Promise<{ resultado: SubmitResult; fallos: FalloCaso[] }> {
    const ej = await this.contenido.ejercicioPorId(ejercicioId, true)
    if (!ej) throw new AppError(404, 'NO_ENCONTRADO', 'El ejercicio no existe.')
    if (ej.tests.length === 0) throw new AppError(422, 'EJERCICIO_SIN_CASOS', 'Este ejercicio no tiene casos de prueba.')

    const resultados = await this.runner.run(codigo, ej.tests.map(({ input, expected }) => ({ input, expected })))
    const { evaluacion, fallos } = evaluar(ej, codigo, resultados)

    const marca = await this.gamificacion.marca(usuarioId)
    const { primeraAprobacion } = await this.intentos.registrar({
      usuarioId, ejercicioId, codigo, passed: evaluacion.passed, mensaje: evaluacion.message, pistasUsadas, fallos, dificultad: ej.difficulty,
    })
    let newBadges: string[] = []
    if (primeraAprobacion) {
      try {
        await this.gamificacion.procesarPendientes()
        newBadges = await this.gamificacion.nuevas(usuarioId, marca)
      } catch (e) {
        console.error('Gamificación: el evento queda pendiente para el procesador de respaldo', e) // el intento ya está guardado
      }
    }

    return { resultado: { ...evaluacion, newBadges, pointsGained: primeraAprobacion ? POINTS[ej.difficulty] : 0 }, fallos }
  }
}
