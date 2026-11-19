import { AppError } from '../../../shared/errors.js'
import type { Hasher, Tokens, UsuarioRepo } from '../domain/puertos.js'
import {
  aUsuarioPublico,
  contrasenaValida,
  esCorreoInstitucional,
  MIN_CONTRASENA,
  normalizarCorreo,
  type UsuarioPublico,
} from '../domain/usuario.js'

export interface Sesion {
  token: string
  user: UsuarioPublico
}

export class AuthService {
  private hashFalso?: Promise<string>

  constructor(
    private readonly repo: UsuarioRepo,
    private readonly hasher: Hasher,
    private readonly tokens: Tokens,
  ) {}

  async registrar(datos: { nombre: string; correo: string; contrasena: string }): Promise<Sesion> {
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
      rol: 'student',
    })
    return { token: this.tokens.firmar({ id: usuario.id, rol: usuario.rol }), user: aUsuarioPublico(usuario) }
  }

  async iniciarSesion(correo: string, contrasena: string): Promise<Sesion> {
    const usuario = await this.repo.buscarPorCorreo(normalizarCorreo(correo))
    // Se compara siempre contra un hash para que el tiempo de respuesta no revele si el correo existe.
    this.hashFalso ??= this.hasher.hash('contrasena-inexistente')
    const ok = await this.hasher.comparar(contrasena, usuario?.hashContrasena ?? (await this.hashFalso))
    if (!usuario || !ok) {
      throw new AppError(401, 'CREDENCIALES_INVALIDAS', 'Correo o contraseña incorrectos.')
    }
    if (!usuario.activo) {
      throw new AppError(403, 'USUARIO_INACTIVO', 'Tu cuenta está desactivada. Contacta al administrador.')
    }
    return { token: this.tokens.firmar({ id: usuario.id, rol: usuario.rol }), user: aUsuarioPublico(usuario) }
  }

  async perfil(id: number): Promise<UsuarioPublico> {
    const usuario = await this.repo.buscarPorId(id)
    if (!usuario) throw new AppError(404, 'USUARIO_NO_ENCONTRADO', 'Usuario no encontrado.')
    return aUsuarioPublico(usuario)
  }
}
