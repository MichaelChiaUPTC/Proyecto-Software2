import mysql from 'mysql2/promise'
import { config } from './config.js'

export const dbSettings = {
  host: config.DB_HOST,
  port: config.DB_PORT,
  user: config.DB_USER,
  password: config.DB_PASSWORD,
  database: config.DB_NAME,
  charset: 'utf8mb4',
  timezone: 'Z',
}

export const pool = mysql.createPool({ ...dbSettings, connectionLimit: 10 })
