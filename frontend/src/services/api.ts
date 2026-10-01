/**
 * Capa de servicios del frontend.
 * Hoy lee y escribe en stores locales con latencia simulada; para conectar un backend
 * real basta con reemplazar el cuerpo de cada función por una llamada HTTP con la misma firma.
 */
import type { BadgeView, Difficulty, Exercise, ItemStatus, Lesson, Module, StudentRow, SubmitResult, User } from '@/types'
import { badgeViews, computeContext, computePoints, moduleStats, newlyEarned } from '@/utils/badges'
import { evaluate } from '@/utils/evaluate'
import { studentRows, studentUser, teacherUser } from '@/mocks/users'
import { catalogStore, progressStore, sessionStore } from './stores'

const wait = (ms = 220) => new Promise<void>((r) => setTimeout(r, ms))

export type PathItem =
  | { kind: 'lesson'; id: string; title: string; meta: string; status: ItemStatus; to: string }
  | { kind: 'exercise'; id: string; title: string; meta: string; status: ItemStatus; to: string; difficulty: Difficulty; attempts: number }

export interface ModuleOverview {
  module: Module
  lessons: number
  exercises: number
  pct: number
  status: 'todo' | 'progress' | 'done'
}

export interface ActivityItem {
  id: string
  at: string
  kind: 'exercise' | 'lesson' | 'badge'
  text: string
  detail?: string
  ok?: boolean
}

export interface Target {
  kind: 'lesson' | 'exercise'
  title: string
  to: string
  module: Module
}

/* ───────── helpers internos ───────── */

