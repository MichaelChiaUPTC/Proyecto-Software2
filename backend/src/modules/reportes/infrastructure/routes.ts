import { Router } from 'express'
import type { Pool } from 'mysql2/promise'
import { z } from 'zod'
import { config } from '../../../shared/config.js'
import { crearRequireAuth, requireRole } from '../../usuarios/infrastructure/auth-middleware.js'
import { MysqlUsuarioRepo } from '../../usuarios/infrastructure/mysql-usuario-repo.js'
import { JwtTokens } from '../../usuarios/infrastructure/seguridad.js'
import { ReporteService } from '../application/reporte-service.js'
import { MysqlReporteRepo } from './mysql-reporte-repo.js'

const filtro = z.object({ group: z.string({ error: 'group inválido.' }).trim().min(1, 'group inválido.').max(80, 'group inválido.').optional() })

export function reportesRouter(pool: Pool): Router {
  const svc = new ReporteService(new MysqlReporteRepo(pool))
  const requireAuth = crearRequireAuth(new JwtTokens(config.JWT_SECRET, config.JWT_EXPIRES_IN), new MysqlUsuarioRepo(pool))
  const docente = [requireAuth, requireRole('teacher', 'admin')]
  const router = Router()

  router.get('/teacher/dashboard', ...docente, async (_req, res) => void res.json(await svc.dashboard()))
  router.get('/teacher/reports', ...docente, async (req, res) => void res.json({ students: await svc.reportes(filtro.parse(req.query).group) }))
  router.get('/teacher/reports.csv', ...docente, async (req, res) => {
    const csv = await svc.csv(filtro.parse(req.query).group)
    res.type('text/csv; charset=utf-8').set('Content-Disposition', 'attachment; filename="reporte-avance.csv"').send(csv)
  })
  return router
}
