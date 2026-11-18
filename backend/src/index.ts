import { createApp } from './app.js'
import type { ProcesadorEventos } from './modules/progreso/application/procesador-eventos.js'
import { config } from './shared/config.js'
import { pool } from './shared/db.js'

const app = createApp(pool)
const procesador = app.locals.procesador as ProcesadorEventos
procesador.iniciarRespaldo(config.OUTBOX_INTERVAL_MS)
void procesador.procesarPendientes().catch((e) => console.error('Procesador de eventos:', e)) // pendientes de antes del arranque
const server = app.listen(config.PORT, () => {
  console.log(`API escuchando en el puerto ${config.PORT}`)
})

const stop = () => server.close(() => void pool.end().then(() => process.exit(0)))
process.on('SIGTERM', stop)
process.on('SIGINT', stop)
