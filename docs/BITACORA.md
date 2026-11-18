# Bitácora de cambios

Registro de todo lo que se agrega o cambia, fase por fase. Lo más reciente arriba.
Plan: [PLAN_DE_ACCION.md](PLAN_DE_ACCION.md) · Pendientes humanos: [TAREAS_MANUALES.md](TAREAS_MANUALES.md)

---

## 2026-11-18 — Fase 6: Métricas y documentación técnica ✅ (rama `feat/fase-6`)

**Qué se agregó**
- **Capturas nítidas para los manuales** (`docs/manual/img/`, 30 PNG): `e2e/manual/manual.spec.ts` con su propia configuración (`e2e/playwright.manual.config.ts`, `cd e2e && npm run manual`; no corre con `npx playwright test` ni en el CI). Escritorio 1440×900 a **escala 2** (imágenes de 2880 px de ancho; las de página completa, hasta 2880×3804), diálogos recortados al elemento (960×520 a 960×1056), tema claro, `animations: 'disabled'`, `reducedMotion`, espera de «sin esqueletos de carga ni peticiones pendientes» y de las fuentes. Móvil 390×844 a **escala 3** (1170×2532, 3 capturas: ingreso, inicio y editor de ejercicio). Las páginas largas se capturan agrandando la ventana al alto del documento (así la barra lateral ocupa toda la imagen). Datos: `e2e/manual/datos.ts` deja al estudiante demo con progreso (módulos 1 a 3 completos, el 4 casi, 6 insignias, un ejercicio «Persistente»), crea 6 alumnos de ejemplo (uno «requiere atención», uno sin actividad) y un módulo borrador «Cadenas de texto» con lección y ejercicio, todo por la API; los alumnos y el módulo se borran al terminar. El flujo fallo → ayuda → acierto se hace en vivo sobre «Par o impar», que queda libre para eso. **Al empezar borra la actividad del estudiante demo** para que sea repetible (documentado en la tarea J).
- **Manual de usuario** `docs/manual/manual-usuario.md`: introducción, requisitos, acceso (ingresar, crear cuenta, tema, cerrar sesión), guías por rol con pasos numerados y 30 capturas (estudiante: inicio, módulos, lección, ejercicios, retroalimentación, ayuda de IA, progreso, insignias, perfil; docente: panel, contenido, publicar, ordenar, editor con casos de prueba, reportes y CSV; administrador: usuarios, crear, rol, desactivar), preguntas frecuentes y solución de problemas. Los puntos que dependen de una persona están marcados con `> **Pendiente:**` (URL pública, canal de soporte, editor de texto de lecciones que no existe en la interfaz).
- **Manual de programador** `docs/manual/manual-programador.md` (9.7): visión general, arquitectura con 5 diagramas Mermaid (módulos, despliegue de desarrollo, secuencia del envío con outbox, MER), stack con versiones instaladas, estructura, instalación paso a paso (Docker, `.env`, migrate, seed, dev, modo demostración y API), tablas de variables de entorno (de `config.ts`, `.env.example` y `docker-compose.yml`), módulos con puertos y adaptadores, **referencia de los 38 endpoints** (rutas leídas de los routers con `node scripts/metricas.mjs --rutas`), base de datos y cómo crear una migración, motor de corrección, IA, eventos y n8n, seguridad, pruebas, convenciones, cómo extender (contenido, módulo del backend, lenguaje o tipo de ejercicio, proveedor de IA, pantalla), despliegue y solución de problemas (incluye la letra de unidad en Windows con Vitest).
- **PDF para el celular**: `scripts/manuales.mjs` (`npm run manuales`) convierte los .md con `marked` (devDependency nueva en el `package.json` raíz), dibuja Mermaid con mermaid 11.4.1 desde jsDelivr (si no hay internet quedan como código) e imprime con Playwright (A4, portada, índice, número de página; las guías por rol y las preguntas frecuentes empiezan en página nueva). Resultado: `manual-usuario.pdf` (32 páginas, 6,2 MB) y `manual-programador.pdf` (25 páginas, 0,6 MB). También acepta un .md extra: `npm run manuales -- ../diagramas.md`.
- **Métricas** `scripts/metricas.mjs` (`npm run metrics`) → `docs/evidencias/metricas.md`, con el compilador de TypeScript instalado (sin dependencias nuevas): LOC (código, comentarios y blancos) por carpeta de backend, frontend y e2e; complejidad ciclomática por función con promedio, máximo, distribución y top 10; cobertura leída de `coverage-summary.json`; insumos de puntos de función (38 endpoints clasificados en EI/EO/EQ, 11 tablas como ILF y 3 interfaces externas, cada uno con una complejidad y un peso IFPUG **propuestos** y columnas vacías «del equipo»); métricas CK (WMC, WMC por ΣCC, DIT, NOC, CBO, RFC y LCOM aproximados) de 22 clases del backend. Integrado en `scripts/evidencias.ps1` (paso `metricas`, omitible) y en `docs/evidencias/README.md`.
- **Diagramas** `docs/diagramas.md`: Fig. 1 (módulos), componentes, Fig. 6 (despliegue de desarrollo y de producción objetivo), secuencia del envío, Fig. 2 (MER con todos los atributos) y Fig. 4 (clases: puertos, servicios y adaptadores). Todos se dibujaron sin errores con mermaid 11.4.1.

**Resultados de las métricas** (equipo y fecha dentro de `metricas.md`)
| Métrica | Backend | Frontend |
|---|---|---|
| Archivos `.ts/.tsx` (con pruebas y seed/mocks) | 64 | 79 |
| Líneas de código (con pruebas, seed/mocks) | 4056 (de ellas 1540 de pruebas) | 5147 (464 de mocks) |
| Funciones medidas / CC promedio / CC máxima | 376 / 1,82 / 24 (`traducirError`) | 691 / 1,94 / 20 (`LoginPage`) |
| Funciones con CC > 10 | 4 (ESLint avisa 4) | 11 (ESLint avisa 12) |
| Cobertura de líneas (reportes de la Fase 5) | 93,83 % | 17,18 % |

