import { mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { expect, test, type Locator, type Page } from '@playwright/test'
import { DEMO, PASSWORD } from '../support/env'
import { loginUi } from '../support/ui'
import { limpiar, preparar } from './datos'

/**
 * Capturas del manual de usuario, en alta resolución, con datos de ejemplo realistas.
 * Escritorio: 1440x900 a escala 2 (2880x1800 px). Móvil: 390x844 a escala 3 (1170x2532 px). Tema claro.
 * Salida: docs/manual/img/. Uso: `cd e2e && npm run manual` (necesita docker compose arriba y el seed cargado).
 * Deja al estudiante demo con progreso y crea alumnos de ejemplo (se borran al terminar).
 */
const DIR = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'docs', 'manual', 'img')
mkdirSync(DIR, { recursive: true })

/** Espera a que no haya esqueletos de carga ni peticiones pendientes y a que las fuentes estén listas. */
async function listo(page: Page) {
  await page.waitForLoadState('networkidle')
  await expect(page.locator('.skeleton, [aria-label="Cargando contenido"], .spin')).toHaveCount(0)
  await page.evaluate(() => document.fonts.ready)
  await page.mouse.move(0, 0)
}

/** Oculta filas de datos de desarrollo que no deben salir en el manual (módulo de pruebas de fases anteriores). */
async function sinRuido(page: Page) {
  await page.getByText(/adaptador/i).locator('xpath=ancestor::*[self::li or self::tr][1]').evaluateAll((els) => els.forEach((e) => ((e as HTMLElement).style.display = 'none')))
}

async function foto(page: Page, nombre: string, opts: { fullPage?: boolean; destino?: Locator } = {}) {
  await listo(page)
  const path = join(DIR, `${nombre}.png`)
  if (opts.destino) await opts.destino.screenshot({ path, animations: 'disabled', caret: 'hide' })
  else if (opts.fullPage) {
    // Se agranda la ventana al alto del documento (en vez de fullPage) para que la barra lateral llene toda la imagen.
    const original = page.viewportSize()!
    const alto = await page.evaluate(() => Math.max(document.documentElement.scrollHeight, document.body.scrollHeight))
    await page.setViewportSize({ width: original.width, height: Math.max(original.height, alto) })
    await listo(page)
    await page.screenshot({ path, animations: 'disabled', caret: 'hide' })
    await page.setViewportSize(original)
  } else await page.screenshot({ path, animations: 'disabled', caret: 'hide' })
}

async function ir(page: Page, ruta: string, h1: string | RegExp) {
  await page.goto(ruta)
  await expect(page.getByRole('heading', { level: 1, name: h1 })).toBeVisible()
  await listo(page)
}

test.describe.configure({ mode: 'serial' })
test.beforeAll(async () => { test.setTimeout(600_000); await preparar() })
test.afterAll(() => limpiar(false))

