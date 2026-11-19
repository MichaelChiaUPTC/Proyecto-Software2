import { AppError } from '../../../shared/errors.js'
import type { ContenidoRepo, DatosEjercicio, DatosLeccion, DatosModulo, Ejercicio, Kind } from '../domain/contenido.js'

const noEncontrado = (que: string) => new AppError(404, 'NO_ENCONTRADO', `${que} no existe.`)
const nombres: Record<Kind, string> = { modules: 'El módulo', lessons: 'La lección', exercises: 'El ejercicio' }

/** Vista para el estudiante: sin solución, reglas internas ni casos ocultos. */
export function paraEstudiante(e: Ejercicio) {
  const { tests, ...resto } = e
  const vista: Partial<Ejercicio> & Omit<Ejercicio, 'tests' | 'expectedAnswer' | 'rules'> = { ...resto }
  delete vista.expectedAnswer
  delete vista.rules
  return { ...vista, tests: tests.filter((t) => !t.hidden).map(({ input, expected }) => ({ input, expected })) }
}

export class ContenidoService {
  constructor(private readonly repo: ContenidoRepo) {}

  // ---- Estudiante: solo publicado (con su módulo y lección publicados) ----
  modulos() {
    return this.repo.listarModulos(true)
  }

  async modulo(id: number) {
    const module = await this.repo.moduloPorId(id, true)
    if (!module) throw noEncontrado('El módulo')
    const [lessons, ejercicios] = await Promise.all([
      this.repo.listarLecciones({ moduloId: id, soloVisibles: true }),
      this.repo.listarEjercicios({ moduloId: id, soloVisibles: true }),
    ])
    return { module, lessons, exercises: ejercicios.map(paraEstudiante) }
  }

  async leccion(id: number) {
    const lesson = await this.repo.leccionPorId(id, true)
    if (!lesson) throw noEncontrado('La lección')
    return lesson
  }

  async ejercicios(f: { moduloId?: number; leccionId?: number }) {
    return (await this.repo.listarEjercicios({ ...f, soloVisibles: true })).map(paraEstudiante)
  }

  async ejercicio(id: number) {
    const e = await this.repo.ejercicioPorId(id, true)
    if (!e) throw noEncontrado('El ejercicio')
    return paraEstudiante(e)
  }

  // ---- Docente ----
  async todo() {
    const [modules, lessons, exercises] = await Promise.all([
      this.repo.listarModulos(false),
      this.repo.listarLecciones({ soloVisibles: false }),
      this.repo.listarEjercicios({ soloVisibles: false }),
    ])
    return { modules, lessons, exercises }
  }

  crearModulo(d: DatosModulo) {
    return this.repo.crearModulo(d)
  }

  async editarModulo(id: number, d: DatosModulo) {
    await this.existente('modules', id)
    await this.repo.actualizarModulo(id, d)
    return (await this.repo.moduloPorId(id, false))!
  }

  async crearLeccion(moduloId: number, d: DatosLeccion) {
    if (!(await this.repo.moduloPorId(moduloId, false))) throw noEncontrado('El módulo')
    return this.repo.crearLeccion(moduloId, d)
  }

  async editarLeccion(id: number, d: DatosLeccion) {
    await this.existente('lessons', id)
    await this.repo.actualizarLeccion(id, d)
    return (await this.repo.leccionPorId(id, false))!
  }

  async crearEjercicio(leccionId: number, d: DatosEjercicio) {
    if (!(await this.repo.leccionPorId(leccionId, false))) throw noEncontrado('La lección')
    return this.repo.crearEjercicio(leccionId, d)
  }

  async editarEjercicio(id: number, d: DatosEjercicio) {
    const actual = await this.repo.ejercicioPorId(id, false)
    if (!actual) throw noEncontrado('El ejercicio')
    if (actual.published && d.tests.length === 0) {
      throw new AppError(422, 'EJERCICIO_SIN_CASOS', 'Un ejercicio publicado debe conservar al menos un caso de prueba.')
    }
    await this.repo.actualizarEjercicio(id, d)
    return (await this.repo.ejercicioPorId(id, false))!
  }

  /** Alterna publicado/borrador aplicando las reglas de negocio al publicar. */
  async alternarPublicacion(kind: Kind, id: number) {
    const actual = await this.existente(kind, id)
    if (!actual.published) {
      if (kind === 'exercises' && (await this.repo.contarHijos('exercises', id)) < 1) {
        throw new AppError(422, 'EJERCICIO_SIN_CASOS', 'No se puede publicar un ejercicio sin al menos un caso de prueba.')
      }
      if (kind === 'modules' && (await this.repo.contarHijos('modules', id)) < 1) {
        throw new AppError(422, 'MODULO_SIN_LECCIONES', 'No se puede publicar un módulo sin al menos una lección.')
      }
    }
    await this.repo.fijarPublicado(kind, id, !actual.published)
    return this.existente(kind, id)
  }

  async mover(kind: Kind, id: number, dir: -1 | 1) {
    await this.existente(kind, id)
    await this.repo.mover(kind, id, dir)
    return this.todo()
  }

  private async existente(kind: Kind, id: number) {
    const r =
      kind === 'modules' ? await this.repo.moduloPorId(id, false)
      : kind === 'lessons' ? await this.repo.leccionPorId(id, false)
      : await this.repo.ejercicioPorId(id, false)
    if (!r) throw noEncontrado(nombres[kind])
    return r
  }
}
