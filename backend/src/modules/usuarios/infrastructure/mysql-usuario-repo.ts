import type { Pool, ResultSetHeader, RowDataPacket } from 'mysql2/promise'
import { AppError } from '../../../shared/errors.js'
import type { NuevoUsuario, UsuarioRepo } from '../domain/puertos.js'
import type { Rol, Usuario } from '../domain/usuario.js'

interface Fila extends RowDataPacket {
  id_usuario: number
  nombre: string
  correo: string
  hash_contrasena: string
  rol: Rol
  activo: number
  programa: string | null
  semestre: number | null
  grupo: string | null
  fecha_creacion: Date
}

const aUsuario = (f: Fila): Usuario => ({
  id: f.id_usuario,
  nombre: f.nombre,
  correo: f.correo,
  hashContrasena: f.hash_contrasena,
  rol: f.rol,
  activo: Boolean(f.activo),
  programa: f.programa,
  semestre: f.semestre,
  grupo: f.grupo,
  fechaCreacion: f.fecha_creacion,
})

export class MysqlUsuarioRepo implements UsuarioRepo {
  constructor(private readonly pool: Pool) {}

  private async uno(donde: string, valor: string | number): Promise<Usuario | null> {
    const [filas] = await this.pool.query<Fila[]>(`SELECT * FROM usuario WHERE ${donde} = ? LIMIT 1`, [valor])
    return filas[0] ? aUsuario(filas[0]) : null
  }

  buscarPorCorreo(correo: string) {
    return this.uno('correo', correo)
  }

  buscarPorId(id: number) {
    return this.uno('id_usuario', id)
  }

  async listar() {
    const [filas] = await this.pool.query<Fila[]>('SELECT * FROM usuario ORDER BY id_usuario')
    return filas.map(aUsuario)
  }

  async crear(n: NuevoUsuario) {
    try {
      const [r] = await this.pool.execute<ResultSetHeader>(
        'INSERT INTO usuario (nombre, correo, hash_contrasena, rol) VALUES (?, ?, ?, ?)',
        [n.nombre, n.correo, n.hashContrasena, n.rol],
      )
      return (await this.buscarPorId(r.insertId))!
    } catch (e) {
      if ((e as { code?: string }).code === 'ER_DUP_ENTRY') {
        throw new AppError(409, 'CORREO_EXISTENTE', 'Ya existe una cuenta con ese correo.')
      }
      throw e
    }
  }

  async actualizar(id: number, cambios: { rol?: Rol; activo?: boolean }) {
    const campos: string[] = []
    const valores: (string | number)[] = []
    if (cambios.rol !== undefined) {
      campos.push('rol = ?')
      valores.push(cambios.rol)
    }
    if (cambios.activo !== undefined) {
      campos.push('activo = ?')
      valores.push(cambios.activo ? 1 : 0)
    }
    if (campos.length) await this.pool.execute(`UPDATE usuario SET ${campos.join(', ')} WHERE id_usuario = ?`, [...valores, id])
    return this.buscarPorId(id)
  }
}
