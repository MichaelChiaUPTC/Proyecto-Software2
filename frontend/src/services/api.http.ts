/**
 * Implementación de `Api` contra el backend (`VITE_API_URL`). Misma firma que `api.mock.ts`.
 * El backend usa ids numéricos; aquí se convierten a string en el borde (`ids`) y se vuelven a número al enviar.
 * Los `as never` son los puntos donde la respuesta del servidor se completa o ajusta a los tipos de la demostración
 * (ver `publicado` y `completo`); el resto de campos coincide con `api.mock.ts`.
 */
import type { Exercise, Lesson, Module, Role, User } from '@/types'
import type { Api } from './api.mock'
import { download, request, saveSession, clearSession } from './http'
import { revisionStore } from './stores'

const ID_KEYS = new Set(['id', 'moduleId', 'lessonId', 'exerciseId'])

/** Convierte a string los ids numéricos de toda la respuesta (id, moduleId, lessonId, exerciseId). */
function ids<T>(v: unknown): T {
  if (Array.isArray(v)) return v.map((x) => ids(x)) as T
  if (v && typeof v === 'object') {
    return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, ID_KEYS.has(k) && typeof x === 'number' ? String(x) : ids(x)])) as T
  }
  return v as T
}

const get = async <T>(path: string, query?: Record<string, string | undefined>) => ids<T>(await request('GET', path, { query }))
/** Escritura: tras ella los datos en pantalla se vuelven a pedir. */
async function write<T>(method: 'POST' | 'PUT' | 'PATCH', path: string, body?: unknown): Promise<T> {
  const r = await request(method, path, { body })
  revisionStore.bump()
  return ids<T>(r)
}

interface ServerUser { id: number | string; name: string; email: string; role: Role; active: boolean; program: string | null; semester: number | null; group: string | null; joinedAt: string }
const toUser = (u: ServerUser): User => ({
  id: String(u.id), name: u.name, email: u.email, role: u.role, active: u.active,
  program: u.program ?? '', semester: u.semester ?? undefined, group: u.group ?? undefined, joinedAt: u.joinedAt,
})

/** Los módulos del progreso del estudiante llegan sin `published` (solo hay publicados). */
const publicado = <M extends object>(m: M) => ({ published: true, ...m })
/** La vista del estudiante no trae solución ni reglas; el tipo `Exercise` las exige. */
const completo = <E extends object>(e: E) => ({ expectedAnswer: '', rules: [], tests: [], examples: [], constraints: [], hints: [], statement: '', ...e }) as unknown as Exercise

const plural = { module: 'modules', lesson: 'lessons', exercise: 'exercises' } as const
const num = (id: string) => Number(id)

interface Contenido { modules: Module[]; lessons: Lesson[]; exercises: Exercise[] }

