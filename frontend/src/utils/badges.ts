import type { BadgeContext, BadgeDef, BadgeView, Exercise, Lesson, Module, ProgressState } from '@/types'

const solvedCount = (p: ProgressState) => Object.values(p.exercises).filter((e) => e.solved).length

export const badgeDefs: BadgeDef[] = [
  { id: 'primer-paso', name: 'Primer paso', condition: 'Resolver tu primer ejercicio.', target: 1, progress: (p) => solvedCount(p) },
  { id: 'constante', name: 'Constante', condition: 'Completar 5 ejercicios.', target: 5, progress: (p) => solvedCount(p) },
  { id: 'algoritmo', name: 'Algoritmo', condition: 'Completar un módulo.', target: 1, progress: (_p, c) => c.completedModules },
  { id: 'a-la-primera', name: 'A la primera', condition: 'Resolver un ejercicio en el primer intento y sin pistas.', target: 1, progress: (p) => Object.values(p.exercises).filter((e) => e.solved && e.attempts === 1 && e.bestHints === 0).length },
  { id: 'lector', name: 'Lector', condition: 'Completar 10 lecciones.', target: 10, progress: (p) => p.completedLessons.length },
  { id: 'persistente', name: 'Persistente', condition: 'Resolver un ejercicio después de 3 o más intentos.', target: 1, progress: (p) => Object.values(p.exercises).filter((e) => e.solved && e.attempts >= 3).length },
  { id: 'mitad-del-camino', name: 'Mitad del camino', condition: 'Completar 4 módulos.', target: 4, progress: (_p, c) => c.completedModules },
  { id: 'decisiones', name: 'Decisiones', condition: 'Completar el módulo de Estructuras condicionales.', target: 1, progress: (_p, c) => (c.completedModuleIds.includes('m05') ? 1 : 0) },
  { id: 'bucle', name: 'Bucle', condition: 'Completar el módulo de Ciclos y repetición.', target: 1, progress: (_p, c) => (c.completedModuleIds.includes('m06') ? 1 : 0) },
  { id: 'ruta-completa', name: 'Ruta completa', condition: 'Completar los 8 módulos.', target: 8, progress: (_p, c) => c.completedModules },
]

export const POINTS = { lesson: 5, basic: 10, medium: 20, advanced: 30 } as const

export function moduleStats(moduleId: string, p: ProgressState, lessons: Lesson[], exercises: Exercise[]) {
  const ls = lessons.filter((l) => l.moduleId === moduleId && l.published)
  const es = exercises.filter((e) => e.moduleId === moduleId && e.published)
  const doneL = ls.filter((l) => p.completedLessons.includes(l.id)).length
  const doneE = es.filter((e) => p.exercises[e.id]?.solved).length
  const total = ls.length + es.length
  const done = doneL + doneE
  const pct = total === 0 ? 0 : Math.round((done / total) * 100)
  const started = done > 0 || es.some((e) => p.exercises[e.id])
  const status: 'todo' | 'progress' | 'done' = total > 0 && done === total ? 'done' : started ? 'progress' : 'todo'
  return { lessons: ls.length, exercises: es.length, doneL, doneE, total, done, pct, status }
}

export function computeContext(p: ProgressState, modules: Module[], lessons: Lesson[], exercises: Exercise[]): BadgeContext {
  const completedModuleIds = modules.filter((m) => m.published && moduleStats(m.id, p, lessons, exercises).status === 'done').map((m) => m.id)
  return { completedModules: completedModuleIds.length, completedModuleIds }
}

export function computePoints(p: ProgressState, exercises: Exercise[]): number {
  const ex = exercises.reduce((sum, e) => sum + (p.exercises[e.id]?.solved ? POINTS[e.difficulty] : 0), 0)
  return ex + p.completedLessons.length * POINTS.lesson
}

export function badgeViews(p: ProgressState, ctx: BadgeContext): BadgeView[] {
  return badgeDefs.map((b) => ({
    id: b.id,
    name: b.name,
    condition: b.condition,
    target: b.target,
    current: Math.min(b.progress(p, ctx), b.target),
    earnedAt: p.badges[b.id],
  }))
}

/** Ids de insignias cuya condición se cumple ahora y que aún no estaban registradas. */
export function newlyEarned(p: ProgressState, ctx: BadgeContext): string[] {
  return badgeDefs.filter((b) => !p.badges[b.id] && b.progress(p, ctx) >= b.target).map((b) => b.id)
}
