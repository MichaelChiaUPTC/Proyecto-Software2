import { expect, test as base } from '@playwright/test'

/**
 * `test` con una guarda: si la pagina escribe un console.error de la aplicacion (p. ej. avisos de React
 * como claves duplicadas) o lanza una excepcion no capturada, la prueba falla. Los «Failed to load resource»
 * (respuestas 4xx esperadas en los escenarios negativos) no cuentan.
 */
export const test = base.extend({
  page: async ({ page }, use) => {
    const problemas: string[] = []
    page.on('console', (m) => {
      if (m.type() === 'error' && !m.text().startsWith('Failed to load resource')) problemas.push(m.text())
    })
    page.on('pageerror', (e) => problemas.push(`Excepcion: ${e.message}`))
    await use(page)
    expect(problemas, 'errores de consola de la aplicacion').toEqual([])
  },
})

export { expect }
