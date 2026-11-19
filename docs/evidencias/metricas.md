# Métricas de código (11.5), puntos de función (11.2) y métricas CK (11.3)

- **Fecha:** 18 de noviembre de 2026 a las 10:00 a. m.
- **Equipo:** Chia · Windows_NT 10.0.26300 · AMD Ryzen 5 5600H with Radeon Graphics (12 hilos) · 7.4 GiB de RAM · Node v24.19.0
- **Equipo de desarrollo:** autores del proyecto, Ingeniería de Sistemas y Computación, UPTC (Software II).
- **Cómo se obtiene:** `node scripts/metricas.mjs` (o `npm run metrics`). Lee el código con el compilador de TypeScript instalado en `backend/`; no se inventa ninguna cifra. Los reportes de cobertura se leen de `backend/coverage` y `frontend/coverage` (genéralos antes con `node scripts/informes.mjs cobertura`).

## 1. Líneas de código por carpeta

Una línea es **código** si tiene al menos un token que no sea comentario; **comentario** si solo tiene comentarios; **blanca** si está vacía. Se cuentan archivos `.ts` y `.tsx`.

### Backend (`backend/`)

| Carpeta | Archivos | Código | Comentarios | Blancos | Total | Comentarios / (código + comentarios) |
|---|---|---|---|---|---|---|
| `db (seed)` | 1 | 83 | 6 | 9 | 98 | 6,7 % |
| `src (raíz)` | 3 | 86 | 3 | 11 | 100 | 3,4 % |
| `src/cli` | 1 | 7 | 0 | 2 | 9 | 0,0 % |
| `src/modules/contenidos/application` | 1 | 107 | 0 | 19 | 126 | 0,0 % |
| `src/modules/contenidos/domain` | 1 | 77 | 3 | 8 | 88 | 3,8 % |
| `src/modules/contenidos/infrastructure` | 2 | 275 | 1 | 33 | 309 | 0,4 % |
| `src/modules/evaluacion/application` | 1 | 48 | 5 | 7 | 60 | 9,4 % |
| `src/modules/evaluacion/domain` | 4 | 189 | 19 | 26 | 234 | 9,1 % |
| `src/modules/evaluacion/infrastructure` | 5 | 307 | 11 | 39 | 357 | 3,5 % |
| `src/modules/pistas-ia/application` | 1 | 40 | 1 | 8 | 49 | 2,4 % |
| `src/modules/pistas-ia/domain` | 2 | 48 | 5 | 10 | 63 | 9,4 % |
| `src/modules/pistas-ia/infrastructure` | 5 | 116 | 4 | 19 | 139 | 3,3 % |
| `src/modules/progreso/application` | 2 | 168 | 7 | 26 | 201 | 4,0 % |
| `src/modules/progreso/domain` | 3 | 169 | 17 | 30 | 216 | 9,1 % |
| `src/modules/progreso/infrastructure` | 2 | 150 | 2 | 17 | 169 | 1,3 % |
| `src/modules/reportes/application` | 1 | 34 | 0 | 6 | 40 | 0,0 % |
| `src/modules/reportes/domain` | 2 | 80 | 7 | 16 | 103 | 8,0 % |
| `src/modules/reportes/infrastructure` | 2 | 70 | 1 | 9 | 80 | 1,4 % |
| `src/modules/usuarios/application` | 2 | 101 | 0 | 12 | 113 | 0,0 % |
| `src/modules/usuarios/domain` | 2 | 66 | 3 | 13 | 82 | 4,3 % |
| `src/modules/usuarios/infrastructure` | 4 | 203 | 2 | 28 | 233 | 1,0 % |
| `src/shared` | 5 | 92 | 4 | 14 | 110 | 4,2 % |
| `test (pruebas)` | 12 | 1540 | 6 | 205 | 1751 | 0,4 % |
| **Total** | 64 | 4056 | 107 | 567 | 4730 | 2,6 % |

### Frontend (`frontend/`)

