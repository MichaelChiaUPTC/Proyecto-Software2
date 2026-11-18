import { Router } from 'express'
import type { Pool } from 'mysql2/promise'
import { z } from 'zod'
import { config } from '../../../shared/config.js'
import { MysqlContenidoRepo } from '../../contenidos/infrastructure/mysql-contenido-repo.js'
import { crearRequireAuth, requireRole } from '../../usuarios/infrastructure/auth-middleware.js'
import { MysqlUsuarioRepo } from '../../usuarios/infrastructure/mysql-usuario-repo.js'
import { JwtTokens } from '../../usuarios/infrastructure/seguridad.js'
import { PistaService } from '../application/pista-service.js'
import type { HintProvider } from '../domain/puertos.js'
import { ClaudeHints } from './claude-hints.js'
import { GeminiHints } from './gemini-hints.js'
import { MysqlPistaRepo } from './mysql-pista-repo.js'

const id = z.coerce.number({ error: 'Identificador inválido.' }).int('Identificador inválido.').positive('Identificador inválido.')

/** Elige el adaptador según el entorno; null si es `none` o falta la clave. */
export function proveedorDesdeConfig(): HintProvider | null {
  const timeoutMs = config.AI_TIMEOUT_MS
  if (config.AI_PROVIDER === 'gemini' && config.GEMINI_API_KEY) return new GeminiHints({ apiKey: config.GEMINI_API_KEY, model: config.GEMINI_MODEL, timeoutMs })
  if (config.AI_PROVIDER === 'claude' && config.ANTHROPIC_API_KEY) return new ClaudeHints({ apiKey: config.ANTHROPIC_API_KEY, model: config.ANTHROPIC_MODEL, timeoutMs })
  return null
}

export function pistasRouter(pool: Pool, provider: HintProvider | null): Router {
  const svc = new PistaService(new MysqlContenidoRepo(pool), new MysqlPistaRepo(pool), provider)
  const requireAuth = crearRequireAuth(new JwtTokens(config.JWT_SECRET, config.JWT_EXPIRES_IN), new MysqlUsuarioRepo(pool))
  const router = Router()
  router.post('/exercises/:id/ai-hint', requireAuth, requireRole('student'), async (req, res) => {
    const p = await svc.pedir(req.usuario!.id, id.parse(req.params.id))
    res.json({ hint: p.texto, source: p.fuente })
  })
  return router
}
