# Plan de acción — Plataforma educativa UPTC

Objetivo: llevar el proyecto de "frontend con datos simulados" a **aplicativo 100 % funcional y desplegado**, generando de paso la evidencia que piden las secciones 8.4–13 de las pautas.

Base: `DOCUMENTOS/Proyecto_Software_II_hasta_8.3.md` (RF-01…07, RNF-01…08, MER 5.1, arquitectura 8.0) y `Pautas de Proyecto SP 2026.pdf`.
Lo que requiere manos humanas está en [TAREAS_MANUALES.md](TAREAS_MANUALES.md).

---

## Decisiones técnicas

| Tema | Decisión | Por qué |
|---|---|---|
| Repositorio | Monorepo: `frontend/` (existente) + `backend/` + `docker-compose.yml` en la raíz | Un solo repo GitHub = evidencia de 9.6 y ACS (10.6) |
| Backend | Node 24 + Express 5 + TypeScript, `mysql2`, `bcrypt`, `jsonwebtoken`, `zod` | Es lo que dice el documento (8.0.1) |
| Estructura backend | Monolito modular; cada módulo con `domain/`, `application/`, `infrastructure/` (puertos y adaptadores) | Sirve directamente como evidencia de 8.7 Hexagonal y 8.8 DDD sin montar microservicios |
| Base de datos | MySQL 8 en Docker; migraciones SQL versionadas en `backend/db/migrations/` | MER 5.1 + `evento_outbox` + vista `v_progreso` |
| Contenido de lecciones | Columna `JSON` con los bloques que ya usa el frontend (en vez de TEXT Markdown) | Evita reescribir el renderizador; se actualiza el diccionario 5.2 |
| Motor de corrección | Puerto `CodeRunner` con adaptador **DockerRunner**: `docker run --rm --network none --memory 128m --cpus 0.5 --pids-limit 64` + timeout 3 s, imagen `python:3.12-alpine` | Cumple RNF-08 (aislado, sin red, límites) sin la complejidad de Judge0. Judge0 queda como adaptador alternativo documentado |
| Veredicto | Siempre calculado en el servidor contra casos de prueba (visibles + ocultos) | Seguridad 8.2.2 |
| Eventos | Tabla `evento_outbox` (`IntentoAprobado`, `LeccionCompletada`, `InsigniaObtenida`); progreso y gamificación se actualizan desde el evento | Evidencia de 8.5 Event Sourcing (versión "outbox", explicada como tal) |
| n8n | Solo para correo: resumen semanal al docente y aviso de insignia. Workflows exportados en `n8n/` | Coherente con 8.0.1 |
| Frontend | `api.ts` conserva su firma; se separa en `api.mock.ts` (actual) y `api.http.ts` (real), elegido por `VITE_API_URL` | El demo de Vercel sigue funcionando mientras el backend no esté publicado |
| Roles | `student`, `teacher`, `admin` (se agrega admin + pantalla de usuarios) | RF-07 |
| Pruebas | Vitest + Supertest (backend), Vitest + Testing Library (frontend), Playwright (E2E), axe (WCAG), k6 (carga) | Cubre 10.1, 10.3, 10.5 y RNF-03/07 |
| CI | GitHub Actions: lint → typecheck → tests → build | 9.5, 10.6 |

---

## Fases

Cada fase termina con: build verde, pruebas de la fase pasando, commit en rama propia y PR a `main`.

### Fase 0 — Cimientos (repo, entorno, CI)
- `backend/` con Express + TS, ESLint, Vitest; script `dev`, `build`, `test`.
- `docker-compose.yml`: `mysql`, `api`, (más adelante `n8n`). `.env.example` en raíz.
- ESLint en frontend (regla `complexity` activada para métricas 11.5).
- `.github/workflows/ci.yml`.
- **Criterio:** `docker compose up` levanta MySQL + API con `GET /api/health` → 200.
- **Secciones del documento:** 9.1, 9.3, 9.5, 9.6.

### Fase 1 — Base de datos y usuarios (RF-01, RF-07, RNF-05)
- Migración inicial con todas las tablas de 5.1 + `evento_outbox` + `v_progreso`.
- Seed: módulos, lecciones y ejercicios tomados de `frontend/src/mocks/` (un script los convierte a SQL) + usuarios demo de los 3 roles.
- `POST /api/auth/login`, `POST /api/auth/register` (solo `@uptc.edu.co`), `GET /api/auth/me`; JWT con expiración; bcrypt costo 12; rate limit en login.
- `GET/POST/PATCH /api/admin/users` (crear, desactivar, cambiar rol) — solo admin.
- Middleware `requireRole(...)`.
- **Criterio:** pruebas de integración para login correcto/incorrecto, usuario inactivo, acceso denegado por rol.
- **Secciones:** 5.1, 5.2, 10.1.

### Fase 2 — Contenidos (RF-02)
- Endpoints de catálogo para estudiante (`/api/modules`, `/api/modules/:id`, `/api/lessons/:id`, `/api/exercises`, `/api/exercises/:id`) — solo publicados.
- Endpoints del docente: crear/editar/ordenar/publicar módulo, lección y ejercicio (incluye casos de prueba). Regla: un ejercicio no se publica sin ≥1 caso de prueba (historia de usuario del tutor).
- **Criterio:** pruebas de integración CRUD + regla de publicación.

