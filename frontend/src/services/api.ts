/**
 * Punto único de acceso a los datos. Con `VITE_API_URL` definida se usa el backend real (`api.http.ts`);
 * sin ella, la demostración con datos locales (`api.mock.ts`), que es lo que publica Vercel por ahora.
 */
import { httpApi } from './api.http'
import { mockApi, type Api } from './api.mock'
import { API_URL, restoreSession } from './http'

export type { ActivityItem, ModuleOverview, PathItem, Target } from './api.mock'

/** true cuando la app habla con el backend; false en modo demostración. */
export const isApiMode = API_URL !== ''

if (isApiMode) restoreSession()

export const api: Api = isApiMode ? httpApi : mockApi