| Carpeta | Archivos | Código | Comentarios | Blancos | Total | Comentarios / (código + comentarios) |
|---|---|---|---|---|---|---|
| `src (raíz)` | 3 | 94 | 1 | 11 | 106 | 1,1 % |
| `src/components/achievements` | 1 | 47 | 1 | 4 | 52 | 2,1 % |
| `src/components/exercises` | 4 | 283 | 12 | 31 | 326 | 4,1 % |
| `src/components/layout` | 7 | 235 | 4 | 23 | 262 | 1,7 % |
| `src/components/learning` | 5 | 251 | 10 | 19 | 280 | 3,8 % |
| `src/components/progress` | 1 | 21 | 1 | 2 | 24 | 4,5 % |
| `src/components/ui` | 16 | 676 | 8 | 85 | 769 | 1,2 % |
| `src/hooks` | 4 | 92 | 6 | 22 | 120 | 6,1 % |
| `src/layouts` | 1 | 29 | 5 | 5 | 39 | 14,7 % |
| `src/mocks` | 4 | 464 | 0 | 23 | 487 | 0,0 % |
| `src/pages/admin` | 1 | 170 | 0 | 13 | 183 | 0,0 % |
| `src/pages/auth` | 1 | 133 | 0 | 16 | 149 | 0,0 % |
| `src/pages/student` | 9 | 740 | 0 | 74 | 814 | 0,0 % |
| `src/pages/teacher` | 5 | 578 | 2 | 46 | 626 | 0,3 % |
| `src/services` | 6 | 758 | 33 | 81 | 872 | 4,2 % |
| `src/test` | 1 | 7 | 0 | 2 | 9 | 0,0 % |
| `src/types` | 1 | 138 | 5 | 19 | 162 | 3,5 % |
| `src/utils` | 9 | 431 | 6 | 77 | 514 | 1,4 % |
| **Total** | 79 | 5147 | 94 | 553 | 5794 | 1,8 % |

### Otros

- Estilos CSS del frontend: 5 archivos, 860 líneas.
- Migraciones SQL: 5 archivos, 141 líneas de sentencias (sin comentarios ni blancos).

### Pruebas E2E (`e2e/`)

| Carpeta | Archivos | Código | Comentarios | Blancos | Total | Comentarios / (código + comentarios) |
|---|---|---|---|---|---|---|
| `e2e (soporte y config)` | 10 | 147 | 18 | 28 | 193 | 10,9 % |
| `e2e/manual` | 2 | 247 | 8 | 35 | 290 | 3,1 % |
| `e2e/tests` | 5 | 523 | 17 | 78 | 618 | 3,1 % |
| **Total** | 17 | 917 | 43 | 141 | 1101 | 4,5 % |

## 2. Complejidad ciclomática (por función)

McCabe: 1 + número de decisiones (`if`, `?:`, `for`, `for…in/of`, `while`, `do`, `case`, `catch`, `&&`, `||`, `??`). Cada función (declaración, expresión, flecha, método, constructor, `get/set`) se mide por separado; una función anidada no suma a la que la contiene. Se excluyen pruebas y mocks. **No coincide exactamente con la regla `complexity` de ESLint** (que cuenta además `?.` y valores por omisión), por eso `estaticas.md` puede dar un número de funciones por encima de 10 ligeramente distinto.

| Proyecto | Funciones | CC promedio | CC máxima | CC 1–5 | CC 6–10 | CC 11–20 | CC > 20 |
|---|---|---|---|---|---|---|---|
| Backend | 376 | 1,82 | 24 | 355 | 17 | 3 | 1 |
| Frontend | 691 | 1,94 | 20 | 650 | 30 | 11 | 0 |

### Top 10 del backend

| # | Función | Archivo : línea | CC |
|---|---|---|---|
| 1 | `traducirError` | `backend/src/modules/evaluacion/domain/mensajes.ts`:49 | 24 |
| 2 | `syntaxProblem` | `backend/src/modules/evaluacion/domain/mensajes.ts`:15 | 19 |
| 3 | `interpretar` | `backend/src/modules/evaluacion/infrastructure/docker-runner.ts`:142 | 11 |
| 4 | `PistaService.pedir` | `backend/src/modules/pistas-ia/application/pista-service.ts`:13 | 11 |
| 5 | `MysqlContenidoRepo.mover` | `backend/src/modules/contenidos/infrastructure/mysql-contenido-repo.ts`:173 | 9 |
| 6 | `evaluar` | `backend/src/modules/evaluacion/domain/veredicto.ts`:38 | 9 |
| 7 | `MysqlReporteRepo.estudiantes` | `backend/src/modules/reportes/infrastructure/mysql-reporte-repo.ts`:21 | 8 |
| 8 | `DockerRunner.terminar` | `backend/src/modules/evaluacion/infrastructure/docker-runner.ts`:75 | 7 |
| 9 | `buildPath` | `backend/src/modules/progreso/domain/progreso.ts`:87 | 7 |
| 10 | `MysqlProgresoRepo.(anónima)` | `backend/src/modules/progreso/infrastructure/mysql-progreso-repo.ts`:98 | 7 |

