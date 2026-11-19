// Prueba de carga (documento IW 8.1.2, RNF-03). Se ejecuta con la imagen grafana/k6, sin instalar nada:
//   docker run --rm -i -v "<repo>/perf:/scripts" -e BASE_URL=http://host.docker.internal:3000/api grafana/k6 run /scripts/carga.js
// (o `perf/ejecutar-carga.ps1`, que además mide el consumo con docker stats y genera docs/evidencias/carga.md).
//
// Supuestos del documento: 60 usuarios concurrentes navegando, 30 envíos de ejercicio por minuto y 5 docentes
// consultando el panel. Umbrales: p95 de envío < 3 s, p95 de lectura < 500 ms, errores < 1 %.
import http from 'k6/http'
import { check, sleep } from 'k6'
import exec from 'k6/execution'

const BASE = __ENV.BASE_URL || 'http://host.docker.internal:3000/api'
const DURACION = __ENV.DURACION || '3m'
const VUS = Number(__ENV.VUS || 60) // usuarios concurrentes navegando
const POOL = Number(__ENV.POOL || 150) // estudiantes registrados (el documento asume 150 usuarios)
const DOCENTES = Number(__ENV.DOCENTES || 5)
const ENVIOS_POR_MIN = Number(__ENV.ENVIOS_POR_MIN || 30)
const RUN = __ENV.RUN_ID || Date.now().toString(36)
const PASSWORD = 'Carga1234'
const JSON_H = { 'Content-Type': 'application/json' }

export const options = {
  setupTimeout: '300s',
  scenarios: {
    navegacion: { executor: 'constant-vus', vus: VUS, duration: DURACION, exec: 'navegar' },
    envios: {
      executor: 'constant-arrival-rate',
      rate: ENVIOS_POR_MIN,
      timeUnit: '1m',
      duration: DURACION,
      preAllocatedVUs: 20,
      maxVUs: 60,
      exec: 'enviar',
    },
    docentes: { executor: 'constant-vus', vus: DOCENTES, duration: DURACION, exec: 'docente' },
  },
  thresholds: {
    'http_req_duration{type:submit}': ['p(95)<3000'],
    'http_req_duration{type:read}': ['p(95)<500'],
    'http_req_failed{type:submit}': ['rate<0.01'],
    'http_req_failed{type:read}': ['rate<0.01'],
    http_req_failed: ['rate<0.01'],
    // Sin umbral propio: solo para que cada endpoint aparezca desglosado en el resumen.
    'http_req_duration{name:me_home}': ['p(95)<500'],
    'http_req_duration{name:me_modules}': ['p(95)<500'],
    'http_req_duration{name:me_lesson}': ['p(95)<500'],
    'http_req_duration{name:dashboard}': ['p(95)<500'],
    'http_req_duration{name:submit_ok}': ['p(95)<3000'],
    'http_req_duration{name:submit_fail}': ['p(95)<3000'],
    checks: ['rate>0.99'],
  },
}

const auth = (token) => ({ Authorization: `Bearer ${token}` })

// Los correos empiezan por e2e-: la limpieza de e2e/cleanup.sql los borra al terminar.
export function setup() {
  const estudiantes = []
  for (let i = 0; i < POOL; i += 10) {
    const lote = []
    for (let j = i; j < Math.min(i + 10, POOL); j++) {
      lote.push(['POST', `${BASE}/auth/register`, JSON.stringify({ name: `Carga ${j}`, email: `e2e-carga-${RUN}-${j}@uptc.edu.co`, password: PASSWORD }), { headers: JSON_H }])
    }
    for (const r of http.batch(lote)) {
      if (r.status !== 201) throw new Error(`Registro de carga falló: ${r.status} ${r.body}`)
      estudiantes.push(r.json('token'))
    }
  }
  const l = http.post(`${BASE}/auth/login`, JSON.stringify({ email: 'docente@uptc.edu.co', password: 'Demo1234' }), { headers: JSON_H })
  if (l.status !== 200) throw new Error(`Login docente falló: ${l.status}. ¿Se ejecutó npm run seed?`)
  return { estudiantes, docente: l.json('token') }
}

export function navegar(data) {
  const token = data.estudiantes[(exec.vu.idInTest - 1) % data.estudiantes.length]
  const p = { headers: auth(token), tags: { type: 'read' } }
  const leccion = 1 + Math.floor(Math.random() * 25)
  const rutas = [
    ['me_home', `${BASE}/me/home`],
    ['me_modules', `${BASE}/me/modules`],
    ['me_lesson', `${BASE}/me/lessons/${leccion}`],
  ]
  for (const [name, url] of rutas) {
    const r = http.get(url, { ...p, tags: { ...p.tags, name } })
    check(r, { [`${name} 200`]: (x) => x.status === 200 })
    sleep(1 + Math.random() * 2) // tiempo de lectura
  }
}

const OK = 'def saludar():\n    print("Hola, UPTC")'
const MAL = 'def saludar():\n    print("Hola")'

export function enviar(data) {
  // Reparte los envíos entre los usuarios: así ninguno supera el límite de 10 envíos por minuto.
  const n = exec.scenario.iterationInTest
  const token = data.estudiantes[n % data.estudiantes.length]
  const acierto = n % 2 === 0
  const r = http.post(`${BASE}/exercises/1/submissions`, JSON.stringify({ code: acierto ? OK : MAL, hintsUsed: 0 }), {
    headers: { ...JSON_H, ...auth(token) },
    tags: { type: 'submit', name: acierto ? 'submit_ok' : 'submit_fail' },
  })
  check(r, { 'envío 200': (x) => x.status === 200, 'veredicto esperado': (x) => x.status === 200 && x.json('passed') === acierto })
}

export function docente(data) {
  const r = http.get(`${BASE}/teacher/dashboard`, { headers: auth(data.docente), tags: { type: 'read', name: 'dashboard' } })
  check(r, { 'dashboard 200': (x) => x.status === 200 })
  sleep(2 + Math.random() * 2)
}
