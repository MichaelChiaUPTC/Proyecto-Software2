import { AppError } from '../../../shared/errors.js'
import { paraEstudiante } from '../../contenidos/application/contenido-service.js'
import type { ContenidoRepo } from '../../contenidos/domain/contenido.js'
import { badgeDefs } from '../domain/insignias.js'
import {
  activity, badgeViews, buildPath, computeContext, findTarget, moduleStats, nextAfter, overview, stats, type Catalogo,
} from '../domain/progreso.js'
import type { ProgresoRepo, Snapshot } from '../domain/puertos.js'
import type { ProcesadorEventos } from './procesador-eventos.js'

const noEncontrado = (que: string) => new AppError(404, 'NO_ENCONTRADO', `${que} no existe.`)
const nombresInsignias = new Map(badgeDefs.map((b) => [b.id, b.name]))

const publicados = (c: Catalogo) => [...c.modules].sort((a, b) => a.order - b.order)

/** Casos de uso del estudiante sobre su progreso. La forma de las respuestas sigue a `api.student.*` del frontend. */
export class ProgresoService {
  constructor(
    private readonly repo: ProgresoRepo,
    private readonly procesador: ProcesadorEventos,
    private readonly contenido: ContenidoRepo,
  ) {}

  private actividadDe(s: Snapshot, limit: number) {
    return activity(s.progreso, limit, { ...s.titulos, insignias: nombresInsignias })
  }

  async completarLeccion(usuarioId: number, leccionId: number) {
    const antes = await this.repo.snapshot(usuarioId)
    const leccion = antes.catalogo.lessons.find((l) => l.id === leccionId)
    if (!leccion) throw noEncontrado('La lección')
    const marca = await this.procesador.marca(usuarioId)
    if (await this.repo.completarLeccion(usuarioId, leccionId)) await this.procesador.procesarPendientes()
    const s = await this.repo.snapshot(usuarioId)
    return { next: nextAfter('lesson', leccionId, leccion.moduleId, s.progreso, s.catalogo), newBadges: await this.procesador.nuevas(usuarioId, marca) }
  }

  async progreso(usuarioId: number) {
    const s = await this.repo.snapshot(usuarioId)
    const { progreso: p, catalogo: c } = s
    const st = stats(p, c)
    return {
      ...st,
      pendingExercises: st.totalExercises - st.solved,
      modules: publicados(c).map((m) => ({ ...overview(m, p, c), stats: moduleStats(m.id, p, c) })),
      activity: this.actividadDe(s, 10),
      modulesCompleted: c.modules.filter((m) => moduleStats(m.id, p, c).status === 'done').length,
      modulesTotal: c.modules.length,
      lessonsDone: p.completedLessons.length,
    }
  }

  async insignias(usuarioId: number) {
    const { progreso: p, catalogo: c } = await this.repo.snapshot(usuarioId)
    return badgeViews(p, computeContext(p, c))
  }

  async actividad(usuarioId: number, limit: number) {
    return this.actividadDe(await this.repo.snapshot(usuarioId), limit)
  }

  async inicio(usuarioId: number) {
    const s = await this.repo.snapshot(usuarioId)
    const { progreso: p, catalogo: c } = s
    const target = findTarget(p, c)
    let nextExercise: { exercise: Catalogo['exercises'][number]; module: Catalogo['modules'][number] } | null = null
    for (const m of publicados(c)) {
      const e = c.exercises.filter((x) => x.moduleId === m.id).sort((a, b) => a.order - b.order).find((x) => !p.exercises[x.id]?.solved)
      if (e && target?.to !== `/ejercicios/${e.id}`) {
        nextExercise = { exercise: e, module: m }
        break
      }
    }
    const badges = badgeViews(p, computeContext(p, c)).filter((b) => b.earnedAt).sort((a, b) => b.earnedAt!.localeCompare(a.earnedAt!)).slice(0, 3)
    return {
      ...stats(p, c), target, current: target ? overview(target.module, p, c) : null, path: target ? buildPath(target.module.id, p, c) : [],
      nextExercise, activity: this.actividadDe(s, 5), recentBadges: badges,
    }
  }

  async perfil(usuarioId: number) {
    const s = await this.repo.snapshot(usuarioId)
    const { progreso: p, catalogo: c } = s
    return { ...stats(p, c), history: this.actividadDe(s, 12), badges: badgeViews(p, computeContext(p, c)), lessonsDone: p.completedLessons.length }
  }

