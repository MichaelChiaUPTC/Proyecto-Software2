import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cx, daysSince, greeting, homeFor, initials, plural, relativeTime, shortDate } from './format'

describe('utils/format', () => {
  beforeEach(() => { vi.useFakeTimers(); vi.setSystemTime(new Date('2026-06-15T12:00:00Z')) })
  afterEach(() => vi.useRealTimers())

  it('relativeTime escoge la unidad adecuada', () => {
    expect(relativeTime('2026-06-15T12:00:20Z')).toBe('ahora mismo')
    expect(relativeTime('2026-06-15T11:30:00Z')).toMatch(/30 minutos/)
    expect(relativeTime('2026-06-15T09:00:00Z')).toMatch(/3 horas/)
    expect(relativeTime('2026-06-12T12:00:00Z')).toMatch(/3 días/)
    expect(relativeTime('2026-03-15T12:00:00Z')).toMatch(/3 meses/)
  })

  it('daysSince y shortDate', () => {
    expect(daysSince('2026-06-10T12:00:00Z')).toBe(5)
    expect(shortDate('2026-06-10T12:00:00Z')).toMatch(/10/)
  })

  it('initials ignora el título «Profesor»', () => {
    expect(initials('Ana Pérez Gómez')).toBe('AP')
    expect(initials('Profesor Luis Rojas')).toBe('LR')
    expect(initials('Madonna')).toBe('M')
    expect(initials('')).toBe('')
  })

  it('greeting depende de la hora local', () => {
    vi.setSystemTime(new Date(2026, 5, 15, 8))
    expect(greeting()).toBe('Buenos días')
    vi.setSystemTime(new Date(2026, 5, 15, 15))
    expect(greeting()).toBe('Buenas tardes')
    vi.setSystemTime(new Date(2026, 5, 15, 22))
    expect(greeting()).toBe('Buenas noches')
  })

  it('homeFor lleva a cada rol a su inicio', () => {
    expect([homeFor('student'), homeFor('teacher'), homeFor('admin')]).toEqual(['/', '/docente', '/admin'])
  })

  it('cx y plural', () => {
    expect(cx('a', false, null, undefined, 'b')).toBe('a b')
    expect(plural(1, 'lección', 'lecciones')).toBe('1 lección')
    expect(plural(3, 'lección', 'lecciones')).toBe('3 lecciones')
  })
})
