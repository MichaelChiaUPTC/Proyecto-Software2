import { spawnSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const root = join(here, '..', '..')

/** Ejecuta cleanup.sql en el MySQL de docker compose (servicio `mysql`). */
export function cleanup() {
  const user = process.env.DB_USER ?? 'uptc'
  const pass = process.env.DB_PASSWORD ?? 'uptc_dev'
  const db = process.env.DB_NAME ?? 'uptc'
  const r = spawnSync('docker', ['compose', 'exec', '-T', 'mysql', 'mysql', `-u${user}`, `-p${pass}`, db], {
    cwd: root,
    input: readFileSync(join(here, '..', 'cleanup.sql')),
    encoding: 'utf8',
  })
  if (r.status !== 0) console.warn(`[e2e] No se pudo limpiar la BD: ${r.stderr}`)
}
