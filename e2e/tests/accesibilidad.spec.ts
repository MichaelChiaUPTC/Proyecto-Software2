import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import os from 'node:os'
import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'
import { estudianteConHistoria } from '../support/datos'
import { DEMO, PASSWORD } from '../support/env'
import { loginUi } from '../support/ui'

/**
 * Accesibilidad (RNF-07): axe-core con las etiquetas WCAG 2.0/2.1 A y AA sobre login, vistas del estudiante,
 * del docente y de admin, en tema claro y oscuro. Escribe docs/evidencias/accesibilidad.md y falla si queda
 * alguna violación seria o crítica.
 */
const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']
const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'docs', 'evidencias')

interface Hallazgo { vista: string; tema: string; regla: string; impacto: string; ayuda: string; wcag: string; nodos: number; ejemplo: string }
const hallazgos: Hallazgo[] = []
const vistasProbadas = new Set<string>()
let axeVersion = ''

async function auditar(page: Page, vista: string, tema: string) {
  await page.waitForLoadState('networkidle')
  const r = await new AxeBuilder({ page }).withTags(TAGS).analyze()
  axeVersion = r.testEngine.version
  vistasProbadas.add(vista)
  for (const v of r.violations) {
    hallazgos.push({
      vista,
      tema,
      regla: v.id,
      impacto: v.impact ?? 'minor',
      ayuda: v.help,
      wcag: v.tags.filter((t) => /^wcag\d{3,4}$/.test(t)).map((t) => t.replace('wcag', '')).join(', ') || '-',
      nodos: v.nodes.length,
      ejemplo: (v.nodes[0]?.target ?? []).join(' ').slice(0, 120),
    })
  }
}

async function irA(page: Page, ruta: string, h1: string | RegExp) {
  await page.goto(ruta)
  await expect(page.getByRole('heading', { level: 1, name: h1 })).toBeVisible()
}

