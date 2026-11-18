import { request, type APIRequestContext } from '@playwright/test'
import { API, PASSWORD } from './env'

export async function apiContext(token?: string): Promise<APIRequestContext> {
  return request.newContext({ baseURL: API + '/', extraHTTPHeaders: token ? { Authorization: `Bearer ${token}` } : {} })
}

export async function loginApi(email: string, password = PASSWORD): Promise<string> {
  const ctx = await apiContext()
  const res = await ctx.post('auth/login', { data: { email, password } })
  if (!res.ok()) throw new Error(`Login ${email}: ${res.status()}`)
  const { token } = await res.json()
  await ctx.dispose()
  return token
}

export async function registerApi(name: string, email: string, password = PASSWORD) {
  const ctx = await apiContext()
  const res = await ctx.post('auth/register', { data: { name, email, password } })
  if (!res.ok()) throw new Error(`Registro ${email}: ${res.status()} ${await res.text()}`)
  await ctx.dispose()
}
