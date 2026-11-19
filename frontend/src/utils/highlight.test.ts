import { describe, expect, it } from 'vitest'
import { highlight } from './highlight'

const kinds = (code: string) => highlight(code).map((l) => l.filter((t) => t.kind !== 'plain').map((t) => `${t.kind}:${t.text}`))

describe('utils/highlight', () => {
  it('clasifica palabras clave, funciones definidas, builtins, números y operadores', () => {
    expect(kinds('def doble(x):\n    return print(x * 2)')).toEqual([
      ['kw:def', 'fn:doble', 'op:(', 'op:)', 'op::'],
      ['kw:return', 'bi:print', 'op:(', 'op:*', 'num:2', 'op:)'],
    ])
  })

  it('reconoce comentarios y cadenas (incluso sin cerrar)', () => {
    const [line] = highlight('x = "hola" # nota')
    expect(line.find((t) => t.kind === 'str')?.text).toBe('"hola"')
    expect(line.find((t) => t.kind === 'com')?.text).toBe('# nota')
    expect(highlight('"abierta')[0][0]).toMatchObject({ kind: 'str', text: '"abierta' })
  })

  it('devuelve una lista de tokens por línea', () => {
    expect(highlight('a\n\nb')).toHaveLength(3)
    expect(highlight('')).toEqual([[]])
  })

  it('reconstruye el código original al unir los tokens', () => {
    const code = 'for i in range(3):\n    print(i + 1.5)  # fin'
    expect(highlight(code).map((l) => l.map((t) => t.text).join('')).join('\n')).toBe(code)
  })
})
