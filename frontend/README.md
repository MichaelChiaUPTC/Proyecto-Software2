# Lógica UPTC · Frontend

Frontend (React + TypeScript + Vite) de la plataforma de práctica de programación básica. Funciona en dos modos, según la variable `VITE_API_URL`.

| | Modo demostración (sin `VITE_API_URL`) | Modo API (con `VITE_API_URL`) |
|---|---|---|
| Datos | mocks + estado local en `localStorage` | backend real (`backend/`, MySQL) |
| Ingreso | cualquier correo `@uptc.edu.co` con 6+ caracteres (si empieza por `docente`, entra como docente) | cuentas reales: la demo del seed (`estudiante@`, `docente@`, `admin@uptc.edu.co`, clave `Demo1234`) o «Crear cuenta» |
| Sesión | `localStorage` | token JWT en `sessionStorage` (por pestaña) |
| Corrección de ejercicios | evaluador simulado | contenedor Docker en el servidor |
| Extras | — | pestaña «Crear cuenta», «Pedir ayuda a la IA», gestión de usuarios (admin), exportar CSV del servidor |

El demo de Vercel se publica sin la variable, así que sigue funcionando con mocks.

## Modo demostración
```bash
npm install
npm run dev      # http://localhost:5173
npm run build
```
Menú de la barra lateral → Configuración: tema claro/oscuro y restablecer datos de demostración.

## Modo API
1. Levanta el backend (desde la raíz del repo): `docker compose up -d --build` y, la primera vez, `cd backend && npm run seed`. La API queda en `http://localhost:3000/api` (puerto `API_PORT`).
2. Copia `.env.example` a `.env.local` (`VITE_API_URL=http://localhost:3000/api`) y ejecuta `npm run dev`. El backend acepta por CORS `http://localhost:5173` (`CORS_ORIGIN`).
3. Para compilar apuntando a una API: `VITE_API_URL=https://mi-dominio/api npm run build` (la variable se fija al compilar; en Vercel, Project Settings → Environment Variables).

Un 401 (sesión vencida o cuenta desactivada) limpia la sesión y devuelve al login.

## Estructura
- `src/components/{ui,layout,learning,exercises,progress,achievements}` componentes reutilizables
- `src/pages/{auth,student,teacher,admin}` pantallas · `src/layouts` estructura de la app
- `src/services/api.ts` **punto único de acceso a datos**: exporta `api` (HTTP si hay `VITE_API_URL`, mock si no) y `isApiMode`
  - `api.mock.ts` implementación de demostración · `api.http.ts` la misma interfaz (`Api`) con `fetch`
  - `http.ts` cliente mínimo: token, cabecera `Authorization`, errores `{error:{code,message}}` → `Error(message)`, 401 → cerrar sesión
  - ids numéricos del backend se convierten a string en el borde (`api.http.ts`); las páginas no cambian
- `src/services/stores.ts` estado local que simula la base de datos (demo) y `revisionStore` (en modo API, refresca las consultas tras una escritura) · `src/mocks` datos de ejemplo
- `src/utils/evaluate.ts` evaluador simulado de ejercicios (solo demo)
- `src/styles/tokens.css` sistema de diseño (color, tipografía, espaciado, claro/oscuro)

Si agregas un método a `api.mock.ts`, TypeScript te obliga a implementarlo en `api.http.ts` (el tipo `Api` sale del mock).
