// Reglas de progreso y gamificación, portadas de frontend/src/utils/badges.ts y frontend/src/services/api.ts.
// Todo es derivado de los intentos y las lecciones completadas: no hay tabla de puntos.
import { badgeDefs } from './insignias.js'

export type Dificultad = 'basic' | 'medium' | 'advanced'
export type EstadoItem = 'todo' | 'current' | 'done'
export type EstadoModulo = 'todo' | 'progress' | 'done'

export const POINTS = { lesson: 5, basic: 10, medium: 20, advanced: 30 } as const

export interface ModuloInfo { id: number; order: number; code: string; title: string; summary: string }
export interface LeccionInfo { id: number; moduleId: number; order: number; title: string; minutes: number }
export interface EjercicioInfo { id: number; moduleId: number; lessonId: number; order: number; title: string; goal: string; difficulty: Dificultad }
/** Solo lo publicado (módulo, lección y ejercicio). */
export interface Catalogo { modules: ModuloInfo[]; lessons: LeccionInfo[]; exercises: EjercicioInfo[] }

export interface Intento { id: string; exerciseId: number; at: string; passed: boolean; hintsUsed: number; feedback: string }
export interface Progreso {
  completedLessons: number[]
  exercises: Record<number, { solved: boolean; attempts: number; bestHints: number }>
  /** Más reciente primero. */
  attempts: Intento[]
  /** código de insignia -> fecha ISO */
  badges: Record<string, string>
  lessonLog: { lessonId: number; at: string }[]
}
export interface Contexto { completedModules: number; completedModuleCodes: string[] }

export interface FilaIntento { id: number; ejercicioId: number; fecha: Date; resultado: boolean; pistas: number; retro: string | null }

/** Arma el estado de progreso a partir de filas de BD (intentos en orden cronológico). */
export function armarProgreso(intentos: FilaIntento[], lecciones: { id: number; fecha: Date }[], insignias: { codigo: string; fecha: Date }[]): Progreso {
  const exercises: Progreso['exercises'] = {}
  for (const i of intentos) {
    const prev = exercises[i.ejercicioId] ?? { solved: false, attempts: 0, bestHints: 0 }
    exercises[i.ejercicioId] = { solved: prev.solved || i.resultado, attempts: prev.attempts + 1, bestHints: prev.solved ? prev.bestHints : i.pistas }
  }
  return {
    completedLessons: lecciones.map((l) => l.id),
    exercises,
    attempts: intentos.map((i) => ({ id: `a${i.id}`, exerciseId: i.ejercicioId, at: i.fecha.toISOString(), passed: i.resultado, hintsUsed: i.pistas, feedback: i.retro ?? '' })).reverse(),
    badges: Object.fromEntries(insignias.map((b) => [b.codigo, b.fecha.toISOString()])),
    lessonLog: lecciones.map((l) => ({ lessonId: l.id, at: l.fecha.toISOString() })),
  }
}

export function moduleStats(moduleId: number, p: Progreso, c: Catalogo) {
  const ls = c.lessons.filter((l) => l.moduleId === moduleId)
  const es = c.exercises.filter((e) => e.moduleId === moduleId)
  const doneL = ls.filter((l) => p.completedLessons.includes(l.id)).length
  const doneE = es.filter((e) => p.exercises[e.id]?.solved).length
  const total = ls.length + es.length
  const done = doneL + doneE
  const pct = total === 0 ? 0 : Math.round((done / total) * 100)
  const started = done > 0 || es.some((e) => p.exercises[e.id])
  const status: EstadoModulo = total > 0 && done === total ? 'done' : started ? 'progress' : 'todo'
  return { lessons: ls.length, exercises: es.length, doneL, doneE, total, done, pct, status }
}

export function computeContext(p: Progreso, c: Catalogo): Contexto {
  const done = c.modules.filter((m) => moduleStats(m.id, p, c).status === 'done')
  return { completedModules: done.length, completedModuleCodes: done.map((m) => m.code) }
}

export function computePoints(p: Progreso, c: Catalogo): number {
  const ex = c.exercises.reduce((sum, e) => sum + (p.exercises[e.id]?.solved ? POINTS[e.difficulty] : 0), 0)
  return ex + p.completedLessons.length * POINTS.lesson
}

export interface BadgeView { id: string; name: string; condition: string; target: number; current: number; earnedAt?: string }

export function badgeViews(p: Progreso, ctx: Contexto): BadgeView[] {
  return badgeDefs.map((b) => ({ id: b.id, name: b.name, condition: b.condition, target: b.target, current: Math.min(b.progress(p, ctx), b.target), earnedAt: p.badges[b.id] }))
}

/** Códigos de insignias cuya condición se cumple ahora y que aún no estaban registradas. */
export function newlyEarned(p: Progreso, ctx: Contexto): string[] {
  return badgeDefs.filter((b) => !p.badges[b.id] && b.progress(p, ctx) >= b.target).map((b) => b.id)
}

