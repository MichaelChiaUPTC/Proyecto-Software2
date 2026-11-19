// Genera los reportes de docs/evidencias que salen de ejecutar herramientas locales:
//   node scripts/informes.mjs estaticas   -> estaticas.md  (ESLint + tsc + npm audit, backend y frontend)
//   node scripts/informes.mjs cobertura   -> cobertura.md  (Vitest + v8, backend y frontend)
//   node scripts/informes.mjs e2e         -> e2e.md        (resultados de Playwright, de e2e/test-results/resultados.json)
// Todo con datos reales de la máquina que lo ejecuta; no se inventa ninguna cifra.
import { spawnSync } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import os from 'node:os'
import { dirname, join, relative, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..')
const OUT = join(raiz, 'docs', 'evidencias')
mkdirSync(OUT, { recursive: true })

const sh = (cmd, cwd) => spawnSync(cmd, { cwd, shell: true, encoding: 'utf8', maxBuffer: 256 * 1024 * 1024 })
const cabecera = (titulo, extra = []) => [
  `# ${titulo}`,
  '',
  `- **Fecha:** ${new Date().toLocaleString('es-CO', { dateStyle: 'long', timeStyle: 'short' })}`,
  `- **Equipo:** ${os.hostname()} · ${os.type()} ${os.release()} · ${os.cpus()[0]?.model.trim()} (${os.cpus().length} hilos) · ${(os.totalmem() / 2 ** 30).toFixed(1)} GiB de RAM · Node ${process.version}`,
  ...extra,
  '',
]
const escribir = (nombre, lineas) => {
  writeFileSync(join(OUT, nombre), lineas.join('\n'))
  console.log(`Escrito docs/evidencias/${nombre}`)
}
const pct = (n) => `${n.toFixed(2)} %`

// ---------------------------------------------------------------- estáticas
function eslint(dir) {
  const r = sh('npx eslint . -f json', join(raiz, dir))
  const data = JSON.parse(r.stdout || '[]')
  const errores = data.reduce((s, f) => s + f.errorCount, 0)
  const avisos = data.reduce((s, f) => s + f.warningCount, 0)
  const porRegla = {}
  const complejidad = []
  for (const f of data) {
    for (const m of f.messages) {
      porRegla[m.ruleId ?? 'sin regla'] = (porRegla[m.ruleId ?? 'sin regla'] ?? 0) + 1
      if (m.ruleId === 'complexity') complejidad.push({ archivo: relative(join(raiz, dir), f.filePath).split(sep).join('/'), linea: m.line, mensaje: m.message })
    }
  }
  return { archivos: data.length, errores, avisos, porRegla, complejidad }
}

function tsc(dir) {
  const r = sh('npx tsc --noEmit -p tsconfig.json', join(raiz, dir))
  return { ok: r.status === 0, salida: (r.stdout + r.stderr).trim().split('\n').slice(0, 15).join('\n') }
}

function audit(dir) {
  const r = sh('npm audit --omit=dev --json', join(raiz, dir))
  try {
    const j = JSON.parse(r.stdout)
    if (j.error) return { error: j.error.summary ?? JSON.stringify(j.error) }
    return { v: j.metadata.vulnerabilities, deps: j.metadata.dependencies, lista: Object.values(j.vulnerabilities ?? {}).map((x) => ({ nombre: x.name, severidad: x.severity, directa: x.isDirect, arreglo: x.fixAvailable ? 'sí' : 'no' })) }
  } catch {
    return { error: (r.stdout + r.stderr).trim().slice(0, 300) || 'sin respuesta de npm audit (¿sin red?)' }
  }
}

function estaticas() {
  const proyectos = [['Backend', 'backend'], ['Frontend', 'frontend']]
  const r = proyectos.map(([n, d]) => ({ n, d, lint: eslint(d), ts: tsc(d), au: audit(d) }))
  const md = [
    ...cabecera('Reporte de pruebas estáticas (10.3)', [
      '- **Herramientas:** ESLint (typescript-eslint, `eslint:recommended`, `react-hooks`, regla `complexity` máx. 10), `tsc --noEmit` en modo estricto y `npm audit --omit=dev` (dependencias de producción).',
    ]),
    '## Resumen',
    '',
    '| Proyecto | ESLint errores | ESLint avisos | `tsc` | Vulnerabilidades (prod.) |',
    '|---|---|---|---|---|',
    ...r.map(({ n, lint, ts, au }) => `| ${n} | ${lint.errores} | ${lint.avisos} | ${ts.ok ? 'sin errores' : 'CON ERRORES'} | ${au.error ? `no se pudo consultar (${au.error})` : `${au.v.total} (críticas ${au.v.critical}, altas ${au.v.high}, moderadas ${au.v.moderate}, bajas ${au.v.low})`} |`),
    '',
  ]
  for (const { n, d, lint, ts, au } of r) {
    md.push(`## ${n} (\`${d}/\`)`, '', `### ESLint`, '', `${lint.archivos} archivos analizados: **${lint.errores} errores** y **${lint.avisos} avisos**.`, '')
    if (Object.keys(lint.porRegla).length) {
      md.push('| Regla | Ocurrencias |', '|---|---|', ...Object.entries(lint.porRegla).map(([k, v]) => `| \`${k}\` | ${v} |`), '')
    }
    if (lint.complejidad.length) {
      md.push('Funciones que superan la complejidad ciclomática permitida (10), insumo de las métricas de 11.5:', '', '| Archivo | Línea | Detalle |', '|---|---|---|', ...lint.complejidad.map((c) => `| \`${c.archivo}\` | ${c.linea} | ${c.mensaje} |`), '')
    }
    md.push('### TypeScript (`tsc --noEmit`)', '', ts.ok ? 'Sin errores de tipos.' : ['```', ts.salida, '```'].join('\n'), '')
    md.push('### `npm audit --omit=dev`', '')
    if (au.error) md.push(`No se pudo completar la consulta: ${au.error}`, '')
    else {
      md.push(`${au.deps.prod} dependencias de producción (${au.deps.total} en total con transitivas): **${au.v.total} vulnerabilidades** (críticas ${au.v.critical}, altas ${au.v.high}, moderadas ${au.v.moderate}, bajas ${au.v.low}, informativas ${au.v.info}).`, '')
      if (au.lista.length) md.push('| Paquete | Severidad | Directa | Arreglo disponible |', '|---|---|---|---|', ...au.lista.map((x) => `| \`${x.nombre}\` | ${x.severidad} | ${x.directa ? 'sí' : 'no'} | ${x.arreglo} |`), '')
    }
  }
  md.push('## Notas', '', '- Los avisos de `complexity` no rompen el CI (son advertencias a propósito: sirven para medir complejidad ciclomática en 11.5).', '- `npm audit` consulta la base de avisos de npm en el momento de ejecutarse; el resultado cambia con el tiempo aunque el código no cambie.', '')
  escribir('estaticas.md', md)
}

// ---------------------------------------------------------------- cobertura
function cobertura() {
  const secciones = []
  for (const [nombre, dir, src] of [['Backend', 'backend', 'src'], ['Frontend', 'frontend', 'src']]) {
    const cwd = join(raiz, dir)
    const salidaJson = join(cwd, 'coverage', 'resultados.json')
    mkdirSync(join(cwd, 'coverage'), { recursive: true })
    const r = sh(`npx vitest run --coverage --coverage.reporter=json-summary --reporter=json --outputFile=${JSON.stringify(salidaJson)}`, cwd)
    if (!existsSync(salidaJson)) throw new Error(`${nombre}: vitest no generó resultados.\n${r.stdout}\n${r.stderr}`)
    const t = JSON.parse(readFileSync(salidaJson, 'utf8'))
    const c = JSON.parse(readFileSync(join(cwd, 'coverage', 'coverage-summary.json'), 'utf8'))
    const carpetas = {}
    for (const [archivo, v] of Object.entries(c)) {
      if (archivo === 'total') continue
      const rel = relative(join(cwd, src), archivo).split(sep).join('/').split('/')
      const clave = rel.length > 3 ? rel.slice(0, 3).join('/') : rel.slice(0, -1).join('/') || '(raíz)'
      const a = (carpetas[clave] ??= { lineas: 0, cubiertas: 0, ramas: 0, ramasCub: 0, archivos: 0 })
      a.lineas += v.lines.total; a.cubiertas += v.lines.covered; a.ramas += v.branches.total; a.ramasCub += v.branches.covered; a.archivos++
    }
    const porArchivo = t.testResults.map((f) => ({ archivo: relative(join(cwd), f.name).split(sep).join('/'), n: f.assertionResults.length, ok: f.assertionResults.filter((a) => a.status === 'passed').length }))
    secciones.push({ nombre, dir, t, c: c.total, carpetas, porArchivo })
  }
  const md = [
    ...cabecera('Reporte de cobertura de pruebas', ['- **Herramienta:** Vitest 5 + `@vitest/coverage-v8` (cobertura de líneas, sentencias, funciones y ramas). Backend contra MySQL y Docker reales; frontend con jsdom.']),
    '## Resumen',
    '',
    '| Proyecto | Pruebas | Pasan | Fallan | Líneas | Sentencias | Funciones | Ramas |',
    '|---|---|---|---|---|---|---|---|',
    ...secciones.map(({ nombre, t, c }) => `| ${nombre} | ${t.numTotalTests} | ${t.numPassedTests} | ${t.numFailedTests} | ${pct(c.lines.pct)} (${c.lines.covered}/${c.lines.total}) | ${pct(c.statements.pct)} | ${pct(c.functions.pct)} | ${pct(c.branches.pct)} |`),
    '',
    '(Solo cuentan los archivos de `src/`; los mocks, las pruebas y el arranque `main.tsx` del frontend se excluyen.)',
    '',
  ]
  for (const s of secciones) {
    md.push(`## ${s.nombre}`, '', '### Cobertura por carpeta', '', '| Carpeta | Archivos | Líneas cubiertas | % líneas | % ramas |', '|---|---|---|---|---|')
    for (const [k, v] of Object.entries(s.carpetas).sort()) md.push(`| \`${k}\` | ${v.archivos} | ${v.cubiertas}/${v.lineas} | ${v.lineas ? pct((v.cubiertas / v.lineas) * 100) : '-'} | ${v.ramas ? pct((v.ramasCub / v.ramas) * 100) : '-'} |`)
    md.push('', '### Pruebas por archivo', '', '| Archivo de pruebas | Pruebas | Pasan |', '|---|---|---|', ...s.porArchivo.sort((a, b) => a.archivo.localeCompare(b.archivo)).map((f) => `| \`${f.archivo}\` | ${f.n} | ${f.ok} |`), '')
  }
  md.push('## Lectura', '', '- La cobertura de líneas es una medida de qué código ejecutan las pruebas, no de su calidad: una línea ejecutada sin aserciones cuenta igual.', '- El reporte HTML navegable queda en `backend/coverage/index.html` y `frontend/coverage/index.html` (no se versionan).', '')
  escribir('cobertura.md', md)
}

// ---------------------------------------------------------------- e2e
function e2e() {
  const archivo = join(raiz, 'e2e', 'test-results', 'resultados.json')
  if (!existsSync(archivo)) throw new Error('No hay e2e/test-results/resultados.json: ejecuta antes `cd e2e && npx playwright test`.')
  const j = JSON.parse(readFileSync(archivo, 'utf8'))
  const filas = []
  const recorrer = (s, ruta) => {
    for (const sp of s.specs ?? []) for (const t of sp.tests) {
      const r = t.results.at(-1)
      filas.push({ archivo: s.file ?? ruta, titulo: sp.title, estado: t.status === 'expected' ? 'pasa' : t.status === 'skipped' ? 'omitida' : 'FALLA', ms: r?.duration ?? 0 })
    }
    for (const h of s.suites ?? []) recorrer(h, s.file ?? ruta)
  }
  for (const s of j.suites) recorrer(s, s.file)
  const total = filas.length
  const pasan = filas.filter((f) => f.estado === 'pasa').length
  const md = [
    ...cabecera('Reporte de pruebas E2E (10.5)', [
      '- **Herramienta:** Playwright ' + (j.config?.version ?? '') + ', Chromium (escritorio 1366×800), frontend en modo API (`VITE_API_URL`) contra la API y MySQL de `docker compose`.',
      `- **Duración total:** ${((j.stats?.duration ?? 0) / 1000).toFixed(1)} s`,
    ]),
    `**Resultado: ${pasan} de ${total} pruebas pasan.**`,
    '',
    '| Archivo | Prueba | Estado | Duración |',
    '|---|---|---|---|',
    ...filas.map((f) => `| \`${f.archivo}\` | ${f.titulo} | ${f.estado} | ${(f.ms / 1000).toFixed(1)} s |`),
    '',
    '## Qué cubren',
    '',
    '- `estudiante.spec.ts`: registro (validaciones y correo repetido), inicio de sesión, completar una lección, intento fallido, **pista con IA (respaldo del curso si no hay proveedor)**, acierto, insignia, progreso, cierre de sesión y credenciales incorrectas.',
    '- `docente.spec.ts`: panel, **publicar/despublicar** contenido (regla «módulo sin lecciones no se publica», visibilidad para el estudiante), **reportes y descarga del CSV verificada** (BOM, cabeceras, fila del estudiante).',
    '- `admin.spec.ts`: crear usuario, cambiar rol, desactivar con confirmación (**el desactivado ya no entra y su sesión abierta se cierra**) y reactivar.',
    '- `accesibilidad.spec.ts`: axe-core WCAG 2.1 A/AA (ver `accesibilidad.md`).',
    '- `capturas.spec.ts`: genera las capturas de `capturas/` para el manual de usuario.',
    '- Todas las pruebas fallan si la aplicación escribe un `console.error` (p. ej. avisos de React) o lanza una excepción no capturada.',
    '- Los datos de prueba llevan el correo `e2e-*@uptc.edu.co` o el título `E2E …` y se borran al terminar (`e2e/cleanup.sql`).',
    '',
  ]
  escribir('e2e.md', md)
}

const tareas = { estaticas, cobertura, e2e }
const cual = process.argv[2]
if (!tareas[cual]) {
  console.error(`Uso: node scripts/informes.mjs ${Object.keys(tareas).join('|')}`)
  process.exit(2)
}
tareas[cual]()
