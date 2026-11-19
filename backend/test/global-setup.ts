import mysql from 'mysql2/promise'
import { migrate } from '../src/shared/migrator.js'

// Crea uptc_test (si no existe) y la deja migrada. Requiere el usuario root del MySQL de docker compose.
export default async function setup() {
  const base = {
    host: process.env.DB_HOST ?? '127.0.0.1',
    port: Number(process.env.DB_PORT ?? 3306),
    user: 'root',
    password: process.env.MYSQL_ROOT_PASSWORD ?? 'root',
    multipleStatements: true,
  }
  const admin = await mysql.createConnection(base)
  await admin.query('CREATE DATABASE IF NOT EXISTS uptc_test CHARACTER SET utf8mb4')
  await admin.end()
  const conn = await mysql.createConnection({ ...base, database: 'uptc_test' })
  await migrate(conn)
  await conn.end()
}