Puntos de función sin ajustar con la propuesta: 263 (EI 65, EO 19, EQ 66, ILF 94, EIF 19). CK: WMC medio 4,5, CBO medio 5,0, RFC medio 14,8, LCOM medio 0,5, DIT 0 salvo `AppError` (1); las reglas de negocio de progreso y evaluación son funciones puras y no aparecen como clases.

**Verificado**
- Se abrieron con la herramienta de imágenes las capturas de inicio, ejercicio fallido con ayuda, ejercicio correcto, progreso, insignias, lección, contenido (con borrador), panel docente, reportes, editor de ejercicio, casos de prueba, modal de nuevo usuario, menú de tema, login con error y la de inicio móvil y la del editor móvil: nítidas, completas y sin estados de carga. Se rehicieron dos veces (barra lateral cortada en páginas largas y un error de selector en la captura de contenido). En los PDF se renderizaron páginas con pymupdf (portada, texto, captura, diagramas): las capturas se ven nítidas a 170 ppp; el diagrama de secuencia queda pequeño por ser ancho (es vectorial: se amplía).
- `npx tsc --noEmit` de `e2e/` sin errores (ahora incluye `manual/`). No se tocó código de backend ni de frontend, así que sus suites no se volvieron a correr (siguen como en la Fase 5: 152/152 y 56/56).

**Desviaciones y por verificar**
- La ayuda de IA de las capturas es «Pista del curso» (no hay proveedor configurado); el manual lo explica.
- Había un módulo de pruebas de fases anteriores en la base de desarrollo («Módulo adaptador 2», código 10, borrador). Borrarlo fue rechazado por el entorno, así que las capturas lo ocultan con una regla en la prueba y las cifras del panel docente (p. ej. «8 de 10 módulos») lo incluyen. Tarea en TAREAS_MANUALES (J).
- Las definiciones de CBO, RFC y LCOM son aproximaciones por análisis del código fuente; la complejidad ciclomática no coincide al 100 % con la regla `complexity` de ESLint (que cuenta además `?.` y valores por omisión).
- Los puntos de función son una **propuesta automática**: el equipo debe confirmar complejidad, pesos y factor de ajuste.
- Los PDF necesitan internet al generarse (Mermaid desde CDN). El manual de programador dice qué hay y qué no (por ejemplo, la columna `ejercicio.lenguaje` existe pero ningún código la usa; ni el soporte de otros lenguajes ni tipos de ejercicio distintos están implementados: solo se describe cómo hacerlos).
- La interfaz no tiene editor para el texto de las lecciones ni para marcar un caso de prueba como oculto; el manual de usuario lo advierte.

**Para la Fase 7**: el manual de programador (sección 16) y `docs/diagramas.md` describen el despliegue de producción como objetivo; hay que actualizarlos con lo realmente instalado (Nginx, TLS, backups) y completar el `> **Pendiente:**` de la URL pública.

---

## 2026-11-18 — Fase 5: Pruebas y evidencia (objetivo específico 5) ✅ (rama `feat/fase-5`)

**Qué se agregó**
- **Frontend, pruebas unitarias** (Vitest 5 + Testing Library + jsdom; scripts `test` y `test:coverage`; configuración en `vite.config.ts`, con `VITE_API_URL` fijada para ejercitar el modo API): 56 pruebas en 7 archivos. `services/http` (token, cabecera, errores → `ApiError(message)`, 401 y `USUARIO_INACTIVO` limpian la sesión, login con 401 no, red caída, 204, descarga, `restoreSession`), utilidades (`badges`, `format`, `highlight`, `evaluate`), `Modal` (foco atrapado, regresión del foco que saltaba al primer campo, devolución del foco) y `ExerciseFeedback` (botón de IA solo en modo API, carga, pista de IA/de respaldo, error). El CI ahora corre `npm test` del frontend.
- **E2E** `e2e/` (Playwright, solo Chromium; `webServer` levanta Vite en :5173 con `VITE_API_URL` contra la API de docker): `estudiante.spec.ts` (registro con validaciones y correo repetido, lección, intento fallido, pista con IA —respaldo del curso al no haber proveedor—, acierto, insignia «Primer paso», progreso, cierre de sesión, credenciales incorrectas), `docente.spec.ts` (panel, crear módulo, regla «sin lecciones no se publica», publicar/despublicar y visibilidad para el estudiante, reportes y **descarga del CSV verificada**: BOM, cabeceras, fila del estudiante), `admin.spec.ts` (crear usuario con validación, cambiar rol, desactivar con confirmación: no puede iniciar sesión y la sesión abierta se cierra; reactivar), más `accesibilidad.spec.ts` y `capturas.spec.ts`. Una guarda hace fallar cualquier prueba si la app escribe `console.error` o lanza una excepción. Datos aislados (`e2e-*@uptc.edu.co`, módulos `E2E …`, sufijo por ejecución) y limpieza con `e2e/cleanup.sql` al empezar y al terminar (no hay DELETE de usuarios en la API).
- **Capturas** (44 PNG, claro y oscuro, 4 recorridos: acceso, estudiante, docente, admin) en `docs/evidencias/capturas/`.
- **Accesibilidad**: axe-core 4.14.1 (wcag2a/2aa/21a/21aa) sobre 22 vistas/estados × 2 temas → `docs/evidencias/accesibilidad.md`. La primera pasada dio **62 violaciones (12 críticas, 50 serias) en 5 reglas** y se corrigieron todas; el reporte actual da 0. Una prueba final falla si reaparece alguna crítica o seria.
- **Carga** `perf/carga.js` (k6 en la imagen `grafana/k6`, sin instalar nada) y `perf/ejecutar-carga.ps1` (muestrea `docker stats` de api y mysql, genera `docs/evidencias/carga.md` con `perf/informe.mjs`; el script sale con código ≠ 0 si un umbral no se cumple). Escenarios: 60 VU navegando (`/me/home`, `/me/modules`, `/me/lessons/:id`), 30 envíos/min (llegada constante, repartidos entre 150 estudiantes registrados en `setup()` para respetar el límite de 10/min por usuario) y 5 docentes en `/teacher/dashboard`. Con 150 estudiantes cargados se mide lo que la Fase 4 dejó pendiente (el `GROUP BY` del panel).
- **Estáticas y cobertura**: `scripts/informes.mjs` (`estaticas`, `cobertura`, `e2e`) genera `estaticas.md`, `cobertura.md` y `e2e.md`. Backend: `@vitest/coverage-v8` y `test:coverage`.
- `scripts/evidencias.ps1` (y `npm run evidence` en un `package.json` raíz mínimo) regenera todo, levantando docker compose y el seed si hacen falta; `-Omitir` salta pasos. `docs/evidencias/README.md` mapea cada reporte con las secciones 10.1, 10.3, 10.4, 10.5, RNF-03, RNF-07 y 8.1.2.
- **CI**: el job `frontend` corre las pruebas; nuevo job `e2e` (docker compose + seed + Playwright, sube informe, capturas y accesibilidad como artefacto).

