import { AppError } from '../../../shared/errors.js'
import type { ContenidoRepo } from '../../contenidos/domain/contenido.js'
import { tieneBloqueDeCodigo } from '../domain/prompt.js'
import type { ContextoPista, HintProvider, IntentoFallido, Pista, PistaRepo } from '../domain/puertos.js'

export const MAX_PISTAS_IA_DIA = 10
const GENERICA = 'Relee el enunciado, prueba tu función a mano con el ejemplo y compara lo que devuelve con lo que se espera.'

export class PistaService {
  /** `provider` null = sin IA (AI_PROVIDER=none o sin clave). */
  constructor(private readonly contenido: ContenidoRepo, private readonly repo: PistaRepo, private readonly provider: HintProvider | null) {}

  async pedir(usuarioId: number, ejercicioId: number): Promise<Pista> {
    const ej = await this.contenido.ejercicioPorId(ejercicioId, true)
    if (!ej) throw new AppError(404, 'NO_ENCONTRADO', 'El ejercicio no existe.')
    const intento = await this.repo.ultimoIntentoFallido(usuarioId, ejercicioId)
    if (!intento) throw new AppError(422, 'SIN_INTENTO_FALLIDO', 'Primero envía una solución: la pista se basa en tu último intento fallido.')

    const previa = await this.repo.deIntento(intento.id)
    if (previa) return previa // 1 pista por intento fallido: se devuelve la misma
    if ((await this.repo.contarIaHoy(usuarioId)) >= MAX_PISTAS_IA_DIA) {
      throw new AppError(429, 'LIMITE_PISTAS_IA', `Llegaste al límite de ${MAX_PISTAS_IA_DIA} pistas con IA por hoy. Mañana podrás pedir más.`)
    }

    const pedidas = await this.repo.contarDeEjercicio(usuarioId, ejercicioId)
    const respaldo = ej.hints.length ? ej.hints[Math.min(pedidas, ej.hints.length - 1)]! : GENERICA

    let pista: Pista = { texto: respaldo, fuente: 'fallback' }
    if (this.provider) {
      try {
        const t = (await this.provider.hint(this.contexto(ej.statement, intento))).trim()
        if (t && !tieneBloqueDeCodigo(t)) pista = { texto: t, fuente: 'ai' }
      } catch (e) {
        console.warn('Pista IA no disponible:', e instanceof Error ? e.message : e) // sin contexto del estudiante en el log
      }
    }
    return this.repo.guardar(intento.id, usuarioId, pista)
  }

  private contexto(enunciado: string, i: IntentoFallido): ContextoPista {
    const f = i.fallos[0]
    const error = f?.timedOut ? 'tiempo agotado (posible ciclo infinito)' : f?.error ? `${f.error.type}: ${f.error.message}` : null
    const caso: ContextoPista['caso'] = !f || f.oculto
      ? { oculto: true, error }
      : { oculto: false, entrada: f.entrada.slice(0, 500), esperado: f.esperado.slice(0, 500), obtenido: f.actual?.slice(0, 500) ?? null, error }
    return { enunciado, codigo: i.codigo, caso }
  }
}