### Fase 3 — Ejercicios, corrección, progreso y gamificación (RF-03, RF-04, RF-05, RNF-03, RNF-08)
- Puerto `CodeRunner` + `DockerRunner` (y `FakeRunner` para pruebas).
- `POST /api/exercises/:id/submissions`: ejecuta casos, guarda `intento`, devuelve el mismo `SubmitResult` que espera el frontend (pasa/falla, prueba fallida, pista progresiva, puntos, insignias nuevas).
- Pistas: se reutiliza la lógica de mensajes de `frontend/src/utils/evaluate.ts` (errores de sintaxis comunes) pero el veredicto sale de la ejecución real.
- Al aprobar → evento outbox → procesador en el mismo proceso actualiza puntos/insignias (reglas de `frontend/src/utils/badges.ts` movidas al backend).
- `POST /api/lessons/:id/complete`, `GET /api/me/progress`, `/api/me/badges`, `/api/me/activity`, `/api/me/home`.
- **Criterio:** código infinito se corta en ≤3 s; código con `import socket` no tiene red; p95 < 3 s en ejercicio simple (medido con k6 en Fase 5).
- **Secciones:** 8.5, 8.7, 8.8, 9.2.x.

### Fase 3b — Pistas con IA (alcance de prueba: 1–3 usuarios, ~1 semana)
- Puerto `HintProvider` con adaptadores `GeminiHints` (capa gratuita de Google AI Studio, sin tarjeta) y `ClaudeHints` (Anthropic, modelo Haiku); se elige con `AI_PROVIDER` en el `.env`. Sin clave → se usan las pistas fijas actuales.
- `POST /api/exercises/:id/ai-hint`: envía enunciado + código + prueba fallida (nunca nombre ni correo). Instrucción del sistema: orientar sin dar la solución, máximo 3 frases.
- Límite: 10 pistas IA por estudiante por día y 1 por intento fallido. Timeout 8 s → respaldo con pista fija.
- Frontend: botón "Pedir ayuda a la IA" en la retroalimentación del ejercicio.
- **Criterio:** con clave responde una pista; sin clave o con error, la app sigue funcionando.
- **Secciones:** 8.7 (adaptador), 8.10 (consumo de servicio web), 8.2.2 (privacidad).

### Fase 4 — Reportes y conexión del frontend (RF-06)
- `GET /api/teacher/dashboard`, `GET /api/teacher/reports` (por estudiante y por grupo) + exportar CSV.
- Frontend: `api.http.ts` con cliente `fetch` (token en memoria + `sessionStorage`), manejo de 401 → login.
- Rol admin en `types`, navegación y página `AdminUsersPage`.
- Registro de estudiante en `LoginPage` (pestaña "Crear cuenta").
- n8n: workflow "resumen semanal" y "insignia obtenida" leyendo `evento_outbox` (exportados a `n8n/*.json`).
- **Criterio:** el recorrido completo (registrarse → lección → ejercicio → insignia → docente ve el reporte) funciona contra el backend real.
- **Secciones:** 8.9, 8.10.

### Fase 5 — Pruebas y evidencia (objetivo específico 5)
- Unitarias: dominio (reglas de insignias, cálculo de progreso, validación de ejercicios).
- Integración API + BD (10.1): Supertest contra MySQL de prueba en Docker.
- E2E Playwright (10.5): login de los 3 roles, resolver ejercicio, publicar contenido.
- Accesibilidad (RNF-07): `@axe-core/playwright` en vistas de estudiante → reporte.
- Carga (8.1.2, RNF-03): script k6 con 60 usuarios concurrentes / 30 envíos por minuto → p95.
- Estáticas (10.3): ESLint + `tsc` + `npm audit` → reporte.
- Script `npm run evidence` que deja todos los reportes en `docs/evidencias/`.
- **Secciones:** 10.1, 10.3, 10.4, 10.5, 10.9.

### Fase 6 — Métricas y documentación técnica
- Script de métricas (11.5): LOC por módulo, complejidad ciclomática (ESLint), cobertura (Vitest) → `docs/evidencias/metricas.md`.
- Datos base para 11.2 (puntos de función: lista de entradas/salidas/consultas/archivos sacada de los endpoints) y 11.3 (métricas CK de las clases del dominio).
- **Manual de programador** (9.7) en `docs/manual-programador.md`: arquitectura, cómo levantar el entorno, estructura, convenciones, cómo agregar un módulo o un tipo de ejercicio (RNF-04).
- Borrador del **manual de usuario** en `docs/manual-usuario.md` (los pantallazos son manuales).
- Diagramas Mermaid actualizados (componentes, despliegue, secuencia de envío de ejercicio, MER) en `docs/diagramas.md`.
- **Secciones:** 9.4, 9.7, 11.x, 12, 13.

### Fase 7 — Despliegue
- `docker-compose.prod.yml` (Nginx + TLS Let's Encrypt, API, MySQL, n8n), script `deploy.sh` y script de backup diario de MySQL.
- Configuración de Vercel con `VITE_API_URL`.
- **Criterio:** URL pública funcionando con HTTPS. (Crear la VM, el dominio y las cuentas es manual.)

---

## Orden y dependencias

```
F0 → F1 → F2 → F3 → F3b → F4 → F5 → F6
                         └──→ F7 (en cuanto exista la VM; ver tareas manuales)
```

## Implementación
Cada fase se delega a un agente con el modelo **Sonnet 5.5**, una fase por vez, con revisión del resultado (build + pruebas) antes de pasar a la siguiente.

## Fuera de alcance (versión 2)
Foros, microservicios reales (se documentan como evolución, 8.6), BYOD/MDM (14) y Bonita (15), salvo que el docente los exija.