**Resultados reales de esta máquina** (detalle y equipo en `docs/evidencias/*.md`)
| Suite | Resultado |
|---|---|
| Backend (Vitest, MySQL y Docker reales) | 152 de 152; cobertura de líneas 93,83 %, ramas 86,90 % |
| Frontend (Vitest) | 56 de 56; cobertura de líneas 17,18 % (las páginas solo las cubre el E2E) |
| E2E Playwright | 27 de 27 (10 de recorridos, 8 de capturas, 9 de axe), 2,9 min |
| axe | 0 violaciones (62 críticas/serias antes de corregir) |
| `npm audit --omit=dev` | 0 vulnerabilidades en backend y en frontend |
| ESLint / `tsc` | 0 errores; 4 avisos `complexity` en backend, 12 en frontend |
| k6 (3 min, 60 VU + 30 envíos/min + 5 docentes) | p95 envío 965 ms (umbral 3 s); p95 lectura 13,3 ms (umbral 500 ms); `/teacher/dashboard` p95 26,4 ms; errores 0,00 % de 6019 peticiones; API: CPU media 32 %, máx. 349 % (arranque con bcrypt), memoria máx. 196 MiB; MySQL: CPU media 8 %, 536 MiB |

**Bugs reales hallados por las pruebas y corregidos** (commits aparte)
1. Modo demostración: la regla de «Cuadrado de un número» exigía `print(` y la solución correcta (`return x ** 2`) nunca aprobaba (lo detectó la prueba unitaria de `evaluate`). Ahora comprueba que NO aparezca `print(`.
2. Claves duplicadas en la ruta de aprendizaje con ids numéricos (lección 1 y ejercicio 1 compartían clave; aviso de React que podía omitir filas): lo detectó la guarda de `console.error` del E2E.
3. Accesibilidad (RNF-07): `aria-controls` hacia paneles inexistentes en `Tabs`, nombre accesible del logo que no contenía el texto visible, `dl/dt/dd` mal formados en Módulos y Panel docente, y contraste de los comentarios de código en tema claro (4,3:1 → `#5a6a6e`).

**Desviaciones y por verificar**
- La carga se midió con cliente, API, MySQL y corrector en el mismo PC (Docker Desktop, VM de 12 CPU y 3,5 GiB): no es una medición de producción; repetir en la VM (Fase 7). La CPU máxima de la API es el arranque (150 registros con bcrypt 12), la mediana fue 14 %.
- El frontend tiene poca cobertura unitaria (17 %) a propósito del alcance pedido (utilidades, `http.ts` y 2 componentes clave); las pantallas y `api.http.ts` están cubiertas por el E2E pero no cuentan en esta métrica. Candidato a mejorar: pruebas de `api.http.ts` con `fetch` simulado.
- La pista «de la IA» se probó solo con el respaldo (sin clave de proveedor); el E2E acepta ambas fuentes.
- axe no sustituye la revisión manual con lector de pantalla ni la prueba de usabilidad (ver TAREAS_MANUALES, sección I). Los workflows de n8n siguen sin probarse en un n8n real.
- El E2E necesita el puerto 5173 libre y la API en `localhost:3000`; limpia con `docker compose exec mysql`.
- `frontend/tsconfig.tsbuildinfo` sigue versionado y `tsc -b` lo modifica: no se incluyó en los commits.

**Para la Fase 6**: `docs/evidencias/estaticas.md` ya lista las funciones con complejidad > 10 y `cobertura.md` trae la cobertura por carpeta (insumos de `metricas.md`, 11.5); las capturas sirven para `manual-usuario.md`; los datos de carga alimentan 8.1.2/RNF-03.

---

## 2026-11-18 — Fase 4: Reportes y conexión del frontend (RF-06) ✅ (rama `feat/fase-4`)

