# Reporte de pruebas E2E (10.5)

- **Fecha:** 18 de noviembre de 2026 a las 9:33 a. m.
- **Equipo:** Chia · Windows_NT 10.0.26300 · AMD Ryzen 5 5600H with Radeon Graphics (12 hilos) · 7.4 GiB de RAM · Node v24.19.0
- **Herramienta:** Playwright 1.65.1, Chromium (escritorio 1366×800), frontend en modo API (`VITE_API_URL`) contra la API y MySQL de `docker compose`.
- **Duración total:** 172.0 s

**Resultado: 27 de 27 pruebas pasan.**

| Archivo | Prueba | Estado | Duración |
|---|---|---|---|
| `accesibilidad.spec.ts` | no quedan violaciones críticas ni serias | pasa | 0.0 s |
| `accesibilidad.spec.ts` | login y registro | pasa | 3.2 s |
| `accesibilidad.spec.ts` | vistas del estudiante | pasa | 24.6 s |
| `accesibilidad.spec.ts` | vistas del docente | pasa | 9.2 s |
| `accesibilidad.spec.ts` | vistas del administrador | pasa | 3.7 s |
| `accesibilidad.spec.ts` | login y registro | pasa | 2.3 s |
| `accesibilidad.spec.ts` | vistas del estudiante | pasa | 22.8 s |
| `accesibilidad.spec.ts` | vistas del docente | pasa | 9.2 s |
| `accesibilidad.spec.ts` | vistas del administrador | pasa | 3.5 s |
| `admin.spec.ts` | admin: crear usuario, cambiar rol y desactivar; el desactivado ya no entra | pasa | 7.1 s |
| `capturas.spec.ts` | acceso: ingresar y crear cuenta | pasa | 0.8 s |
| `capturas.spec.ts` | estudiante | pasa | 15.5 s |
| `capturas.spec.ts` | docente | pasa | 8.8 s |
| `capturas.spec.ts` | administrador | pasa | 2.0 s |
| `capturas.spec.ts` | acceso: ingresar y crear cuenta | pasa | 0.8 s |
| `capturas.spec.ts` | estudiante | pasa | 15.1 s |
| `capturas.spec.ts` | docente | pasa | 8.7 s |
| `capturas.spec.ts` | administrador | pasa | 2.0 s |
| `docente.spec.ts` | el panel docente muestra los indicadores y el docente no entra a las pantallas de admin | pasa | 1.4 s |
| `docente.spec.ts` | publicar y despublicar contenido: reglas, estado y visibilidad para el estudiante | pasa | 7.5 s |
| `docente.spec.ts` | reportes: el estudiante aparece con su avance y el CSV se descarga con sus datos | pasa | 3.4 s |
| `estudiante.spec.ts` | el registro valida el formulario y crea la cuenta | pasa | 1.4 s |
| `estudiante.spec.ts` | registrar un correo repetido muestra el error del servidor | pasa | 1.2 s |
| `estudiante.spec.ts` | inicia sesión, completa una lección y llega al ejercicio | pasa | 3.8 s |
| `estudiante.spec.ts` | falla un intento, pide una pista (con respaldo si no hay IA) y acierta | pasa | 5.6 s |
| `estudiante.spec.ts` | la insignia y el progreso reflejan lo hecho; la sesión se cierra | pasa | 2.3 s |
| `estudiante.spec.ts` | credenciales incorrectas muestran un mensaje y no abren sesión | pasa | 1.1 s |

## Qué cubren

- `estudiante.spec.ts`: registro (validaciones y correo repetido), inicio de sesión, completar una lección, intento fallido, **pista con IA (respaldo del curso si no hay proveedor)**, acierto, insignia, progreso, cierre de sesión y credenciales incorrectas.
- `docente.spec.ts`: panel, **publicar/despublicar** contenido (regla «módulo sin lecciones no se publica», visibilidad para el estudiante), **reportes y descarga del CSV verificada** (BOM, cabeceras, fila del estudiante).
- `admin.spec.ts`: crear usuario, cambiar rol, desactivar con confirmación (**el desactivado ya no entra y su sesión abierta se cierra**) y reactivar.
- `accesibilidad.spec.ts`: axe-core WCAG 2.1 A/AA (ver `accesibilidad.md`).
- `capturas.spec.ts`: genera las capturas de `capturas/` para el manual de usuario.
- Todas las pruebas fallan si la aplicación escribe un `console.error` (p. ej. avisos de React) o lanza una excepción no capturada.
- Los datos de prueba llevan el correo `e2e-*@uptc.edu.co` o el título `E2E …` y se borran al terminar (`e2e/cleanup.sql`).
