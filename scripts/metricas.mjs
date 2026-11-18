// Métricas de código (11.5), insumos de puntos de función (11.2) y métricas CK (11.3) -> docs/evidencias/metricas.md
//   node scripts/metricas.mjs            genera el reporte
//   node scripts/metricas.mjs --rutas    imprime solo la tabla de endpoints (para el manual de programador)
// Todo se calcula leyendo el código real con el compilador de TypeScript (el que ya está instalado en backend/ y frontend/).
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import os from 'node:os'
import { basename, dirname, join, relative, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..')
const ts = createRequire(join(raiz, 'backend', 'package.json'))('typescript')
const rel = (p) => relative(raiz, p).split(sep).join('/')
const leer = (p) => readFileSync(p, 'utf8')

function archivos(dir, ext, ignorar = ['node_modules', 'dist', 'coverage']) {
  if (!existsSync(dir)) return []
  return readdirSync(dir).flatMap((n) => {
    const p = join(dir, n)
    if (statSync(p).isDirectory()) return ignorar.includes(n) ? [] : archivos(p, ext, ignorar)
    return ext.some((e) => n.endsWith(e)) ? [p] : []
  })
}

// ------------------------------------------------------------------ LOC (código / comentarios / blancos)
/** Clasifica cada línea con el escáner de TypeScript: una línea con algún token es código; solo con comentarios, comentario. */
function contarLineas(texto, tsx) {
  const lineas = texto.split(/\r?\n/)
  const codigo = new Set()
  const comentario = new Set()
  const sc = ts.createScanner(ts.ScriptTarget.Latest, false, tsx ? ts.LanguageVariant.JSX : ts.LanguageVariant.Standard, texto)
  // posiciones de inicio de línea
  const inicios = [0]
  for (let i = 0; i < texto.length; i++) if (texto[i] === '\n') inicios.push(i + 1)
  const linea = (pos) => {
    let a = 0, b = inicios.length - 1
    while (a < b) { const m = (a + b + 1) >> 1; if (inicios[m] <= pos) a = m; else b = m - 1 }
    return a
  }
  let k
  while ((k = sc.scan()) !== ts.SyntaxKind.EndOfFileToken) {
    const ini = sc.getTokenStart(), fin = sc.getTokenEnd()
    if (k === ts.SyntaxKind.WhitespaceTrivia || k === ts.SyntaxKind.NewLineTrivia) continue
    const marca = k === ts.SyntaxKind.SingleLineCommentTrivia || k === ts.SyntaxKind.MultiLineCommentTrivia ? comentario : codigo
    for (let l = linea(ini); l <= linea(Math.max(ini, fin - 1)); l++) marca.add(l)
    // JSX y plantillas: el escáner sin contexto parte mal, pero cualquier token cuenta como código, lo que basta aquí.
  }
  let c = 0, m = 0, b = 0
  lineas.forEach((t, i) => {
    if (!t.trim()) b++
    else if (codigo.has(i)) c++
    else if (comentario.has(i)) m++
    else c++ // contenido dentro de plantillas/JSX que el escáner no distinguió
  })
  return { codigo: c, comentarios: m, blancos: b }
}

function locPorGrupo(dir, grupoDe, exts = ['.ts', '.tsx']) {
  const grupos = new Map()
  for (const f of archivos(dir, exts)) {
    const g = grupoDe(rel(f))
    const l = contarLineas(leer(f), f.endsWith('x'))
    const a = grupos.get(g) ?? { archivos: 0, codigo: 0, comentarios: 0, blancos: 0 }
    a.archivos++; a.codigo += l.codigo; a.comentarios += l.comentarios; a.blancos += l.blancos
    grupos.set(g, a)
  }
  return [...grupos.entries()].sort(([a], [b]) => a.localeCompare(b))
}

const grupoBackend = (r) => {
  const p = r.split('/')
  if (p[1] === 'test') return 'test (pruebas)'
  if (p[1] === 'db') return 'db (seed)'
  if (p[1] === 'src' && p[2] === 'modules') return `src/modules/${p[3]}/${p[4].endsWith('.ts') ? '' : p[4]}`.replace(/\/$/, '')
  if (p[1] === 'src' && p[2] === 'shared') return 'src/shared'
  return p.length > 3 ? `src/${p[2]}` : 'src (raíz)'
}
const grupoFrontend = (r) => {
  const p = r.split('/')
  if (p[2] === 'components' || p[2] === 'pages') return `src/${p[2]}/${p[3]}`.replace(/\/[^/]*\.tsx?$/, '')
  return p.length > 3 ? `src/${p[2]}` : 'src (raíz)'
}

// ------------------------------------------------------------------ complejidad ciclomática
const OPS_LOGICOS = new Set([ts.SyntaxKind.AmpersandAmpersandToken, ts.SyntaxKind.BarBarToken, ts.SyntaxKind.QuestionQuestionToken, ts.SyntaxKind.AmpersandAmpersandEqualsToken, ts.SyntaxKind.BarBarEqualsToken, ts.SyntaxKind.QuestionQuestionEqualsToken])
const esFuncion = (n) => ts.isFunctionDeclaration(n) || ts.isFunctionExpression(n) || ts.isArrowFunction(n) || ts.isMethodDeclaration(n) || ts.isConstructorDeclaration(n) || ts.isGetAccessor(n) || ts.isSetAccessor(n)

/** McCabe: 1 + decisiones (if, ?:, bucles, case, catch, &&, ||, ??). Las funciones anidadas se cuentan aparte. */
function complejidad(fn) {
  let c = 1
  const visita = (n) => {
    if (n !== fn && esFuncion(n)) return
    switch (n.kind) {
      case ts.SyntaxKind.IfStatement: case ts.SyntaxKind.ConditionalExpression: case ts.SyntaxKind.ForStatement: case ts.SyntaxKind.ForInStatement:
      case ts.SyntaxKind.ForOfStatement: case ts.SyntaxKind.WhileStatement: case ts.SyntaxKind.DoStatement: case ts.SyntaxKind.CaseClause: case ts.SyntaxKind.CatchClause:
        c++; break
      case ts.SyntaxKind.BinaryExpression:
        if (OPS_LOGICOS.has(n.operatorToken.kind)) c++
        break
    }
    ts.forEachChild(n, visita)
  }
  visita(fn)
  return c
}

function nombreDe(fn, sf) {
  const padre = fn.parent
  const pos = ts.getLineAndCharacterOfPosition(sf, fn.getStart(sf)).line + 1
  let n = fn.name?.getText(sf)
  if (!n && padre && ts.isVariableDeclaration(padre)) n = padre.name.getText(sf)
  if (!n && padre && ts.isPropertyAssignment(padre)) n = padre.name.getText(sf)
  if (!n && ts.isConstructorDeclaration(fn)) n = 'constructor'
  if (!n) n = '(anónima)'
  let clase = ''
  for (let p = fn.parent; p; p = p.parent) if (ts.isClassDeclaration(p) && p.name) { clase = `${p.name.text}.`; break }
  return { nombre: `${clase}${n}`, linea: pos }
}

function analizarComplejidad(archs) {
  const filas = []
  for (const f of archs) {
    const sf = ts.createSourceFile(f, leer(f), ts.ScriptTarget.Latest, true, f.endsWith('x') ? ts.ScriptKind.TSX : ts.ScriptKind.TS)
    const visita = (n) => {
      if (esFuncion(n) && n.body) filas.push({ archivo: rel(f), ...nombreDe(n, sf), cc: complejidad(n) })
      ts.forEachChild(n, visita)
    }
    visita(sf)
  }
  return filas
}
const resumenCC = (f) => ({
  n: f.length,
  prom: f.reduce((s, x) => s + x.cc, 0) / Math.max(1, f.length),
  max: Math.max(0, ...f.map((x) => x.cc)),
  mayor10: f.filter((x) => x.cc > 10).length,
  tramos: [f.filter((x) => x.cc <= 5).length, f.filter((x) => x.cc > 5 && x.cc <= 10).length, f.filter((x) => x.cc > 10 && x.cc <= 20).length, f.filter((x) => x.cc > 20).length],
})

// ------------------------------------------------------------------ rutas de la API (leídas de los routers reales)
const VERBOS = ['get', 'post', 'put', 'patch', 'delete']
function leerRutas() {
  const rutas = []
  for (const f of archivos(join(raiz, 'backend', 'src'), ['routes.ts'])) {
    const texto = leer(f)
    const modulo = basename(dirname(dirname(f)))
    const vars = Object.fromEntries([...texto.matchAll(/const (\w+) = '(\/[^']*)'/g)].map((m) => [m[1], m[2]]))
    // Acumula declaraciones de arreglos de middleware: const docente = [requireAuth, requireRole('teacher','admin')]
    const arreglos = Object.fromEntries([...texto.matchAll(/const (\w+) = \[([^\]]*requireRole[^\]]*)\]/g)].map((m) => [m[1], m[2]]))
    const re = new RegExp(`router\\.(${VERBOS.join('|')})\\(\\s*(?:(['\`])([^'\`]+)\\2|(\\w+))([^\\n]*)`, 'g')
    for (const m of texto.matchAll(re)) {
      const ruta = m[4] ? (vars[m[4]] ?? m[4]) : m[3].replace(/\$\{(\w+)\}/g, (_, v) => vars[v] ?? `\${${v}}`)
      const resto = m[5]
      let roles = 'público'
      const spread = /\.\.\.(\w+)/.exec(resto)
      const fuente = spread && arreglos[spread[1]] ? arreglos[spread[1]] : resto
      const rr = /requireRole\(([^)]*)\)/.exec(fuente)
      if (rr) roles = rr[1].replace(/['\s]/g, '').split(',').map((r) => ({ student: 'estudiante', teacher: 'docente', admin: 'admin' })[r]).join(' / ')
      else if (/requireAuth/.test(fuente)) roles = 'autenticado'
      rutas.push({ metodo: m[1].toUpperCase(), ruta: `/api${ruta}`, roles, modulo, archivo: rel(f) })
    }
  }
  rutas.unshift({ metodo: 'GET', ruta: '/api/health', roles: 'público', modulo: 'app', archivo: 'backend/src/app.ts' })
  return rutas
}
const tablaRutas = (rutas) => ['| Método | Ruta | Acceso | Módulo |', '|---|---|---|---|', ...rutas.map((r) => `| ${r.metodo} | \`${r.ruta}\` | ${r.roles} | ${r.modulo} |`)]

if (process.argv.includes('--rutas')) {
  console.log(tablaRutas(leerRutas()).join('\n'))
  process.exit(0)
}

// ------------------------------------------------------------------ tablas (migraciones)
function leerTablas() {
  const tablas = []
  for (const f of archivos(join(raiz, 'backend', 'db', 'migrations'), ['.sql']).sort()) {
    const sql = leer(f)
    for (const m of sql.matchAll(/CREATE TABLE (\w+) \(([\s\S]*?)\n\) ENGINE/g)) {
      const cols = m[2].split('\n').map((l) => l.trim()).filter((l) => /^[a-z_]+\s+(INT|BIGINT|VARCHAR|CHAR|TEXT|JSON|DATETIME|BOOLEAN|TINYINT|SMALLINT|ENUM)/i.test(l))
      tablas.push({ nombre: m[1], columnas: cols.length, migracion: basename(f) })
    }
    for (const m of sql.matchAll(/ALTER TABLE (\w+) ADD COLUMN (\w+)/g)) {
      const t = tablas.find((x) => x.nombre === m[1])
      if (t) t.columnas++
    }
  }
  return tablas
}

// ------------------------------------------------------------------ métricas CK
function analizarClases() {
  const clases = []
  const archs = archivos(join(raiz, 'backend', 'src'), ['.ts'])
  for (const f of archs) {
    const sf = ts.createSourceFile(f, leer(f), ts.ScriptTarget.Latest, true)
    // nombres importados de archivos del proyecto (rutas relativas): base del acoplamiento
    const importados = new Set()
    for (const s of sf.statements) {
      if (ts.isImportDeclaration(s) && s.moduleSpecifier.getText(sf).slice(1).startsWith('.') && s.importClause?.namedBindings && ts.isNamedImports(s.importClause.namedBindings)) {
        for (const e of s.importClause.namedBindings.elements) importados.add(e.name.text)
      }
    }
    const visita = (n) => {
      if (ts.isClassDeclaration(n) && n.name) {
        const nombre = n.name.text
        const metodos = n.members.filter((m) => (ts.isMethodDeclaration(m) || ts.isGetAccessor(m) || ts.isSetAccessor(m)) && m.body)
        const ctor = n.members.find((m) => ts.isConstructorDeclaration(m))
        const hereda = n.heritageClauses?.find((h) => h.token === ts.SyntaxKind.ExtendsKeyword)?.types[0]?.expression.getText(sf)
        const implementa = n.heritageClauses?.find((h) => h.token === ts.SyntaxKind.ImplementsKeyword)?.types.map((t) => t.expression.getText(sf)) ?? []
        // campos usados por método (this.x)
        const usos = metodos.map((m) => {
          const s = new Set()
          const v = (x) => { if (ts.isPropertyAccessExpression(x) && x.expression.kind === ts.SyntaxKind.ThisKeyword) s.add(x.name.text); ts.forEachChild(x, v) }
          v(m)
          return s
        })
        let P = 0, Q = 0
        for (let i = 0; i < usos.length; i++) for (let j = i + 1; j < usos.length; j++) {
          if ([...usos[i]].some((x) => usos[j].has(x))) Q++
          else P++
        }
        // acoplamiento: símbolos del proyecto (importados) mencionados dentro de la clase, salvo ella misma
        const usados = new Set()
        const ids = (x) => { if (ts.isIdentifier(x) && importados.has(x.text) && x.text !== nombre) usados.add(x.text); ts.forEachChild(x, ids) }
        ids(n)
        // respuesta: métodos propios + métodos/funciones distintos invocados
        const llamadas = new Set()
        const calls = (x) => {
          if (ts.isCallExpression(x)) {
            const e = x.expression
            if (ts.isPropertyAccessExpression(e)) llamadas.add(e.name.text)
            else if (ts.isIdentifier(e)) llamadas.add(e.text)
          }
          ts.forEachChild(x, calls)
        }
        calls(n)
        const propios = new Set(metodos.map((m) => m.name?.getText(sf)))
        clases.push({
          clase: nombre, archivo: rel(f), hereda, implementa,
          wmc: metodos.length + (ctor && ctor.body && ctor.body.statements.length ? 1 : 0),
          wmcCC: metodos.reduce((s, m) => s + complejidad(m), 0) + (ctor?.body ? complejidad(ctor) - 1 : 0),
          cbo: usados.size, rfc: metodos.length + [...llamadas].filter((x) => !propios.has(x)).length, lcom: Math.max(0, P - Q), cuenta: metodos.length,
        })
      }
      ts.forEachChild(n, visita)
    }
    visita(sf)
  }
  const nombres = new Map(clases.map((c) => [c.clase, c]))
  const dit = (c) => (c.hereda ? 1 + (nombres.has(c.hereda) ? dit(nombres.get(c.hereda)) : 0) : 0)
  return clases.map((c) => ({ ...c, dit: dit(c), noc: clases.filter((o) => o.hereda === c.clase).length })).sort((a, b) => a.archivo.localeCompare(b.archivo))
}

// ------------------------------------------------------------------ puntos de función
const PESOS = { EI: { baja: 3, media: 4, alta: 6 }, EO: { baja: 4, media: 5, alta: 7 }, EQ: { baja: 3, media: 4, alta: 6 }, ILF: { baja: 7, media: 10, alta: 15 }, EIF: { baja: 5, media: 7, alta: 10 } }
const SALIDAS = new Set(['/api/teacher/dashboard', '/api/teacher/reports', '/api/teacher/reports.csv'])
/** Propuesta de complejidad por endpoint; el humano la confirma contando archivos referenciados (FTR) y campos (DET). */
function propuestaEndpoint(r) {
  if (r.ruta === '/api/exercises/:id/submissions') return ['EI', 'alta', 'Valida el código, ejecuta el corrector, escribe intento + evento y puede otorgar insignias (≥ 4 archivos lógicos).']
  if (r.ruta === '/api/exercises/:id/ai-hint') return ['EI', 'alta', 'Lee intento y ejercicio, llama a un proveedor externo y escribe pista_ia (límites y respaldo).']
  if (SALIDAS.has(r.ruta)) return ['EO', r.ruta.endsWith('.csv') ? 'media' : 'alta', 'Agrega datos de varios archivos lógicos con cálculo derivado (porcentajes, atención).']
  if (r.metodo === 'GET') return ['EQ', /^\/api\/(me\/(home|progress|profile|exercises\/:id|lessons\/:id)|teacher\/content)$/.test(r.ruta) || /\/me\/(exercises|lessons)\/:id$/.test(r.ruta) ? 'media' : 'baja', 'Consulta sin cálculo derivado significativo.']
  if (r.ruta.startsWith('/api/teacher/content')) return ['EI', /exercises/.test(r.ruta) && r.metodo !== 'POST' || r.ruta.endsWith('/exercises') ? 'alta' : 'media', 'Crea o modifica contenido (varios campos); los ejercicios incluyen casos de prueba.']
  if (r.ruta.startsWith('/api/auth')) return ['EI', 'media', 'Valida credenciales/datos y accede a usuario.']
  return ['EI', 'baja', 'Escritura sobre un solo archivo lógico.']
}

// ------------------------------------------------------------------ cobertura (reportes existentes)
function cobertura(dir) {
  const p = join(raiz, dir, 'coverage', 'coverage-summary.json')
  if (!existsSync(p)) return null
  const t = JSON.parse(leer(p)).total
  return { lineas: t.lines, ramas: t.branches, funciones: t.functions, sentencias: t.statements }
}

// ------------------------------------------------------------------ reporte
const fmt = (n, d = 2) => n.toFixed(d).replace('.', ',')
const filasLoc = (g) => {
  const t = g.reduce((a, [, x]) => ({ archivos: a.archivos + x.archivos, codigo: a.codigo + x.codigo, comentarios: a.comentarios + x.comentarios, blancos: a.blancos + x.blancos }), { archivos: 0, codigo: 0, comentarios: 0, blancos: 0 })
  const fila = (n, x) => `| ${n} | ${x.archivos} | ${x.codigo} | ${x.comentarios} | ${x.blancos} | ${x.codigo + x.comentarios + x.blancos} | ${fmt((100 * x.comentarios) / Math.max(1, x.codigo + x.comentarios), 1)} % |`
  return [...g.map(([n, x]) => fila(`\`${n}\``, x)), fila('**Total**', t)]
}
const cabLoc = ['| Carpeta | Archivos | Código | Comentarios | Blancos | Total | Comentarios / (código + comentarios) |', '|---|---|---|---|---|---|---|']

const locBack = locPorGrupo(join(raiz, 'backend'), grupoBackend)
const locFront = locPorGrupo(join(raiz, 'frontend'), grupoFrontend)
const locCss = locPorGrupo(join(raiz, 'frontend', 'src'), () => 'frontend/src/styles (CSS)', ['.css'])
const locSql = (() => {
  let c = 0, a = 0
  for (const f of archivos(join(raiz, 'backend', 'db', 'migrations'), ['.sql'])) { a++; c += leer(f).split('\n').filter((l) => l.trim() && !l.trim().startsWith('--')).length }
  return { a, c }
})()
const locE2e = locPorGrupo(join(raiz, 'e2e'), (r) => (r.split('/')[1] === 'tests' || r.split('/')[1] === 'manual' ? `e2e/${r.split('/')[1]}` : 'e2e (soporte y config)'), ['.ts'])

const ccBack = analizarComplejidad(archivos(join(raiz, 'backend', 'src'), ['.ts']))
const ccFront = analizarComplejidad(archivos(join(raiz, 'frontend', 'src'), ['.ts', '.tsx']).filter((f) => !/\.test\.tsx?$/.test(f) && !f.includes(`${sep}mocks${sep}`)))
const rutas = leerRutas()
const tablas = leerTablas()
const clases = analizarClases()
const cb = cobertura('backend'), cf = cobertura('frontend')

const top = (f) => [...f].sort((a, b) => b.cc - a.cc).slice(0, 10)
const resumenFila = (n, f) => { const r = resumenCC(f); return `| ${n} | ${r.n} | ${fmt(r.prom)} | ${r.max} | ${r.tramos[0]} | ${r.tramos[1]} | ${r.tramos[2]} | ${r.tramos[3]} |` }
const tablaTop = (f) => ['| # | Función | Archivo : línea | CC |', '|---|---|---|---|', ...top(f).map((x, i) => `| ${i + 1} | \`${x.nombre}\` | \`${x.archivo}\`:${x.linea} | ${x.cc} |`)]

const ep = rutas.map((r) => ({ ...r, prop: propuestaEndpoint(r) }))
const cuenta = (tipo) => ep.filter((e) => e.prop[0] === tipo).length
const ufp = ep.reduce((s, e) => s + PESOS[e.prop[0]][e.prop[1]], 0)
const complejidadTabla = (t) => (t.columnas >= 15 ? 'alta' : t.columnas >= 7 ? 'media' : 'baja')
const ilf = tablas.map((t) => ({ ...t, comp: complejidadTabla(t) }))
const ufpIlf = ilf.reduce((s, t) => s + PESOS.ILF[t.comp], 0)
const eif = [
  ['Motor de corrección (Docker, vía socket)', 'media', 'Interfaz externa: ejecuta el código del estudiante en un contenedor `python:3.12-alpine` (`DockerRunner`).'],
  ['Proveedor de IA (Gemini o Anthropic, HTTPS)', 'media', 'Interfaz externa opcional detrás del puerto `HintProvider`.'],
  ['Servidor SMTP (correo de n8n)', 'baja', 'Interfaz externa usada por los workflows de n8n (insignia obtenida, resumen semanal).'],
]
const ufpEif = eif.reduce((s, e) => s + PESOS.EIF[e[1]], 0)

const L = []
L.push(
  '# Métricas de código (11.5), puntos de función (11.2) y métricas CK (11.3)',
  '',
  `- **Fecha:** ${new Date().toLocaleString('es-CO', { dateStyle: 'long', timeStyle: 'short' })}`,
  `- **Equipo:** ${os.hostname()} · ${os.type()} ${os.release()} · ${os.cpus()[0]?.model.trim()} (${os.cpus().length} hilos) · ${(os.totalmem() / 2 ** 30).toFixed(1)} GiB de RAM · Node ${process.version}`,
  '- **Equipo de desarrollo:** autores del proyecto, Ingeniería de Sistemas y Computación, UPTC (Software II).',
  '- **Cómo se obtiene:** `node scripts/metricas.mjs` (o `npm run metrics`). Lee el código con el compilador de TypeScript instalado en `backend/`; no se inventa ninguna cifra. Los reportes de cobertura se leen de `backend/coverage` y `frontend/coverage` (genéralos antes con `node scripts/informes.mjs cobertura`).',
  '',
  '## 1. Líneas de código por carpeta',
  '',
  'Una línea es **código** si tiene al menos un token que no sea comentario; **comentario** si solo tiene comentarios; **blanca** si está vacía. Se cuentan archivos `.ts` y `.tsx`.',
  '',
  '### Backend (`backend/`)', '', ...cabLoc, ...filasLoc(locBack), '',
  '### Frontend (`frontend/`)', '', ...cabLoc, ...filasLoc(locFront), '',
  '### Otros', '',
  `- Estilos CSS del frontend: ${locCss.map(([, x]) => `${x.archivos} archivos, ${x.codigo} líneas`).join('')}.`,
  `- Migraciones SQL: ${locSql.a} archivos, ${locSql.c} líneas de sentencias (sin comentarios ni blancos).`,
  '',
  '### Pruebas E2E (`e2e/`)', '', ...cabLoc, ...filasLoc(locE2e), '',
  '## 2. Complejidad ciclomática (por función)',
  '',
  'McCabe: 1 + número de decisiones (`if`, `?:`, `for`, `for…in/of`, `while`, `do`, `case`, `catch`, `&&`, `||`, `??`). Cada función (declaración, expresión, flecha, método, constructor, `get/set`) se mide por separado; una función anidada no suma a la que la contiene. Se excluyen pruebas y mocks. **No coincide exactamente con la regla `complexity` de ESLint** (que cuenta además `?.` y valores por omisión), por eso `estaticas.md` puede dar un número de funciones por encima de 10 ligeramente distinto.',
  '',
  '| Proyecto | Funciones | CC promedio | CC máxima | CC 1–5 | CC 6–10 | CC 11–20 | CC > 20 |', '|---|---|---|---|---|---|---|---|',
  resumenFila('Backend', ccBack), resumenFila('Frontend', ccFront), '',
  '### Top 10 del backend', '', ...tablaTop(ccBack), '',
  '### Top 10 del frontend', '', ...tablaTop(ccFront), '',
  '## 3. Cobertura de pruebas (reportes existentes)',
  '',
  '| Proyecto | Líneas | Sentencias | Funciones | Ramas |', '|---|---|---|---|---|',
  ...[['Backend', cb], ['Frontend', cf]].map(([n, c]) => (c ? `| ${n} | ${fmt(c.lineas.pct)} % (${c.lineas.covered}/${c.lineas.total}) | ${fmt(c.sentencias.pct)} % | ${fmt(c.funciones.pct)} % | ${fmt(c.ramas.pct)} % |` : `| ${n} | sin reporte (corre \`node scripts/informes.mjs cobertura\`) | | | |`)),
  '',
  'Detalle por carpeta y por archivo de prueba en [`cobertura.md`](cobertura.md). El frontend queda bajo a propósito: las pantallas las cubre el E2E (ver [`e2e.md`](e2e.md)), que no cuenta en esta métrica.',
  '',
  '## 4. Insumos para puntos de función (11.2)',
  '',
  `Se enumeran los elementos funcionales **leyendo los routers reales** (${rutas.length} endpoints), las migraciones (${tablas.length} tablas) y las integraciones externas. La columna «Propuesta» es una sugerencia automática; **el equipo debe confirmarla** contando tipos de archivo referenciados (FTR) y campos (DET) según la tabla de complejidad de IFPUG, y elegir el factor de ajuste (14 características) para pasar de puntos sin ajustar (UFP) a ajustados (FP).`,
  '',
  '| Tipo | Cantidad | UFP con la propuesta |', '|---|---|---|',
  `| Entradas externas (EI): POST/PUT/PATCH | ${cuenta('EI')} | ${ep.filter((e) => e.prop[0] === 'EI').reduce((s, e) => s + PESOS.EI[e.prop[1]], 0)} |`,
  `| Salidas externas (EO): reportes y CSV del docente | ${cuenta('EO')} | ${ep.filter((e) => e.prop[0] === 'EO').reduce((s, e) => s + PESOS.EO[e.prop[1]], 0)} |`,
  `| Consultas externas (EQ): GET | ${cuenta('EQ')} | ${ep.filter((e) => e.prop[0] === 'EQ').reduce((s, e) => s + PESOS.EQ[e.prop[1]], 0)} |`,
  `| Archivos lógicos internos (ILF): tablas | ${ilf.length} | ${ufpIlf} |`,
  `| Interfaces externas (EIF) | ${eif.length} | ${ufpEif} |`,
  `| **Total sin ajustar (propuesta)** | | **${ufp + ufpIlf + ufpEif}** |`,
  '',
  'Pesos IFPUG usados en la propuesta: EI 3/4/6, EO 4/5/7, EQ 3/4/6, ILF 7/10/15, EIF 5/7/10 (baja/media/alta). `GET /api/health` cuenta como consulta de infraestructura; el equipo puede excluirlo.',
  '',
  '### 4.1 Entradas, salidas y consultas (endpoints)', '',
  '| Tipo | Método | Ruta | Acceso | Complejidad propuesta | Peso | Justificación (propuesta) | Complejidad del equipo | Peso del equipo |', '|---|---|---|---|---|---|---|---|---|',
  ...ep.map((e) => `| ${e.prop[0]} | ${e.metodo} | \`${e.ruta}\` | ${e.roles} | ${e.prop[1]} | ${PESOS[e.prop[0]][e.prop[1]]} | ${e.prop[2]} | | |`),
  '',
  '### 4.2 Archivos lógicos internos (tablas)', '',
  '| Tabla | Columnas | Migración | Complejidad propuesta | Peso | Complejidad del equipo | Peso del equipo |', '|---|---|---|---|---|---|---|',
  ...ilf.map((t) => `| \`${t.nombre}\` | ${t.columnas} | ${t.migracion} | ${t.comp} | ${PESOS.ILF[t.comp]} | | |`),
  '',
  'La vista `v_progreso` y la tabla de control `schema_migrations` no se cuentan. La propuesta de complejidad usa solo el número de columnas (≥ 15 alta, 7–14 media, < 7 baja).',
  '',
  '### 4.3 Interfaces externas (EIF)', '',
  '| Interfaz | Complejidad propuesta | Peso | Nota | Complejidad del equipo | Peso del equipo |', '|---|---|---|---|---|---|',
  ...eif.map((e) => `| ${e[0]} | ${e[1]} | ${PESOS.EIF[e[1]]} | ${e[2]} | | |`),
  '',
  '## 5. Métricas CK de las clases del backend (11.3)',
  '',
  `Se analizaron ${clases.length} clases de \`backend/src\` con el compilador de TypeScript. Las definiciones son aproximaciones calculadas sobre el código fuente:`,
  '',
  '- **WMC**: número de métodos con cuerpo (más el constructor si hace algo). **WMC (ΣCC)** suma la complejidad ciclomática de esos métodos.',
  '- **DIT**: profundidad en la jerarquía de herencia dentro del proyecto (`Error` cuenta como 1 nivel). **NOC**: subclases directas.',
  '- **CBO** (aprox.): símbolos del proyecto (clases, interfaces y tipos importados con ruta relativa) mencionados dentro de la clase.',
  '- **RFC** (aprox.): métodos propios + nombres distintos de métodos/funciones invocados dentro de la clase.',
  '- **LCOM** (Chidamber-Kemerer): pares de métodos que no comparten campos (`this.x`) menos pares que sí comparten, mínimo 0.',
  '',
  '| Clase | Archivo | WMC | WMC (ΣCC) | DIT | NOC | CBO | RFC | LCOM |', '|---|---|---|---|---|---|---|---|---|',
  ...clases.map((c) => `| \`${c.clase}\` | \`${c.archivo.replace('backend/src/', '')}\` | ${c.wmc} | ${c.wmcCC} | ${c.dit} | ${c.noc} | ${c.cbo} | ${c.rfc} | ${c.lcom} |`),
  '',
  `Promedios: WMC ${fmt(clases.reduce((s, c) => s + c.wmc, 0) / clases.length, 1)}, CBO ${fmt(clases.reduce((s, c) => s + c.cbo, 0) / clases.length, 1)}, RFC ${fmt(clases.reduce((s, c) => s + c.rfc, 0) / clases.length, 1)}, LCOM ${fmt(clases.reduce((s, c) => s + c.lcom, 0) / clases.length, 1)}. ` +
    'Las clases que implementan un puerto (`implements`) no heredan, por eso DIT y NOC son casi siempre 0: la arquitectura hexagonal favorece la composición sobre la herencia. Las reglas de negocio de los módulos de progreso y evaluación están en **funciones puras** (no en clases), por lo que no aparecen en esta tabla; su complejidad está en la sección 2.',
  '',
  '## Interpretación',
  '',
  '> **Pendiente (equipo):** interpretar estas cifras en el documento (11.2, 11.3, 11.5): umbrales usados, comparación con valores de referencia y acciones sobre las funciones con CC > 10.',
  '',
)
const out = join(raiz, 'docs', 'evidencias')
mkdirSync(out, { recursive: true })
writeFileSync(join(out, 'metricas.md'), L.join('\n'))
console.log(`Escrito docs/evidencias/metricas.md (${rutas.length} endpoints, ${tablas.length} tablas, ${clases.length} clases)`)
