import { readdir, readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import type { Connection } from 'mysql2/promise'

const dir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../db/migrations')

/** Aplica en orden los .sql de db/migrations que aún no están en schema_migrations. La conexión debe tener multipleStatements. */
export async function migrate(conn: Connection): Promise<string[]> {
  await conn.query(
    'CREATE TABLE IF NOT EXISTS schema_migrations (version VARCHAR(100) PRIMARY KEY, aplicada DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP)',
  )
  const [rows] = await conn.query('SELECT version FROM schema_migrations')
  const done = new Set((rows as { version: string }[]).map((r) => r.version))
  const files = (await readdir(dir)).filter((f) => f.endsWith('.sql')).sort()
  const applied: string[] = []
  for (const file of files.filter((f) => !done.has(f))) {
    await conn.query(await readFile(path.join(dir, file), 'utf8'))
    await conn.query('INSERT INTO schema_migrations (version) VALUES (?)', [file])
    applied.push(file)
  }
  return applied
}
