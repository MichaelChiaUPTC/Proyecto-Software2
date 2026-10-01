import type { ProgressState, StudentRow, User } from '@/types'
import { exercisesSeed } from './exercises'
import { lessonsSeed } from './lessons'

const daysAgo = (d: number, h = 0) => new Date(Date.now() - d * 864e5 - h * 36e5).toISOString()

export const studentUser: User = {
  id: 'u-camila',
  name: 'Camila Rojas Pineda',
  email: 'camila.rojas@uptc.edu.co',
  role: 'student',
  program: 'Ingeniería de Sistemas y Computación',
  semester: 1,
  group: 'Programación Básica · Grupo 02',
  joinedAt: daysAgo(63),
}

export const teacherUser: User = {
  id: 'u-docente',
  name: 'Profesor Andrés Beltrán',
  email: 'docente.beltran@uptc.edu.co',
  role: 'teacher',
  program: 'Escuela de Ingeniería de Sistemas y Computación',
  joinedAt: daysAgo(400),
}

const doneModules = ['m01', 'm02', 'm03', 'm04']

export function seedProgress(): ProgressState {
  const completedLessons = [
    ...lessonsSeed.filter((l) => doneModules.includes(l.moduleId)).map((l) => l.id),
    'm05-l1',
    'm05-l2',
  ]
  const exercises: ProgressState['exercises'] = {}
  for (const e of exercisesSeed.filter((x) => doneModules.includes(x.moduleId))) {
    exercises[e.id] = { solved: true, attempts: e.id === 'm03-conversion' ? 3 : 1 + (e.order % 2), bestHints: e.id === 'm04-multiplo' ? 1 : 0 }
  }
  exercises['m05-par'] = { solved: true, attempts: 2, bestHints: 0 }
  exercises['m05-mayor'] = { solved: false, attempts: 1, bestHints: 1 }

  return {
    completedLessons,
    exercises,
    attempts: [
      { id: 'a1', exerciseId: 'm05-mayor', at: daysAgo(0, 3), passed: false, hintsUsed: 1, feedback: 'Debe haber un return para cada posible resultado.' },
      { id: 'a2', exerciseId: 'm05-par', at: daysAgo(1, 2), passed: true, hintsUsed: 0, feedback: 'Cuando el residuo de dividir entre 2 es 0, el número es par.' },
      { id: 'a3', exerciseId: 'm05-par', at: daysAgo(1, 2.2), passed: false, hintsUsed: 0, feedback: 'No estás usando el residuo de dividir entre 2.' },
      { id: 'a4', exerciseId: 'm04-multiplo', at: daysAgo(5), passed: true, hintsUsed: 1, feedback: 'Una comparación ya vale True o False.' },
      { id: 'a5', exerciseId: 'm04-residuo', at: daysAgo(6), passed: true, hintsUsed: 0, feedback: 'El módulo aparece en paridad y ciclos circulares.' },
      { id: 'a6', exerciseId: 'm03-conversion', at: daysAgo(12), passed: true, hintsUsed: 1, feedback: 'El tipo de dato decide qué significa el operador.' },
      { id: 'a7', exerciseId: 'm03-conversion', at: daysAgo(12, 0.3), passed: false, hintsUsed: 0, feedback: 'Estás operando con texto. Convierte con int().' },
      { id: 'a8', exerciseId: 'm03-conversion', at: daysAgo(12, 0.5), passed: false, hintsUsed: 0, feedback: 'Estás operando con texto. Convierte con int().' },
    ],
    badges: {
      'primer-paso': daysAgo(60),
      constante: daysAgo(30),
      algoritmo: daysAgo(40),
      lector: daysAgo(20),
      'a-la-primera': daysAgo(58),
      persistente: daysAgo(12),
      'mitad-del-camino': daysAgo(8),
    },
    lessonsOpened: completedLessons,
  }
}

