import cors from 'cors'
import express from 'express'
import helmet from 'helmet'
import type { Pool } from 'mysql2/promise'
import { config } from './shared/config.js'
import { errorHandler, notFound } from './shared/middleware/error-handler.js'
import { usuariosRouter } from './modules/usuarios/infrastructure/routes.js'

export function createApp(pool: Pool, opts: { loginLimit?: number } = {}) {
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

  app.use(notFound)
  app.use(errorHandler)
  return app
}
