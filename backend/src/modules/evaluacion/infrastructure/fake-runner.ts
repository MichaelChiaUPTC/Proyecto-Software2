import type { CasoEjecucion, CodeRunner, ResultadoCaso } from '../domain/runner.js'

type Manejador = (code: string, tests: CasoEjecucion[]) => ResultadoCaso[] | Promise<ResultadoCaso[]>

/** Runner para pruebas: el resultado lo decide una función (sin Docker). */
export class FakeRunner implements CodeRunner {
  llamadas: { code: string; tests: CasoEjecucion[] }[] = []
  constructor(private readonly manejador: Manejador) {}

  async run(code: string, tests: CasoEjecucion[]) {
    this.llamadas.push({ code, tests })
    return this.manejador(code, tests)
  }

  /** Aprueba o reprueba todos los casos. */
  static todos(passed: boolean): FakeRunner {
    return new FakeRunner((_c, tests) => tests.map((t) => ({ passed, actual: passed ? t.expected : '0', error: null, timedOut: false })))
  }
}
