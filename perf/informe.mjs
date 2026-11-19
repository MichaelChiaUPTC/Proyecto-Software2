// Genera docs/evidencias/carga.md a partir de perf/resultados (resumen.json de k6 y stats.csv de docker stats).
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs'
import { execSync } from 'node:child_process'
import os from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const aqui = dirname(fileURLToPath(import.meta.url))
const res = join(aqui, 'resultados')
const salida = join(aqui, '..', 'docs', 'evidencias', 'carga.md')
const duracion = process.argv[2] ?? '3m'

const k6 = JSON.parse(readFileSync(join(res, 'resumen.json'), 'utf8')).metrics
const ms = (n) => (n >= 100 ? `${Math.round(n)} ms` : `${n.toFixed(1)} ms`)
const m = (nombre) => k6[nombre]

const filas = [
  ['Envío de ejercicio (todos)', 'http_req_duration{type:submit}', 3000],
  ['  Envío correcto', 'http_req_duration{name:submit_ok}', 3000],
  ['  Envío con fallo', 'http_req_duration{name:submit_fail}', 3000],
  ['Lectura (todas)', 'http_req_duration{type:read}', 500],
  ['  GET /me/home', 'http_req_duration{name:me_home}', 500],
  ['  GET /me/modules', 'http_req_duration{name:me_modules}', 500],
  ['  GET /me/lessons/:id', 'http_req_duration{name:me_lesson}', 500],
  ['  GET /teacher/dashboard (5 docentes)', 'http_req_duration{name:dashboard}', 500],
]
const tabla = filas.map(([n, k, lim]) => {
  const x = m(k)
  return `| ${n} | ${ms(x.avg)} | ${ms(x.med)} | ${ms(x['p(90)'])} | **${ms(x['p(95)'])}** | ${ms(x.max)} | < ${lim} ms | ${x['p(95)'] < lim ? 'Cumple' : 'NO cumple'} |`
})

const fallos = (k) => m(k)
const tot = (k) => fallos(k).passes + fallos(k).fails
const errTotal = m('http_req_failed')
const errPct = (errTotal.value * 100).toFixed(2)
const envios = tot('http_req_failed{type:submit}')
const lecturas = tot('http_req_failed{type:read}')
const cumple = m('http_req_duration{type:submit}')['p(95)'] < 3000 && m('http_req_duration{type:read}')['p(95)'] < 500 && errTotal.value < 0.01

// Consumo de la API y de MySQL
const stats = existsSync(join(res, 'stats.csv')) ? readFileSync(join(res, 'stats.csv'), 'utf8').trim().split('\n').slice(1).map((l) => l.split(',')) : []
const resumenStats = (nombre) => {
  const f = stats.filter((r) => r[1] === nombre)
  if (!f.length) return null
  const cpu = f.map((r) => Number(r[2]))
  const mem = f.map((r) => Number(r[3]))
  const media = (a) => a.reduce((s, v) => s + v, 0) / a.length
  const mediana = (a) => [...a].sort((x, y) => x - y)[Math.floor(a.length / 2)]
  return { n: f.length, cpuMediana: mediana(cpu), cpuMedia: media(cpu), cpuMax: Math.max(...cpu), memMedia: media(mem), memMax: Math.max(...mem) }
}
const sh = (c) => { try { return execSync(c, { encoding: 'utf8' }).trim() } catch { return '' } }
const docker = sh('docker info --format "CPUs={{.NCPU}} memoria={{.MemTotal}} docker={{.ServerVersion}}"')
const dm = /CPUs=(\d+) memoria=(\d+) docker=(\S+)/.exec(docker)
const memDocker = dm ? `${(Number(dm[2]) / 2 ** 30).toFixed(1)} GiB` : 'n/d'
const cpus = os.cpus()
const fila = (n, s) => (s ? `| ${n} | ${s.cpuMedia.toFixed(0)} % | ${s.cpuMediana.toFixed(0)} % | ${s.cpuMax.toFixed(0)} % | ${s.memMedia.toFixed(0)} MiB | ${s.memMax.toFixed(0)} MiB | ${s.n} |` : `| ${n} | n/d | n/d | n/d | n/d | n/d | 0 |`)
const sApi = resumenStats('api')
const sDb = resumenStats('mysql')

