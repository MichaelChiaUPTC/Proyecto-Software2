# Evidencias de pruebas y métricas (Fases 5 y 6)

Todos los reportes se generan con datos reales de la máquina que los ejecuta (cada uno lleva fecha y equipo). Para regenerarlos todos:

```powershell
npm run evidence          # raíz del repo; equivale a: powershell -File scripts/evidencias.ps1
# Parcial: powershell -File scripts/evidencias.ps1 -Omitir carga,e2e   (también: cobertura, estaticas, metricas)
```

Requiere Docker Desktop y Node 24 (levanta `docker compose` y carga el seed si hace falta). k6 corre en la imagen `grafana/k6`, no se instala nada.

| Reporte | Qué es | Sección del documento IW | Cómo se genera |
|---|---|---|---|
| [`cobertura.md`](cobertura.md) | Pruebas unitarias y de integración (API + MySQL real, DockerRunner real, frontend con jsdom): número de pruebas por archivo y cobertura por carpeta | **10.1** (pruebas de BD e integración) y **10.3** (dinámicas) | `node scripts/informes.mjs cobertura` |
| [`estaticas.md`](estaticas.md) | ESLint (incluye complejidad ciclomática), `tsc` estricto y `npm audit --omit=dev` de backend y frontend | **10.3** (pruebas estáticas), insumo de **11.5** | `node scripts/informes.mjs estaticas` |
| [`metricas.md`](metricas.md) | Líneas de código por carpeta, complejidad ciclomática por función, cobertura, insumos de puntos de función (endpoints, tablas, interfaces) y métricas CK de las clases del backend | **11.2**, **11.3**, **11.5** | `node scripts/metricas.mjs` (o `npm run metrics`) |
| [`e2e.md`](e2e.md) | Resultado de los recorridos Playwright de los 3 roles (registro, ejercicio con pista de IA, insignia, publicar contenido, reportes y CSV, administración de usuarios) | **10.5** (pruebas modernas: E2E) y **10.4** (reporte de ejecución) | `cd e2e && npx playwright test` + `node scripts/informes.mjs e2e` |
| [`accesibilidad.md`](accesibilidad.md) | axe-core WCAG 2.1 A/AA sobre login, estudiante, docente y admin, en tema claro y oscuro; violaciones encontradas y corregidas | **RNF-07**, **10.5** | `cd e2e && npm run test:a11y` |
| [`carga.md`](carga.md) | k6: 60 usuarios concurrentes, 30 envíos/min, 5 docentes; p95, errores y consumo de CPU/memoria | **RNF-03** y **8.1.2** | `powershell -File perf/ejecutar-carga.ps1` |
| [`capturas/`](capturas/) | Capturas de las pantallas principales de los 3 roles (claro y oscuro), con datos reales (1366×800, evidencia de pruebas) | **10.4** (evidencia) | `cd e2e && npm run test:capturas` |
| [`../manual/img/`](../manual/img/) | Capturas nítidas (escala 2 y 3) para los manuales, en tema claro | Manual de usuario (9.7 / entregables) | `cd e2e && npm run manual` (no corre con `npm test` ni en el CI) |

## Notas por sección

- **10.1 (BD):** las migraciones, la vista `v_progreso`, las claves únicas y la regla de publicación se prueban en `backend/test/*.test.ts` contra MySQL real (`uptc_test`); el detalle por archivo está en `cobertura.md`.
- **10.4 (auditoría y reporte):** `pista_ia` (auditoría de las pistas de IA), `evento_outbox` y los intentos se verifican en las pruebas de integración; los reportes de esta carpeta son el reporte de ejecución. Los reportes del docente (CSV) se verifican de punta a punta en `e2e.md`.
- **10.3 / 10.5:** estáticas en `estaticas.md`; dinámicas en `cobertura.md` y `carga.md`; modernas (E2E, accesibilidad automatizada, carga) en `e2e.md`, `accesibilidad.md` y `carga.md`.

## Qué no cubren (tareas manuales)

Interpretación de `metricas.md` y asignación de pesos de puntos de función (11.2), prueba de usabilidad con personas (10.2), revisión con lector de pantalla y teclado, revisión visual de las capturas y prueba del n8n real. Ver `docs/TAREAS_MANUALES.md`.