const rows: Omit<StudentRow, 'totalExercises'>[] = [
  { id: 's01', name: 'Camila Rojas Pineda', email: 'camila.rojas@uptc.edu.co', group: 'Grupo 02', progress: 0, solved: 0, successRate: 0, lastActivity: daysAgo(0, 3), currentModule: '05 · Estructuras condicionales' },
  { id: 's02', name: 'Juan David Cárdenas', email: 'juan.cardenas@uptc.edu.co', group: 'Grupo 02', progress: 71, solved: 15, successRate: 78, lastActivity: daysAgo(0, 6), currentModule: '06 · Ciclos y repetición' },
  { id: 's03', name: 'Laura Sofía Mendoza', email: 'laura.mendoza@uptc.edu.co', group: 'Grupo 01', progress: 88, solved: 18, successRate: 91, lastActivity: daysAgo(0, 1), currentModule: '07 · Funciones' },
  { id: 's04', name: 'Santiago Pérez Rincón', email: 'santiago.perez@uptc.edu.co', group: 'Grupo 01', progress: 34, solved: 6, successRate: 38, lastActivity: daysAgo(9), currentModule: '03 · Variables y tipos de datos' },
  { id: 's05', name: 'Valentina Gómez Ortiz', email: 'valentina.gomez@uptc.edu.co', group: 'Grupo 02', progress: 62, solved: 13, successRate: 70, lastActivity: daysAgo(2), currentModule: '05 · Estructuras condicionales' },
  { id: 's06', name: 'Daniel Alejandro Silva', email: 'daniel.silva@uptc.edu.co', group: 'Grupo 03', progress: 18, solved: 3, successRate: 33, lastActivity: daysAgo(14), currentModule: '02 · Algoritmos y pseudocódigo' },
  { id: 's07', name: 'María Paula Vargas', email: 'maria.vargas@uptc.edu.co', group: 'Grupo 03', progress: 79, solved: 17, successRate: 85, lastActivity: daysAgo(1), currentModule: '06 · Ciclos y repetición' },
  { id: 's08', name: 'Nicolás Barrera Torres', email: 'nicolas.barrera@uptc.edu.co', group: 'Grupo 01', progress: 55, solved: 11, successRate: 64, lastActivity: daysAgo(3), currentModule: '05 · Estructuras condicionales' },
  { id: 's09', name: 'Isabela Duarte Salcedo', email: 'isabela.duarte@uptc.edu.co', group: 'Grupo 02', progress: 94, solved: 20, successRate: 93, lastActivity: daysAgo(0, 8), currentModule: '08 · Estructuras de datos básicas' },
  { id: 's10', name: 'Esteban Camargo Ruiz', email: 'esteban.camargo@uptc.edu.co', group: 'Grupo 03', progress: 41, solved: 8, successRate: 52, lastActivity: daysAgo(8), currentModule: '04 · Operadores y expresiones' },
  { id: 's11', name: 'Sara Lucía Niño', email: 'sara.nino@uptc.edu.co', group: 'Grupo 01', progress: 67, solved: 14, successRate: 74, lastActivity: daysAgo(1, 5), currentModule: '05 · Estructuras condicionales' },
  { id: 's12', name: 'Andrés Felipe Sandoval', email: 'andres.sandoval@uptc.edu.co', group: 'Grupo 03', progress: 27, solved: 5, successRate: 45, lastActivity: daysAgo(11), currentModule: '03 · Variables y tipos de datos' },
  { id: 's13', name: 'Mariana Quintero Bernal', email: 'mariana.quintero@uptc.edu.co', group: 'Grupo 02', progress: 83, solved: 17, successRate: 88, lastActivity: daysAgo(0, 12), currentModule: '07 · Funciones' },
  { id: 's14', name: 'Felipe Ardila Moreno', email: 'felipe.ardila@uptc.edu.co', group: 'Grupo 01', progress: 49, solved: 10, successRate: 58, lastActivity: daysAgo(4), currentModule: '04 · Operadores y expresiones' },
]

export function studentRows(selfProgressPct: number, selfSolved: number, selfRate: number): StudentRow[] {
  const total = exercisesSeed.length
  return rows.map((r) =>
    r.id === 's01'
      ? { ...r, progress: selfProgressPct, solved: selfSolved, successRate: selfRate, totalExercises: total }
      : { ...r, totalExercises: total },
  )
}
