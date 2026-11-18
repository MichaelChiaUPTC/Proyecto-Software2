// Genera docs/manual/manual-usuario.pdf y docs/manual/manual-programador.pdf a partir de los .md (para leerlos en el celular).
//   npm run manuales            (requiere `npm install` en la raíz y `npm install` en e2e/ con Chromium: npx playwright install chromium)
// Markdown -> HTML con `marked`; los diagramas Mermaid se dibujan con mermaid desde jsDelivr (necesita internet al generar;
// si no hay, quedan como bloques de código); se imprime con Chromium (Playwright). Las imágenes se toman de docs/manual/img/.
import { existsSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { basename, dirname, join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { marked } from 'marked'

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..')
const dirManual = join(raiz, 'docs', 'manual')
const { chromium } = createRequire(join(raiz, 'e2e', 'package.json'))('@playwright/test')

const MANUALES = [
  // Opcional: `npm run manuales -- ../diagramas.md` genera también ese archivo (ruta relativa a docs/manual/).
  ...process.argv.slice(2).map((a) => ({ md: a, pdf: a.replace(/^.*[\/]/, '').replace(/.md$/, '.pdf'), titulo: 'Diagramas', subtitulo: 'Lógica UPTC · Diagramas del sistema', saltos: /^(?!)/ })),
  { md: 'manual-usuario.md', pdf: 'manual-usuario.pdf', titulo: 'Manual de usuario', subtitulo: 'Lógica UPTC · Plataforma educativa de práctica de programación', saltos: /^(Guía para|Preguntas frecuentes|Solución de problemas)/ },
  { md: 'manual-programador.md', pdf: 'manual-programador.pdf', titulo: 'Manual del programador', subtitulo: 'Lógica UPTC · Plataforma educativa de práctica de programación', saltos: /^(?!)/ }, // sin saltos forzados: las secciones fluyen
]

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
const slug = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

function aHtml(fuente, { saltos }) {
  const toc = []
  const renderer = {
    heading({ tokens, depth }) {
      const texto = this.parser.parseInline(tokens)
      const plano = tokens.map((t) => t.raw ?? t.text ?? '').join('').replace(/[`*_]/g, '')
      const id = slug(plano)
      if (depth === 2) toc.push({ id, texto: plano })
      const salto = depth === 2 && saltos.test(plano) ? ' class="salto"' : ''
      return `<h${depth} id="${id}"${salto}>${texto}</h${depth}>\n`
    },
    image({ href, text }) {
      const movil = /movil/.test(href) ? ' movil' : ''
      return `<figure class="${movil.trim()}"><img src="${esc(href)}" alt="${esc(text)}"><figcaption>${esc(text)}</figcaption></figure>`
    },
    code({ text, lang }) {
      if (lang === 'mermaid') return `<pre class="mermaid">${esc(text)}</pre>\n`
      return `<pre><code${lang ? ` class="lenguaje-${esc(lang)}"` : ''}>${esc(text)}</code></pre>\n`
    },
  }
  marked.use({ renderer, gfm: true })
  const cuerpo = marked.parse(fuente)
  return { cuerpo, toc }
}

const CSS = `
@page { size: A4; margin: 18mm 16mm 20mm 16mm; }
* { box-sizing: border-box; }
body { font: 10.5pt/1.55 "Segoe UI", Inter, Arial, sans-serif; color: #1c2528; margin: 0; }
h1, h2, h3, h4 { font-family: inherit; color: #0b4f4a; line-height: 1.25; break-after: avoid; }
h1 { font-size: 22pt; margin: 0 0 6mm; }
h2 { font-size: 16pt; margin: 9mm 0 3mm; border-bottom: 1.5px solid #0b6b66; padding-bottom: 1.5mm; }
h2.salto { break-before: page; margin-top: 0; }
h3 { font-size: 12.5pt; margin: 6mm 0 2mm; }
h4 { font-size: 11pt; margin: 4mm 0 1mm; }
p, li { orphans: 3; widows: 3; }
a { color: #0b6b66; text-decoration: none; }
code { font: 9pt "Cascadia Mono", Consolas, monospace; background: #eef2f2; padding: 0.4mm 1.2mm; border-radius: 2px; }
pre { background: #f3f6f6; border: 1px solid #d9e1e1; border-radius: 4px; padding: 3mm; overflow-wrap: anywhere; white-space: pre-wrap; break-inside: avoid; font-size: 8.6pt; }
pre code { background: none; padding: 0; font-size: inherit; }
pre.mermaid { background: #fff; text-align: center; white-space: normal; border-style: dashed; }
pre.mermaid svg { max-width: 100%; height: auto; }
table { border-collapse: collapse; width: 100%; margin: 3mm 0; font-size: 9pt; }
th, td { border: 1px solid #cfd8d8; padding: 1.4mm 2mm; text-align: left; vertical-align: top; overflow-wrap: anywhere; }
th { background: #e6efee; }
tr { break-inside: avoid; }
blockquote { margin: 3mm 0; padding: 2mm 4mm; border-left: 3px solid #e0a100; background: #fff7e0; }
blockquote p { margin: 1mm 0; }
figure { margin: 4mm 0; text-align: center; break-inside: avoid; }
figure img { max-width: 100%; max-height: 165mm; border: 1px solid #cfd8d8; border-radius: 4px; }
figure.movil img { max-height: 135mm; max-width: 62mm; }
figcaption { font-size: 8.8pt; color: #566669; margin-top: 1.5mm; }
.portada { height: 235mm; display: flex; flex-direction: column; justify-content: center; break-after: page; }
.portada h1 { font-size: 34pt; border: 0; }
.portada p { font-size: 13pt; color: #44575a; margin: 1mm 0; }
.portada .pie { margin-top: 20mm; font-size: 10pt; color: #6a7b7e; }
.indice { break-after: page; }
.indice h2 { border: 0; }
.indice ol { columns: 1; padding-left: 6mm; }
hr { border: 0; border-top: 1px solid #d9e1e1; margin: 5mm 0; }
`

function pagina(m, fuente) {
  const { cuerpo, toc } = aHtml(fuente, m)
  const fecha = new Date().toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' })
  // El primer <h1> del .md es el título del documento: se saca para la portada.
  const sinTitulo = cuerpo.replace(/<h1[^>]*>[\s\S]*?<\/h1>\n?/, '')
  return `<!doctype html><html lang="es"><head><meta charset="utf-8"><title>${esc(m.titulo)}</title><style>${CSS}</style></head><body>
<section class="portada"><p>Universidad Pedagógica y Tecnológica de Colombia</p><h1>${esc(m.titulo)}</h1><p>${esc(m.subtitulo)}</p><p class="pie">Versión del ${fecha}</p></section>
<section class="indice"><h2>Contenido</h2><ol>${toc.map((t) => `<li><a href="#${t.id}">${esc(t.texto)}</a></li>`).join('')}</ol></section>
${sinTitulo}
<script src="https://cdn.jsdelivr.net/npm/mermaid@11.4.1/dist/mermaid.min.js"></script>
</body></html>`
}

async function dibujarMermaid(page) {
  const hay = await page.locator('pre.mermaid').count()
  if (!hay) return
  const cargado = await page.evaluate(() => typeof window.mermaid !== 'undefined')
  if (!cargado) { console.warn('  Aviso: mermaid no se pudo cargar (¿sin internet?); los diagramas quedan como código.'); return }
  await page.evaluate(async () => {
    window.mermaid.initialize({ startOnLoad: false, theme: 'neutral', securityLevel: 'loose', flowchart: { useMaxWidth: true }, er: { useMaxWidth: true }, sequence: { useMaxWidth: true, wrap: true, width: 80, actorMargin: 8, messageFontSize: 15, actorFontSize: 15, noteFontSize: 14, mirrorActors: false } })
    await window.mermaid.run({ querySelector: 'pre.mermaid' })
  })
  const errores = await page.locator('pre.mermaid:not(:has(svg)), pre.mermaid:has-text("Syntax error")').count()
  if (errores) console.warn(`  Aviso: ${errores} diagrama(s) no se pudieron dibujar y quedan como código.`)
}

const navegador = await chromium.launch()
try {
  for (const m of MANUALES) {
    const origen = join(dirManual, m.md)
    if (!existsSync(origen)) { console.warn(`No existe ${m.md}; se omite.`); continue }
    const tmp = join(dirManual, `.${basename(m.md)}.html`)
    writeFileSync(tmp, pagina(m, readFileSync(origen, 'utf8')))
    const page = await navegador.newPage()
    await page.goto(pathToFileURL(tmp).href, { waitUntil: 'load' })
    await page.waitForLoadState('networkidle').catch(() => {})
    await dibujarMermaid(page)
    await page.evaluate(() => Promise.all([document.fonts.ready, ...[...document.images].map((i) => (i.complete ? 0 : new Promise((ok) => { i.onload = i.onerror = ok })))]))
    const rotas = await page.evaluate(() => [...document.images].filter((i) => !i.naturalWidth).map((i) => i.getAttribute('src')))
    if (rotas.length) console.warn(`  Aviso: imágenes que no cargaron: ${rotas.join(', ')}`)
    await page.pdf({
      path: join(dirManual, m.pdf.includes('/') ? m.pdf : m.pdf), format: 'A4', printBackground: true, displayHeaderFooter: true, margin: { top: '18mm', bottom: '20mm', left: '16mm', right: '16mm' },
      headerTemplate: '<div></div>',
      footerTemplate: `<div style="font:8px sans-serif;color:#6a7b7e;width:100%;padding:0 16mm;display:flex;justify-content:space-between"><span>${esc(m.titulo)} · Lógica UPTC</span><span><span class="pageNumber"></span> / <span class="totalPages"></span></span></div>`,
    })
    await page.close()
    rmSync(tmp, { force: true })
    console.log(`Escrito docs/manual/${m.pdf}`)
  }
} finally {
  await navegador.close()
}
