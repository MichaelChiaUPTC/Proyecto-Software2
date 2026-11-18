# Reporte de carga (RNF-03, 8.1.2)

- **Fecha:** 18 de noviembre de 2026 a las 9:36 a. m.
- **Equipo:** Chia · Windows_NT 10.0.26300 · AMD Ryzen 5 5600H with Radeon Graphics (12 hilos) · 7.4 GiB de RAM
- **Docker:** 29.7.2, VM con 12 CPU y 3.5 GiB. API y MySQL en contenedores (`docker compose`); k6 en la imagen `grafana/k6` contra `host.docker.internal:3000`. Todo en la misma máquina.
- **Script:** `perf/carga.js` (k6) · **Ejecución:** `perf/ejecutar-carga.ps1` · duración de cada escenario: 3m

## Escenario (supuestos del documento IW 8.1.2)

| Escenario | Carga | Qué hace |
|---|---|---|
| `navegacion` | 60 usuarios virtuales concurrentes (constante) | Cada uno recorre `GET /me/home`, `/me/modules` y `/me/lessons/:id` (lección al azar de 25) con 1 a 3 s de lectura entre peticiones |
| `envios` | 30 envíos por minuto (tasa de llegada constante) | `POST /exercises/1/submissions`, mitad con la solución correcta y mitad con una incorrecta; cada envío ejecuta un contenedor Docker real (`python:3.12-alpine`, sin red) |
| `docentes` | 5 usuarios virtuales (constante) | `GET /teacher/dashboard` cada 2 a 4 s |

El `setup()` registra **150 estudiantes** (el documento asume 150 usuarios en total; 60 son los concurrentes) para que el panel docente agregue sobre una población realista; los envíos se reparten entre los 150 para no tocar el límite de 10 envíos por minuto por usuario. Los usuarios se borran al terminar (`e2e/cleanup.sql`).

## Resultados

**Veredicto: se cumplen los tres umbrales.**

| Medición | Promedio | Mediana | p90 | p95 | Máximo | Umbral p95 | Estado |
|---|---|---|---|---|---|---|---|
| Envío de ejercicio (todos) | 758 ms | 736 ms | 882 ms | **965 ms** | 1050 ms | < 3000 ms | Cumple |
|   Envío correcto | 773 ms | 757 ms | 930 ms | **976 ms** | 1050 ms | < 3000 ms | Cumple |
|   Envío con fallo | 742 ms | 728 ms | 837 ms | **879 ms** | 1015 ms | < 3000 ms | Cumple |
| Lectura (todas) | 8.0 ms | 5.1 ms | 9.7 ms | **13.3 ms** | 309 ms | < 500 ms | Cumple |
|   GET /me/home | 11.3 ms | 4.9 ms | 9.1 ms | **14.6 ms** | 309 ms | < 500 ms | Cumple |
|   GET /me/modules | 5.7 ms | 4.8 ms | 7.6 ms | **9.8 ms** | 129 ms | < 500 ms | Cumple |
|   GET /me/lessons/:id | 6.1 ms | 5.3 ms | 8.4 ms | **11.0 ms** | 65.2 ms | < 500 ms | Cumple |
|   GET /teacher/dashboard (5 docentes) | 14.8 ms | 10.6 ms | 19.8 ms | **26.4 ms** | 225 ms | < 500 ms | Cumple |

| Indicador | Valor | Umbral | Estado |
|---|---|---|---|
| Peticiones fallidas (HTTP ≥ 400 o error de red) | 0.00 % de 6019 | < 1 % | Cumple |
| Comprobaciones (estado 200 y veredicto esperado) | 100.00 % de 5959 | > 99 % | Cumple |
| Envíos realizados | 91 | | |
| Lecturas realizadas | 5777 | | |
| Rendimiento total | 30.6 peticiones/s | | |

## Consumo de recursos (`docker stats`, muestreo cada ~3 s durante toda la ejecución)

| Contenedor | CPU media | CPU mediana | CPU máx. | Memoria media | Memoria máx. | Muestras |
|---|---|---|---|---|---|---|
| api (Node + lanzador de contenedores) | 32 % | 14 % | 349 % | 165 MiB | 196 MiB | 50 |
| mysql | 8 % | 8 % | 21 % | 535 MiB | 536 MiB | 50 |

La CPU es porcentaje de un núcleo (100 % = 1 núcleo; puede superar 100 %). Incluye el arranque (`setup()`: 150 registros con bcrypt de costo 12, que es el pico de CPU de la API). No incluye los contenedores efímeros del corrector (`python:3.12-alpine`, límite de 0,5 CPU y 128 MB cada uno, máximo 4 a la vez).

## Interpretación

- **Envíos:** el p95 fue 965 ms frente al umbral de 3 s (32 % del límite). Casi todo es el arranque del contenedor del corrector (~0,6 s en Docker Desktop); a 30 envíos por minuto el corrector está lejos de saturarse (con 4 contenedores simultáneos y ~0,7 s por envío caben unos 340 por minuto).
- **Lecturas:** el p95 fue 13.3 ms frente a 500 ms. Las lecturas de módulos y lecciones son consultas simples; las más lentas son `/me/home` y `/teacher/dashboard`, que agregan intentos con `GROUP BY` en cada petición (p95 14.6 ms y 26.4 ms).
- **Errores:** ver la tabla; los 429 por límite de envíos no aparecen porque el reparto entre usuarios los evita (el límite de 10/min por usuario se probó aparte en las pruebas de integración del backend).

## Limitaciones

- Un solo equipo ejecuta cliente, API, MySQL y los contenedores del corrector: sus consumos compiten entre sí. En un servidor dedicado (Fase 7) el resultado puede variar; la prueba demuestra el cumplimiento del requisito en el entorno de desarrollo, no en producción.
- Una sola instancia de la API; no se probó escalado horizontal.
- Los 60 usuarios concurrentes tienen tiempos de lectura de 1 a 3 s; un uso real con pausas más largas genera menos peticiones por segundo.
- La base de datos de la prueba tiene poco histórico (solo los intentos de esta ejecución y los de las demás pruebas); el panel docente con meses de datos habría que volver a medirlo.

Regenerar: `powershell -File perf/ejecutar-carga.ps1` (o `scripts/evidencias.ps1`). Los datos crudos quedan en `perf/resultados/` (no se versionan).
