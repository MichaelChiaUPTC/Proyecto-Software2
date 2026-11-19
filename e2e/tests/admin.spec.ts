import { expect, test } from '../support/fixtures'
import { DEMO, e2eEmail, PASSWORD, RUN } from '../support/env'
import { loginUi } from '../support/ui'

const NOMBRE = `Usuario Admin E2E ${RUN}`
const correo = e2eEmail('admin-crea')

test('admin: crear usuario, cambiar rol y desactivar; el desactivado ya no entra', async ({ page, browser }) => {
  await loginUi(page, DEMO.admin)
  await expect(page).toHaveURL(/\/admin$/)
  await expect(page.getByRole('heading', { level: 1, name: 'Usuarios' })).toBeVisible()

  // El admin no puede desactivarse a sí mismo
  await page.getByLabel('Buscar usuario').fill(DEMO.admin)
  await expect(page.getByRole('button', { name: /Desactivar a/ })).toBeDisabled()
  await page.getByLabel('Buscar usuario').clear()

  // Crear: primero la validación, después el alta
  await page.getByRole('button', { name: 'Nuevo usuario' }).click()
  const dialogo = page.getByRole('dialog', { name: 'Nuevo usuario' })
  await dialogo.getByRole('button', { name: 'Crear usuario' }).click()
  await expect(dialogo.getByText('Escribe el nombre completo.')).toBeVisible()
  await expect(dialogo.getByText('Usa un correo @uptc.edu.co.')).toBeVisible()
  await dialogo.getByLabel('Nombre completo').fill(NOMBRE)
  await dialogo.getByLabel('Correo institucional').fill(correo)
  await dialogo.getByLabel('Contraseña inicial').fill(PASSWORD)
  await dialogo.getByRole('button', { name: 'Crear usuario' }).click()
  await expect(page.getByText('Usuario creado')).toBeVisible()
  await expect(dialogo).toBeHidden()

  await page.getByLabel('Buscar usuario').fill(correo)
  const fila = page.getByRole('row', { name: new RegExp(NOMBRE) })
  await expect(fila).toHaveCount(1)
  await expect(fila.getByText('Activo')).toBeVisible()

  // El usuario inicia sesión en otro navegador (queda con la sesión abierta)
  const ctxUsuario = await browser.newContext()
  const paginaUsuario = await ctxUsuario.newPage()
  await loginUi(paginaUsuario, correo)
  await expect(paginaUsuario).toHaveURL('/')

  // Cambiar rol: al volver a entrar es docente
  await fila.getByLabel(`Rol de ${NOMBRE}`).selectOption('teacher')
  await expect(page.getByText('Rol actualizado')).toBeVisible()
  await expect(fila.getByLabel(`Rol de ${NOMBRE}`)).toHaveValue('teacher')
  const ctxDocente = await browser.newContext()
  const paginaDocente = await ctxDocente.newPage()
  await loginUi(paginaDocente, correo)
  await expect(paginaDocente).toHaveURL(/\/docente$/)
  await ctxDocente.close()

  // Desactivar con confirmación
  await fila.getByRole('button', { name: `Desactivar a ${NOMBRE}` }).click()
  const confirmar = page.getByRole('dialog', { name: 'Desactivar usuario' })
  await expect(confirmar).toContainText(correo)
  await confirmar.getByRole('button', { name: 'Desactivar' }).click()
  await expect(page.getByText('Cuenta desactivada').first()).toBeVisible()
  await expect(fila.getByText('Desactivado')).toBeVisible()

  // Ya no puede iniciar sesión...
  const ctxNuevo = await browser.newContext()
  const paginaNueva = await ctxNuevo.newPage()
  await loginUi(paginaNueva, correo)
  await expect(paginaNueva.getByRole('alert')).toBeVisible()
  await expect(paginaNueva).toHaveURL(/\/login$/)
  await ctxNuevo.close()

  // ...y la sesión que tenía abierta se cierra en la siguiente petición
  await paginaUsuario.getByRole('link', { name: 'Módulos' }).first().click()
  await expect(paginaUsuario).toHaveURL(/\/login/)
  await ctxUsuario.close()

  // Reactivar lo devuelve a la lista de activos
  await fila.getByRole('button', { name: `Activar a ${NOMBRE}` }).click()
  await expect(page.getByText('Cuenta reactivada')).toBeVisible()
  await expect(fila.getByText('Activo')).toBeVisible()
})
