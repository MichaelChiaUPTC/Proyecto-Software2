import { Router } from 'express'
import type { Pool } from 'mysql2/promise'
import { z } from 'zod'
import { config } from '../../../shared/config.js'
import { crearRequireAuth, requireRole } from '../../usuarios/infrastructure/auth-middleware.js'
import { MysqlUsuarioRepo } from '../../usuarios/infrastructure/mysql-usuario-repo.js'
import { JwtTokens } from '../../usuarios/infrastructure/seguridad.js'
import type { ProcesadorEventos } from '../application/procesador-eventos.js'
import { ProgresoService } from '../application/progreso-service.js'
import type { ProgresoRepo } from '../domain/puertos.js'

const id = z.coerce.number({ error: 'Identificador inválido.' }).int('Identificador inválido.').positive('Identificador inválido.')
const limite = z.coerce.number({ error: 'limit inválido.' }).int('limit inválido.').min(1, 'limit inválido.').max(50, 'limit máximo: 50.').default(8)

export function progresoRouter(pool: Pool, repo: ProgresoRepo, procesador: ProcesadorEventos): Router {
  const svc = new ProgresoService(repo, procesador)
  const requireAuth = crearRequireAuth(new JwtTokens(config.JWT_SECRET, config.JWT_EXPIRES_IN), new MysqlUsuarioRepo(pool))
  const estudiante = [requireAuth, requireRole('student')]
  const router = Router()

  router.post('/lessons/:id/complete', ...estudiante, async (req, res) => void res.json(await svc.completarLeccion(req.usuario!.id, id.parse(req.params.id))))
  router.get('/exercises/:id/attempts', ...estudiante, async (req, res) => void res.json(await svc.intentosDeEjercicio(req.usuario!.id, id.parse(req.params.id))))
  router.get('/me/modules/:id', ...estudiante, async (req, res) => void res.json(await svc.rutaDeModulo(req.usuario!.id, id.parse(req.params.id))))
  router.get('/me/progress', ...estudiante, async (req, res) => void res.json(await svc.progreso(req.usuario!.id)))
  router.get('/me/badges', ...estudiante, async (req, res) => void res.json({ badges: await svc.insignias(req.usuario!.id) }))
  router.get('/me/activity', ...estudiante, async (req, res) => void res.json({ activity: await svc.actividad(req.usuario!.id, limite.parse(req.query.limit)) }))
  router.get('/me/home', ...estudiante, async (req, res) => void res.json(await svc.inicio(req.usuario!.id)))
  router.get('/me/profile', ...estudiante, async (req, res) => void res.json(await svc.perfil(req.usuario!.id)))
  return router
}