### Top 10 del frontend

| # | Función | Archivo : línea | CC |
|---|---|---|---|
| 1 | `LoginPage` | `frontend/src/pages/auth/LoginPage.tsx`:33 | 20 |
| 2 | `syntaxProblem` | `frontend/src/utils/evaluate.ts`:24 | 19 |
| 3 | `Workspace` | `frontend/src/pages/student/ExercisePage.tsx`:37 | 18 |
| 4 | `onKeyDown` | `frontend/src/components/exercises/CodeEditor.tsx`:30 | 14 |
| 5 | `ExerciseFeedback` | `frontend/src/components/exercises/ExerciseFeedback.tsx`:28 | 14 |
| 6 | `(anónima)` | `frontend/src/components/learning/LessonList.tsx`:17 | 14 |
| 7 | `save` | `frontend/src/pages/teacher/ExerciseEditorPage.tsx`:82 | 14 |
| 8 | `send` | `frontend/src/services/http.ts`:64 | 14 |
| 9 | `validate` | `frontend/src/pages/auth/LoginPage.tsx`:21 | 12 |
| 10 | `EditorForm` | `frontend/src/pages/teacher/ExerciseEditorPage.tsx`:46 | 12 |

## 3. Cobertura de pruebas (reportes existentes)

| Proyecto | Líneas | Sentencias | Funciones | Ramas |
|---|---|---|---|---|
| Backend | 93,83 % (914/974) | 92,63 % | 93,61 % | 86,90 % |
| Frontend | 17,18 % (228/1327) | 17,48 % | 12,46 % | 19,64 % |

Detalle por carpeta y por archivo de prueba en [`cobertura.md`](cobertura.md). El frontend queda bajo a propósito: las pantallas las cubre el E2E (ver [`e2e.md`](e2e.md)), que no cuenta en esta métrica.

## 4. Insumos para puntos de función (11.2)

Se enumeran los elementos funcionales **leyendo los routers reales** (38 endpoints), las migraciones (11 tablas) y las integraciones externas. La columna «Propuesta» es una sugerencia automática; **el equipo debe confirmarla** contando tipos de archivo referenciados (FTR) y campos (DET) según la tabla de complejidad de IFPUG, y elegir el factor de ajuste (14 características) para pasar de puntos sin ajustar (UFP) a ajustados (FP).

| Tipo | Cantidad | UFP con la propuesta |
|---|---|---|
| Entradas externas (EI): POST/PUT/PATCH | 15 | 65 |
| Salidas externas (EO): reportes y CSV del docente | 3 | 19 |
| Consultas externas (EQ): GET | 20 | 66 |
| Archivos lógicos internos (ILF): tablas | 11 | 94 |
| Interfaces externas (EIF) | 3 | 19 |
| **Total sin ajustar (propuesta)** | | **263** |

Pesos IFPUG usados en la propuesta: EI 3/4/6, EO 4/5/7, EQ 3/4/6, ILF 7/10/15, EIF 5/7/10 (baja/media/alta). `GET /api/health` cuenta como consulta de infraestructura; el equipo puede excluirlo.

### 4.1 Entradas, salidas y consultas (endpoints)

