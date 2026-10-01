import type { Exercise, Lesson, Module, ProgressState, User } from '@/types'
import { createStore } from '@/utils/store'
import { exercisesSeed } from '@/mocks/exercises'
import { lessonsSeed } from '@/mocks/lessons'
import { modulesSeed } from '@/mocks/modules'
import { seedProgress } from '@/mocks/users'

export interface Catalog {
  modules: Module[]
  lessons: Lesson[]
  exercises: Exercise[]
}

/** Estado local que simula lo que más adelante vendrá del backend. */
export const catalogStore = createStore<Catalog>('logica.catalog.v1', () => ({
  modules: modulesSeed,
  lessons: lessonsSeed,
  exercises: exercisesSeed,
}))

export const progressStore = createStore<ProgressState>('logica.progress.v1', seedProgress)

export const sessionStore = createStore<{ user: User | null }>('logica.session.v1', () => ({ user: null }))

export function resetDemoData() {
  catalogStore.reset()
  progressStore.reset()
}
