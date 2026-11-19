import mysql from 'mysql2/promise'
import { dbSettings } from '../shared/db.js'
import { migrate } from '../shared/migrator.js'

const conn = await mysql.createConnection({ ...dbSettings, multipleStatements: true })
const applied = await migrate(conn)
console.log(applied.length ? `Migraciones aplicadas: ${applied.join(', ')}` : 'Base de datos al día.')
await conn.end()
