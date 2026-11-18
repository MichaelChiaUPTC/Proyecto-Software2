import { defineConfig, devices } from '@playwright/test'
import { API, WEB } from './support/env'

const port = new URL(WEB).port || '5173'

export default defineConfig({
  testDir: './tests',
  // Un solo worker: comparten la misma BD y el limite de envios, y el docente/admin ven datos globales.
  workers: 1,
  fullyParallel: false,
  retries: process.env.CI ? 1 : 0,
  timeout: 60_000,
  expect: { timeout: 10_000 },
  reporter: [['list'], ['html', { open: 'never' }], ['json', { outputFile: 'test-results/resultados.json' }]],
  globalSetup: './global-setup.ts',
  globalTeardown: './global-teardown.ts',
  use: { baseURL: WEB, locale: 'es-CO', trace: 'retain-on-failure', screenshot: 'only-on-failure', acceptDownloads: true },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'], viewport: { width: 1366, height: 800 } } }],
  webServer: {
    // El frontend en modo API (VITE_API_URL) contra la API de docker compose.
    command: `npm run dev -- --port ${port} --strictPort`,
    cwd: '../frontend',
    url: WEB,
    env: { VITE_API_URL: API },
    reuseExistingServer: false,
    timeout: 60_000,
  },
})
