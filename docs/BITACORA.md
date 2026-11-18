# Bitácora de cambios

Registro de todo lo que se agrega o cambia, fase por fase. Lo más reciente arriba.
Plan: [PLAN_DE_ACCION.md](PLAN_DE_ACCION.md) · Pendientes humanos: [TAREAS_MANUALES.md](TAREAS_MANUALES.md)

---

## 2026-11-18 — Fases 0 y 1 ✅ (rama `feat/fase-0-1`, commits `2bc26dd`, `83254d4`)

**Qué se agregó**
- `backend/`: Express 5 + TypeScript, organizado como monolito modular hexagonal (`src/modules/<módulo>/{domain,application,infrastructure}`).
- `docker-compose.yml` con MySQL 8 y la API. La API corre las migraciones al arrancar.
- Migraciones `001_esquema_inicial.sql` (las tablas del MER más `evento_outbox`) y `002_vista_progreso.sql` (`v_progreso`).
- El seed carga los mocks del frontend: 8 módulos, 25 lecciones, 21 ejercicios, 51 casos de prueba (24 ocultos), 10 insignias y 3 usuarios demo.
- Endpoints: `GET /api/health`, `POST /api/auth/register|login`, `GET /api/auth/me` y `GET|POST|PATCH /api/admin/users` (solo admin).
- Seguridad: bcrypt (costo 12), JWT de 8 h, límite de 10 intentos fallidos de login cada 15 min, helmet y CORS. El estado `activo` se comprueba en cada petición, así que desactivar un usuario tiene efecto inmediato.
- ESLint en backend y frontend (la regla `complexity` sirve para las métricas de la 11.5) y CI en `.github/workflows/ci.yml`.
- 32 pruebas: de dominio, de JWT y de integración con Supertest contra MySQL real.

**Usuarios demo** (contraseña `Demo1234`): `estudiante@uptc.edu.co`, `docente@uptc.edu.co`, `admin@uptc.edu.co`.

**Cómo verificar**: `docker compose up -d mysql` → `cd backend && npm run migrate && npm run seed && npm test`.
⚠️ En Windows, abre la terminal en la ruta con `C:` mayúscula. Con `c:` minúscula, Vitest falla con "failed to find the runner". Es un problema de Vitest, no del código.

**Desviaciones respecto al documento IW (actualizar la 5.2)**
- Columnas extra para que el contenido del frontend encaje: `usuario.programa/semestre/grupo`, `modulo.codigo/resumen`, `leccion.minutos`, y en `ejercicio`: `objetivo`, `starter`, `solucion`, `pistas`, `ejemplos`, `restricciones`, `reglas` y `nota_exito`.
- La dificultad se guarda como baja/media/alta. `ejercicio` no tiene `id_modulo` porque se obtiene a través de la lección (3FN).
- Casos de prueba: `entrada` es una expresión de Python (por ejemplo `promedio(3, 4, 5)`) que se evalúa después del código del estudiante, y `salida_esperada` es lo que imprime.
- TypeScript del frontend bajó de 7 a 6.0.3, porque typescript-eslint todavía no soporta la 7. El build sigue funcionando.
- Extras de seguridad: un admin no puede desactivarse a sí mismo, y el login tarda lo mismo exista o no el correo, para que no se pueda averiguar qué correos están registrados.

## 2026-11-18 — Inicio

- Análisis de pautas, documento IW (hasta 8.3) y código del frontend.
- Creados `docs/PLAN_DE_ACCION.md`, `docs/TAREAS_MANUALES.md` y esta bitácora.
- Verificado: Docker Desktop ejecuta un contenedor `python:3.12-alpine` sin red (base del motor de corrección).
- Agregada al plan la **Fase 3b: pistas con IA** (Gemini gratis por defecto, Claude opcional), para una prueba de 1 a 3 usuarios durante una semana. La clave de API quedó como tarea manual.
- En curso: Fases 0 y 1 en la rama `feat/fase-0-1`.
