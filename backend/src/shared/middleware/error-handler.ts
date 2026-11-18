import type { ErrorRequestHandler, RequestHandler } from 'express'
import { ZodError } from 'zod'
import { AppError } from '../errors.js'

export const notFound: RequestHandler = (_req, res) => {
  res.status(404).json({ error: { code: 'NO_ENCONTRADO', message: 'Recurso no encontrado.' } })
}

// Express exige los 4 parametros para reconocer un manejador de errores.
export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof AppError) {
    res.status(err.status).json({ error: { code: err.code, message: err.message } })
  } else if (err instanceof ZodError) {
    res.status(400).json({ error: { code: 'DATOS_INVALIDOS', message: err.issues[0]?.message ?? 'Datos inválidos.' } })
  } else if (err instanceof SyntaxError && 'body' in err) {
    res.status(400).json({ error: { code: 'JSON_INVALIDO', message: 'El cuerpo de la petición no es JSON válido.' } })
  } else {
    console.error(err)
    res.status(500).json({ error: { code: 'ERROR_INTERNO', message: 'Error interno del servidor.' } })
  }
}
