import { AppError } from '../../../shared/errors.js'
import type { Hasher, UsuarioRepo } from '../domain/puertos.js'
import {
  aUsuarioPublico,
  contrasenaValida,
  esCorreoInstitucional,
  MIN_CONTRASENA,
  normalizarCorreo,
  type Rol,
  type UsuarioPublico,
} from '../domain/usuario.js'

export class AdminService {
  constructor(
    private readonly repo: UsuarioRepo,
    private readonly hasher: Hasher,
  ) {}

  async listar(): Promise<UsuarioPublico[]> {
    return (await this.repo.listar()).map(aUsuarioPublico)
  }

  async crear(datos: { nombre: string; correo: string; contrasena: string; rol: Rol }): Promise<UsuarioPublico> {
    const correo = normalizarCorreo(datos.correo)
    if (!esCorreoInstitucional(correo)) {
      throw new AppError(400, 'CORREO_NO_INSTITUCIONAL', 'Solo se permiten correos @uptc.edu.co.')
    }
    if (!contrasenaValida(datos.contrasena)) {
      throw new AppError(400, 'CONTRASENA_DEBIL', `La contraseña debe tener al menos ${MIN_CONTRASENA} caracteres.`)
    }
    const usuario = await this.repo.crear({
      nombre: datos.nombre.trim(),
      correo,
      hashContrasena: await this.hasher.hash(datos.contrasena),
      rol: datos.rol,
    })
    return aUsuarioPublico(usuario)
  }

  async actualizar(idAdmin: number, id: number, cambios: { rol?: Rol; activo?: boolean }): Promise<UsuarioPublico> {
    // Evita que el único admin se bloquee a sí mismo.
    if (id === idAdmin && (cambios.activo === false || (cambios.rol !== undefined && cambios.rol !== 'admin'))) {
      throw new AppError(400, 'AUTOMODIFICACION_NO_PERMITIDA', 'No puedes desactivarte ni quitarte el rol de administrador.')
    }
    const usuario = await this.repo.actualizar(id, cambios)
    if (!usuario) throw new AppError(404, 'USUARIO_NO_ENCONTRADO', 'Usuario no encontrado.')
    return aUsuarioPublico(usuario)
  }
}
