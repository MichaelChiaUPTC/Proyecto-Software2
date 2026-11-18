// Tipos con los mismos nombres de campo que frontend/src/types/index.ts (ids numéricos).
export type Dificultad = 'basic' | 'medium' | 'advanced'
export type Kind = 'modules' | 'lessons' | 'exercises'

export type LessonBlock =
  | { type: 'p'; text: string }
  | { type: 'h'; id: string; text: string }
  | { type: 'code'; code: string; caption?: string; lang?: string }
  | { type: 'callout'; title: string; text: string }
  | { type: 'list'; items: string[] }
  | { type: 'flow'; steps: { kind: 'start' | 'decision' | 'action' | 'end'; label: string; yes?: string; no?: string }[]; caption?: string }

export interface Modulo {
  id: number
  order: number
  code: string
  title: string
  summary: string
  published: boolean
}

export interface Leccion {
  id: number
  moduleId: number
  order: number
  title: string
  minutes: number
  published: boolean
  blocks: LessonBlock[]
}

export interface Caso {
  input: string
  expected: string
}
export interface CasoCompleto extends Caso {
  hidden: boolean
}
export interface Regla {
  pattern: string
  message: string
  concept: string
}

export interface Ejercicio {
  id: number
  moduleId: number
  lessonId: number
  order: number
  title: string
  statement: string
  goal: string
  difficulty: Dificultad
  published: boolean
  examples: Caso[]
  constraints: string[]
  hints: string[]
  starter: string
  expectedAnswer: string
  tests: CasoCompleto[]
  rules: Regla[]
  successNote: string
}

export type DatosModulo = Pick<Modulo, 'code' | 'title' | 'summary'>
export type DatosLeccion = Pick<Leccion, 'title' | 'minutes' | 'blocks'>
export type DatosEjercicio = Omit<Ejercicio, 'id' | 'moduleId' | 'lessonId' | 'order' | 'published'>

export interface ContenidoRepo {
  listarModulos(soloVisibles: boolean): Promise<Modulo[]>
  moduloPorId(id: number, soloVisibles: boolean): Promise<Modulo | null>
  listarLecciones(f: { moduloId?: number; soloVisibles: boolean }): Promise<Leccion[]>
  leccionPorId(id: number, soloVisibles: boolean): Promise<Leccion | null>
  listarEjercicios(f: { moduloId?: number; leccionId?: number; soloVisibles: boolean }): Promise<Ejercicio[]>
  ejercicioPorId(id: number, soloVisibles: boolean): Promise<Ejercicio | null>
  crearModulo(d: DatosModulo): Promise<Modulo>
  actualizarModulo(id: number, d: DatosModulo): Promise<void>
  crearLeccion(moduloId: number, d: DatosLeccion): Promise<Leccion>
  actualizarLeccion(id: number, d: DatosLeccion): Promise<void>
  crearEjercicio(leccionId: number, d: DatosEjercicio): Promise<Ejercicio>
  actualizarEjercicio(id: number, d: DatosEjercicio): Promise<void>
  /** Lecciones de un módulo o casos de prueba de un ejercicio. */
  contarHijos(kind: 'modules' | 'exercises', id: number): Promise<number>
  fijarPublicado(kind: Kind, id: number, valor: boolean): Promise<void>
  /** Intercambia el orden con el vecino del mismo grupo, en una transacción. */
  mover(kind: Kind, id: number, dir: -1 | 1): Promise<void>
}