const md = [
  '# Reporte de carga (RNF-03, 8.1.2)',
  '',
  `- **Fecha:** ${new Date().toLocaleString('es-CO', { dateStyle: 'long', timeStyle: 'short' })}`,
  `- **Equipo:** ${os.hostname()} · ${os.type()} ${os.release()} · ${cpus[0]?.model.trim()} (${cpus.length} hilos) · ${(os.totalmem() / 2 ** 30).toFixed(1)} GiB de RAM`,
  `- **Docker:** ${dm ? `${dm[3]}, VM con ${dm[1]} CPU y ${memDocker}` : 'n/d'}. API y MySQL en contenedores (\`docker compose\`); k6 en la imagen \`grafana/k6\` contra \`host.docker.internal:3000\`. Todo en la misma máquina.`,
  `- **Script:** \`perf/carga.js\` (k6) · **Ejecución:** \`perf/ejecutar-carga.ps1\` · duración de cada escenario: ${duracion}`,
  '',
  '## Escenario (supuestos del documento IW 8.1.2)',
  '',
  '| Escenario | Carga | Qué hace |',
  '|---|---|---|',
  '| `navegacion` | 60 usuarios virtuales concurrentes (constante) | Cada uno recorre `GET /me/home`, `/me/modules` y `/me/lessons/:id` (lección al azar de 25) con 1 a 3 s de lectura entre peticiones |',
  '| `envios` | 30 envíos por minuto (tasa de llegada constante) | `POST /exercises/1/submissions`, mitad con la solución correcta y mitad con una incorrecta; cada envío ejecuta un contenedor Docker real (`python:3.12-alpine`, sin red) |',
  '| `docentes` | 5 usuarios virtuales (constante) | `GET /teacher/dashboard` cada 2 a 4 s |',
  '',
  'El `setup()` registra **150 estudiantes** (el documento asume 150 usuarios en total; 60 son los concurrentes) para que el panel docente agregue sobre una población realista; los envíos se reparten entre los 150 para no tocar el límite de 10 envíos por minuto por usuario. Los usuarios se borran al terminar (`e2e/cleanup.sql`).',
  '',
  '## Resultados',
  '',
  `**Veredicto: ${cumple ? 'se cumplen los tres umbrales' : 'NO se cumple al menos un umbral'}.**`,
  '',
  '| Medición | Promedio | Mediana | p90 | p95 | Máximo | Umbral p95 | Estado |',
  '|---|---|---|---|---|---|---|---|',
  ...tabla,
  '',
  '| Indicador | Valor | Umbral | Estado |',
  '|---|---|---|---|',
  `| Peticiones fallidas (HTTP ≥ 400 o error de red) | ${errPct} % de ${m('http_reqs').count} | < 1 % | ${errTotal.value < 0.01 ? 'Cumple' : 'NO cumple'} |`,
  `| Comprobaciones (estado 200 y veredicto esperado) | ${(m('checks').value * 100).toFixed(2)} % de ${m('checks').passes + m('checks').fails} | > 99 % | ${m('checks').value > 0.99 ? 'Cumple' : 'NO cumple'} |`,
  `| Envíos realizados | ${envios} | | |`,
  `| Lecturas realizadas | ${lecturas} | | |`,
  `| Rendimiento total | ${m('http_reqs').rate.toFixed(1)} peticiones/s | | |`,
  '',
  '## Consumo de recursos (`docker stats`, muestreo cada ~3 s durante toda la ejecución)',
  '',
  '| Contenedor | CPU media | CPU mediana | CPU máx. | Memoria media | Memoria máx. | Muestras |',
  '|---|---|---|---|---|---|---|',
  fila('api (Node + lanzador de contenedores)', sApi),
  fila('mysql', sDb),
  '',
  'La CPU es porcentaje de un núcleo (100 % = 1 núcleo; puede superar 100 %). Incluye el arranque (`setup()`: 150 registros con bcrypt de costo 12, que es el pico de CPU de la API). No incluye los contenedores efímeros del corrector (`python:3.12-alpine`, límite de 0,5 CPU y 128 MB cada uno, máximo 4 a la vez).',
  '',
  '## Interpretación',
  '',
  `- **Envíos:** el p95 fue ${ms(m('http_req_duration{type:submit}')['p(95)'])} frente al umbral de 3 s (${((m('http_req_duration{type:submit}')['p(95)'] / 3000) * 100).toFixed(0)} % del límite). Casi todo es el arranque del contenedor del corrector (~0,6 s en Docker Desktop); a 30 envíos por minuto el corrector está lejos de saturarse (con 4 contenedores simultáneos y ~0,7 s por envío caben unos 340 por minuto).`,
  `- **Lecturas:** el p95 fue ${ms(m('http_req_duration{type:read}')['p(95)'])} frente a 500 ms. Las lecturas de módulos y lecciones son consultas simples; las más lentas son \`/me/home\` y \`/teacher/dashboard\`, que agregan intentos con \`GROUP BY\` en cada petición (p95 ${ms(m('http_req_duration{name:me_home}')['p(95)'])} y ${ms(m('http_req_duration{name:dashboard}')['p(95)'])}).`,
  '- **Errores:** ver la tabla; los 429 por límite de envíos no aparecen porque el reparto entre usuarios los evita (el límite de 10/min por usuario se probó aparte en las pruebas de integración del backend).',
  '',
  '## Limitaciones',
  '',
  '- Un solo equipo ejecuta cliente, API, MySQL y los contenedores del corrector: sus consumos compiten entre sí. En un servidor dedicado (Fase 7) el resultado puede variar; la prueba demuestra el cumplimiento del requisito en el entorno de desarrollo, no en producción.',
  '- Una sola instancia de la API; no se probó escalado horizontal.',
  '- Los 60 usuarios concurrentes tienen tiempos de lectura de 1 a 3 s; un uso real con pausas más largas genera menos peticiones por segundo.',
  '- La base de datos de la prueba tiene poco histórico (solo los intentos de esta ejecución y los de las demás pruebas); el panel docente con meses de datos habría que volver a medirlo.',
  '',
  'Regenerar: `powershell -File perf/ejecutar-carga.ps1` (o `scripts/evidencias.ps1`). Los datos crudos quedan en `perf/resultados/` (no se versionan).',
  '',
].join('\n')

mkdirSync(dirname(salida), { recursive: true })
writeFileSync(salida, md)
process.exitCode = cumple ? 0 : 1
console.log(`Informe de carga escrito en ${salida} (${cumple ? 'umbrales cumplidos' : 'UMBRALES NO CUMPLIDOS'})`)
