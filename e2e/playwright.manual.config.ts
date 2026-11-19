import { defineConfig, devices } from '@playwright/test'
import { API, WEB } from './support/env'

const port = new URL(WEB).port || '5173'

/**
 * Capturas nítidas del manual de usuario (docs/manual/img/). No forma parte de `npm test` ni del CI:
 *   cd e2e && npm run manual
 * Escritorio 1440x900 a escala 2 y móvil 390x844 a escala 3, tema claro, sin animaciones.
 */
export default defineConfig({
  testDir: './manual',
  workers: 1,
  fullyParallel: false,
  timeout: 240_000,
  expect: { timeout: 10_000 },
  reporter: [['list']],
  globalSetup: './global-setup.ts',
  globalTeardown: './global-teardown.ts',
  use: { baseURL: WEB, locale: 'es-CO', colorScheme: 'light', reducedMotion: 'reduce' },
  projects: [{ name: 'manual', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 } }],
  webServer: {
    command: `npm run dev -- --port ${port} --strictPort`,
    cwd: '../frontend',
    url: WEB,
    env: { VITE_API_URL: API },
    reuseExistingServer: false,
    timeout: 60_000,
  },
})
