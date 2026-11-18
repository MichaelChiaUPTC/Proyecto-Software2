export const API = process.env.E2E_API_URL ?? 'http://localhost:3000/api'
export const WEB = process.env.E2E_WEB_URL ?? 'http://localhost:5173'
export const PASSWORD = 'Demo1234'
export const DEMO = {
  student: 'estudiante@uptc.edu.co',
  teacher: 'docente@uptc.edu.co',
  admin: 'admin@uptc.edu.co',
}

/** Identificador de la ejecucion: los correos y titulos creados por las pruebas llevan este sufijo. */
export const RUN = process.env.E2E_RUN_ID ?? Date.now().toString(36)
export const e2eEmail = (tag: string) => `e2e-${tag}-${RUN}@uptc.edu.co`