/* ───────── ruta de aprendizaje y resúmenes ───────── */

export type PathItem =
  | { kind: 'lesson'; id: number; title: string; meta: string; status: EstadoItem; to: string }
  | { kind: 'exercise'; id: number; title: string; meta: string; status: EstadoItem; to: string; difficulty: Dificultad; attempts: number }

export function buildPath(moduleId: number, p: Progreso, c: Catalogo): PathItem[] {
  const ls = c.lessons.filter((l) => l.moduleId === moduleId).sort((a, b) => a.order - b.order)
  const es = c.exercises.filter((e) => e.moduleId === moduleId).sort((a, b) => a.order - b.order)
  const items: PathItem[] = []
  const used = new Set<number>()
  const exItem = (e: EjercicioInfo): PathItem => ({
    kind: 'exercise', id: e.id, title: e.title, difficulty: e.difficulty, attempts: p.exercises[e.id]?.attempts ?? 0,
    meta: '', status: p.exercises[e.id]?.solved ? 'done' : 'todo', to: `/ejercicios/${e.id}`,
  })
  for (const l of ls) {
    items.push({ kind: 'lesson', id: l.id, title: l.title, meta: `${l.minutes} min de lectura`, status: p.completedLessons.includes(l.id) ? 'done' : 'todo', to: `/lecciones/${l.id}` })
    for (const e of es.filter((x) => x.lessonId === l.id)) {
      items.push(exItem(e))
      used.add(e.id)
    }
  }
  for (const e of es) if (!used.has(e.id)) items.push(exItem(e))
  const firstOpen = items.findIndex((i) => i.status !== 'done')
  if (firstOpen >= 0) items[firstOpen]!.status = 'current'
  return items
}

export function overview(m: ModuloInfo, p: Progreso, c: Catalogo) {
  const s = moduleStats(m.id, p, c)
  return { module: m, lessons: s.lessons, exercises: s.exercises, pct: s.pct, status: s.status }
}

/** Siguiente elemento pendiente después de `itemId` en la ruta de su módulo (o el que sigue, si todo está hecho). */
export function nextAfter(kind: 'lesson' | 'exercise', itemId: number, moduleId: number, p: Progreso, c: Catalogo): PathItem | null {
  const path = buildPath(moduleId, p, c)
  const resto = path.slice(path.findIndex((i) => i.kind === kind && i.id === itemId) + 1)
  return resto.find((i) => i.status !== 'done') ?? resto[0] ?? null
}

export function findTarget(p: Progreso, c: Catalogo) {
  for (const m of [...c.modules].sort((a, b) => a.order - b.order)) {
    if (overview(m, p, c).status === 'done') continue
    const cur = buildPath(m.id, p, c).find((i) => i.status === 'current')
    if (cur) return { kind: cur.kind, title: cur.title, to: cur.to, module: m }
  }
  return null
}

export function stats(p: Progreso, c: Catalogo) {
  const totals = c.modules.reduce((acc, m) => {
    const s = moduleStats(m.id, p, c)
    return { done: acc.done + s.done, total: acc.total + s.total }
  }, { done: 0, total: 0 })
  const passed = p.attempts.filter((a) => a.passed).length
  return {
    overallPct: totals.total ? Math.round((totals.done / totals.total) * 100) : 0,
    solved: c.exercises.filter((e) => p.exercises[e.id]?.solved).length,
    totalExercises: c.exercises.length,
    successRate: p.attempts.length ? Math.round((passed / p.attempts.length) * 100) : 0,
    points: computePoints(p, c),
    attemptsCount: p.attempts.length,
  }
}

export interface ActivityItem { id: string; at: string; kind: 'exercise' | 'lesson' | 'badge'; text: string; detail?: string; ok?: boolean }

/** Línea de tiempo (intentos, lecciones, insignias) más reciente primero. `titulos` resuelve ids a texto. */
export function activity(p: Progreso, limit: number, t: { ejercicios: Map<number, string>; lecciones: Map<number, string>; insignias: Map<string, string> }): ActivityItem[] {
  const items: ActivityItem[] = [
    ...p.attempts.map((a) => ({ id: a.id, at: a.at, kind: 'exercise' as const, ok: a.passed, text: t.ejercicios.get(a.exerciseId) ?? 'Ejercicio', detail: a.passed ? 'Resuelto' : 'Intento sin éxito' })),
    ...p.lessonLog.map((l) => ({ id: `l-${l.lessonId}-${l.at}`, at: l.at, kind: 'lesson' as const, text: t.lecciones.get(l.lessonId) ?? 'Lección', detail: 'Lección completada' })),
    ...Object.entries(p.badges).map(([id, at]) => ({ id: `b-${id}`, at, kind: 'badge' as const, text: t.insignias.get(id) ?? id, detail: 'Insignia obtenida' })),
  ]
  return items.sort((a, b) => b.at.localeCompare(a.at)).slice(0, limit)
}
