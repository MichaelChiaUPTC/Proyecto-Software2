import { mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { expect, test, type Page } from '@playwright/test'
import { estudianteConHistoria } from '../support/datos'
import { DEMO, PASSWORD } from '../support/env'
import { loginUi } from '../support/ui'

/**
 * Capturas de las pantallas principales de los 3 roles (tema claro y oscuro) para el manual de usuario.
 * Se guardan en docs/evidencias/capturas/. Con datos de prueba reales, no con maquetas.
 */
const DIR = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'docs', 'evidencias', 'capturas')
mkdirSync(DIR, { recursive: true })

const temas = [
  { id: 'claro', colorScheme: 'light' as const },
  { id: 'oscuro', colorScheme: 'dark' as const },
]

async function lista(page: Page, ruta: string, h1: string | RegExp) {
  await page.goto(ruta)
  await expect(page.getByRole('heading', { level: 1, name: h1 })).toBeVisible()
  await page.waitForLoadState('networkidle')
}

for (const tema of temas) {
  test.describe(`Capturas (${tema.id})`, () => {
    test.use({ colorScheme: tema.colorScheme, reducedMotion: 'reduce' })
    const foto = (page: Page, rol: string, n: string, nombre: string) =>
      page.screenshot({ path: join(DIR, `${rol}-${n}-${nombre}-${tema.id}.png`) })

    test('acceso: ingresar y crear cuenta', async ({ page }) => {
      await page.goto('/login')
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
      await foto(page, 'acceso', '01', 'ingresar')
      await page.getByRole('tab', { name: 'Crear cuenta' }).click()
      await expect(page.getByLabel('Confirmar contraseña')).toBeVisible()
      await foto(page, 'acceso', '02', 'crear-cuenta')
    })

    test('estudiante', async ({ page }) => {
      const { email } = await estudianteConHistoria(`cap-est-${tema.id}`, 'Camila Torres Rojas')
      await loginUi(page, email)
      await expect(page).toHaveURL('/')
      await page.waitForLoadState('networkidle')
      await foto(page, 'estudiante', '01', 'inicio')

      await lista(page, '/modulos', 'Módulos')
      await foto(page, 'estudiante', '02', 'modulos')
      await lista(page, '/modulos/1', /Introducción a la programación/)
      await foto(page, 'estudiante', '03', 'modulo-detalle')
      await lista(page, '/lecciones/2', 'Tu primer programa en Python')
      await foto(page, 'estudiante', '04', 'leccion')
      await lista(page, '/ejercicios', 'Ejercicios')
      await foto(page, 'estudiante', '05', 'ejercicios')

      // Ejercicio: enunciado, intento fallido con pista de la IA y acierto
      await lista(page, '/ejercicios/1', 'Saluda a la universidad')
      await foto(page, 'estudiante', '06', 'ejercicio')
      const editor = page.getByLabel('Código de la función saludar')
      await editor.fill('def saludar():\n    print("Hola")')
      await page.getByRole('button', { name: 'Ejecutar y enviar' }).click()
      await expect(page.getByRole('status').filter({ hasText: 'Hay un problema' })).toBeVisible()
      await page.getByRole('button', { name: 'Pedir ayuda a la IA' }).click()
      await expect(page.getByText(/Pista (de la IA|del curso)/)).toBeVisible()
      await foto(page, 'estudiante', '07', 'ejercicio-fallo-con-pista')
      await editor.fill('def saludar():\n    print("Hola, UPTC")')
      await page.getByRole('button', { name: 'Ejecutar y enviar' }).click()
      await expect(page.getByRole('status').filter({ hasText: 'Correcto' })).toBeVisible()
      await foto(page, 'estudiante', '08', 'ejercicio-correcto')

      await lista(page, '/progreso', 'Progreso')
      await foto(page, 'estudiante', '09', 'progreso')
      await lista(page, '/insignias', 'Insignias')
      await foto(page, 'estudiante', '10', 'insignias')
      await lista(page, '/perfil', 'Camila Torres Rojas')
      await foto(page, 'estudiante', '11', 'perfil')
    })

    test('docente', async ({ page }) => {
      await estudianteConHistoria(`cap-doc-alumno-${tema.id}`, 'Laura Gómez Díaz')
      await loginUi(page, DEMO.teacher)
      await expect(page).toHaveURL(/\/docente$/)
      await page.waitForLoadState('networkidle')
      await foto(page, 'docente', '01', 'panel')

      await lista(page, '/docente/contenido', 'Gestión de contenido')
      await foto(page, 'docente', '02', 'contenido')
      await page.getByRole('button', { name: 'Nuevo módulo' }).click()
      await expect(page.getByRole('dialog')).toBeVisible()
      await foto(page, 'docente', '03', 'nuevo-modulo')
      await page.keyboard.press('Escape')

      await lista(page, '/docente/ejercicios', 'Ejercicios')
      await foto(page, 'docente', '04', 'ejercicios')
      await page.goto('/docente/ejercicios/1')
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
      await page.waitForLoadState('networkidle')
      await foto(page, 'docente', '05', 'editor-ejercicio')

      await lista(page, '/docente/reportes', 'Reportes de avance')
      await foto(page, 'docente', '06', 'reportes')
    })

    test('administrador', async ({ page }) => {
      await loginUi(page, DEMO.admin)
      await expect(page).toHaveURL(/\/admin$/)
      await expect(page.getByRole('heading', { level: 1, name: 'Usuarios' })).toBeVisible()
      await page.waitForLoadState('networkidle')
      await foto(page, 'admin', '01', 'usuarios')

      await page.getByRole('button', { name: 'Nuevo usuario' }).click()
      const d = page.getByRole('dialog', { name: 'Nuevo usuario' })
      await d.getByLabel('Nombre completo').fill('Nuevo Usuario Ejemplo')
      await d.getByLabel('Correo institucional').fill('nuevo.usuario@uptc.edu.co')
      await d.getByLabel('Contraseña inicial').fill(PASSWORD)
      await foto(page, 'admin', '02', 'nuevo-usuario')
      await page.keyboard.press('Escape')

      await page.getByLabel('Buscar usuario').fill('estudiante@')
      await page.getByRole('button', { name: /Desactivar a/ }).click()
      await expect(page.getByRole('dialog', { name: 'Desactivar usuario' })).toBeVisible()
      await foto(page, 'admin', '03', 'desactivar-usuario')
    })
  })
}