| Tipo | Método | Ruta | Acceso | Complejidad propuesta | Peso | Justificación (propuesta) | Complejidad del equipo | Peso del equipo |
|---|---|---|---|---|---|---|---|---|
| EQ | GET | `/api/health` | público | baja | 3 | Consulta sin cálculo derivado significativo. | | |
| EQ | GET | `/api/modules` | autenticado | baja | 3 | Consulta sin cálculo derivado significativo. | | |
| EQ | GET | `/api/modules/:id` | autenticado | baja | 3 | Consulta sin cálculo derivado significativo. | | |
| EQ | GET | `/api/lessons/:id` | autenticado | baja | 3 | Consulta sin cálculo derivado significativo. | | |
| EQ | GET | `/api/exercises` | autenticado | baja | 3 | Consulta sin cálculo derivado significativo. | | |
| EQ | GET | `/api/exercises/:id` | autenticado | baja | 3 | Consulta sin cálculo derivado significativo. | | |
| EQ | GET | `/api/teacher/content` | docente / admin | media | 4 | Consulta sin cálculo derivado significativo. | | |
| EI | POST | `/api/teacher/content/modules` | docente / admin | media | 4 | Crea o modifica contenido (varios campos); los ejercicios incluyen casos de prueba. | | |
| EI | PUT | `/api/teacher/content/modules/:id` | docente / admin | media | 4 | Crea o modifica contenido (varios campos); los ejercicios incluyen casos de prueba. | | |
| EI | POST | `/api/teacher/content/lessons` | docente / admin | media | 4 | Crea o modifica contenido (varios campos); los ejercicios incluyen casos de prueba. | | |
| EI | PUT | `/api/teacher/content/lessons/:id` | docente / admin | media | 4 | Crea o modifica contenido (varios campos); los ejercicios incluyen casos de prueba. | | |
| EI | POST | `/api/teacher/content/exercises` | docente / admin | alta | 6 | Crea o modifica contenido (varios campos); los ejercicios incluyen casos de prueba. | | |
| EI | PUT | `/api/teacher/content/exercises/:id` | docente / admin | alta | 6 | Crea o modifica contenido (varios campos); los ejercicios incluyen casos de prueba. | | |
| EI | POST | `/api/teacher/content/:kind/:id/publish` | docente / admin | media | 4 | Crea o modifica contenido (varios campos); los ejercicios incluyen casos de prueba. | | |
| EI | POST | `/api/teacher/content/:kind/:id/move` | docente / admin | media | 4 | Crea o modifica contenido (varios campos); los ejercicios incluyen casos de prueba. | | |
| EI | POST | `/api/exercises/:id/submissions` | estudiante | alta | 6 | Valida el código, ejecuta el corrector, escribe intento + evento y puede otorgar insignias (≥ 4 archivos lógicos). | | |
| EI | POST | `/api/exercises/:id/ai-hint` | estudiante | alta | 6 | Lee intento y ejercicio, llama a un proveedor externo y escribe pista_ia (límites y respaldo). | | |
| EI | POST | `/api/lessons/:id/complete` | estudiante | baja | 3 | Escritura sobre un solo archivo lógico. | | |
| EQ | GET | `/api/exercises/:id/attempts` | estudiante | baja | 3 | Consulta sin cálculo derivado significativo. | | |
| EQ | GET | `/api/me/modules/:id` | estudiante | baja | 3 | Consulta sin cálculo derivado significativo. | | |
| EQ | GET | `/api/me/modules` | estudiante | baja | 3 | Consulta sin cálculo derivado significativo. | | |
| EQ | GET | `/api/me/exercises` | estudiante | baja | 3 | Consulta sin cálculo derivado significativo. | | |
| EQ | GET | `/api/me/exercises/:id` | estudiante | media | 4 | Consulta sin cálculo derivado significativo. | | |
| EQ | GET | `/api/me/lessons/:id` | estudiante | media | 4 | Consulta sin cálculo derivado significativo. | | |
| EQ | GET | `/api/me/progress` | estudiante | media | 4 | Consulta sin cálculo derivado significativo. | | |
| EQ | GET | `/api/me/badges` | estudiante | baja | 3 | Consulta sin cálculo derivado significativo. | | |
| EQ | GET | `/api/me/activity` | estudiante | baja | 3 | Consulta sin cálculo derivado significativo. | | |
| EQ | GET | `/api/me/home` | estudiante | media | 4 | Consulta sin cálculo derivado significativo. | | |
| EQ | GET | `/api/me/profile` | estudiante | media | 4 | Consulta sin cálculo derivado significativo. | | |
| EO | GET | `/api/teacher/dashboard` | docente / admin | alta | 7 | Agrega datos de varios archivos lógicos con cálculo derivado (porcentajes, atención). | | |
| EO | GET | `/api/teacher/reports` | docente / admin | alta | 7 | Agrega datos de varios archivos lógicos con cálculo derivado (porcentajes, atención). | | |
| EO | GET | `/api/teacher/reports.csv` | docente / admin | media | 5 | Agrega datos de varios archivos lógicos con cálculo derivado (porcentajes, atención). | | |
| EI | POST | `/api/auth/register` | público | media | 4 | Valida credenciales/datos y accede a usuario. | | |
| EI | POST | `/api/auth/login` | público | media | 4 | Valida credenciales/datos y accede a usuario. | | |
| EQ | GET | `/api/auth/me` | autenticado | baja | 3 | Consulta sin cálculo derivado significativo. | | |
| EQ | GET | `/api/admin/users` | admin | baja | 3 | Consulta sin cálculo derivado significativo. | | |
| EI | POST | `/api/admin/users` | admin | baja | 3 | Escritura sobre un solo archivo lógico. | | |
| EI | PATCH | `/api/admin/users/:id` | admin | baja | 3 | Escritura sobre un solo archivo lógico. | | |

