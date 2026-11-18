import { createApp } from './app.js'
import { config } from './shared/config.js'
import { pool } from './shared/db.js'

const server = createApp(pool).listen(config.PORT, () => {
  console.log(`API escuchando en el puerto ${config.PORT}`)
})

const stop = () => server.close(() => void pool.end().then(() => process.exit(0)))
process.on('SIGTERM', stop)
process.on('SIGINT', stop)
