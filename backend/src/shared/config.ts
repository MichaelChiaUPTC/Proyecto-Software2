import { existsSync } from 'node:fs'
import { z } from 'zod'

if (existsSync('.env')) process.loadEnvFile('.env')

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),
  DB_HOST: z.string().default('127.0.0.1'),
  DB_PORT: z.coerce.number().int().positive().default(3306),
  DB_USER: z.string().default('uptc'),
  DB_PASSWORD: z.string().default('uptc_dev'),
  DB_NAME: z.string().default('uptc'),
  JWT_SECRET: z.string().min(16, 'JWT_SECRET debe tener al menos 16 caracteres'),
  JWT_EXPIRES_IN: z.string().default('8h'),
  BCRYPT_COST: z.coerce.number().int().min(4).max(15).default(12),
  LOGIN_RATE_LIMIT_MAX: z.coerce.number().int().positive().default(10),
})

export const config = schema.parse(process.env)
