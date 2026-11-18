# Reporte de pruebas estáticas (10.3)

- **Fecha:** 18 de noviembre de 2026 a las 9:28 a. m.
- **Equipo:** Chia · Windows_NT 10.0.26300 · AMD Ryzen 5 5600H with Radeon Graphics (12 hilos) · 7.4 GiB de RAM · Node v24.19.0
- **Herramientas:** ESLint (typescript-eslint, `eslint:recommended`, `react-hooks`, regla `complexity` máx. 10), `tsc --noEmit` en modo estricto y `npm audit --omit=dev` (dependencias de producción).

## Resumen

| Proyecto | ESLint errores | ESLint avisos | `tsc` | Vulnerabilidades (prod.) |
|---|---|---|---|---|
| Backend | 0 | 4 | sin errores | 0 (críticas 0, altas 0, moderadas 0, bajas 0) |
| Frontend | 0 | 12 | sin errores | 0 (críticas 0, altas 0, moderadas 0, bajas 0) |

## Backend (`backend/`)

### ESLint

65 archivos analizados: **0 errores** y **4 avisos**.

| Regla | Ocurrencias |
|---|---|
| `complexity` | 4 |

Funciones que superan la complejidad ciclomática permitida (10), insumo de las métricas de 11.5:

| Archivo | Línea | Detalle |
|---|---|---|
| `src/modules/evaluacion/domain/mensajes.ts` | 15 | Function 'syntaxProblem' has a complexity of 19. Maximum allowed is 10. |
| `src/modules/evaluacion/domain/mensajes.ts` | 49 | Function 'traducirError' has a complexity of 24. Maximum allowed is 10. |
| `src/modules/evaluacion/infrastructure/docker-runner.ts` | 142 | Function 'interpretar' has a complexity of 11. Maximum allowed is 10. |
| `src/modules/pistas-ia/application/pista-service.ts` | 13 | Async method 'pedir' has a complexity of 11. Maximum allowed is 10. |

### TypeScript (`tsc --noEmit`)

Sin errores de tipos.

### `npm audit --omit=dev`

99 dependencias de producción (333 en total con transitivas): **0 vulnerabilidades** (críticas 0, altas 0, moderadas 0, bajas 0, informativas 0).

## Frontend (`frontend/`)

### ESLint

80 archivos analizados: **0 errores** y **12 avisos**.

| Regla | Ocurrencias |
|---|---|
| `complexity` | 12 |

Funciones que superan la complejidad ciclomática permitida (10), insumo de las métricas de 11.5:

| Archivo | Línea | Detalle |
|---|---|---|
| `src/components/exercises/CodeEditor.tsx` | 30 | Arrow function has a complexity of 15. Maximum allowed is 10. |
| `src/components/exercises/ExerciseFeedback.tsx` | 28 | Function 'ExerciseFeedback' has a complexity of 14. Maximum allowed is 10. |
| `src/components/learning/LessonList.tsx` | 17 | Arrow function has a complexity of 14. Maximum allowed is 10. |
| `src/pages/auth/LoginPage.tsx` | 21 | Function 'validate' has a complexity of 12. Maximum allowed is 10. |
| `src/pages/auth/LoginPage.tsx` | 33 | Function 'LoginPage' has a complexity of 20. Maximum allowed is 10. |
| `src/pages/student/ExercisePage.tsx` | 37 | Function 'Workspace' has a complexity of 20. Maximum allowed is 10. |
| `src/pages/teacher/ExerciseEditorPage.tsx` | 46 | Function 'EditorForm' has a complexity of 12. Maximum allowed is 10. |
| `src/pages/teacher/ExerciseEditorPage.tsx` | 82 | Async arrow function has a complexity of 21. Maximum allowed is 10. |
| `src/services/http.ts` | 64 | Async function 'send' has a complexity of 18. Maximum allowed is 10. |
| `src/utils/evaluate.ts` | 24 | Function 'syntaxProblem' has a complexity of 19. Maximum allowed is 10. |
| `src/utils/evaluate.ts` | 64 | Function 'evaluate' has a complexity of 12. Maximum allowed is 10. |
| `src/utils/highlight.ts` | 12 | Function 'highlight' has a complexity of 11. Maximum allowed is 10. |

### TypeScript (`tsc --noEmit`)

Sin errores de tipos.

### `npm audit --omit=dev`

11 dependencias de producción (265 en total con transitivas): **0 vulnerabilidades** (críticas 0, altas 0, moderadas 0, bajas 0, informativas 0).

## Notas

- Los avisos de `complexity` no rompen el CI (son advertencias a propósito: sirven para medir complejidad ciclomática en 11.5).
- `npm audit` consulta la base de avisos de npm en el momento de ejecutarse; el resultado cambia con el tiempo aunque el código no cambie.