for (const tema of [{ id: 'claro', colorScheme: 'light' as const }, { id: 'oscuro', colorScheme: 'dark' as const }]) {
  test.describe(`axe (${tema.id})`, () => {
    test.use({ colorScheme: tema.colorScheme, reducedMotion: 'reduce' })

    test('login y registro', async ({ page }) => {
      await page.goto('/login')
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
      await auditar(page, 'Login · Ingresar', tema.id)
      await page.getByRole('tab', { name: 'Crear cuenta' }).click()
      await page.getByRole('button', { name: 'Crear cuenta', exact: true }).click() // muestra los errores de validación
      await expect(page.getByText('Escribe tu nombre completo.')).toBeVisible()
      await auditar(page, 'Login · Crear cuenta (con errores)', tema.id)
    })

    test('vistas del estudiante', async ({ page }) => {
      const { email } = await estudianteConHistoria(`axe-est-${tema.id}`, 'Estudiante Axe')
      await loginUi(page, email)
      await expect(page).toHaveURL('/')
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
      await auditar(page, 'Estudiante · Inicio', tema.id)
      await irA(page, '/modulos', 'Módulos'); await auditar(page, 'Estudiante · Módulos', tema.id)
      await irA(page, '/modulos/1', /Introducción/); await auditar(page, 'Estudiante · Detalle de módulo', tema.id)
      await irA(page, '/lecciones/2', 'Tu primer programa en Python'); await auditar(page, 'Estudiante · Lección', tema.id)
      await irA(page, '/ejercicios', 'Ejercicios'); await auditar(page, 'Estudiante · Lista de ejercicios', tema.id)

      await irA(page, '/ejercicios/1', 'Saluda a la universidad')
      await auditar(page, 'Estudiante · Ejercicio (inicial)', tema.id)
      await page.getByLabel('Código de la función saludar').fill('def saludar():\n    print("Hola")')
      await page.getByRole('button', { name: 'Ejecutar y enviar' }).click()
      await expect(page.getByRole('status').filter({ hasText: 'Hay un problema' })).toBeVisible()
      await auditar(page, 'Estudiante · Ejercicio (fallo, botón de IA)', tema.id)
      await page.getByRole('button', { name: 'Pedir ayuda a la IA' }).click()
      await expect(page.getByText(/Pista (de la IA|del curso)/)).toBeVisible()
      await auditar(page, 'Estudiante · Ejercicio (pista de la IA)', tema.id)
      await page.getByLabel('Código de la función saludar').fill('def saludar():\n    print("Hola, UPTC")')
      await page.getByRole('button', { name: 'Ejecutar y enviar' }).click()
      await expect(page.getByRole('status').filter({ hasText: 'Correcto' })).toBeVisible()
      await auditar(page, 'Estudiante · Ejercicio (correcto)', tema.id)

      await irA(page, '/progreso', 'Progreso'); await auditar(page, 'Estudiante · Progreso', tema.id)
      await irA(page, '/insignias', 'Insignias'); await auditar(page, 'Estudiante · Insignias', tema.id)
      await irA(page, '/perfil', 'Estudiante Axe'); await auditar(page, 'Estudiante · Perfil', tema.id)
    })

    test('vistas del docente', async ({ page }) => {
      await loginUi(page, DEMO.teacher)
      await expect(page).toHaveURL(/\/docente$/)
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
      await auditar(page, 'Docente · Panel', tema.id)
      await irA(page, '/docente/contenido', 'Gestión de contenido'); await auditar(page, 'Docente · Contenido', tema.id)
      await irA(page, '/docente/ejercicios', 'Ejercicios'); await auditar(page, 'Docente · Ejercicios', tema.id)
      await page.goto('/docente/ejercicios/1')
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
      await auditar(page, 'Docente · Editor de ejercicio', tema.id)
      await irA(page, '/docente/reportes', 'Reportes de avance'); await auditar(page, 'Docente · Reportes', tema.id)
    })

    test('vistas del administrador', async ({ page }) => {
      await loginUi(page, DEMO.admin)
      await expect(page).toHaveURL(/\/admin$/)
      await expect(page.getByRole('heading', { level: 1, name: 'Usuarios' })).toBeVisible()
      await auditar(page, 'Admin · Usuarios', tema.id)
      await page.getByRole('button', { name: 'Nuevo usuario' }).click()
      const d = page.getByRole('dialog', { name: 'Nuevo usuario' })
      await d.getByRole('button', { name: 'Crear usuario' }).click()
      await expect(d.getByText('Escribe el nombre completo.')).toBeVisible()
      await d.getByLabel('Nombre completo').fill('Persona Ejemplo')
      await d.getByLabel('Contraseña inicial').fill(PASSWORD)
      await auditar(page, 'Admin · Crear usuario (modal con errores)', tema.id)
      await page.keyboard.press('Escape')
      await page.getByLabel('Buscar usuario').fill('estudiante@')
      await page.getByRole('button', { name: /Desactivar a/ }).click()
      await expect(page.getByRole('dialog', { name: 'Desactivar usuario' })).toBeVisible()
      await auditar(page, 'Admin · Desactivar usuario (modal)', tema.id)
    })
  })
}

test('no quedan violaciones críticas ni serias', () => {
  expect(hallazgos.filter((h) => h.impacto === 'critical' || h.impacto === 'serious')).toEqual([])
})

