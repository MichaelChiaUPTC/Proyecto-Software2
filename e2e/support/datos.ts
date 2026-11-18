import { apiContext, loginApi, registerApi } from './api'
import { e2eEmail } from './env'

export const SOLUCION_ORDEN = 'def secuencia():\n    print("Inicio")\n    print("Fin")'

/**
 * Estudiante nuevo con algo de historia (lección 1 completada, ejercicio «El orden importa» resuelto con un
 * intento fallido antes), para que las pantallas no salgan vacías. Todo por la API.
 */
export async function estudianteConHistoria(tag: string, nombre: string) {
  const email = e2eEmail(tag)
  await registerApi(nombre, email)
  const api = await apiContext(await loginApi(email))
  const lista = (await (await api.get('me/exercises')).json()) as { exercises: { exercise: { id: number; title: string } }[] }
  const orden = lista.exercises.find((e) => e.exercise.title === 'El orden importa')!.exercise.id
  await api.post('lessons/1/complete')
  await api.post(`exercises/${orden}/submissions`, { data: { code: 'def secuencia():\n    print("Fin")', hintsUsed: 0 } })
  const ok = await api.post(`exercises/${orden}/submissions`, { data: { code: SOLUCION_ORDEN, hintsUsed: 1 } })
  if (!(await ok.json()).passed) throw new Error('El envío de preparación no aprobó')
  await api.dispose()
  return { email, nombre }
}