**Qué se agregó**
- **Backend, módulo `reportes`** (domain / application / infrastructure). Un solo cálculo, con las reglas de progreso del estudiante (`stats`, `findTarget`), a partir de consultas agregadas en SQL (no se cargan los intentos uno a uno). Solo estudiantes **activos**; un desactivado sale de los reportes.
  - `GET /api/teacher/dashboard` (docente/admin): `{rows, active, total, attention, published, modulesTotal, lessonsPublished, exercisesPublished, avg, perModule: [{module, students}], recent}` (la forma de `api.teacher.dashboard()`).
  - `GET /api/teacher/reports[?group=]`: `{students: StudentRow[]}`. `group=Sin grupo` devuelve los de `grupo IS NULL`. `StudentRow` lleva además `attempts` (intentos enviados).
  - `GET /api/teacher/reports.csv[?group=]`: UTF-8 con BOM, CRLF, todo entre comillas, cabeceras en español (`Estudiante, Correo, Grupo, Progreso (%), Ejercicios resueltos, Total ejercicios, Éxito (%), Última actividad, Módulo actual`); los valores que empiezan por `= + - @` se neutralizan con una comilla simple (inyección de fórmulas). `Content-Disposition: attachment; filename="reporte-avance.csv"`.
  - Definiciones: `lastActivity` = último intento o lección completada (si no hay, la fecha de registro); `currentModule` = `"05 · Título"` del módulo de la meta actual, o `Curso completado`; requiere atención = 7 días o más sin actividad, o éxito < 40 % **con al menos un intento** (un estudiante nuevo no se marca por tener 0 %).
- **Backend, huecos de la Fase 3** (todos solo estudiante), para que el frontend no haga N peticiones: `GET /api/me/modules` (módulos con `pct/status`), `GET /api/me/exercises` (ejercicios, vista del estudiante, con `module`, `solved`, `attempts`), `GET /api/me/lessons/:id` (= `api.catalog.lesson`: lección con bloques, módulo, `done`, `position`, `total`, `prev`, `next`) y `GET /api/me/exercises/:id` (= `api.catalog.exercise`: ejercicio sin solución ni casos ocultos, módulo, lección, `next`, `solved`, `attempts`, `history`). `ProgresoService` ahora recibe también el repo de contenidos.
- **Frontend**: `services/api.ts` pasa a `api.mock.ts` (`mockApi`, sin cambios de comportamiento); `api.http.ts` implementa el mismo tipo `Api` con `fetch`; `api.ts` exporta `api` e `isApiMode` según `VITE_API_URL`. `services/http.ts`: token en `sessionStorage` (con try/catch) junto al usuario, cabecera `Authorization`, errores `{error:{code,message}}` → `ApiError(message)`, 401 o `USUARIO_INACTIVO` → limpia la sesión (`AppLayout` redirige a /login). Ids numéricos → string en el borde (`ids()`), sin tocar páginas. `revisionStore` hace que `useQuery` refresque tras una escritura en modo API.
- Rol `admin` (tipos, `navByRole`, `mobileNav`, rutas `/admin`, `homeFor`/`roleLabel`) y `pages/admin/AdminUsersPage.tsx` (buscar, filtrar, crear, cambiar rol, desactivar con confirmación / activar; no puede tocar su propia cuenta).
- `LoginPage`: pestañas «Ingresar / Crear cuenta» solo en modo API (nombre, correo @uptc.edu.co, contraseña ≥ 8, confirmación).
- `ExerciseFeedback`/`ExercisePage`: tras un intento fallido, en modo API, botón «Pedir ayuda a la IA» → `POST /exercises/:id/ai-hint`; muestra la pista con insignia «Pista de la IA» o «Pista del curso» (respaldo), estado de carga y errores (429 límite diario, 422 sin intento fallido, red).
- `ReportsPage`: «Exportar CSV» usa `api.teacher.exportCsv(group)`: descarga el CSV del backend, o lo genera en el cliente en modo demo.
- `Modal`: el foco ya no vuelve al primer campo en cada tecla (el efecto dependía de `onClose`, que cambia en cada render).
- `ContentPage`/`ExerciseEditorPage`: los errores del servidor (p. ej. publicar sin casos de prueba) se muestran en vez de ignorarse.
- `frontend/.env.example` (`VITE_API_URL=http://localhost:3000/api`; el puerto real es `API_PORT`, 3000). CORS: ya aceptaba `http://localhost:5173` (`CORS_ORIGIN`); se comprobó el preflight con `Authorization`.
- **n8n**: servicio `n8n` en `docker-compose.yml` bajo el perfil `automatizacion` (volumen `uptc_n8n_data`, red de compose, `depends_on` MySQL; puerto `N8N_PORT`, 5678), `n8n/insignia-obtenida.json`, `n8n/resumen-semanal.json` y `n8n/README.md`. Pasos manuales en `docs/TAREAS_MANUALES.md` (sección H).

