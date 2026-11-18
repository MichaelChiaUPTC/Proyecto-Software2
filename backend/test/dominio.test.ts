import { describe, expect, it } from 'vitest'
import { aUsuarioPublico, contrasenaValida, esCorreoInstitucional, normalizarCorreo } from '../src/modules/usuarios/domain/usuario.js'
import { JwtTokens } from '../src/modules/usuarios/infrastructure/seguridad.js'

describe('dominio de usuarios', () => {
  it('acepta solo correos @uptc.edu.co', () => {
    expect(esCorreoInstitucional('ana@uptc.edu.co')).toBe(true)
    expect(esCorreoInstitucional('  ANA@UPTC.EDU.CO ')).toBe(true)
    expect(esCorreoInstitucional('ana@gmail.com')).toBe(false)
    expect(esCorreoInstitucional('ana@uptc.edu.co.evil.com')).toBe(false)
    expect(esCorreoInstitucional('ana@@uptc.edu.co')).toBe(false)
    expect(esCorreoInstitucional('@uptc.edu.co')).toBe(false)
  })

  it('normaliza el correo', () => {
    expect(normalizarCorreo('  Ana@UPTC.edu.co ')).toBe('ana@uptc.edu.co')
  })

  it('exige contraseña de al menos 8 caracteres', () => {
    expect(contrasenaValida('1234567')).toBe(false)
    expect(contrasenaValida('12345678')).toBe(true)
  })

  it('la vista pública no expone el hash', () => {
    const u = aUsuarioPublico({
      id: 1, nombre: 'Ana', correo: 'ana@uptc.edu.co', hashContrasena: 'x', rol: 'student', activo: true,
      programa: null, semestre: null, grupo: null, fechaCreacion: new Date('2026-01-01T00:00:00Z'),
    })
    expect(u).not.toHaveProperty('hashContrasena')
    expect(u).toMatchObject({ id: 1, name: 'Ana', role: 'student', joinedAt: '2026-01-01T00:00:00.000Z' })
  })
})

describe('JwtTokens', () => {
  const secreto = 'secreto-de-pruebas-0123456789'
  const tokens = new JwtTokens(secreto, '8h')

  it('firma y verifica id y rol', () => {
    expect(tokens.verificar(tokens.firmar({ id: 7, rol: 'teacher' }))).toEqual({ id: 7, rol: 'teacher' })
  })

  it('rechaza tokens manipulados, de otro secreto, expirados o basura', () => {
    const t = tokens.firmar({ id: 7, rol: 'student' })
    expect(tokens.verificar(t + 'x')).toBeNull()
    expect(new JwtTokens('otro-secreto-0123456789', '8h').verificar(t)).toBeNull()
    const vencido = new JwtTokens(secreto, '-1s')
    expect(vencido.verificar(vencido.firmar({ id: 1, rol: 'admin' }))).toBeNull()
    expect(tokens.verificar('basura')).toBeNull()
  })
})
