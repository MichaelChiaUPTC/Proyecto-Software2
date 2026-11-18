import { computeContext, newlyEarned } from '../domain/progreso.js'
import type { Gamificacion, ProgresoRepo, Snapshot } from '../domain/puertos.js'

const otorgar = (s: Snapshot) => newlyEarned(s.progreso, computeContext(s.progreso, s.catalogo))

/**
 * Consumidor de la tabla evento_outbox dentro del mismo proceso. Se invoca justo después de confirmar la transacción
 * que escribió el evento y, además, de forma periódica como respaldo (por si el proceso cayó entre el commit y la llamada).
 * Es idempotente: las insignias se insertan con INSERT IGNORE y cada evento se marca como procesado una sola vez.
 */
export class ProcesadorEventos implements Gamificacion {
  private cola: Promise<unknown> = Promise.resolve()

  constructor(private readonly repo: ProgresoRepo) {}

  /** Procesa todos los eventos pendientes (en serie dentro del proceso). Devuelve cuántos procesó. */
  procesarPendientes(): Promise<number> {
    const r = this.cola.then(() => this.ciclo())
    this.cola = r.catch(() => {})
    return r
  }

  private async ciclo() {
    await this.repo.asegurarInsignias()
    let n = 0
    while (await this.repo.procesarSiguiente(otorgar)) n++
    return n
  }

  marca(usuarioId: number) {
    return this.repo.marcaInsignias(usuarioId)
  }

  nuevas(usuarioId: number, marca: number) {
    return this.repo.insigniasDesde(usuarioId, marca)
  }

  /** Respaldo periódico: nunca lanza (registra el error y reintenta en el siguiente intervalo). */
  iniciarRespaldo(ms: number): NodeJS.Timeout {
    const t = setInterval(() => {
      this.procesarPendientes().catch((e) => console.error('Procesador de eventos:', e))
    }, ms)
    t.unref()
    return t
  }
}