export const httpApi: Api = {
  auth: {
    async login(email, password) {
      const { token, user } = await request<{ token: string; user: ServerUser }>('POST', '/auth/login', { body: { email: email.trim(), password }, auth: false })
      const u = toUser(user)
      saveSession(token, u)
      return u
    },
    async register(name, email, password) {
      const { token, user } = await request<{ token: string; user: ServerUser }>('POST', '/auth/register', { body: { name: name.trim(), email: email.trim(), password }, auth: false })
      const u = toUser(user)
      saveSession(token, u)
      return u
    },
    async logout() {
      clearSession()
    },
  },

  catalog: {
    async modules() {
      const r = await get<{ modules: { module: object }[] }>('/me/modules')
      return r.modules.map((m) => ({ ...m, module: publicado(m.module) })) as never
    },
    async moduleDetail(id) {
      const r = await get<{ module: object }>(`/me/modules/${id}`)
      return { ...r, module: publicado(r.module) } as never
    },
    lesson: (id) => get(`/me/lessons/${id}`),
    async exercise(id) {
      const r = await get<{ exercise: object }>(`/me/exercises/${id}`)
      return { ...r, exercise: completo(r.exercise) } as never
    },
    async exercises() {
      const r = await get<{ exercises: { exercise: object }[] }>('/me/exercises')
      return r.exercises.map((x) => ({ ...x, exercise: completo(x.exercise) })) as never
    },
  },

  student: {
    async home() {
      const r = await get<{ target: { module: object } | null; current: { module: object } | null; nextExercise: { exercise: object; module: object } | null }>('/me/home')
      return {
        ...r,
        target: r.target && { ...r.target, module: publicado(r.target.module) },
        current: r.current && { ...r.current, module: publicado(r.current.module) },
        nextExercise: r.nextExercise && { exercise: completo(r.nextExercise.exercise), module: publicado(r.nextExercise.module) },
      } as never
    },
    async activity(limit = 8) {
      return (await get<{ activity: never }>('/me/activity', { limit: String(limit) })).activity
    },
    async progress() {
      const r = await get<{ modules: { module: object }[] }>('/me/progress')
      return { ...r, modules: r.modules.map((m) => ({ ...m, module: publicado(m.module) })) } as never
    },
    async badges() {
      return (await get<{ badges: never }>('/me/badges')).badges
    },
    profile: () => get('/me/profile'),
    completeLesson: (id) => write('POST', `/lessons/${id}/complete`),
  },

  exercises: {
    submit: (id, code, hintsUsed) => write('POST', `/exercises/${id}/submissions`, { code, hintsUsed }),
    aiHint: (id) => request('POST', `/exercises/${id}/ai-hint`),
  },

  teacher: {
    dashboard: () => get('/teacher/dashboard'),
    async reports() {
      return (await get<{ students: never }>('/teacher/reports')).students
    },
    exportCsv: (group) => download('/teacher/reports.csv', { group }),
    content: () => get('/teacher/content'),
    async togglePublish(kind, id) {
      await write('POST', `/teacher/content/${plural[kind]}/${id}/publish`)
    },
    async move(kind, id, dir) {
      await write('POST', `/teacher/content/${plural[kind]}/${id}/move`, { dir })
    },
    async saveModule({ id, title, summary }) {
      const { modules } = await get<Contenido>('/teacher/content')
      const actual = id ? modules.find((m) => m.id === id) : undefined
      // Módulo nuevo: el código es su posición («09»); el servidor rechaza repetidos.
      const code = actual?.code ?? String(Math.max(0, ...modules.map((m) => m.order)) + 1).padStart(2, '0')
      await write(id ? 'PUT' : 'POST', id ? `/teacher/content/modules/${id}` : '/teacher/content/modules', { code, title, summary })
    },
    async saveLesson({ id, moduleId, title, minutes }) {
      const blocks = id ? (await get<Contenido>('/teacher/content')).lessons.find((l) => l.id === id)?.blocks : undefined
      const datos = { title, minutes, blocks: blocks ?? [{ type: 'p', text: 'Contenido pendiente de redacción.' }] }
      if (id) await write('PUT', `/teacher/content/lessons/${id}`, datos)
      else await write('POST', '/teacher/content/lessons', { ...datos, moduleId: num(moduleId) })
    },
    async saveExercise(ex) {
      const datos = {
        title: ex.title, statement: ex.statement, goal: ex.goal, difficulty: ex.difficulty, examples: ex.examples, constraints: ex.constraints,
        hints: ex.hints, starter: ex.starter, expectedAnswer: ex.expectedAnswer, rules: ex.rules, successNote: ex.successNote,
        tests: ex.tests.map((t) => ({ input: t.input, expected: t.expected, hidden: Boolean(t.hidden) })),
      }
      // Un ejercicio nuevo trae un id inventado por el editor; los del servidor son numéricos.
      const existente = /^\d+$/.test(ex.id)
      const { exercise } = existente
        ? await write<{ exercise: Exercise }>('PUT', `/teacher/content/exercises/${ex.id}`, datos)
        : await write<{ exercise: Exercise }>('POST', '/teacher/content/exercises', { ...datos, lessonId: num(ex.lessonId) })
      // El servidor publica solo con la acción «publicar» (y valida que haya casos de prueba).
      if (exercise.published !== ex.published) await write('POST', `/teacher/content/exercises/${exercise.id}/publish`)
    },
  },

  admin: {
    async users() {
      return (await request<{ users: ServerUser[] }>('GET', '/admin/users')).users.map(toUser)
    },
    async createUser({ name, email, password, role }) {
      const r = await write<{ user: ServerUser }>('POST', '/admin/users', { name: name.trim(), email: email.trim(), password, role })
      return toUser(r.user)
    },
    async updateUser(id, changes) {
      const r = await write<{ user: ServerUser }>('PATCH', `/admin/users/${id}`, changes)
      return toUser(r.user)
    },
  },
}