function buildPath(moduleId: string): PathItem[] {
  const { lessons, exercises } = catalogStore.get()
  const p = progressStore.get()
  const ls = lessons.filter((l) => l.moduleId === moduleId && l.published).sort((a, b) => a.order - b.order)
  const es = exercises.filter((e) => e.moduleId === moduleId && e.published).sort((a, b) => a.order - b.order)
  const items: PathItem[] = []
  const used = new Set<string>()
  const exItem = (e: Exercise): PathItem => ({
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
  if (firstOpen >= 0) items[firstOpen].status = 'current'
  return items
}

function publishedModules(): Module[] {
  return catalogStore.get().modules.filter((m) => m.published).sort((a, b) => a.order - b.order)
}

function overview(m: Module): ModuleOverview {
  const { lessons, exercises } = catalogStore.get()
  const s = moduleStats(m.id, progressStore.get(), lessons, exercises)
  return { module: m, lessons: s.lessons, exercises: s.exercises, pct: s.pct, status: s.status }
}

function findTarget(): Target | null {
  for (const m of publishedModules()) {
    if (overview(m).status === 'done') continue
    const cur = buildPath(m.id).find((i) => i.status === 'current')
    if (cur) return { kind: cur.kind, title: cur.title, to: cur.to, module: m }
  }
  return null
}

function nextAfter(itemId: string, moduleId: string): PathItem | null {
  const path = buildPath(moduleId)
  const idx = path.findIndex((i) => i.id === itemId)
  const after = path.slice(idx + 1).find((i) => i.status !== 'done') ?? path.slice(idx + 1)[0]
  return after ?? null
}

function recordBadges(): string[] {
  const { modules, lessons, exercises } = catalogStore.get()
  const p = progressStore.get()
  const fresh = newlyEarned(p, computeContext(p, modules, lessons, exercises))
  if (fresh.length) {
    const now = new Date().toISOString()
    progressStore.set((s) => ({ ...s, badges: { ...s.badges, ...Object.fromEntries(fresh.map((id) => [id, now])) } }))
  }
  return fresh
}

function badgeNames(ids: string[]): string[] {
  const { modules, lessons, exercises } = catalogStore.get()
  const p = progressStore.get()
  const views = badgeViews(p, computeContext(p, modules, lessons, exercises))
  return ids.map((id) => views.find((b) => b.id === id)?.name ?? id)
}

function stats() {
  const { modules, lessons, exercises } = catalogStore.get()
  const p = progressStore.get()
  const pub = modules.filter((m) => m.published)
  const totals = pub.reduce((acc, m) => {
    const s = moduleStats(m.id, p, lessons, exercises)
    return { done: acc.done + s.done, total: acc.total + s.total }
  }, { done: 0, total: 0 })
  const solved = exercises.filter((e) => e.published && p.exercises[e.id]?.solved).length
  const passed = p.attempts.filter((a) => a.passed).length
  return {
    overallPct: totals.total ? Math.round((totals.done / totals.total) * 100) : 0,
    solved,
    totalExercises: exercises.filter((e) => e.published).length,
    successRate: p.attempts.length ? Math.round((passed / p.attempts.length) * 100) : 0,
    points: computePoints(p, exercises),
    attemptsCount: p.attempts.length,
  }
}

/* ───────── API pública ───────── */

export const api = {
  auth: {
    async login(email: string, password: string): Promise<User> {
      await wait(900)
      const mail = email.trim().toLowerCase()
      if (!/^[^\s@]+@uptc\.edu\.co$/.test(mail)) throw new Error('Usa tu correo institucional (termina en @uptc.edu.co).')
      if (password.length < 6) throw new Error('La contraseña es incorrecta. Revisa que no tengas activadas las mayúsculas.')
      const user = mail.startsWith('docente') ? { ...teacherUser, email: mail } : { ...studentUser, email: mail }
      sessionStore.set(() => ({ user }))
      return user
    },
    async logout() {
      sessionStore.set(() => ({ user: null }))
    },
  },

  catalog: {
    async modules(): Promise<ModuleOverview[]> {
      await wait()
      return publishedModules().map(overview)
    },
    async moduleDetail(id: string) {
      await wait()
      const m = catalogStore.get().modules.find((x) => x.id === id)
      if (!m) throw new Error('No encontramos ese módulo.')
      const o = overview(m)
      return { ...o, path: buildPath(id) }
    },
    async lesson(id: string) {
      await wait()
      const l = catalogStore.get().lessons.find((x) => x.id === id)
      if (!l) throw new Error('No encontramos esa lección.')
      const m = catalogStore.get().modules.find((x) => x.id === l.moduleId)!
      const path = buildPath(l.moduleId)
      const idx = path.findIndex((i) => i.id === id)
      return {
        lesson: l, module: m, done: progressStore.get().completedLessons.includes(id),
        position: idx + 1, total: path.length,
        prev: idx > 0 ? path[idx - 1] : null,
        next: idx < path.length - 1 ? path[idx + 1] : null,
      }
    },
    async exercise(id: string) {
      await wait()
      const e = catalogStore.get().exercises.find((x) => x.id === id)
      if (!e) throw new Error('No encontramos ese ejercicio.')
      const m = catalogStore.get().modules.find((x) => x.id === e.moduleId)!
      const lesson = catalogStore.get().lessons.find((x) => x.id === e.lessonId) ?? null
      const next = nextAfter(id, e.moduleId)
      const prog = progressStore.get().exercises[id]
      const history = progressStore.get().attempts.filter((a) => a.exerciseId === id).sort((a, b) => b.at.localeCompare(a.at))
      return { exercise: e, module: m, lesson, next, solved: !!prog?.solved, attempts: prog?.attempts ?? 0, history }
    },
    async exercises() {
      await wait()
      const { exercises, modules } = catalogStore.get()
      const p = progressStore.get()
      return exercises.filter((e) => e.published).map((e) => ({
        exercise: e,
        module: modules.find((m) => m.id === e.moduleId)!,
        solved: !!p.exercises[e.id]?.solved,
        attempts: p.exercises[e.id]?.attempts ?? 0,
      })).sort((a, b) => a.module.order - b.module.order || a.exercise.order - b.exercise.order)
    },
  },

  student: {
    async home() {
      await wait()
      const s = stats()
      const target = findTarget()
      const { exercises, modules, lessons } = catalogStore.get()
      const p = progressStore.get()
      let nextExercise: { exercise: Exercise; module: Module } | null = null
      for (const m of publishedModules()) {
        const e = exercises.filter((x) => x.moduleId === m.id && x.published).sort((a, b) => a.order - b.order).find((x) => !p.exercises[x.id]?.solved)
        if (e && target?.to !== `/ejercicios/${e.id}`) { nextExercise = { exercise: e, module: m }; break }
        if (e) continue
      }
      const cur = target ? overview(target.module) : null
      const path = target ? buildPath(target.module.id) : []
      const badges = badgeViews(p, computeContext(p, modules, lessons, exercises)).filter((b) => b.earnedAt).sort((a, b) => b.earnedAt!.localeCompare(a.earnedAt!)).slice(0, 3)
      return { ...s, target, current: cur, path, nextExercise, activity: await api.student.activity(5), recentBadges: badges }
    },
    async activity(limit = 8): Promise<ActivityItem[]> {
      const { exercises, lessons } = catalogStore.get()
      const p = progressStore.get()
      const items: ActivityItem[] = [
        ...p.attempts.map((a) => ({
          id: a.id, at: a.at, kind: 'exercise' as const, ok: a.passed,
          text: exercises.find((e) => e.id === a.exerciseId)?.title ?? 'Ejercicio',
          detail: a.passed ? 'Resuelto' : 'Intento sin éxito',
        })),
        ...(p.lessonLog ?? []).map((l) => ({
          id: `l-${l.lessonId}-${l.at}`, at: l.at, kind: 'lesson' as const,
          text: lessons.find((x) => x.id === l.lessonId)?.title ?? 'Lección', detail: 'Lección completada',
        })),
        ...Object.entries(p.badges).map(([id, at]) => ({ id: `b-${id}`, at, kind: 'badge' as const, text: badgeNames([id])[0], detail: 'Insignia obtenida' })),
      ]
      return items.sort((a, b) => b.at.localeCompare(a.at)).slice(0, limit)
    },
    async progress() {
      await wait()
      const s = stats()
      const { modules, lessons, exercises } = catalogStore.get()
      const p = progressStore.get()
      return {
        ...s,
        pendingExercises: s.totalExercises - s.solved,
        modules: publishedModules().map((m) => ({ ...overview(m), stats: moduleStats(m.id, p, lessons, exercises) })),
        activity: await api.student.activity(10),
        modulesCompleted: modules.filter((m) => m.published && moduleStats(m.id, p, lessons, exercises).status === 'done').length,
        modulesTotal: modules.filter((m) => m.published).length,
        lessonsDone: p.completedLessons.length,
      }
    },
    async badges(): Promise<BadgeView[]> {
      await wait()
      const { modules, lessons, exercises } = catalogStore.get()
      const p = progressStore.get()
      return badgeViews(p, computeContext(p, modules, lessons, exercises))
    },
    async profile() {
      await wait()
      const s = stats()
      return { ...s, history: await api.student.activity(12), badges: await api.student.badges(), lessonsDone: progressStore.get().completedLessons.length }
    },
    async completeLesson(lessonId: string): Promise<{ next: PathItem | null; newBadges: string[] }> {
      const l = catalogStore.get().lessons.find((x) => x.id === lessonId)
      if (!l) throw new Error('Lección no encontrada.')
      if (!progressStore.get().completedLessons.includes(lessonId)) {
        progressStore.set((s) => ({ ...s, completedLessons: [...s.completedLessons, lessonId], lessonLog: [...(s.lessonLog ?? []), { lessonId, at: new Date().toISOString() }] }))
      }
      const fresh = recordBadges()
      return { next: nextAfter(lessonId, l.moduleId), newBadges: badgeNames(fresh) }
    },
  },

  exercises: {
    async submit(exerciseId: string, code: string, hintsUsed: number): Promise<SubmitResult> {
      await wait(900)
      const e = catalogStore.get().exercises.find((x) => x.id === exerciseId)
      if (!e) throw new Error('Ejercicio no encontrado.')
      const before = computePoints(progressStore.get(), catalogStore.get().exercises)
      const ev = evaluate(e, code)
      progressStore.set((s) => {
        const prev = s.exercises[exerciseId] ?? { solved: false, attempts: 0, bestHints: 0 }
        return {
          ...s,
          exercises: { ...s.exercises, [exerciseId]: { solved: prev.solved || ev.passed, attempts: prev.attempts + 1, bestHints: prev.solved ? prev.bestHints : hintsUsed } },
          attempts: [{ id: `a${Date.now()}`, exerciseId, at: new Date().toISOString(), passed: ev.passed, hintsUsed, feedback: ev.message }, ...s.attempts],
        }
      })
      const fresh = recordBadges()
      const after = computePoints(progressStore.get(), catalogStore.get().exercises)
      return { ...ev, newBadges: badgeNames(fresh), pointsGained: after - before }
    },
  },

  teacher: {
    async dashboard() {
      await wait()
      const s = stats()
      const rows = studentRows(s.overallPct, s.solved, s.successRate)
      const { modules, lessons, exercises } = catalogStore.get()
      const active = rows.filter((r) => Date.now() - new Date(r.lastActivity).getTime() < 7 * 864e5)
      const attention = rows.filter((r) => Date.now() - new Date(r.lastActivity).getTime() >= 7 * 864e5 || r.successRate < 40)
      const avg = Math.round(rows.reduce((a, r) => a + r.progress, 0) / rows.length)
      // distribución por módulo actual
      const perModule = modules.filter((m) => m.published).sort((a, b) => a.order - b.order).map((m) => ({
        module: m,
        students: rows.filter((r) => r.currentModule.startsWith(m.id.replace('m', ''))).length,
      }))
      return {
        rows, active: active.length, total: rows.length, attention: attention.sort((a, b) => a.lastActivity.localeCompare(b.lastActivity)),
        published: modules.filter((m) => m.published).length, modulesTotal: modules.length,
        lessonsPublished: lessons.filter((l) => l.published).length, exercisesPublished: exercises.filter((e) => e.published).length,
        avg, perModule,
        recent: [...rows].sort((a, b) => b.lastActivity.localeCompare(a.lastActivity)).slice(0, 6),
      }
    },
    async reports(): Promise<StudentRow[]> {
      await wait()
      const s = stats()
      return studentRows(s.overallPct, s.solved, s.successRate)
    },
    async content() {
      await wait(160)
      const c = catalogStore.get()
      return {
        modules: [...c.modules].sort((a, b) => a.order - b.order),
        lessons: c.lessons, exercises: c.exercises,
      }
    },
    async togglePublish(kind: 'module' | 'lesson' | 'exercise', id: string) {
      catalogStore.set((c) => ({
        ...c,
        modules: kind === 'module' ? c.modules.map((m) => (m.id === id ? { ...m, published: !m.published } : m)) : c.modules,
        lessons: kind === 'lesson' ? c.lessons.map((m) => (m.id === id ? { ...m, published: !m.published } : m)) : c.lessons,
        exercises: kind === 'exercise' ? c.exercises.map((m) => (m.id === id ? { ...m, published: !m.published } : m)) : c.exercises,
      }))
    },
    async move(kind: 'module' | 'lesson' | 'exercise', id: string, dir: -1 | 1) {
      catalogStore.set((c) => {
        const swap = <T extends { id: string; order: number }>(list: T[], same: (x: T) => boolean): T[] => {
          const group = list.filter(same).sort((a, b) => a.order - b.order)
          const i = group.findIndex((x) => x.id === id)
          const j = i + dir
          if (i < 0 || j < 0 || j >= group.length) return list
          const a = group[i], b = group[j]
          return list.map((x) => (x.id === a.id ? { ...x, order: b.order } : x.id === b.id ? { ...x, order: a.order } : x))
        }
        if (kind === 'module') return { ...c, modules: swap(c.modules, () => true) }
        if (kind === 'lesson') { const l = c.lessons.find((x) => x.id === id)!; return { ...c, lessons: swap(c.lessons, (x) => x.moduleId === l.moduleId) } }
        const e = c.exercises.find((x) => x.id === id)!
        return { ...c, exercises: swap(c.exercises, (x) => x.moduleId === e.moduleId) }
      })
    },
    async saveModule(input: { id?: string; title: string; summary: string }) {
      await wait(300)
      catalogStore.set((c) => {
        if (input.id) return { ...c, modules: c.modules.map((m) => (m.id === input.id ? { ...m, title: input.title, summary: input.summary } : m)) }
        const order = Math.max(0, ...c.modules.map((m) => m.order)) + 1
        const id = `m${String(order).padStart(2, '0')}-${Date.now().toString(36)}`
        return { ...c, modules: [...c.modules, { id, order, code: String(order).padStart(2, '0'), title: input.title, summary: input.summary, published: false }] }
      })
    },
    async saveLesson(input: { id?: string; moduleId: string; title: string; minutes: number }) {
      await wait(300)
      catalogStore.set((c) => {
        if (input.id) return { ...c, lessons: c.lessons.map((l) => (l.id === input.id ? { ...l, title: input.title, minutes: input.minutes } : l)) }
        const order = Math.max(0, ...c.lessons.filter((l) => l.moduleId === input.moduleId).map((l) => l.order)) + 1
        const lesson: Lesson = {
          id: `${input.moduleId}-l${order}-${Date.now().toString(36)}`, moduleId: input.moduleId, order, title: input.title, minutes: input.minutes, published: false,
          blocks: [{ type: 'p', text: 'Contenido pendiente de redacción.' }],
        }
        return { ...c, lessons: [...c.lessons, lesson] }
      })
    },
    async saveExercise(ex: Exercise) {
      await wait(400)
      catalogStore.set((c) => {
        const exists = c.exercises.some((e) => e.id === ex.id)
        return { ...c, exercises: exists ? c.exercises.map((e) => (e.id === ex.id ? ex : e)) : [...c.exercises, ex] }
      })
    },
  },
}