### 4.2 Archivos lógicos internos (tablas)

| Tabla | Columnas | Migración | Complejidad propuesta | Peso | Complejidad del equipo | Peso del equipo |
|---|---|---|---|---|---|---|
| `usuario` | 10 | 001_esquema_inicial.sql | media | 10 | | |
| `modulo` | 6 | 001_esquema_inicial.sql | baja | 7 | | |
| `leccion` | 7 | 001_esquema_inicial.sql | media | 10 | | |
| `ejercicio` | 16 | 001_esquema_inicial.sql | alta | 15 | | |
| `caso_prueba` | 5 | 001_esquema_inicial.sql | baja | 7 | | |
| `intento` | 9 | 001_esquema_inicial.sql | media | 10 | | |
| `insignia` | 5 | 001_esquema_inicial.sql | baja | 7 | | |
| `usuario_insignia` | 3 | 001_esquema_inicial.sql | baja | 7 | | |
| `evento_outbox` | 5 | 001_esquema_inicial.sql | baja | 7 | | |
| `leccion_completada` | 3 | 003_progreso_gamificacion.sql | baja | 7 | | |
| `pista_ia` | 6 | 005_pista_ia.sql | baja | 7 | | |

La vista `v_progreso` y la tabla de control `schema_migrations` no se cuentan. La propuesta de complejidad usa solo el número de columnas (≥ 15 alta, 7–14 media, < 7 baja).

### 4.3 Interfaces externas (EIF)

| Interfaz | Complejidad propuesta | Peso | Nota | Complejidad del equipo | Peso del equipo |
|---|---|---|---|---|---|
| Motor de corrección (Docker, vía socket) | media | 7 | Interfaz externa: ejecuta el código del estudiante en un contenedor `python:3.12-alpine` (`DockerRunner`). | | |
| Proveedor de IA (Gemini o Anthropic, HTTPS) | media | 7 | Interfaz externa opcional detrás del puerto `HintProvider`. | | |
| Servidor SMTP (correo de n8n) | baja | 5 | Interfaz externa usada por los workflows de n8n (insignia obtenida, resumen semanal). | | |

## 5. Métricas CK de las clases del backend (11.3)

Se analizaron 22 clases de `backend/src` con el compilador de TypeScript. Las definiciones son aproximaciones calculadas sobre el código fuente:

- **WMC**: número de métodos con cuerpo (más el constructor si hace algo). **WMC (ΣCC)** suma la complejidad ciclomática de esos métodos.
- **DIT**: profundidad en la jerarquía de herencia dentro del proyecto (`Error` cuenta como 1 nivel). **NOC**: subclases directas.
- **CBO** (aprox.): símbolos del proyecto (clases, interfaces y tipos importados con ruta relativa) mencionados dentro de la clase.
- **RFC** (aprox.): métodos propios + nombres distintos de métodos/funciones invocados dentro de la clase.
- **LCOM** (Chidamber-Kemerer): pares de métodos que no comparten campos (`this.x`) menos pares que sí comparten, mínimo 0.

