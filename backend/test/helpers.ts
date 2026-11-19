import bcrypt from 'bcrypt'
import request from 'supertest'
import { createApp } from '../src/app.js'
import { pool } from '../src/shared/db.js'
import type { Rol } from '../src/modules/usuarios/domain/usuario.js'

export const app = createApp(pool)
export { pool }
export const CLAVE = 'Demo1234'

/** Borra el progreso (intentos, insignias del usuario, eventos); `intento` bloquea el borrado de usuarios y ejercicios. */
export async function limpiarProgreso() {
  await pool.query('DELETE FROM intento')
  await pool.query('DELETE FROM usuario_insignia')
  await pool.query('DELETE FROM evento_outbox')
}

export async function limpiarUsuarios() {
  await limpiarProgreso()
  await pool.query('DELETE FROM usuario')
}

export async function crearUsuario(correo: string, rol: Rol = 'student', activo = true) {
  const hash = await bcrypt.hash(CLAVE, 4)
  await pool.execute('INSERT INTO usuario (nombre, correo, hash_contrasena, rol, activo) VALUES (?, ?, ?, ?, ?)', [`Usuario ${rol}`, correo, hash, rol, activo])
}

export async function tokenDe(correo: string): Promise<string> {
  const r = await request(app).post('/api/auth/login').send({ email: correo, password: CLAVE })
  return r.body.token
}

export const auth = (t: string) => ({ Authorization: `Bearer ${t}` })

export const ejercicioBase = (extra: object = {}) => ({
  title: 'Suma', statement: 'Suma dos números', difficulty: 'basic', starter: '# código', expectedAnswer: 'def suma(a, b): return a + b',
  hints: ['Usa +'], examples: [{ input: 'suma(1, 2)', expected: '3' }], constraints: [],
  rules: [{ pattern: 'return', message: 'Falta return', concept: 'funciones' }], successNote: 'Bien hecho',
  tests: [{ input: 'suma(1, 2)', expected: '3' }, { input: 'suma(5, 5)', expected: '10', hidden: true }], ...extra,
})

/** Crea módulo -> lección -> ejercicios y lo publica todo. Devuelve los ids. */
export async function arbolPublicado(docToken: string, codigo = 'M1', ejercicios: object[] = [ejercicioBase()]) {
  const T = '/api/teacher/content'
  const m = (await request(app).post(`${T}/modules`).set(auth(docToken)).send({ code: codigo, title: `Módulo ${codigo}`, summary: 'r' })).body.module
  const l = (await request(app).post(`${T}/lessons`).set(auth(docToken)).send({ moduleId: m.id, title: 'Lección', blocks: [{ type: 'p', text: 'Hola' }] })).body.lesson
  const es: { id: number }[] = []
  for (const e of ejercicios) es.push((await request(app).post(`${T}/exercises`).set(auth(docToken)).send({ lessonId: l.id, ...e })).body.exercise)
  for (const e of es) await request(app).post(`${T}/exercises/${e.id}/publish`).set(auth(docToken))
  await request(app).post(`${T}/lessons/${l.id}/publish`).set(auth(docToken))
  await request(app).post(`${T}/modules/${m.id}/publish`).set(auth(docToken))
  return { moduloId: m.id as number, leccionId: l.id as number, ejercicios: es.map((e) => e.id) }
}