test.afterAll(() => {
  mkdirSync(OUT, { recursive: true })
  const orden = { critical: 0, serious: 1, moderate: 2, minor: 3 } as Record<string, number>
  const graves = hallazgos.filter((h) => h.impacto === 'critical' || h.impacto === 'serious')
  const fecha = new Date().toLocaleString('es-CO', { dateStyle: 'long', timeStyle: 'short' })
  const filas = [...hallazgos].sort((a, b) => orden[a.impacto] - orden[b.impacto] || a.vista.localeCompare(b.vista) || a.tema.localeCompare(b.tema))
  const md = [
    '# Reporte de accesibilidad (RNF-07)',
    '',
    `- **Fecha:** ${fecha}`,
    `- **Equipo:** ${os.hostname()} · ${os.type()} ${os.release()} · Node ${process.version}`,
    `- **Herramienta:** axe-core ${axeVersion} (@axe-core/playwright) sobre Chromium (Playwright)`,
    `- **Criterios:** ${TAGS.join(', ')} (WCAG 2.1 niveles A y AA)`,
    `- **Alcance:** ${vistasProbadas.size} vistas/estados, cada una en tema claro y oscuro (${vistasProbadas.size * 2} análisis). Estudiante, docente, administrador y acceso, contra el backend real.`,
    '',
    '## Resumen',
    '',
    `| Impacto | Violaciones (vista × tema) |`,
    `|---|---|`,
    ...['critical', 'serious', 'moderate', 'minor'].map((i) => `| ${i} | ${hallazgos.filter((h) => h.impacto === i).length} |`),
    `| **Total** | **${hallazgos.length}** |`,
    '',
    graves.length === 0
      ? '**No hay violaciones críticas ni serias** en las vistas auditadas.'
      : `**Hay ${graves.length} violaciones críticas o serias** (ver la tabla).`,
    '',
    '## Violaciones por vista',
    '',
    hallazgos.length === 0
      ? 'axe no reportó ninguna violación automática en ninguna de las vistas.'
      : '| Vista | Tema | Impacto | Regla | WCAG | Nodos | Ejemplo de elemento |\n|---|---|---|---|---|---|---|\n' +
        filas.map((h) => `| ${h.vista} | ${h.tema} | ${h.impacto} | \`${h.regla}\` — ${h.ayuda} | ${h.wcag} | ${h.nodos} | \`${h.ejemplo.replace(/\|/g, '\\|')}\` |`).join('\n'),
    '',
    '## Violaciones encontradas en la primera auditoría y corregidas',
    '',
    'La primera pasada (antes de corregir) encontró 62 violaciones críticas o serias en 5 reglas; se corrigieron todas en el frontend:',
    '',
    '| Regla | Impacto | Dónde | Causa | Corrección |',
    '|---|---|---|---|---|',
    '| `aria-valid-attr-value` (4.1.2) | crítica | Pestañas (ejercicio, login) | `aria-controls` apuntaba a paneles que no existen en el DOM | Se quitó `aria-controls` de `Tabs` |',
    '| `label-content-name-mismatch` (2.5.3) | seria | Logo de la barra lateral (todas las vistas) | El nombre accesible «lógica UPTC, ir al inicio» no contenía el texto visible («lógica» y «UPTC» sin espacio entre los `span`) | Espacio entre los dos `span` del logo |',
    '| `definition-list` / `dlitem` (1.3.1) | seria | Módulos (tarjeta destacada) y Panel docente | `div` anidados y `p` dentro de `dl` | Se aplanó la estructura `dt`/`dd`; la nota pasó a ser un `dd` |',
    '| `color-contrast` (1.4.3) | seria | Comentarios en bloques de código (tema claro) | `#66767a` sobre `#f1f4f4`: 4,3:1 (< 4,5:1) | Color `--code-com` a `#5a6a6e` |',
    '',
    '## Vistas auditadas',
    '',
    ...[...vistasProbadas].map((v) => `- ${v}`),
    '',
    '## Alcance y limitaciones',
    '',
    '- axe detecta solo una parte de los problemas de accesibilidad (se suele citar entre un 30 % y un 40 %). Esto no sustituye la revisión manual con teclado y lector de pantalla (NVDA/VoiceOver), que queda como tarea manual.',
    '- No se audita el modo demostración (datos locales): es la misma interfaz que el modo API.',
    '- Se ejecuta con `reducedMotion: reduce` para que las animaciones de entrada no falseen el cálculo de contraste.',
    '',
    'Regenerar: `cd e2e && npm run test:a11y` (con la API y el frontend como indica `e2e/README` / `scripts/evidencias.ps1`).',
    '',
  ].join('\n')
  writeFileSync(join(OUT, 'accesibilidad.md'), md)
})
