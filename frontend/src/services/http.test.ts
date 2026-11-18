import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError, clearSession, download, getToken, request, restoreSession, saveSession } from './http'
import { sessionStore } from './stores'
import type { User } from '@/types'

const user: User = { id: '7', name: 'Ana Pérez', email: 'ana@uptc.edu.co', role: 'student', program: 'Ing', joinedAt: '2026-01-01' }
const json = (status: number, body: unknown) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })

describe('services/http', () => {
  const fetchMock = vi.fn()
  beforeEach(() => {
    fetchMock.mockReset()
    vi.stubGlobal('fetch', fetchMock)
    clearSession()
  })
  afterEach(() => vi.unstubAllGlobals())

  it('saveSession guarda token y usuario en sessionStorage y en el store', () => {
    saveSession('tok', user)
    expect(getToken()).toBe('tok')
    expect(sessionStorage.getItem('logica.token')).toBe('tok')
    expect(JSON.parse(sessionStorage.getItem('logica.user')!)).toMatchObject({ email: 'ana@uptc.edu.co' })
    expect(sessionStore.get().user?.id).toBe('7')
  })

  it('envía Authorization con el token, el cuerpo como JSON y la query sin valores indefinidos', async () => {
    saveSession('tok', user)
    fetchMock.mockResolvedValue(json(200, { ok: 1 }))
    await expect(request('POST', '/x', { body: { a: 1 }, query: { group: 'G1', q: undefined } })).resolves.toEqual({ ok: 1 })
    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe('http://api.test/api/x?group=G1')
    expect(init.method).toBe('POST')
    expect(init.headers).toMatchObject({ Authorization: 'Bearer tok', 'Content-Type': 'application/json' })
    expect(init.body).toBe('{"a":1}')
  })

  it('con auth:false no manda el token', async () => {
    saveSession('tok', user)
    fetchMock.mockResolvedValue(json(200, {}))
    await request('POST', '/auth/login', { body: {}, auth: false })
    expect(fetchMock.mock.calls[0][1].headers).not.toHaveProperty('Authorization')
  })

  it('un error del servidor se convierte en ApiError con el mensaje, el estado y el código', async () => {
    fetchMock.mockResolvedValue(json(422, { error: { code: 'EJERCICIO_SIN_CASOS', message: 'Falta un caso de prueba.' } }))
    const err = (await request('POST', '/x').catch((e) => e)) as ApiError
    expect(err).toBeInstanceOf(Error)
    expect(err).toBeInstanceOf(ApiError)
    expect(err.message).toBe('Falta un caso de prueba.')
    expect(err.status).toBe(422)
    expect(err.code).toBe('EJERCICIO_SIN_CASOS')
  })

  it('una respuesta de error sin JSON usa un mensaje genérico', async () => {
    fetchMock.mockResolvedValue(new Response('<html>', { status: 502 }))
    await expect(request('GET', '/x')).rejects.toThrow('El servidor respondió con un error (502).')
  })

  it('un fallo de red da un mensaje en español y código SIN_CONEXION', async () => {
    fetchMock.mockRejectedValue(new TypeError('Failed to fetch'))
    await expect(request('GET', '/x')).rejects.toMatchObject({ code: 'SIN_CONEXION', status: 0 })
  })

  it('un 401 limpia la sesión', async () => {
    saveSession('tok', user)
    fetchMock.mockResolvedValue(json(401, { error: { code: 'NO_AUTORIZADO', message: 'Sesión vencida' } }))
    await expect(request('GET', '/me/home')).rejects.toThrow('Sesión vencida')
    expect(getToken()).toBeNull()
    expect(sessionStore.get().user).toBeNull()
  })

  it('USUARIO_INACTIVO (403) también limpia la sesión', async () => {
    saveSession('tok', user)
    fetchMock.mockResolvedValue(json(403, { error: { code: 'USUARIO_INACTIVO', message: 'Cuenta desactivada' } }))
    await expect(request('GET', '/me/home')).rejects.toThrow('Cuenta desactivada')
    expect(sessionStore.get().user).toBeNull()
  })

  it('un 401 de login (auth:false) NO limpia la sesión: son credenciales incorrectas', async () => {
    saveSession('tok', user)
    fetchMock.mockResolvedValue(json(401, { error: { code: 'CREDENCIALES', message: 'Correo o contraseña incorrectos' } }))
    await expect(request('POST', '/auth/login', { body: {}, auth: false })).rejects.toThrow('Correo o contraseña incorrectos')
    expect(getToken()).toBe('tok')
  })

  it('un 403 por rol no cierra la sesión', async () => {
    saveSession('tok', user)
    fetchMock.mockResolvedValue(json(403, { error: { code: 'PROHIBIDO', message: 'Sin permiso' } }))
    await expect(request('GET', '/admin/users')).rejects.toThrow('Sin permiso')
    expect(getToken()).toBe('tok')
  })

  it('204 devuelve null', async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 204 }))
    await expect(request('DELETE', '/x')).resolves.toBeNull()
  })

  it('download devuelve el blob', async () => {
    fetchMock.mockResolvedValue(new Response('a,b', { status: 200 }))
    const blob = await download('/teacher/reports.csv', { group: 'G1' })
    expect(await blob.text()).toBe('a,b')
    expect(fetchMock.mock.calls[0][0]).toBe('http://api.test/api/teacher/reports.csv?group=G1')
  })

  describe('restoreSession', () => {
    it('recupera al usuario si la pestaña conserva el token', () => {
      sessionStorage.setItem('logica.token', 'tok')
      sessionStorage.setItem('logica.user', JSON.stringify(user))
      restoreSession()
      expect(sessionStore.get().user?.email).toBe('ana@uptc.edu.co')
    })

    it('sin token, o con el usuario corrupto, deja la sesión vacía', () => {
      sessionStorage.setItem('logica.user', JSON.stringify(user))
      restoreSession()
      expect(sessionStore.get().user).toBeNull()
      sessionStorage.setItem('logica.token', 'tok')
      sessionStorage.setItem('logica.user', '{no es json')
      restoreSession()
      expect(sessionStore.get().user).toBeNull()
    })
  })
})
