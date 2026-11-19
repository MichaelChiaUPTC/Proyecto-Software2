import { defineConfig } from 'vitest/config'

// Las pruebas de integración usan una BD aparte (uptc_test) en el MySQL de docker compose.
export default defineConfig({
  test: {
    globalSetup: ['test/global-setup.ts'],
    fileParallelism: false,
    coverage: { provider: 'v8', include: ['src/**/*.ts'], reporter: ['text-summary', 'json-summary', 'html'] },
    env: {
      NODE_ENV: 'test',
      DB_HOST: process.env.DB_HOST ?? '127.0.0.1',
      DB_PORT: process.env.DB_PORT ?? '3306',
      DB_USER: 'root',
      DB_PASSWORD: process.env.MYSQL_ROOT_PASSWORD ?? 'root',
      DB_NAME: 'uptc_test',
      JWT_SECRET: 'secreto-de-pruebas-0123456789',
      BCRYPT_COST: '4',
      LOGIN_RATE_LIMIT_MAX: '1000',
    },
  },
})
