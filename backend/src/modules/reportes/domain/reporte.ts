// Reportes del docente (RF-06). Se calculan con las mismas reglas de progreso que ve el estudiante.
import { findTarget, stats, type Catalogo, type ModuloInfo, type Progreso } from '../../progreso/domain/progreso.js'

/** Mismos campos que `StudentRow` del frontend. */
export interface FilaEstudiante {
  id: number
  name: string
  email: string
  group: string
  progress: number
  solved: number
  totalExercises: number
  successRate: number
  /** Intentos enviados: sin ninguno, el 0 % de éxito no es una señal de alerta. */
  attempts: number
  lastActivity: string
  currentModule: string
}

/** Lo que se sabe de cada estudiante, ya agregado por la BD (no se cargan los intentos uno a uno). */
export interface DatosEstudiante {
  id: number
  nombre: string
  correo: string
  grupo: string | null
  creado: Date
  /** ejercicio -> intentos y si alguno aprobó */
  ejercicios: Map<number, { intentos: number; aprobado: boolean }>
  lecciones: number[]
  intentos: number
  aprobados: number
  ultima: Date | null
}

export const SIN_GRUPO = 'Sin grupo'
export const DIAS_INACTIVIDAD = 7
export const EXITO_MINIMO = 40

export type FilaConModulo = FilaEstudiante & { moduloActual: ModuloInfo | null }

export function construirFila(d: DatosEstudiante, c: Catalogo): FilaConModulo {
  const p: Progreso = {
    completedLessons: d.lecciones,
    exercises: Object.fromEntries([...d.ejercicios].map(([id, e]) => [id, { solved: e.aprobado, attempts: e.intentos, bestHints: 0 }])),
    attempts: [], badges: {}, lessonLog: [],
  }
  const s = stats(p, c)
  const meta = findTarget(p, c)
  const moduloActual = meta?.module ?? null
  return {
    id: d.id, name: d.nombre, email: d.correo, group: d.grupo ?? SIN_GRUPO,
    progress: s.overallPct, solved: s.solved, totalExercises: s.totalExercises,
    successRate: d.intentos ? Math.round((d.aprobados / d.intentos) * 100) : 0,
    attempts: d.intentos,
    // Sin actividad todavía: cuenta desde que se registró.
    lastActivity: (d.ultima ?? d.creado).toISOString(),
    currentModule: moduloActual ? `${moduloActual.code} · ${moduloActual.title}` : c.modules.length > 0 ? 'Curso completado' : '—',
    moduloActual,
  }
}

export const sinModulo = ({ moduloActual: _m, ...fila }: FilaConModulo): FilaEstudiante => fila

export const necesitaAtencion = (f: Pick<FilaEstudiante, 'lastActivity' | 'successRate' | 'attempts'>, ahora: number) =>
  ahora - new Date(f.lastActivity).getTime() >= DIAS_INACTIVIDAD * 864e5 || (f.attempts > 0 && f.successRate < EXITO_MINIMO)

/** Cuántos estudiantes tienen cada módulo como actual (solo módulos publicados, en orden). */
export function distribucion(filas: FilaConModulo[], c: Catalogo) {
  return [...c.modules].sort((a, b) => a.order - b.order).map((m) => ({
    module: { ...m, published: true },
    students: filas.filter((f) => f.moduloActual?.id === m.id).length,
  }))
}

/* ───────── CSV ───────── */

const CABECERA = ['Estudiante', 'Correo', 'Grupo', 'Progreso (%)', 'Ejercicios resueltos', 'Total ejercicios', 'Éxito (%)', 'Última actividad', 'Módulo actual']

/** Evita que Excel interprete el texto como fórmula (inyección de CSV). */
const seguro = (v: string | number) => {
  const t = String(v)
  return /^[=+\-@\t\r]/.test(t) ? `'${t}` : t
}
const celda = (v: string | number) => `"${seguro(v).replace(/"/g, '""')}"`

/** CSV en UTF-8 con BOM (para que Excel respete las tildes) y saltos CRLF. */
export function aCsv(filas: FilaEstudiante[]): string {
  const cuerpo = filas.map((f) => [f.name, f.email, f.group, f.progress, f.solved, f.totalExercises, f.successRate, f.lastActivity, f.currentModule])
  return '﻿' + [CABECERA, ...cuerpo].map((l) => l.map(celda).join(',')).join('\r\n') + '\r\n'
}