**Cómo correr el frontend contra el backend**: `docker compose up -d --build` (raíz), `cd backend && npm run seed`, `cd frontend && cp .env.example .env.local && npm run dev` (http://localhost:5173). Sin `.env.local` sigue el modo demostración. Detalle en `frontend/README.md`. Cuentas del seed: `estudiante@`, `docente@`, `admin@uptc.edu.co` / `Demo1234`.

**Cómo verificar**
- Backend: `cd backend && npm test && npm run lint && npm run typecheck && npm run build` (152 pruebas, antes 133; nuevas: 19 en `reportes.test.ts` y `catalogo-estudiante.test.ts`).
- Frontend: `npm run lint` (0 errores; las advertencias son de la regla `complexity`), `npm run typecheck`, `npm run build` sin y con `VITE_API_URL`.
- Recorrido real contra la API en Docker (script de Node con `fetch`, no versionado): registro → módulos con `pct/status` → lección → completar → ejercicio fallido → pista (422 sin intento; con intento, respaldo) → acierto (+10 puntos, insignia «Primer paso») → progreso e insignias → docente: dashboard, reporte con la fila del estudiante, CSV con cabeceras → admin desactiva → el estudiante recibe 403 `USUARIO_INACTIVO` en cualquier ruta y no puede iniciar sesión → desaparece del reporte → reactivar.
- La capa `api.http.ts` completa (auth, catálogo, estudiante, envíos, docente con alta/edición/publicación/orden, admin, 401 que limpia la sesión) se ejecutó contra esa misma API cargándola con el servidor de Vite en Node (sin navegador).

**Desviaciones y por verificar**
- **No se probó la interfaz en un navegador**: la extensión de Chrome no estaba conectada. Lo verificado de la UI es compilación, lint, tipos y el uso real de `api.http.ts` contra el backend; falta pasar el recorrido a mano (tarea en TAREAS_MANUALES) o con Playwright en la Fase 5.
- Los workflows de n8n no se importaron en una instancia de n8n (no se descargó la imagen); sí se ejecutaron sus consultas SQL contra el MySQL del proyecto. Los `typeVersion` (`scheduleTrigger 1.2`, `mySql 2.4`, `emailSend 2.1`, `code 2`) son los de n8n 1.x reciente.
- El CSV exportado respeta solo el filtro de **grupo**; la búsqueda por texto y el filtro de estado únicamente filtran la tabla en pantalla. Separador `,`: Excel en español puede abrirlo en una columna (ver TAREAS_MANUALES).
- `api.http.ts` completa con valores vacíos lo que la vista del estudiante no trae (`expectedAnswer`, `rules`) y `published: true` en los módulos del progreso (solo hay publicados); hay `as never` en esos bordes.
- Docente: no se puede cambiar de lección un ejercicio existente (el `PUT` del backend no lo mueve). Un módulo nuevo toma como código su posición (`09`).
- `lastActivity` de un estudiante sin actividad es su fecha de registro; el registro no asigna `grupo` (queda «Sin grupo») y no hay pantalla para editarlo.
- `UserMenu`: en modo API se oculta «Restablecer datos de demostración».
- Se agregó `.env.local` al `.gitignore`.

**Pendientes para la Fase 5**: E2E con Playwright del recorrido completo en los 3 roles (incluye lo no probado en navegador: pestaña «Crear cuenta», botón de IA, descarga del CSV, pantalla de admin); axe en las vistas nuevas (admin, login con registro, retroalimentación con IA); k6 sobre `/teacher/dashboard` y `/me/*` (el dashboard agrega todos los intentos con `GROUP BY` en cada petición: bien para un curso, medir con 150 usuarios); pruebas del frontend con Testing Library para `http.ts` (401, errores, token); probar los workflows en un n8n real con un SMTP de prueba.

---

## 2026-11-18 — Fase 3b: Pistas con IA (backend) ✅ (rama `feat/fase-3b`)

**Qué se agregó**
- Módulo `backend/src/modules/pistas-ia/` (hexagonal). Puerto `HintProvider.hint(contexto) → string`; adaptadores con `fetch` nativo: `GeminiHints` (Google AI Studio, `POST .../v1beta/models/{modelo}:generateContent`, cabecera `x-goog-api-key`, `systemInstruction` + `contents` + `generationConfig`), `ClaudeHints` (Messages API, `x-api-key`, `anthropic-version: 2023-06-01`) y `FakeHintProvider` para pruebas. `AI_PROVIDER=gemini|claude|none` (por omisión `none`); sin clave se comporta como `none` y no se llama a nada.
- Migración `005_pista_ia.sql`: tabla `pista_ia (id_pista, id_intento UNIQUE, id_usuario, texto, fuente 'ai'|'fallback', fecha)` con borrado en cascada desde `intento`/`usuario`. Sirve de auditoría y para contar límites.
- Sistema (prompt): tutor de programación para principiantes, en español, orientar sin dar el código de la solución ni la línea corregida, sin bloques de código, máximo 3 frases.

**Endpoint para la Fase 4 (botón "Pedir ayuda a la IA")**
`POST /api/exercises/:id/ai-hint` — token de estudiante, **sin cuerpo** (se usa el último intento fallido guardado en la BD).
- 200 `{ "hint": string, "source": "ai" | "fallback" }`. `fallback` = pista fija del ejercicio (las `hints`, en orden según cuántas pistas ha pedido ya el usuario en ese ejercicio; si se agotan, repite la última; si el ejercicio no tiene, mensaje genérico). Se usa cuando no hay proveedor, hay timeout (8 s, `AI_TIMEOUT_MS`), error HTTP, respuesta vacía o con bloque de código.
- Pedirla otra vez sobre el mismo intento fallido devuelve la misma pista guardada (200, sin llamar a la IA). Un nuevo envío fallido permite una nueva.
- 422 `SIN_INTENTO_FALLIDO` si el usuario no tiene ningún intento fallido en ese ejercicio.
- 429 `LIMITE_PISTAS_IA` con 10 pistas de IA (`source: 'ai'`) en el día (las de respaldo no cuentan; el día es el del servidor MySQL).
- 404 ejercicio inexistente o no publicado; 401/403 sin sesión o rol distinto de estudiante. Errores con la forma `{ error: { code, message } }`.

**Privacidad (8.2.2)**: al modelo solo llegan enunciado, código del intento y del primer caso fallido: entrada, esperado, obtenido y error (entrada/esperado/obtenido recortados a 500 caracteres). Si ese caso es oculto solo se envía "falló un caso oculto" y el tipo/mensaje del error. Nunca se envía la solución (`expectedAnswer`), las reglas, ni nombre, correo o id del usuario. El contexto lo arma el servidor desde la BD; el cliente no puede mandar texto. En los logs solo se escribe el mensaje de error del proveedor.

**Cómo activar**: en `.env` (raíz, lo lee docker compose) o `backend/.env`: `AI_PROVIDER=gemini` y `GEMINI_API_KEY=...` (opcional `GEMINI_MODEL`), o `AI_PROVIDER=claude`, `ANTHROPIC_API_KEY=...`, `ANTHROPIC_MODEL` (por omisión `claude-haiku-5-5`). Después `docker compose up -d --build api`.

**Pruebas**: `test/pistas-ia.test.ts` (12): 401/403/404, 422, límite diario 429, una pista por intento, último intento desde la BD, privacidad (caso oculto, sin solución, sin datos personales), pistas fijas en orden, respaldo por error/vacío/bloque de código; adaptadores con `fetch` simulado (formato de la petición, error HTTP, timeout). No se llama a ninguna API real.

**Desviaciones y por verificar**
- **Verificar**: modelo Gemini por omisión `gemini-3.6-flash`, tomado del listado de modelos estables de https://aistudio.google.com/docs/models (también figuran `gemini-3.8-flash` y `gemini-3.5-flash-lite`); el formato de la petición `generateContent` se tomó de lo conocido de la API v1beta, no se pudo contrastar en esa página. No se probó con claves reales: al poner la clave, probar una pista y ajustar `GEMINI_MODEL` si responde 404.
- Las pistas de respaldo también se guardan en `pista_ia` (para que repetir el pedido sobre el mismo intento sea idempotente); no cuentan para el límite diario.
- Dos peticiones simultáneas sobre el mismo intento pueden llamar dos veces a la IA; solo se guarda una (clave única).
- `AI_TIMEOUT_MS` (8000) es configurable; el timeout vive en los adaptadores (`AbortSignal.timeout`).

---

## 2026-11-18 — Fase 3: Ejercicios, corrección, progreso y gamificación (RF-03, RF-04, RF-05, RNF-03, RNF-08) ✅ (rama `feat/fase-3`)

**Qué se agregó**
- Módulo `evaluacion` (`backend/src/modules/evaluacion/`): puerto `CodeRunner`, adaptador `DockerRunner` y `FakeRunner` para pruebas. Un `docker run --rm -i` por envío con `--network none --memory 128m --memory-swap 128m --cpus 0.5 --pids-limit 64 --read-only --tmpfs /tmp:size=8m --user 65534 --cap-drop ALL --security-opt no-new-privileges python:3.12-alpine python -`. Se lanza con `spawn` y un array de argumentos; el código y los casos viajan por stdin dentro de un arnés Python (payload en base64), nunca en la línea de comandos.
- El arnés ejecuta el código del estudiante una vez, evalúa la `entrada` de cada caso aislando las excepciones por caso y captura stdout (tope de 20 000 caracteres). Cada resultado sale como línea `<nonce><json>`; el nonce (128 bits) lo genera el servidor por envío, así que un `print` del estudiante no puede falsificar un veredicto. Se compara `repr(valor)` con la salida esperada (también acepta la forma `"texto"` con comillas dobles) o, si la función no devuelve nada, lo impreso.
- Timeout total de 3 s: `docker kill` por nombre aleatorio (se repite cada 500 ms) y `docker rm -f`; los casos sin resultado quedan `timedOut`. Tope de 1 MB leído del contenedor (si lo supera se mata). Máximo de 4 contenedores simultáneos (`RUNNER_MAX_CONCURRENT`); el resto espera en cola. Código limitado a 20 KB. Todo configurable por env (`RUNNER_*`, ver `backend/.env.example`).
- Veredicto (`domain/veredicto.ts`): misma forma que `Evaluation`/`SubmitResult` del frontend. `testsTotal` cuenta todos los casos; `failedTests` son índices dentro de la lista de casos **visibles** (la que recibe el estudiante). Un caso visible fallido muestra esperado y obtenido; si solo fallan ocultos, mensaje genérico sin entrada ni salida. Los errores reales de Python (SyntaxError, IndentationError, NameError, TypeError, ZeroDivisionError, IndexError, EOFError…) se traducen a español con la línea. `syntaxProblem` de `evaluate.ts` (falta `:`, comillas, paréntesis, indentación) se portó y se usa para el mensaje didáctico cuando Python reporta un SyntaxError.
- `POST /api/exercises/:id/submissions` (solo rol estudiante, 10 envíos/min por usuario → 429 `DEMASIADOS_ENVIOS`). Guarda el `intento` (código, resultado, mensaje, pistas usadas y `detalle` JSON con los casos fallidos para la Fase 3b; el detalle nunca se envía al estudiante).
- Módulo `progreso`: reglas de insignias y puntos portadas de `frontend/src/utils/badges.ts` (dominio puro, probado sin BD). Los puntos **no se guardan**: se derivan (10/20/30 por ejercicio resuelto según dificultad + 5 por lección completada).
- Outbox: al aprobar por primera vez, `intento` + evento `IntentoAprobado` se escriben en la misma transacción; al completar una lección, `leccion_completada` + `LeccionCompletada`. `ProcesadorEventos` (en el mismo proceso) se invoca justo después del commit, al arrancar y cada `OUTBOX_INTERVAL_MS` (30 s) como respaldo. Toma cada evento con `SELECT … FOR UPDATE SKIP LOCKED`, calcula las insignias nuevas, las inserta con `INSERT IGNORE` y emite `InsigniaObtenida` (con `origen` = id del evento) en la misma transacción; después marca `procesado`. Es idempotente. Los eventos `InsigniaObtenida` quedan con `procesado = NULL` a propósito: los consumirá n8n en la Fase 4 (el procesador interno solo toma `IntentoAprobado` y `LeccionCompletada`).
- Migraciones: `003_progreso_gamificacion.sql` (`intento.pistas_usadas`, tabla `leccion_completada`) y `004_intento_detalle.sql` (`intento.detalle`). `v_progreso` sigue siendo correcta (no usa las columnas nuevas); hay una prueba que la consulta.
- Insignias: las definiciones viven ahora en el backend (`progreso/domain/insignias.ts`); se sincronizan con la tabla `insignia` al procesar eventos y el seed las importa de ahí (ya no del frontend). `decisiones` y `bucle` se identifican por el código del módulo (`05`, `06`).
- docker-compose: `api` instala `docker-cli` (Dockerfile), monta `/var/run/docker.sock` y usa `group_add: DOCKER_GID` (0 en Docker Desktop; en Linux, el GID del grupo docker). La imagen `python:3.12-alpine` debe estar descargada en el host.
- CI: se agrega `docker pull python:3.12-alpine` antes de `npm test`, así las pruebas del runner real corren en ubuntu-latest.

**Endpoints** (todos requieren token de estudiante)
| Método | Ruta | Respuesta |
|---|---|---|
| POST | `/api/exercises/:id/submissions` `{code, hintsUsed}` | `SubmitResult`: `passed, title, message, concept?, line?, testsPassed, testsTotal, failedTests, newBadges (nombres), pointsGained` |
| GET | `/api/exercises/:id/attempts` | `{solved, attempts, history: Attempt[], next}` (lo de `api.catalog.exercise`) |
| POST | `/api/lessons/:id/complete` | `{next: PathItem o null, newBadges: string[]}` |
| GET | `/api/me/progress` | como `api.student.progress()` |
| GET | `/api/me/badges` | `{badges: BadgeView[]}` |
| GET | `/api/me/activity?limit=` (1 a 50, por omisión 8) | `{activity: ActivityItem[]}` |
| GET | `/api/me/home` | como `api.student.home()` |
| GET | `/api/me/profile` | como `api.student.profile()` |
| GET | `/api/me/modules/:id` | `{module, lessons, exercises, pct, status, path}` (la parte de progreso de `api.catalog.moduleDetail`) |

**Cómo verificar**: `docker pull python:3.12-alpine`, `docker compose up -d mysql`, `cd backend && npm test && npm run lint && npm run typecheck && npm run build` (`SKIP_DOCKER_TESTS=1 npm test` salta las 18 pruebas con Docker real). Con la API en Docker (`docker compose up -d --build api`): login como `estudiante@uptc.edu.co`, `GET /api/exercises` para ver ids y `POST /api/exercises/<id>/submissions` con `{"code":"def cuadrado(x):\n    return x ** 2"}` (ejercicio "Cuadrado de un número") → `passed: true, pointsGained: 10, newBadges: ["Primer paso", …]`; con código sin `:` → mensaje en español con la línea.

**Pruebas**: 121 en total (antes 53), todas verdes (103 sin Docker + 18 con Docker real). Nuevas: dominio (veredicto, mensajes, reglas de insignias, puntos, interpretación de la salida del contenedor); integración con Supertest y `FakeRunner` (envío, rate limit, eventos, idempotencia del procesador, respaldo ante evento pendiente, lecciones, progreso, home, perfil, `v_progreso`); y DockerRunner real: solución correcta pasa; `while True: pass` se corta en ~3,1 s; sin red (conexión directa y `urlopen`); un `print` imitando el delimitador no cambia el veredicto; 500 MB de memoria falla; escribir en `/` falla; corre como uid 65534; salida enorme; bomba de `fork`; `input()` no cuelga; y **las 21 soluciones del seed pasan todos sus casos y ningún código inicial pasa** (valida el formato de casos del seed contra el motor real).

**Medición RNF-03** (corrección de un ejercicio simple, `suma(a, b)` con 3 casos, Docker Desktop en Windows, envíos secuenciales por el endpoint, n = 20): mín 687 ms, p50 767 ms, **p95 859 ms**, máx 898 ms. Por curl contra el contenedor `api` (que lanza el contenedor hermano por el socket): 683 a 780 ms. Un ciclo infinito responde en ~3,16 s. Pendiente la medición con carga concurrente (k6, Fase 5): con `RUNNER_MAX_CONCURRENT=4` y ~0,7 s por envío caben unos 340 envíos/min, contra los 30/min del requisito.

**Desviaciones y decisiones**
- Las `reglas` (patrones) del contenido **no** se usan en los mensajes: algunas del seed están al revés (p. ej. "Cuadrado de un número" exige que aparezca `print(`) y daban pistas engañosas. Los campos quedan disponibles para la Fase 3b. Anotado en TAREAS_MANUALES.
- `syntaxProblem` solo se aplica cuando Python realmente reporta un SyntaxError (no antes de ejecutar): aplicarlo antes daba falsos positivos con código válido (comillas dentro de comentarios, etc.).
- Corregidos dos casos de prueba imposibles en el mock del frontend (`tabla`: `[3, 6, 9, ..., 30]` pasa a la lista completa). Es un cambio de datos en `frontend/src/mocks/exercises.ts`; hay que volver a correr `npm run seed`.
- Una función que **imprime** en vez de devolver aprueba si lo impreso coincide con la salida esperada (el arnés no lo distingue). Pendiente de decisión del docente.
- Las respuestas llevan ids numéricos y `newBadges` son nombres (como el `api.ts` del mock), no códigos.
- `home.nextExercise.exercise` trae solo `{id, moduleId, lessonId, order, title, goal, difficulty}` (lo que usa la pantalla), no el ejercicio completo. `PathItem.meta` y `to` replican el mock (`/lecciones/:id`, `/ejercicios/:id`).
- Endpoints extra para que la Fase 4 solo cambie el transporte: `GET /exercises/:id/attempts` y `GET /me/modules/:id`. **Sin cubrir** (pendiente Fase 4): `api.catalog.modules()` con `pct/status` por módulo (sale de `/me/progress`), `api.catalog.exercises()` con `solved/attempts` por ejercicio y `prev/next` de una lección (derivables de `/me/modules/:id`).
- Los endpoints de envío y `/me/*` son solo para el rol estudiante (docente y admin reciben 403) para no mezclar sus pruebas con los reportes.
- Si el procesador de eventos falla después del commit, el envío igual responde 200 (sin `newBadges`) y el respaldo periódico completa las insignias.
- `newBadges` se calcula con una marca (último `InsigniaObtenida` del usuario antes del envío), así que incluye insignias de eventos atrasados del mismo usuario.

**Riesgos**
- **Acceso al socket de Docker = control del host.** Quien comprometa el proceso de la API podría lanzar contenedores privilegiados y escapar a la máquina. Mitigaciones aplicadas: el código del estudiante nunca llega a la línea de comandos, la API corre como usuario `node` (no root), y los contenedores del estudiante no tienen red, capacidades ni escritura. Recomendadas para producción (Fase 7): (1) ejecutar los envíos en un host o VM separado (`DOCKER_HOST=tcp://…` por red privada con TLS, o `ssh://`); (2) poner delante un proxy del socket (p. ej. `tecnativa/docker-socket-proxy`) que solo permita crear, iniciar, matar y borrar contenedores y consultar imágenes; (3) Docker rootless o un runtime con aislamiento extra (gVisor o Sysbox); (4) el adaptador Judge0 del plan como alternativa detrás del mismo puerto `CodeRunner`.
- El arnés corre en el mismo proceso Python que el código del estudiante: quien recorra la memoria del proceso podría ver el nonce y falsificar **su propio** veredicto. No afecta a otros usuarios ni al host; se acepta para el alcance del curso. Un proceso padre que ejecute cada caso en un hijo lo cerraría.
- Sin red, la resolución DNS de Python tarda 5 s (musl), así que un `urlopen` por nombre termina como "tiempo agotado" y no como error inmediato; el efecto es el mismo (no hay red).
- El arranque del contenedor ronda 0,6 a 0,7 s en Docker Desktop. Si Docker no responde, el envío devuelve 503 `EJECUTOR_NO_DISPONIBLE` y no se guarda el intento.
- El módulo `progreso` carga todos los intentos del usuario en cada consulta: correcto para el volumen del curso; habría que paginar o agregar en SQL si crece mucho.

**Para la Fase 3b**: el `detalle` del intento (columna JSON) guarda por caso fallido `{indice, oculto, entrada, esperado, actual, error, timedOut}`; `EvaluacionService.enviar` también lo devuelve como `fallos`. El endpoint de IA puede leer el último intento del usuario y mandar a la IA solo enunciado, código y el caso fallido visible (no revelar el esperado de los ocultos). **Para la Fase 4**: ver "Sin cubrir" arriba, y que n8n lea `evento_outbox` (`InsigniaObtenida` con `procesado IS NULL`) y los marque.

---

## 2026-11-18 — Fase 2: Contenidos (RF-02) ✅ (rama `feat/fase-2`)

**Qué se agregó**
- Módulo `backend/src/modules/contenidos/` (domain / application / infrastructure, mismo estilo que `usuarios`). Sin migraciones nuevas.
- Los objetos devueltos usan los nombres de `frontend/src/types/index.ts` (camelCase, dificultad `basic|medium|advanced`, ids numéricos) para facilitar la Fase 4.
- Estudiante (requiere token, solo publicado; lecciones y ejercicios exigen también su módulo publicado, y los ejercicios además su lección): `GET /api/modules`, `GET /api/modules/:id` (módulo + lecciones + ejercicios ordenados), `GET /api/lessons/:id`, `GET /api/exercises` (filtros `?moduleId=&lessonId=`), `GET /api/exercises/:id`. Nunca se devuelven `expectedAnswer`, `rules` ni casos ocultos (`tests` trae solo los visibles, sin el campo `hidden`).
- Docente/admin bajo `/api/teacher/content`: `GET` (todo, con borradores, solución y casos ocultos), `POST|PUT .../modules`, `.../lessons` (bloques JSON; el POST lleva `moduleId`), `.../exercises` (el POST lleva `lessonId`; el PUT reemplaza el set completo de casos), `POST .../:kind/:id/publish` (alterna) y `POST .../:kind/:id/move` con `{dir: -1|1}`. `kind` es `modules|lessons|exercises`. El move devuelve el listado completo actualizado.
- Reglas: ejercicio sin caso de prueba no se publica (422 `EJERCICIO_SIN_CASOS`), y uno publicado no puede quedarse sin casos al editarlo; módulo sin lecciones no se publica (422 `MODULO_SIN_LECCIONES`). Código de módulo duplicado: 409.
- Validación zod con límites de longitud (bloques ≤200, casos ≤50, textos ≤5000, patrón de reglas debe ser regex válida).
- Mover intercambia el orden con el vecino del grupo en una transacción (usa un orden temporal por la clave única `(grupo, orden)`); en el extremo no hace nada.
- 21 pruebas nuevas (`backend/test/contenidos.test.ts`): 53 en total, todas verdes.

**Cómo verificar**: `cd backend && npm test && npm run lint && npm run typecheck && npm run build`. Con la API en Docker: login como estudiante demo y `GET /api/modules` devuelve los 8 módulos del seed.

**Desviaciones**
- No hay `DELETE` (no estaba en el alcance; `intento` referencia ejercicios sin cascada). Pendiente si el docente lo exige.
- `published` no se cambia en POST/PUT: solo con `publish`. El contenido nuevo siempre nace como borrador.
- Orden de creación: al final del grupo (`MAX(orden)+1`); dos creaciones simultáneas podrían chocar con la clave única (no relevante con pocos docentes).
- Las `hints` (pistas) sí se devuelven al estudiante; la Fase 3/4 decide cómo mostrarlas de forma progresiva.

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
