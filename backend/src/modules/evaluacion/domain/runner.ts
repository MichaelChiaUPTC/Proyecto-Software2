/** Un caso a ejecutar: `input` es una expresión Python evaluada tras el código del estudiante. */
export interface CasoEjecucion {
  input: string
  expected: string
}

export interface ErrorPython {
  /** Nombre de la excepción, p. ej. NameError, SyntaxError. */
  type: string
  message: string
  /** Línea dentro del código del estudiante, si se pudo determinar. */
  line: number | null
}

export interface ResultadoCaso {
  passed: boolean
  /** Lo que imprimió o la repr del valor devuelto (recortado). null si hubo error. */
  actual: string | null
  error: ErrorPython | null
  timedOut: boolean
}

/** Puerto del motor de corrección: ejecuta el código contra los casos y devuelve un resultado por caso. */
export interface CodeRunner {
  run(code: string, tests: CasoEjecucion[]): Promise<ResultadoCaso[]>
}
