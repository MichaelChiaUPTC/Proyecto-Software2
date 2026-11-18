/**
 * Cliente HTTP mínimo para el backend (modo API). El token JWT vive en `sessionStorage`:
 * se pierde al cerrar la pestaña, a propósito. El usuario se guarda junto al token para que
 * `useAuth` (que lee `sessionStore`) sea coherente con él al recargar.
 */
import type { User } from '@/types'
import { sessionStore } from './stores'

export const API_URL = String(import.meta.env.VITE_API_URL ?? '').trim().replace(/\/+$/, '')

const TOKEN_KEY = 'logica.token'
const USER_KEY = 'logica.user'

export class ApiError extends Error {
  constructor(message: string, readonly status: number, readonly code: string) {
    super(message)
  }
}

const read = (k: string) => {
  try { return sessionStorage.getItem(k) } catch { return null }
}
const write = (k: string, v: string | null) => {
  try {
    if (v === null) sessionStorage.removeItem(k)
    else sessionStorage.setItem(k, v)
  } catch { /* sessionStorage no disponible: la sesión dura lo que la página */ }
}

let memoryToken: string | null = null
export const getToken = () => memoryToken ?? read(TOKEN_KEY)

export function saveSession(token: string, user: User) {
  memoryToken = token
  write(TOKEN_KEY, token)
  write(USER_KEY, JSON.stringify(user))
  sessionStore.set(() => ({ user }))
}

/** Cierra la sesión local; `AppLayout` redirige a /login al quedarse sin usuario. */
export function clearSession() {
  memoryToken = null
  write(TOKEN_KEY, null)
  write(USER_KEY, null)
  sessionStore.set(() => ({ user: null }))
}

/** Al arrancar en modo API: el usuario solo es válido si esta pestaña conserva su token. */
export function restoreSession() {
  const token = getToken()
  let user: User | null = null
  try { user = JSON.parse(read(USER_KEY) ?? 'null') as User | null } catch { /* dato corrupto */ }
  sessionStore.set(() => ({ user: token && user ? user : null }))
  if (!token || !user) clearSession()
}

interface Opts {
  body?: unknown
  query?: Record<string, string | undefined>
  /** false en login y registro: un 401 ahí es «credenciales incorrectas», no «sesión vencida». */
  auth?: boolean
}

async function send(method: string, path: string, { body, query, auth = true }: Opts): Promise<Response> {
  const params = new URLSearchParams(Object.entries(query ?? {}).filter((e): e is [string, string] => e[1] !== undefined))
  const url = `${API_URL}${path}${params.size ? `?${params}` : ''}`
  const token = getToken()
  let res: Response
  try {
    res = await fetch(url, {
      method,
      headers: { ...(body !== undefined && { 'Content-Type': 'application/json' }), ...(auth && token && { Authorization: `Bearer ${token}` }) },
      body: body === undefined ? undefined : JSON.stringify(body),
    })
  } catch {
    throw new ApiError('No pudimos conectar con el servidor. Revisa tu conexión e inténtalo de nuevo.', 0, 'SIN_CONEXION')
  }
  if (res.ok) return res
  const err = ((await res.json().catch(() => null)) as { error?: { code?: string; message?: string } } | null)?.error
  const code = err?.code ?? 'ERROR'
  // Sesión vencida o cuenta desactivada: se limpia y la app vuelve al login.
  if (auth && (res.status === 401 || code === 'USUARIO_INACTIVO')) clearSession()
  throw new ApiError(err?.message ?? `El servidor respondió con un error (${res.status}).`, res.status, code)
}

export async function request<T>(method: string, path: string, opts: Opts = {}): Promise<T> {
  const res = await send(method, path, opts)
  return (res.status === 204 ? null : await res.json()) as T
}

export async function download(path: string, query?: Opts['query']): Promise<Blob> {
  return (await send('GET', path, { query })).blob()
}
