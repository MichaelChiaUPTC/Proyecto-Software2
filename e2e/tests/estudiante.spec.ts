import { expect, test } from '../support/fixtures'
import { e2eEmail, PASSWORD } from '../support/env'
import { logoutUi } from '../support/ui'

const email = e2eEmail('estudiante')
const NAME = 'Estudiante Prueba E2E'
const SOLUCION = 'def secuencia():\n    print("Inicio")\n    print("Fin")'

// Recorrido completo del estudiante contra la API real: cada paso depende del anterior.
test.describe.serial('Estudiante: registro, lección, ejercicio, insignia y progreso', () => {
  test('el registro valida el formulario y crea la cuenta', async ({ page }) => {
    await page.goto('/login')
    await page.getByRole('tab', { name: 'Crear cuenta' }).click()

    // Validaciones del cliente
    await page.getByLabel('Nombre completo').fill(NAME)
    await page.getByLabel('Correo institucional').fill('alguien@gmail.com')
    await page.getByLabel('Contraseña', { exact: true }).fill(PASSWORD)
    await page.getByLabel('Confirmar contraseña').fill('otra-distinta')
    await page.getByRole('button', { name: 'Crear cuenta', exact: true }).click()
    await expect(page.getByText('Solo se permiten correos @uptc.edu.co.')).toBeVisible()
    await expect(page.getByText('Las contraseñas no coinciden.')).toBeVisible()

    // Registro correcto
    await page.getByLabel('Correo institucional').fill(email)
    await page.getByLabel('Confirmar contraseña').fill(PASSWORD)
    await page.getByRole('button', { name: 'Crear cuenta', exact: true }).click()
    await expect(page).toHaveURL('/')
    await expect(page.getByRole('heading', { level: 1 })).toContainText(/Buen/)
    await expect(page.getByText(NAME).first()).toBeVisible()
  })

  test('registrar un correo repetido muestra el error del servidor', async ({ page }) => {
    await page.goto('/login')
    await page.getByRole('tab', { name: 'Crear cuenta' }).click()
    await page.getByLabel('Nombre completo').fill(NAME)
    await page.getByLabel('Correo institucional').fill(email)
    await page.getByLabel('Contraseña', { exact: true }).fill(PASSWORD)
    await page.getByLabel('Confirmar contraseña').fill(PASSWORD)
    await page.getByRole('button', { name: 'Crear cuenta', exact: true }).click()
    await expect(page.getByRole('alert')).toBeVisible()
    await expect(page).toHaveURL(/\/login$/)
  })

  test('inicia sesión, completa una lección y llega al ejercicio', async ({ page }) => {
    await page.goto('/login')
    await page.getByLabel('Correo institucional').fill(email)
    await page.getByLabel('Contraseña', { exact: true }).fill(PASSWORD)
    await page.getByRole('button', { name: 'Ingresar', exact: true }).click()
    await expect(page).toHaveURL('/')

    await page.getByRole('link', { name: 'Módulos' }).first().click()
    await page.getByRole('link', { name: /Continuar módulo/ }).click()
    await page.getByRole('link', { name: /¿Qué es un programa\?/ }).first().click()
    await expect(page.getByRole('heading', { level: 1, name: '¿Qué es un programa?' })).toBeVisible()

    await page.getByRole('button', { name: 'Continuar al ejercicio' }).click()
    await expect(page.getByRole('heading', { level: 1, name: 'El orden importa' })).toBeVisible()
  })

  test('falla un intento, pide una pista (con respaldo si no hay IA) y acierta', async ({ page }) => {
    await page.goto('/login')
    await page.getByLabel('Correo institucional').fill(email)
    await page.getByLabel('Contraseña', { exact: true }).fill(PASSWORD)
    await page.getByRole('button', { name: 'Ingresar', exact: true }).click()
    await page.getByRole('link', { name: 'Ejercicios' }).first().click()
    await page.getByRole('link', { name: /El orden importa/ }).first().click()

    const editor = page.getByLabel('Código de la función secuencia')
    const enviar = page.getByRole('button', { name: 'Ejecutar y enviar' })

    // Sin intento fallido todavía no se ofrece ayuda de la IA
    await expect(page.getByRole('button', { name: 'Pedir ayuda a la IA' })).toHaveCount(0)

    // Intento fallido: Inicio y Fin al revés
    await editor.fill('def secuencia():\n    print("Fin")\n    print("Inicio")')
    await enviar.click()
    const feedback = page.getByRole('status').filter({ hasText: 'Hay un problema' })
    await expect(feedback).toBeVisible()
    await expect(feedback.getByText(/de \d+ casos de prueba/)).toBeVisible()

    // Pista con IA: con AI_PROVIDER=none el servidor responde con la pista fija del curso
    await page.getByRole('button', { name: 'Pedir ayuda a la IA' }).click()
    await expect(feedback.getByText(/Pista (de la IA|del curso)/)).toBeVisible()

    // Acierto
    await editor.fill(SOLUCION)
    await enviar.click()
    const ok = page.getByRole('status').filter({ hasText: 'Correcto' })
    await expect(ok).toBeVisible()
    await expect(ok.getByText('+10 puntos')).toBeVisible()
    await expect(page.getByRole('region', { name: 'Notificaciones' }).getByText('Primer paso')).toBeVisible()
    await expect(page.getByText('Resuelto').first()).toBeVisible()
  })

  test('la insignia y el progreso reflejan lo hecho; la sesión se cierra', async ({ page }) => {
    await page.goto('/login')
    await page.getByLabel('Correo institucional').fill(email)
    await page.getByLabel('Contraseña', { exact: true }).fill(PASSWORD)
    await page.getByRole('button', { name: 'Ingresar', exact: true }).click()

    await page.getByRole('link', { name: 'Insignias' }).first().click()
    await expect(page.getByRole('heading', { level: 2, name: /Obtenidas · [1-9]/ })).toBeVisible()
    await expect(page.getByText('Primer paso').first()).toBeVisible()

    await page.getByRole('link', { name: 'Progreso' }).first().click()
    await expect(page.getByRole('heading', { level: 1, name: 'Progreso' })).toBeVisible()
    await expect(page.getByText('Actividad reciente')).toBeVisible()

    await page.getByRole('link', { name: 'Perfil' }).first().click()
    await expect(page.getByRole('heading', { level: 1, name: NAME })).toBeVisible()

    // Un enlace profundo sin sesión redirige al login; con sesión cerrada no se conserva el acceso
    await logoutUi(page)
    await page.goto('/progreso')
    await expect(page).toHaveURL(/\/login$/)
  })

  test('credenciales incorrectas muestran un mensaje y no abren sesión', async ({ page }) => {
    await page.goto('/login')
    await page.getByLabel('Correo institucional').fill(email)
    await page.getByLabel('Contraseña', { exact: true }).fill('incorrecta-123')
    await page.getByRole('button', { name: 'Ingresar', exact: true }).click()
    await expect(page.getByRole('alert')).toBeVisible()
    await expect(page).toHaveURL(/\/login$/)
  })
})
