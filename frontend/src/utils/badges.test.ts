import { describe, expect, it } from 'vitest'
import { POINTS, badgeDefs, badgeViews, computeContext, computePoints, moduleStats, newlyEarned } from './badges'
import type { Exercise, Lesson, Module, ProgressState } from '@/types'

const mod = (id: string, published = true): Module => ({ id, order: 1, code: id, title: id, summary: '', published })
const les = (id: string, moduleId: string, published = true): Lesson => ({ id, moduleId, order: 1, title: id, minutes: 5, published, blocks: [] })
const exe = (id: string, moduleId: string, difficulty: Exercise['difficulty'] = 'basic', published = true) => ({ id, moduleId, difficulty, published }) as Exercise
const empty = (): ProgressState => ({ completedLessons: [], exercises: {}, attempts: [], badges: {}, lessonsOpened: [] })

const modules = [mod('m05'), mod('m06')]
const lessons = [les('l1', 'm05'), les('l2', 'm05'), les('l3', 'm06'), les('lx', 'm05', false)]
const exercises = [exe('e1', 'm05'), exe('e2', 'm05', 'medium'), exe('e3', 'm06', 'advanced'), exe('ex', 'm05', 'basic', false)]

describe('utils/badges', () => {
  it('moduleStats ignora lo no publicado y calcula porcentaje y estado', () => {
    expect(moduleStats('m05', empty(), lessons, exercises)).toMatchObject({ lessons: 2, exercises: 2, total: 4, pct: 0, status: 'todo' })
    const p: ProgressState = { ...empty(), completedLessons: ['l1'], exercises: { e1: { solved: true, attempts: 1, bestHints: 0 } } }
    expect(moduleStats('m05', p, lessons, exercises)).toMatchObject({ done: 2, pct: 50, status: 'progress' })
    const all: ProgressState = { ...empty(), completedLessons: ['l1', 'l2'], exercises: { e1: { solved: true, attempts: 1, bestHints: 0 }, e2: { solved: true, attempts: 2, bestHints: 1 } } }
    expect(moduleStats('m05', all, lessons, exercises)).toMatchObject({ pct: 100, status: 'done' })
  })

  it('un módulo con un intento fallido ya está «en curso»; uno sin contenido nunca está terminado', () => {
    const p: ProgressState = { ...empty(), exercises: { e3: { solved: false, attempts: 1, bestHints: 0 } } }
    expect(moduleStats('m06', p, lessons, exercises).status).toBe('progress')
    expect(moduleStats('m99', p, lessons, exercises)).toMatchObject({ total: 0, pct: 0, status: 'todo' })
  })

  it('computePoints suma por dificultad y 5 por lección', () => {
    const p: ProgressState = { ...empty(), completedLessons: ['l1', 'l2'], exercises: { e1: { solved: true, attempts: 1, bestHints: 0 }, e2: { solved: true, attempts: 1, bestHints: 0 }, e3: { solved: false, attempts: 4, bestHints: 0 } } }
    expect(computePoints(p, exercises)).toBe(POINTS.basic + POINTS.medium + 2 * POINTS.lesson)
  })

  it('«Primer paso» se gana al resolver el primer ejercicio, y no se repite si ya la tenías', () => {
    const p: ProgressState = { ...empty(), exercises: { e1: { solved: true, attempts: 2, bestHints: 1 } } }
    const ctx = computeContext(p, modules, lessons, exercises)
    expect(newlyEarned(p, ctx)).toEqual(['primer-paso'])
    expect(newlyEarned({ ...p, badges: { 'primer-paso': '2026-01-01' } }, ctx)).toEqual([])
  })

  it('«A la primera» y «Persistente» dependen de intentos y pistas', () => {
    const first: ProgressState = { ...empty(), exercises: { e1: { solved: true, attempts: 1, bestHints: 0 } } }
    expect(newlyEarned(first, computeContext(first, modules, lessons, exercises))).toContain('a-la-primera')
    const hinted: ProgressState = { ...empty(), exercises: { e1: { solved: true, attempts: 1, bestHints: 1 } } }
    expect(newlyEarned(hinted, computeContext(hinted, modules, lessons, exercises))).not.toContain('a-la-primera')
    const persistent: ProgressState = { ...empty(), exercises: { e1: { solved: true, attempts: 3, bestHints: 0 } } }
    expect(newlyEarned(persistent, computeContext(persistent, modules, lessons, exercises))).toContain('persistente')
  })

  it('completar un módulo da «Algoritmo» y la insignia del módulo concreto', () => {
    const p: ProgressState = {
      ...empty(),
      completedLessons: ['l1', 'l2'],
      exercises: { e1: { solved: true, attempts: 1, bestHints: 0 }, e2: { solved: true, attempts: 1, bestHints: 0 } },
    }
    const ctx = computeContext(p, modules, lessons, exercises)
    expect(ctx).toEqual({ completedModules: 1, completedModuleIds: ['m05'] })
    const earned = newlyEarned(p, ctx)
    expect(earned).toEqual(expect.arrayContaining(['algoritmo', 'decisiones']))
    expect(earned).not.toContain('bucle')
  })

  it('badgeViews limita el avance al objetivo y expone la fecha de obtención', () => {
    const p: ProgressState = { ...empty(), completedLessons: Array.from({ length: 14 }, (_, i) => `l${i}`), badges: { lector: '2026-02-02' } }
    const lector = badgeViews(p, { completedModules: 0, completedModuleIds: [] }).find((b) => b.id === 'lector')!
    expect(lector).toMatchObject({ current: 10, target: 10, earnedAt: '2026-02-02' })
    expect(badgeDefs).toHaveLength(10)
  })
})
