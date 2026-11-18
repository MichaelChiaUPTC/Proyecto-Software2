# Backend — Plataforma educativa UPTC

Express 5 + TypeScript (ESM), MySQL 8. Monolito modular: `src/modules/<modulo>/{domain,application,infrastructure}` y `src/shared/`.

## Levantar

Desde la raíz del repo:

```bash
cp .env.example .env                  # ajusta JWT_SECRET
docker compose up -d mysql            # MySQL en :3306 (cambia con MYSQL_PORT)
cd backend
cp .env.example .env
npm ci
npm run migrate                       # aplica db/migrations/*.sql
npm run seed                          # módulos, lecciones, ejercicios + usuarios demo
npm run dev                           # http://localhost:3000/api/health
```

Todo en contenedores: `docker compose up -d --build` (la API migra al arrancar; el seed se corre aparte con `npm run seed`).

Usuarios demo (contraseña `Demo1234`): `estudiante@uptc.edu.co`, `docente@uptc.edu.co`, `admin@uptc.edu.co`.

## Scripts

`dev`, `build`, `start`, `test`, `lint`, `typecheck`, `migrate`, `seed`.

Las pruebas de integración usan la BD `uptc_test` del mismo MySQL (la crean y migran solas con el usuario root; contraseña en `MYSQL_ROOT_PASSWORD`, por defecto `root`).

## Endpoints (Fases 1 a 4)

| Método | Ruta | Acceso |
|---|---|---|
| GET | `/api/health` | público |
| POST | `/api/auth/register` | público (solo `@uptc.edu.co`, rol student) |
| POST | `/api/auth/login` | público (limitado: 10 fallos / 15 min / IP) |
| GET | `/api/auth/me` | autenticado |
| GET, POST | `/api/admin/users` | admin |
| PATCH | `/api/admin/users/:id` | admin (`role`, `active`) |
| GET | `/api/modules`, `/api/modules/:id`, `/api/lessons/:id`, `/api/exercises`, `/api/exercises/:id` | autenticado (solo publicado, sin solución ni casos ocultos) |
| GET | `/api/teacher/content` | docente/admin |
| POST, PUT | `/api/teacher/content/{modules,lessons,exercises}[/:id]` | docente/admin |
| POST | `/api/teacher/content/:kind/:id/publish`, `.../move` | docente/admin |
| POST | `/api/exercises/:id/submissions` | estudiante (10 envíos/min por usuario). Body `{code, hintsUsed}` → `SubmitResult` |
| GET | `/api/exercises/:id/attempts` | estudiante: `{solved, attempts, history, next}` |
| POST | `/api/lessons/:id/complete` | estudiante: `{next, newBadges}` |
| GET | `/api/me/progress`, `/api/me/badges`, `/api/me/activity?limit=`, `/api/me/home`, `/api/me/profile`, `/api/me/modules/:id` | estudiante |
| GET | `/api/me/modules` (módulos con `pct/status`), `/api/me/exercises` (ejercicios con `solved/attempts`), `/api/me/lessons/:id` (lección + módulo + `prev/next`), `/api/me/exercises/:id` (ejercicio + módulo + lección + `next` + historial) | estudiante |
| POST | `/api/exercises/:id/ai-hint` | estudiante: `{hint, source: 'ai' \| 'fallback'}` (Fase 3b) |
| GET | `/api/teacher/dashboard` | docente/admin: resumen del grupo (activos, atención, distribución por módulo, recientes) |
| GET | `/api/teacher/reports[?group=]` | docente/admin: `{students: StudentRow[]}` (solo estudiantes activos; `group=Sin grupo` para los que no tienen) |
| GET | `/api/teacher/reports.csv[?group=]` | docente/admin: CSV UTF-8 con BOM, cabeceras en español, valores neutralizados contra inyección de fórmulas |

CORS: `CORS_ORIGIN` (lista separada por comas; por omisión `http://localhost:5173`, el servidor de desarrollo de Vite).

Errores: `{ "error": { "code": "...", "message": "..." } }`.

## Motor de corrección (Fase 3)

Cada envío ejecuta el código del estudiante en un contenedor `python:3.12-alpine` efímero (`DockerRunner`): sin red, 128 MB, 0,5 CPU, 64 procesos, sistema de archivos de solo lectura, usuario 65534, sin capacidades y con límite total de 3 s (después se mata el contenedor). El código y los casos viajan por stdin; los resultados vuelven con un delimitador aleatorio por envío.

- Necesita Docker en la máquina que corre la API y la imagen descargada: `docker pull python:3.12-alpine`.
- En `docker compose` la API monta `/var/run/docker.sock` (ver riesgos en `docs/BITACORA.md`). Variable `DOCKER_GID` en el `.env` de la raíz (0 en Docker Desktop).
- Configurable por env: `RUNNER_IMAGE`, `RUNNER_TIMEOUT_MS`, `RUNNER_MEMORY`, `RUNNER_CPUS`, `RUNNER_PIDS`, `RUNNER_MAX_CONCURRENT`, `SUBMIT_RATE_LIMIT_MAX`, `OUTBOX_INTERVAL_MS`.
- Casos de prueba: `entrada` es una expresión Python evaluada tras el código del estudiante; `salida_esperada` es lo que imprime o la `repr` del valor devuelto (se acepta la forma `"texto"` con comillas dobles).
- Las pruebas del runner real se saltan con `SKIP_DOCKER_TESTS=1` (el resto de pruebas usa `FakeRunner`).