| Clase | Archivo | WMC | WMC (ΣCC) | DIT | NOC | CBO | RFC | LCOM |
|---|---|---|---|---|---|---|---|---|
| `ContenidoService` | `modules/contenidos/application/contenido-service.ts` | 15 | 31 | 0 | 0 | 6 | 30 | 0 |
| `MysqlContenidoRepo` | `modules/contenidos/infrastructure/mysql-contenido-repo.ts` | 18 | 49 | 0 | 0 | 6 | 36 | 0 |
| `EvaluacionService` | `modules/evaluacion/application/evaluacion-service.ts` | 1 | 6 | 0 | 0 | 8 | 10 | 0 |
| `DockerRunner` | `modules/evaluacion/infrastructure/docker-runner.ts` | 4 | 6 | 0 | 0 | 5 | 28 | 2 |
| `FakeRunner` | `modules/evaluacion/infrastructure/fake-runner.ts` | 2 | 2 | 0 | 0 | 2 | 5 | 1 |
| `MysqlIntentoRepo` | `modules/evaluacion/infrastructure/mysql-intento-repo.ts` | 1 | 6 | 0 | 0 | 2 | 9 | 0 |
| `PistaService` | `modules/pistas-ia/application/pista-service.ts` | 2 | 17 | 0 | 0 | 8 | 14 | 1 |
| `ClaudeHints` | `modules/pistas-ia/infrastructure/claude-hints.ts` | 1 | 4 | 0 | 0 | 4 | 9 | 0 |
| `FakeHintProvider` | `modules/pistas-ia/infrastructure/fake-hint-provider.ts` | 1 | 2 | 0 | 0 | 2 | 2 | 0 |
| `GeminiHints` | `modules/pistas-ia/infrastructure/gemini-hints.ts` | 1 | 4 | 0 | 0 | 4 | 9 | 0 |
| `MysqlPistaRepo` | `modules/pistas-ia/infrastructure/mysql-pista-repo.ts` | 5 | 9 | 0 | 0 | 3 | 10 | 0 |
| `ProcesadorEventos` | `modules/progreso/application/procesador-eventos.ts` | 5 | 6 | 0 | 0 | 2 | 15 | 4 |
| `ProgresoService` | `modules/progreso/application/progreso-service.ts` | 13 | 29 | 0 | 0 | 15 | 45 | 0 |
| `MysqlProgresoRepo` | `modules/progreso/infrastructure/mysql-progreso-repo.ts` | 7 | 10 | 0 | 0 | 3 | 23 | 0 |
| `ReporteService` | `modules/reportes/application/reporte-service.ts` | 4 | 7 | 0 | 0 | 8 | 21 | 2 |
| `MysqlReporteRepo` | `modules/reportes/infrastructure/mysql-reporte-repo.ts` | 3 | 10 | 0 | 0 | 4 | 14 | 0 |
| `AdminService` | `modules/usuarios/application/admin-service.ts` | 3 | 10 | 0 | 0 | 10 | 10 | 0 |
| `AuthService` | `modules/usuarios/application/auth-service.ts` | 3 | 11 | 0 | 0 | 10 | 14 | 0 |
| `MysqlUsuarioRepo` | `modules/usuarios/infrastructure/mysql-usuario-repo.ts` | 6 | 13 | 0 | 0 | 5 | 12 | 1 |
| `BcryptHasher` | `modules/usuarios/infrastructure/seguridad.ts` | 2 | 2 | 0 | 0 | 1 | 3 | 1 |
| `JwtTokens` | `modules/usuarios/infrastructure/seguridad.ts` | 2 | 6 | 0 | 0 | 2 | 7 | 0 |
| `AppError` | `shared/errors.ts` | 1 | 0 | 1 | 0 | 0 | 0 | 0 |

Promedios: WMC 4,5, CBO 5,0, RFC 14,8, LCOM 0,5. Las clases que implementan un puerto (`implements`) no heredan, por eso DIT y NOC son casi siempre 0: la arquitectura hexagonal favorece la composición sobre la herencia. Las reglas de negocio de los módulos de progreso y evaluación están en **funciones puras** (no en clases), por lo que no aparecen en esta tabla; su complejidad está en la sección 2.

## Interpretación

> **Pendiente (equipo):** interpretar estas cifras en el documento (11.2, 11.3, 11.5): umbrales usados, comparación con valores de referencia y acciones sobre las funciones con CC > 10.
