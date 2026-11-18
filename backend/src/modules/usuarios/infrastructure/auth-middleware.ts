import type { RequestHandler } from 'express'
import { AppError } from '../../../shared/errors.js'
import type { Tokens, UsuarioRepo } from '../domain/puertos.js'
import type { Rol } from '../domain/usuario.js'

declare module 'express-serve-static-core' {
  interface Request {
    /** El rol viene del JWT; `activo` se verifica en la BD en cada petición. */
    usuario?: { id: number; rol: Rol }
  }
}

export function crearRequireAuth(tokens: Tokens, repo: UsuarioRepo): RequestHandler {
  return async (req, _res, next) => {
    const token = req.headers.authorization?.match(/^Bearer (.+)$/)?.[1]
    const payload = token ? tokens.verificar(token) : null
    if (!payload) throw new AppError(401, 'NO_AUTENTICADO', 'Debes iniciar sesión.')
    const usuario = await repo.buscarPorId(payload.id)
    if (!usuario) throw new AppError(401, 'NO_AUTENTICADO', 'Debes iniciar sesión.')
    if (!usuario.activo) throw new AppError(403, 'USUARIO_INACTIVO', 'Tu cuenta está desactivada. Contacta al administrador.')
    req.usuario = payload
    next()
  }
}

export const requireRole =
  (...roles: Rol[]): RequestHandler =>
  (req, _res, next) => {
    if (!req.usuario || !roles.includes(req.usuario.rol)) {
      throw new AppError(403, 'ACCESO_DENEGADO', 'No tienes permisos para realizar esta acción.')
    }
    next()
  }
