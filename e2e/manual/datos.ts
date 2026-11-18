import { spawnSync } from 'node:child_process'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { apiContext, loginApi, registerApi } from '../support/api'
import { DEMO } from '../support/env'

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..', '..')

function sql(texto: string) {
  const r = spawnSync('docker', ['compose', 'exec', '-T', 'mysql', 'mysql', `-u${process.env.DB_USER ?? 'uptc'}`, `-p${process.env.DB_PASSWORD ?? 'uptc_dev'}`, process.env.DB_NAME ?? 'uptc'], {
    cwd: raiz, input: texto, encoding: 'utf8',
  })
  if (r.status !== 0) throw new Error(`SQL fallido: ${r.stderr}`)
}

/** Estudiantes de ejemplo para los reportes del docente y la lista de usuarios del administrador. */
export const ALUMNOS = [
  { nombre: 'Laura Gómez Díaz', correo: 'laura.gomez@uptc.edu.co', resueltos: [1, 2, 3, 4, 5, 8], lecciones: [1, 2, 3, 4, 5, 6, 7], fallos: [] as number[] },
  { nombre: 'Andrés Felipe Vargas', correo: 'andres.vargas@uptc.edu.co', resueltos: [1, 2], lecciones: [1, 2], fallos: [] },
  { nombre: 'Daniela Ortiz Muñoz', correo: 'daniela.ortiz@uptc.edu.co', resueltos: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11], lecciones: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13], fallos: [] },
  { nombre: 'Juan Sebastián Pardo', correo: 'juan.pardo@uptc.edu.co', resueltos: [], lecciones: [1], fallos: [1, 1, 2, 2, 3] },
  { nombre: 'Valentina Castro Rivera', correo: 'valentina.castro@uptc.edu.co', resueltos: [1, 2, 3, 4, 5, 6, 7], lecciones: [1, 2, 3, 4, 5, 6, 7, 8, 9], fallos: [] },
  { nombre: 'Miguel Ángel Suárez', correo: 'miguel.suarez@uptc.edu.co', resueltos: [], lecciones: [], fallos: [] },
]
const CORREOS = ALUMNOS.map((a) => `'${a.correo}'`).join(',')
const TITULO_MODULO = 'Cadenas de texto'

/** Borra lo que crea este script (alumnos de ejemplo y módulo borrador) y, si se pide, la actividad del estudiante demo. */
export function limpiar(incluirDemo = false) {
  const quien = `(SELECT id_usuario FROM usuario WHERE correo IN (${CORREOS}${incluirDemo ? `,'${DEMO.student}'` : ''}))`
  sql(`
    DELETE FROM evento_outbox WHERE CAST(JSON_UNQUOTE(JSON_EXTRACT(payload, '$.usuarioId')) AS UNSIGNED) IN ${quien};
    DELETE FROM pista_ia WHERE id_usuario IN ${quien};
    DELETE FROM intento WHERE id_usuario IN ${quien};
    DELETE FROM usuario_insignia WHERE id_usuario IN ${quien};
    DELETE FROM leccion_completada WHERE id_usuario IN ${quien};
    DELETE FROM usuario WHERE correo IN (${CORREOS});
    DELETE FROM modulo WHERE titulo = '${TITULO_MODULO}';
  `)
}

type Contenido = { exercises: { id: string; expectedAnswer: string }[] }
type Api = Awaited<ReturnType<typeof apiContext>>

const FALLO = 'def intento():\n    pass'

async function enviar(api: Api, ejercicio: number, codigo: string) {
  for (let i = 0; i < 10; i++) {
    const r = await api.post(`exercises/${ejercicio}/submissions`, { data: { code: codigo, hintsUsed: 0 } })
    if (r.status() !== 429) return
    await new Promise((ok) => setTimeout(ok, 8000)) // límite de 10 envíos por minuto y usuario
  }
  throw new Error('Límite de envíos')
}

async function darProgreso(token: string, soluciones: Map<number, string>, resueltos: number[], lecciones: number[], fallos: number[], fallarAntes: number[] = []) {
  const api = await apiContext(token)
  for (const l of lecciones) await api.post(`lessons/${l}/complete`)
  for (const e of fallos) await enviar(api, e, FALLO)
  for (const e of resueltos) {
    if (fallarAntes.includes(e)) { await enviar(api, e, FALLO); await enviar(api, e, FALLO) } // para «Persistente»
    await enviar(api, e, soluciones.get(e)!)
  }
  await api.dispose()
}

/** Deja todo listo: estudiante demo con progreso, alumnos de ejemplo y un módulo borrador con lección y ejercicio. */
export async function preparar() {
  limpiar(true)
  const teacher = await apiContext(await loginApi(DEMO.teacher))
  const todo = (await (await teacher.get('teacher/content')).json()) as Contenido
  const soluciones = new Map(todo.exercises.map((e) => [Number(e.id), e.expectedAnswer]))

  // Estudiante demo: módulos 1 a 3 completos y el 4 casi; deja libre «Par o impar» (ejercicio 11) para el recorrido.
  await darProgreso(await loginApi(DEMO.student), soluciones, [1, 2, 3, 4, 5, 6, 7, 8, 9], [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11], [], [3])
  for (const a of ALUMNOS) {
    await registerApi(a.nombre, a.correo)
    await darProgreso(await loginApi(a.correo), soluciones, a.resueltos, a.lecciones, a.fallos)
  }
  sql(`UPDATE usuario SET grupo = (SELECT g FROM (SELECT grupo AS g FROM usuario WHERE correo = '${DEMO.student}') t) WHERE correo IN (${CORREOS});`)

  // Módulo borrador para mostrar «Borrador» y «Publicar»
  const m = await (await teacher.post('teacher/content/modules', { data: { code: '09', title: TITULO_MODULO, summary: 'Cómo guardar, unir y recorrer texto en Python.' } })).json()
  const l = await (await teacher.post('teacher/content/lessons', { data: { moduleId: m.module.id, title: 'Operaciones con cadenas', minutes: 8, blocks: [{ type: 'p', text: 'Una cadena es una secuencia de caracteres entre comillas.' }] } })).json()
  await teacher.post('teacher/content/exercises', {
    data: {
      lessonId: l.lesson.id, title: 'Invierte una palabra', difficulty: 'basic',
      statement: 'Escribe la función invertir(texto) que devuelva el texto al revés.', goal: 'Practicar el recorrido de cadenas.',
      starter: 'def invertir(texto):\n    pass\n', expectedAnswer: 'def invertir(texto):\n    return texto[::-1]',
      examples: [{ input: 'invertir("uptc")', expected: '"ctpu"' }], hints: ['Las cadenas se pueden recorrer con índices.'],
      tests: [{ input: 'invertir("uptc")', expected: '"ctpu"', hidden: false }, { input: 'invertir("")', expected: '""', hidden: true }],
    },
  })
  await teacher.dispose()
}