test.describe('Escritorio', () => {
  test('acceso', async ({ page }) => {
    await page.goto('/login')
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    await foto(page, 'acceso-01-ingresar')
    await page.getByRole('tab', { name: 'Crear cuenta' }).click()
    await expect(page.getByLabel('Confirmar contraseña')).toBeVisible()
    await page.getByLabel('Nombre completo').fill('Sofía Ramírez Torres')
    await page.getByLabel('Correo institucional').fill('sofia.ramirez@uptc.edu.co')
    await page.getByLabel('Contraseña', { exact: true }).fill('MiClave2026')
    await page.getByLabel('Confirmar contraseña').fill('MiClave2026')
    await foto(page, 'acceso-02-crear-cuenta')
    await page.getByRole('tab', { name: 'Ingresar' }).click()
    await page.getByLabel('Correo institucional').fill('camila@gmail.com')
    await page.getByLabel('Contraseña', { exact: true }).fill('x')
    await page.getByRole('button', { name: 'Ingresar', exact: true }).click()
    await expect(page.getByRole('alert').first()).toBeVisible()
    await foto(page, 'acceso-03-error-ingreso')
  })

  test('estudiante', async ({ page }) => {
    await loginUi(page, DEMO.student)
    await expect(page).toHaveURL('/')
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    await foto(page, 'estudiante-01-inicio', { fullPage: true })

    await ir(page, '/modulos', 'Módulos')
    await foto(page, 'estudiante-02-modulos', { fullPage: true })
    await ir(page, '/modulos/4', /Operadores y expresiones/)
    await foto(page, 'estudiante-03-modulo-detalle', { fullPage: true })
    await ir(page, '/lecciones/14', 'if, elif y else')
    await foto(page, 'estudiante-04-leccion', { fullPage: true })
    await ir(page, '/ejercicios', 'Ejercicios')
    await foto(page, 'estudiante-05-ejercicios', { fullPage: true })

    // Ejercicio «Par o impar»: enunciado, fallo con pista, acierto
    await ir(page, '/ejercicios/11', 'Par o impar')
    await foto(page, 'estudiante-06-ejercicio')
    const editor = page.getByLabel('Código de la función es_par')
    await editor.fill('def es_par(n):\n    return n % 2 == 1')
    await page.getByRole('button', { name: 'Ejecutar y enviar' }).click()
    await expect(page.getByRole('status').filter({ hasText: 'Hay un problema' })).toBeVisible()
    await foto(page, 'estudiante-07-ejercicio-fallo')
    await page.getByRole('button', { name: 'Pedir ayuda a la IA' }).click()
    await expect(page.getByText(/Pista (de la IA|del curso)/)).toBeVisible()
    await foto(page, 'estudiante-08-ejercicio-ayuda-ia')
    await editor.fill('def es_par(n):\n    if n % 2 == 0:\n        return True\n    else:\n        return False')
    await page.getByRole('button', { name: 'Ejecutar y enviar' }).click()
    await expect(page.getByRole('status').filter({ hasText: 'Correcto' })).toBeVisible()
    await foto(page, 'estudiante-09-ejercicio-correcto')

    await ir(page, '/progreso', 'Progreso')
    await foto(page, 'estudiante-10-progreso', { fullPage: true })
    await ir(page, '/insignias', 'Insignias')
    await foto(page, 'estudiante-11-insignias', { fullPage: true })
    await ir(page, '/perfil', 'Camila Rojas Pineda')
    await foto(page, 'estudiante-12-perfil', { fullPage: true })

    await page.getByRole('button', { name: 'Configuración' }).click()
    await expect(page.getByRole('menuitem', { name: 'Cerrar sesión' })).toBeVisible()
    await foto(page, 'acceso-04-menu-tema')
  })

  test('docente', async ({ page }) => {
    await loginUi(page, DEMO.teacher)
    await expect(page).toHaveURL(/\/docente$/)
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    await foto(page, 'docente-01-panel', { fullPage: true })

    await ir(page, '/docente/contenido', 'Gestión de contenido')
    await page.getByRole('button', { name: /05.*Estructuras condicionales/ }).click() // abre un módulo para ver lecciones y ejercicios
    await expect(page.getByText('Clasifica una nota')).toBeVisible()
    await sinRuido(page)
    await foto(page, 'docente-02-contenido')
    await page.getByRole('button', { name: /09.*Cadenas de texto/ }).click()
    await expect(page.getByText('Invierte una palabra')).toBeVisible()
    await sinRuido(page)
    await foto(page, 'docente-03-contenido-borrador', { fullPage: true })

    await page.getByRole('button', { name: 'Nuevo módulo' }).click()
    const dialogo = page.getByRole('dialog', { name: 'Nuevo módulo' })
    await expect(dialogo).toBeVisible()
    await dialogo.getByLabel('Título').fill('Listas y tuplas')
    await dialogo.getByLabel('Descripción corta').fill('Cómo guardar varios valores en una sola variable y recorrerlos.')
    await foto(page, 'docente-04-nuevo-modulo', { destino: dialogo })
    await page.keyboard.press('Escape')

    await ir(page, '/docente/ejercicios', 'Ejercicios')
    await sinRuido(page)
    await foto(page, 'docente-05-ejercicios', { fullPage: true })
    await page.goto('/docente/ejercicios/11')
    await expect(page.getByRole('heading', { level: 1, name: 'Editar ejercicio' })).toBeVisible()
    await foto(page, 'docente-06-editor-ejercicio', { fullPage: true })
    await foto(page, 'docente-07-casos-de-prueba', { destino: page.locator('fieldset').filter({ has: page.getByText('Casos de prueba', { exact: true }) }) })

    await ir(page, '/docente/reportes', 'Reportes de avance')
    await foto(page, 'docente-08-reportes', { fullPage: true })
  })

  test('administrador', async ({ page }) => {
    await loginUi(page, DEMO.admin)
    await expect(page).toHaveURL(/\/admin$/)
    await expect(page.getByRole('heading', { level: 1, name: 'Usuarios' })).toBeVisible()
    await foto(page, 'admin-01-usuarios', { fullPage: true })

    await page.getByRole('button', { name: 'Nuevo usuario' }).click()
    const d = page.getByRole('dialog', { name: 'Nuevo usuario' })
    await d.getByLabel('Nombre completo').fill('Carolina Mendoza Prieto')
    await d.getByLabel('Correo institucional').fill('carolina.mendoza@uptc.edu.co')
    await d.getByLabel('Contraseña inicial').fill(PASSWORD)
    await d.getByLabel('Rol').selectOption('teacher')
    await foto(page, 'admin-02-nuevo-usuario', { destino: d })
    await page.keyboard.press('Escape')

    await page.getByLabel('Buscar usuario').fill('juan.pardo')
    await page.getByRole('button', { name: /Desactivar a/ }).click()
    const c = page.getByRole('dialog', { name: 'Desactivar usuario' })
    await expect(c).toBeVisible()
    await foto(page, 'admin-03-desactivar-usuario', { destino: c })
  })
})

test.describe('Móvil', () => {
  test.use({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true })

  test('estudiante en el celular', async ({ page }) => {
    await page.goto('/login')
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    await foto(page, 'movil-01-ingresar')
    await loginUi(page, DEMO.student)
    await expect(page).toHaveURL('/')
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    await foto(page, 'movil-02-inicio')
    await ir(page, '/ejercicios/12', 'El mayor de dos números')
    await page.getByRole('tab', { name: 'Código' }).first().click()
    await foto(page, 'movil-03-ejercicio-codigo')
  })
})
