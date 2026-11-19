import type { Rol, Usuario } from './usuario.js'

export interface NuevoUsuario {
  nombre: string
  correo: string
  hashContrasena: string
  rol: Rol
}

export interface UsuarioRepo {
  buscarPorCorreo(correo: string): Promise<Usuario | null>
  buscarPorId(id: number): Promise<Usuario | null>
  listar(): Promise<Usuario[]>
  /** Lanza AppError 409 si el correo ya existe. */
  crear(nuevo: NuevoUsuario): Promise<Usuario>
  actualizar(id: number, cambios: { rol?: Rol; activo?: boolean }): Promise<Usuario | null>
}

export interface Hasher {
  hash(contrasena: string): Promise<string>
  comparar(contrasena: string, hash: string): Promise<boolean>
}

export interface TokenPayload {
  id: number
  rol: Rol
}

export interface Tokens {
  firmar(payload: TokenPayload): string
  /** Devuelve null si el token es inválido o expiró. */
  verificar(token: string): TokenPayload | null
}
