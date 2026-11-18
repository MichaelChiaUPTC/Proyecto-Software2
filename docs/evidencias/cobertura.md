# Reporte de cobertura de pruebas

- **Fecha:** 18 de noviembre de 2026 a las 9:30 a. m.
- **Equipo:** Chia · Windows_NT 10.0.26300 · AMD Ryzen 5 5600H with Radeon Graphics (12 hilos) · 7.4 GiB de RAM · Node v24.19.0
- **Herramienta:** Vitest 5 + `@vitest/coverage-v8` (cobertura de líneas, sentencias, funciones y ramas). Backend contra MySQL y Docker reales; frontend con jsdom.

## Resumen

| Proyecto | Pruebas | Pasan | Fallan | Líneas | Sentencias | Funciones | Ramas |
|---|---|---|---|---|---|---|---|
| Backend | 152 | 152 | 0 | 93.83 % (914/974) | 92.63 % | 93.61 % | 86.90 % |
| Frontend | 56 | 56 | 0 | 17.18 % (228/1327) | 17.48 % | 12.46 % | 19.64 % |

(Solo cuentan los archivos de `src/`; los mocks, las pruebas y el arranque `main.tsx` del frontend se excluyen.)

## Backend

### Cobertura por carpeta

| Carpeta | Archivos | Líneas cubiertas | % líneas | % ramas |
|---|---|---|---|---|
| `(raíz)` | 2 | 21/31 | 67.74 % | 100.00 % |
| `cli` | 1 | 0/4 | 0.00 % | 0.00 % |
| `modules/contenidos/application` | 1 | 53/53 | 100.00 % | 96.88 % |
| `modules/contenidos/domain` | 1 | 0/0 | - | - |
| `modules/contenidos/infrastructure` | 2 | 134/139 | 96.40 % | 96.36 % |
| `modules/evaluacion/application` | 1 | 17/18 | 94.44 % | 87.50 % |
| `modules/evaluacion/domain` | 4 | 71/76 | 93.42 % | 88.64 % |
| `modules/evaluacion/infrastructure` | 5 | 114/127 | 89.76 % | 86.67 % |
| `modules/pistas-ia/application` | 1 | 24/24 | 100.00 % | 89.29 % |
| `modules/pistas-ia/domain` | 2 | 5/5 | 100.00 % | 66.67 % |
| `modules/pistas-ia/infrastructure` | 5 | 40/40 | 100.00 % | 65.71 % |
| `modules/progreso/application` | 2 | 78/82 | 95.12 % | 86.11 % |
| `modules/progreso/domain` | 3 | 73/73 | 100.00 % | 85.48 % |
| `modules/progreso/infrastructure` | 2 | 71/73 | 97.26 % | 86.67 % |
| `modules/reportes/application` | 1 | 14/14 | 100.00 % | 100.00 % |
| `modules/reportes/domain` | 2 | 21/21 | 100.00 % | 94.12 % |
| `modules/reportes/infrastructure` | 2 | 35/35 | 100.00 % | 86.67 % |
| `modules/usuarios/application` | 2 | 34/36 | 94.44 % | 88.46 % |
| `modules/usuarios/domain` | 2 | 6/6 | 100.00 % | - |
| `modules/usuarios/infrastructure` | 4 | 86/87 | 98.85 % | 85.29 % |
| `shared` | 4 | 8/19 | 42.11 % | 50.00 % |
| `shared/middleware` | 1 | 9/11 | 81.82 % | 80.00 % |

### Pruebas por archivo

| Archivo de pruebas | Pruebas | Pasan |
|---|---|---|
| `test/admin.test.ts` | 10 | 10 |
| `test/auth.test.ts` | 16 | 16 |
| `test/catalogo-estudiante.test.ts` | 8 | 8 |
| `test/contenidos.test.ts` | 21 | 21 |
| `test/docker-runner.test.ts` | 18 | 18 |
| `test/dominio.test.ts` | 6 | 6 |
| `test/envios.test.ts` | 23 | 23 |
| `test/evaluacion-dominio.test.ts` | 27 | 27 |
| `test/pistas-ia.test.ts` | 12 | 12 |
| `test/reportes.test.ts` | 11 | 11 |

## Frontend

### Cobertura por carpeta

| Carpeta | Archivos | Líneas cubiertas | % líneas | % ramas |
|---|---|---|---|---|
| `(raíz)` | 1 | 0/16 | 0.00 % | - |
| `components/achievements` | 1 | 0/5 | 0.00 % | 0.00 % |
| `components/exercises` | 3 | 5/45 | 11.11 % | 46.58 % |
| `components/layout` | 7 | 0/31 | 0.00 % | 0.00 % |
| `components/learning` | 5 | 0/40 | 0.00 % | 0.00 % |
| `components/progress` | 1 | 0/2 | 0.00 % | 0.00 % |
| `components/ui` | 15 | 37/185 | 20.00 % | 20.35 % |
| `hooks` | 4 | 0/46 | 0.00 % | 0.00 % |
| `layouts` | 1 | 0/10 | 0.00 % | 0.00 % |
| `pages/admin` | 1 | 0/71 | 0.00 % | 0.00 % |
| `pages/auth` | 1 | 0/43 | 0.00 % | 0.00 % |
| `pages/student` | 9 | 0/159 | 0.00 % | 0.00 % |
| `pages/teacher` | 5 | 0/195 | 0.00 % | 0.00 % |
| `services` | 5 | 46/332 | 13.86 % | 18.02 % |
| `types` | 1 | 0/0 | - | - |
| `utils` | 5 | 140/147 | 95.24 % | 96.09 % |

### Pruebas por archivo

| Archivo de pruebas | Pruebas | Pasan |
|---|---|---|
| `src/components/exercises/ExerciseFeedback.test.tsx` | 10 | 10 |
| `src/components/ui/Modal.test.tsx` | 5 | 5 |
| `src/services/http.test.ts` | 14 | 14 |
| `src/utils/badges.test.ts` | 7 | 7 |
| `src/utils/evaluate.test.ts` | 10 | 10 |
| `src/utils/format.test.ts` | 6 | 6 |
| `src/utils/highlight.test.ts` | 4 | 4 |

## Lectura

- La cobertura de líneas es una medida de qué código ejecutan las pruebas, no de su calidad: una línea ejecutada sin aserciones cuenta igual.
- El reporte HTML navegable queda en `backend/coverage/index.html` y `frontend/coverage/index.html` (no se versionan).
