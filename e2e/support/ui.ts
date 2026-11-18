import { expect, type Page } from '@playwright/test'
import { PASSWORD } from './env'

export async function loginUi(page: Page, email: string, password = PASSWORD) {
  await page.goto('/login')
  await page.getByLabel('Correo institucional').fill(email)
  await page.getByLabel('Contraseña', { exact: true }).fill(password)
  await page.getByRole('button', { name: 'Ingresar', exact: true }).click()
}

export async function logoutUi(page: Page) {
  const trigger = page.getByRole('button', { name: /Configuración|Cuenta de/ }).first()
  await trigger.click()
  await page.getByRole('menuitem', { name: 'Cerrar sesión' }).click()
  await expect(page).toHaveURL(/\/login$/)
}
