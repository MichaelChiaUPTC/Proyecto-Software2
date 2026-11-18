# Pruebas E2E (Playwright, Chromium)

Recorren la aplicación real: el frontend (Vite, modo API con `VITE_API_URL`) contra la API y MySQL de `docker compose`.

```powershell
# 1. Raíz del repo: API + MySQL, y los usuarios demo
docker compose up -d --build
cd backend; npm run seed; cd ..
docker pull python:3.12-alpine

# 2. E2E (levanta solo el frontend en :5173; el puerto debe estar libre)
cd e2e
npm install
npx playwright install chromium
npx playwright test                       # todo
npx playwright test tests/estudiante.spec.ts
npx playwright show-report                # informe HTML
```

- `tests/estudiante|docente|admin.spec.ts`: recorridos por rol. `accesibilidad.spec.ts`: axe (escribe `docs/evidencias/accesibilidad.md`). `capturas.spec.ts`: capturas para el manual (`docs/evidencias/capturas/`).
- `manual/manual.spec.ts` (config aparte: `npm run manual`): capturas nítidas para el manual de usuario en `docs/manual/img/` (1440×900 a escala 2; móvil 390×844 a escala 3; tema claro). No corre con `npx playwright test` ni en el CI. Prepara datos (progreso del estudiante demo, alumnos de ejemplo, un módulo borrador) y los limpia al terminar; tarda unos 3 minutos por el límite de 10 envíos por minuto.
- Los datos creados llevan `e2e-…@uptc.edu.co` / `E2E …` y se borran al empezar y al terminar con `cleanup.sql` (usa `docker compose exec mysql`).
- Variables: `E2E_API_URL` (por omisión `http://localhost:3000/api`) y `E2E_WEB_URL` (`http://localhost:5173`).
- Un solo worker a propósito: las pruebas comparten BD y el docente/admin ven datos globales.
