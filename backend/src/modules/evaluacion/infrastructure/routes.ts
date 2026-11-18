import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import type { Pool } from 'mysql2/promise'
import { z } from 'zod'
import { config } from '../../../shared/config.js'
import { MysqlContenidoRepo } from '../../contenidos/infrastructure/mysql-contenido-repo.js'
import type { Gamificacion } from '../../progreso/domain/puertos.js'
import { crearRequireAuth, requireRole } from '../../usuarios/infrastructure/auth-middleware.js'
import { MysqlUsuarioRepo } from '../../usuarios/infrastructure/mysql-usuario-repo.js'
import { JwtTokens } from '../../usuarios/infrastructure/seguridad.js'
import { EvaluacionService } from '../application/evaluacion-service.js'
import type { CodeRunner } from '../domain/runner.js'
import { MysqlIntentoRepo } from './mysql-intento-repo.js'

export const MAX_CODIGO_BYTES = 20_000

const envioSchema = z.object({
  code: z
    .string({ error: 'El código es obligatorio.' })
    .min(1, 'Escribe tu código antes de enviar.')
    .refine((c) => Buffer.byteLength(c, 'utf8') <= MAX_CODIGO_BYTES, `El código es demasiado largo (máximo ${MAX_CODIGO_BYTES / 1000} KB).`),
  hintsUsed: z.number({ error: 'hintsUsed debe ser un número.' }).int().min(0).max(20).default(0),
})
const id = z.coerce.number({ error: 'Identificador inválido.' }).int('Identificador inválido.').positive('Identificador inválido.')

export function evaluacionRouter(pool: Pool, deps: { runner: CodeRunner; gamificacion: Gamificacion; submitLimit?: number }): Router {
  const svc = new EvaluacionService(new MysqlContenidoRepo(pool), deps.runner, new MysqlIntentoRepo(pool), deps.gamificacion)
  const requireAuth = crearRequireAuth(new JwtTokens(config.JWT_SECRET, config.JWT_EXPIRES_IN), new MysqlUsuarioRepo(pool))

  // Por usuario (no por IP): cada envío arranca un contenedor.
  const limiteEnvios = rateLimit({
    windowMs: 60 * 1000,
    limit: deps.submitLimit ?? config.SUBMIT_RATE_LIMIT_MAX,
    keyGenerator: (req) => `u${req.usuario!.id}`,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    handler: (_req, res) => {
      res.status(429).json({ error: { code: 'DEMASIADOS_ENVIOS', message: 'Estás enviando demasiado rápido. Espera un momento antes de intentarlo de nuevo.' } })
    },
  })

  const router = Router()
  router.post('/exercises/:id/submissions', requireAuth, requireRole('student'), limiteEnvios, async (req, res) => {
    const ejercicioId = id.parse(req.params.id)
    const b = envioSchema.parse(req.body)
    const { resultado } = await svc.enviar(req.usuario!.id, ejercicioId, b.code, b.hintsUsed)
    res.json(resultado)
  })
  return router
}
