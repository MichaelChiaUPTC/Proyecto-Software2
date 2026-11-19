import { readFileSync } from 'node:fs'
import { expect, test } from '../support/fixtures'
import { apiContext, loginApi, registerApi } from '../support/api'
import { DEMO, e2eEmail, RUN } from '../support/env'
import { loginUi } from '../support/ui'

const MODULO = `E2E Módulo ${RUN}`
const LECCION = `E2E Lección ${RUN}`

test.beforeEach(async ({ page }) => {
  await loginUi(page, DEMO.teacher)
  await expect(page).toHaveURL(/\/docente$/)
})

test('el panel docente muestra los indicadores y el docente no entra a las pantallas de admin', async ({ page }) => {
  await expect(page.getByRole('heading', { level: 1, name: 'Panel docente' })).toBeVisible()
  await expect(page.getByText('Estudiantes activos')).toBeVisible()
  await expect(page.getByText('Módulos publicados')).toBeVisible()
  await page.goto('/admin')
  await expect(page).toHaveURL(/\/docente$/)
})

test('publicar y despublicar contenido: reglas, estado y visibilidad para el estudiante', async ({ page }) => {
  await page.getByRole('link', { name: 'Contenido', exact: true }).first().click()
  await expect(page.getByRole('heading', { level: 1, name: 'Gestión de contenido' })).toBeVisible()

  // Nuevo módulo: nace como borrador
  await page.getByRole('button', { name: 'Nuevo módulo' }).click()
  await page.getByLabel('Título').fill(MODULO)
  await page.getByLabel('Descripción corta').fill('Módulo creado por la prueba E2E.')
  await page.getByRole('button', { name: 'Guardar' }).click()
  const modulo = page.locator('.ctree__module', { hasText: MODULO })
  await expect(modulo).toBeVisible()
  const cabecera = modulo.locator('.ctree__row--module')
  await expect(cabecera.getByText('Borrador')).toBeVisible()

  // Un módulo sin lecciones no se publica: el servidor lo rechaza y la pantalla lo dice
  await cabecera.getByRole('button', { name: 'Publicar' }).click()
  await expect(page.getByText('No se pudo completar la acción')).toBeVisible()
  await expect(cabecera.getByText('Borrador')).toBeVisible()

  // Se agrega una lección y se publica todo
  await modulo.locator('.ctree__toggle').click()
  await modulo.getByRole('button', { name: 'Agregar lección' }).click()
  await page.getByLabel('Título').fill(LECCION)
  await page.getByRole('button', { name: 'Guardar' }).click()
  const fila = modulo.locator('.ctree__row', { hasText: LECCION })
  await expect(fila).toBeVisible()
  await fila.getByRole('button', { name: 'Publicar' }).click()
  await expect(fila.getByText('Publicada')).toBeVisible()
  await cabecera.getByRole('button', { name: 'Publicar' }).click()
  await expect(cabecera.getByText('Publicado', { exact: true })).toBeVisible()

  // El estudiante lo ve (consulta a la API con el token del estudiante demo)
  const estudiante = await apiContext(await loginApi(DEMO.student))
  const visible = async () => ((await (await estudiante.get('modules')).json()) as { modules: { title: string }[] }).modules.some((m) => m.title === MODULO)
  expect(await visible()).toBe(true)

  // Despublicar: vuelve a borrador y el estudiante deja de verlo
  await cabecera.getByRole('button', { name: 'Despublicar' }).click()
  await expect(cabecera.getByText('Borrador')).toBeVisible()
  expect(await visible()).toBe(false)
  await estudiante.dispose()
})

test('reportes: el estudiante aparece con su avance y el CSV se descarga con sus datos', async ({ page }) => {
  // Estudiante nuevo con un ejercicio resuelto (por la API: este caso prueba el reporte, no el recorrido)
  const nombre = `Reporte E2E ${RUN}`
  const correo = e2eEmail('reporte')
  await registerApi(nombre, correo)
  const alumno = await apiContext(await loginApi(correo))
  const lista = (await (await alumno.get('me/exercises')).json()) as { exercises: { exercise: { id: number; title: string } }[] }
  const ej = lista.exercises.find((e) => e.exercise.title === 'El orden importa')!.exercise
  const envio = await alumno.post(`exercises/${ej.id}/submissions`, { data: { code: 'def secuencia():\n    print("Inicio")\n    print("Fin")', hintsUsed: 0 } })
  expect((await envio.json()).passed).toBe(true)
  await alumno.dispose()

  await page.getByRole('link', { name: 'Reportes' }).first().click()
  await expect(page.getByRole('heading', { level: 1, name: 'Reportes de avance' })).toBeVisible()
  await page.getByLabel('Buscar estudiante').fill(nombre)
  const fila = page.getByRole('row', { name: new RegExp(nombre) })
  await expect(fila).toHaveCount(1)
  await expect(fila).toContainText('1 / ')

  const [descarga] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Exportar CSV' }).click()])
  expect(descarga.suggestedFilename()).toBe('reporte-avance.csv')
  const csv = readFileSync((await descarga.path())!, 'utf8')
  expect(csv.charCodeAt(0)).toBe(0xfeff) // BOM para Excel
  expect(csv).toContain('"Estudiante","Correo","Grupo","Progreso (%)","Ejercicios resueltos"')
  expect(csv).toContain(`"${nombre}","${correo}"`)
  expect(csv).toContain('\r\n')
  await expect(page.getByText('Reporte exportado')).toBeVisible()
})
