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

## Endpoints (Fase 1)

| Método | Ruta | Acceso |
|---|---|---|
| GET | `/api/health` | público |
| POST | `/api/auth/register` | público (solo `@uptc.edu.co`, rol student) |
| POST | `/api/auth/login` | público (limitado: 10 fallos / 15 min / IP) |
| GET | `/api/auth/me` | autenticado |
| GET, POST | `/api/admin/users` | admin |
| PATCH | `/api/admin/users/:id` | admin (`role`, `active`) |

Errores: `{ "error": { "code": "...", "message": "..." } }`.
