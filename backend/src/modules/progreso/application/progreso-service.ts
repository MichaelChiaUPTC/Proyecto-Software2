import { AppError } from '../../../shared/errors.js'
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
}
