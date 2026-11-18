import { API } from './support/env'
import { cleanup } from './support/db'

export default async function globalSetup() {
  const res = await fetch(`${API}/health`).catch(() => null)
  if (!res?.ok) throw new Error(`La API no responde en ${API}/health. Levanta docker compose up -d --build y corre npm run seed en backend.`)
  cleanup() // restos de una ejecucion interrumpida
}
