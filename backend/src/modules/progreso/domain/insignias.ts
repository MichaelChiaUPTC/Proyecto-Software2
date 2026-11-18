import type { Contexto, Progreso } from './progreso.js'

export interface InsigniaDef {
  id: string
  name: string
  condition: string
  target: number
  progress: (p: Progreso, c: Contexto) => number
}

const resueltos = (p: Progreso) => Object.values(p.exercises).filter((e) => e.solved).length

// Portado de frontend/src/utils/badges.ts. Los módulos 'decisiones' y 'bucle' se identifican por su código ('05', '06').
export const badgeDefs: InsigniaDef[] = [
  { id: 'primer-paso', name: 'Primer paso', condition: 'Resolver tu primer ejercicio.', target: 1, progress: (p) => resueltos(p) },
  { id: 'constante', name: 'Constante', condition: 'Completar 5 ejercicios.', target: 5, progress: (p) => resueltos(p) },
  { id: 'algoritmo', name: 'Algoritmo', condition: 'Completar un módulo.', target: 1, progress: (_p, c) => c.completedModules },
  { id: 'a-la-primera', name: 'A la primera', condition: 'Resolver un ejercicio en el primer intento y sin pistas.', target: 1, progress: (p) => Object.values(p.exercises).filter((e) => e.solved && e.attempts === 1 && e.bestHints === 0).length },
  { id: 'lector', name: 'Lector', condition: 'Completar 10 lecciones.', target: 10, progress: (p) => p.completedLessons.length },
  { id: 'persistente', name: 'Persistente', condition: 'Resolver un ejercicio después de 3 o más intentos.', target: 1, progress: (p) => Object.values(p.exercises).filter((e) => e.solved && e.attempts >= 3).length },
  { id: 'mitad-del-camino', name: 'Mitad del camino', condition: 'Completar 4 módulos.', target: 4, progress: (_p, c) => c.completedModules },
  { id: 'decisiones', name: 'Decisiones', condition: 'Completar el módulo de Estructuras condicionales.', target: 1, progress: (_p, c) => (c.completedModuleCodes.includes('05') ? 1 : 0) },
  { id: 'bucle', name: 'Bucle', condition: 'Completar el módulo de Ciclos y repetición.', target: 1, progress: (_p, c) => (c.completedModuleCodes.includes('06') ? 1 : 0) },
  { id: 'ruta-completa', name: 'Ruta completa', condition: 'Completar los 8 módulos.', target: 8, progress: (_p, c) => c.completedModules },
]