  /** Equivalente a `api.catalog.moduleDetail` (la parte de progreso: porcentaje, estado y ruta). */
  async rutaDeModulo(usuarioId: number, moduloId: number) {
    const { progreso: p, catalogo: c } = await this.repo.snapshot(usuarioId)
    const m = c.modules.find((x) => x.id === moduloId)
    if (!m) throw noEncontrado('El módulo')
    return { ...overview(m, p, c), path: buildPath(m.id, p, c) }
  }

  /** Equivalente a `solved`, `attempts`, `history` y `next` de `api.catalog.exercise`. */
  async intentosDeEjercicio(usuarioId: number, ejercicioId: number) {
    const { progreso: p, catalogo: c } = await this.repo.snapshot(usuarioId)
    const e = c.exercises.find((x) => x.id === ejercicioId)
    if (!e) throw noEncontrado('El ejercicio')
    const prog = p.exercises[ejercicioId]
    return {
      solved: Boolean(prog?.solved), attempts: prog?.attempts ?? 0,
      history: p.attempts.filter((a) => a.exerciseId === ejercicioId), // ya viene del más reciente al más antiguo
      next: nextAfter('exercise', ejercicioId, e.moduleId, p, c),
    }
  }

  /** Equivalente a `api.catalog.modules`: cada módulo publicado con su porcentaje y estado. */
  async modulos(usuarioId: number) {
    const { progreso: p, catalogo: c } = await this.repo.snapshot(usuarioId)
    return { modules: publicados(c).map((m) => overview(m, p, c)) }
  }

  /** Equivalente a `api.catalog.exercises`: ejercicios publicados (vista del estudiante) con `solved` e intentos. */
  async ejercicios(usuarioId: number) {
    const [{ progreso: p }, modulos, ejercicios] = await Promise.all([
      this.repo.snapshot(usuarioId), this.contenido.listarModulos(true), this.contenido.listarEjercicios({ soloVisibles: true }),
    ])
    const modulo = new Map(modulos.map((m) => [m.id, m]))
    return {
      exercises: ejercicios
        .map((e) => ({ exercise: paraEstudiante(e), module: modulo.get(e.moduleId)!, solved: Boolean(p.exercises[e.id]?.solved), attempts: p.exercises[e.id]?.attempts ?? 0 }))
        .sort((a, b) => a.module.order - b.module.order || a.exercise.order - b.exercise.order),
    }
  }

  /** Equivalente a `api.catalog.lesson`: la lección con su módulo, estado y vecinos en la ruta. */
  async leccion(usuarioId: number, leccionId: number) {
    const lesson = await this.contenido.leccionPorId(leccionId, true)
    if (!lesson) throw noEncontrado('La lección')
    const [module, { progreso: p, catalogo: c }] = await Promise.all([this.contenido.moduloPorId(lesson.moduleId, true), this.repo.snapshot(usuarioId)])
    const path = buildPath(lesson.moduleId, p, c)
    const idx = path.findIndex((i) => i.kind === 'lesson' && i.id === leccionId)
    return {
      lesson, module, done: p.completedLessons.includes(leccionId), position: idx + 1, total: path.length,
      prev: idx > 0 ? path[idx - 1]! : null, next: idx >= 0 && idx < path.length - 1 ? path[idx + 1]! : null,
    }
  }

  /** Equivalente a `api.catalog.exercise`: ejercicio (sin solución ni casos ocultos) con módulo, lección, siguiente e intentos. */
  async ejercicio(usuarioId: number, ejercicioId: number) {
    const e = await this.contenido.ejercicioPorId(ejercicioId, true)
    if (!e) throw noEncontrado('El ejercicio')
    const [module, lesson, { progreso: p, catalogo: c }] = await Promise.all([
      this.contenido.moduloPorId(e.moduleId, true), this.contenido.leccionPorId(e.lessonId, true), this.repo.snapshot(usuarioId),
    ])
    const prog = p.exercises[ejercicioId]
    return {
      exercise: paraEstudiante(e), module, lesson, next: nextAfter('exercise', ejercicioId, e.moduleId, p, c),
      solved: Boolean(prog?.solved), attempts: prog?.attempts ?? 0, history: p.attempts.filter((a) => a.exerciseId === ejercicioId),
    }
  }
}
