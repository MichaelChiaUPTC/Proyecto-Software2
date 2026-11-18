# Bitácora de cambios

Registro de todo lo que se agrega o cambia, fase por fase. Lo más reciente arriba.
Plan: [PLAN_DE_ACCION.md](PLAN_DE_ACCION.md) · Pendientes humanos: [TAREAS_MANUALES.md](TAREAS_MANUALES.md)

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
