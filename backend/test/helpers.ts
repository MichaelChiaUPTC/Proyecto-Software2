import bcrypt from 'bcrypt'
import request from 'supertest'
import { createApp } from '../src/app.js'
import { pool } from '../src/shared/db.js'
import type { Rol } from '../src/modules/usuarios/domain/usuario.js'

export const app = createApp(pool)
export { pool }
export const CLAVE = 'Demo1234'

export async function limpiarUsuarios() {
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
