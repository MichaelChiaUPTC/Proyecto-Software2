import type { ContextoPista, HintProvider } from '../domain/puertos.js'

/** Para pruebas: guarda los contextos recibidos y responde con `respuesta` (o lanza si es un Error). */
export class FakeHintProvider implements HintProvider {
  llamadas: ContextoPista[] = []
  constructor(public respuesta: string | Error = 'Revisa qué valor devuelve tu función.') {}
  async hint(c: ContextoPista) {
    this.llamadas.push(c)
    if (this.respuesta instanceof Error) throw this.respuesta
    return this.respuesta
  }
}
