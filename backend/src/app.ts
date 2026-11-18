import cors from 'cors'
import express from 'express'
import helmet from 'helmet'
import type { Pool } from 'mysql2/promise'
import { config } from './shared/config.js'
import { errorHandler, notFound } from './shared/middleware/error-handler.js'
import { usuariosRouter } from './modules/usuarios/infrastructure/routes.js'
import { contenidosRouter } from './modules/contenidos/infrastructure/routes.js'
import type { CodeRunner } from './modules/evaluacion/domain/runner.js'
import { DockerRunner } from './modules/evaluacion/infrastructure/docker-runner.js'
import { evaluacionRouter } from './modules/evaluacion/infrastructure/routes.js'
import type { HintProvider } from './modules/pistas-ia/domain/puertos.js'
import { pistasRouter, proveedorDesdeConfig } from './modules/pistas-ia/infrastructure/routes.js'
import { ProcesadorEventos } from './modules/progreso/application/procesador-eventos.js'
import { MysqlProgresoRepo } from './modules/progreso/infrastructure/mysql-progreso-repo.js'
import { reportesRouter } from './modules/reportes/infrastructure/routes.js'
import { progresoRouter } from './modules/progreso/infrastructure/routes.js'

export interface AppOpts {
  loginLimit?: number
  submitLimit?: number
  /** Motor de corrección; por omisión DockerRunner con la configuración del entorno. */
  runner?: CodeRunner
  /** Proveedor de pistas; por omisión según AI_PROVIDER (null = sin IA). */
  hintProvider?: HintProvider | null
}

export function createApp(pool: Pool, opts: AppOpts = {}) {
  const app = express()
  app.use(helmet())
  app.use(cors({ origin: config.CORS_ORIGIN.split(',').map((o) => o.trim()) }))
  app.use(express.json({ limit: '100kb' }))

  app.get('/api/health', async (_req, res) => {
    try {
      await pool.query('SELECT 1')
      res.json({ status: 'ok', db: 'up' })
    } catch {
      res.status(503).json({ status: 'degraded', db: 'down' })
    }
  })
  app.use('/api', usuariosRouter(pool, opts))
  app.use('/api', contenidosRouter(pool))

  const runner = opts.runner ?? new DockerRunner({
    image: config.RUNNER_IMAGE, timeoutMs: config.RUNNER_TIMEOUT_MS, memory: config.RUNNER_MEMORY, cpus: config.RUNNER_CPUS,
    pids: config.RUNNER_PIDS, maxConcurrent: config.RUNNER_MAX_CONCURRENT, dockerBin: config.RUNNER_DOCKER_BIN,
  })
  const progresoRepo = new MysqlProgresoRepo(pool)
  const procesador = new ProcesadorEventos(progresoRepo)
  app.locals.procesador = procesador
  app.use('/api', evaluacionRouter(pool, { runner, gamificacion: procesador, submitLimit: opts.submitLimit }))
  app.use('/api', progresoRouter(pool, progresoRepo, procesador))
  app.use('/api', reportesRouter(pool))
  app.use('/api', pistasRouter(pool, opts.hintProvider === undefined ? proveedorDesdeConfig() : opts.hintProvider))

  app.use(notFound)
  app.use(errorHandler)
  return app
}
