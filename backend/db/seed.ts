// Importa los mocks del frontend a la BD y crea los usuarios demo. Es idempotente (se puede repetir).
//
// Casos de prueba: el mock de cada ejercicio trae `input` (una expresión Python, p. ej. "promedio(3, 4, 5)")
// y `expected` (lo que imprime o la repr del valor devuelto). Se guardan tal cual en caso_prueba.entrada /
// salida_esperada; el runner de la Fase 3 los ejecuta después del código del estudiante.
// Son visibles los que coinciden con un ejemplo del enunciado; el resto quedan ocultos.
import bcrypt from 'bcrypt'
import mysql from 'mysql2/promise'
import { exercisesSeed } from '../../frontend/src/mocks/exercises'
import { lessonsSeed } from '../../frontend/src/mocks/lessons'
import { modulesSeed } from '../../frontend/src/mocks/modules'
import { badgeDefs } from '../src/modules/progreso/domain/insignias'
import { config } from '../src/shared/config'
import { dbSettings } from '../src/shared/db'

const dificultad = { basic: 'baja', medium: 'media', advanced: 'alta' } as const
const json = (v: unknown) => JSON.stringify(v)

const conn = await mysql.createConnection(dbSettings)
const insertId = async (sql: string, params: unknown[]) => ((await conn.execute(sql, params as never[]))[0] as mysql.ResultSetHeader).insertId

await conn.beginTransaction()
try {
  const moduloId = new Map<string, number>()
  for (const m of modulesSeed) {
    moduloId.set(
      m.id,
      await insertId(
        `INSERT INTO modulo (codigo, titulo, resumen, orden, publicado) VALUES (?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE id_modulo = LAST_INSERT_ID(id_modulo), titulo = VALUES(titulo), resumen = VALUES(resumen), orden = VALUES(orden), publicado = VALUES(publicado)`,
        [m.code, m.title, m.summary, m.order, m.published],
      ),
    )
  }

  const leccionId = new Map<string, number>()
  for (const l of lessonsSeed) {
    leccionId.set(
      l.id,
      await insertId(
        `INSERT INTO leccion (id_modulo, titulo, contenido, minutos, orden, publicado) VALUES (?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE id_leccion = LAST_INSERT_ID(id_leccion), titulo = VALUES(titulo), contenido = VALUES(contenido), minutos = VALUES(minutos), publicado = VALUES(publicado)`,
        [moduloId.get(l.moduleId), l.title, json(l.blocks), l.minutes, l.order, l.published],
      ),
    )
  }

  for (const e of exercisesSeed) {
    const id = await insertId(
      `INSERT INTO ejercicio (id_leccion, titulo, enunciado, objetivo, dificultad, lenguaje, starter, solucion, pistas, ejemplos, restricciones, reglas, nota_exito, orden, publicado)
       VALUES (?, ?, ?, ?, ?, 'python', ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE id_ejercicio = LAST_INSERT_ID(id_ejercicio), titulo = VALUES(titulo), enunciado = VALUES(enunciado), objetivo = VALUES(objetivo),
         dificultad = VALUES(dificultad), starter = VALUES(starter), solucion = VALUES(solucion), pistas = VALUES(pistas), ejemplos = VALUES(ejemplos),
         restricciones = VALUES(restricciones), reglas = VALUES(reglas), nota_exito = VALUES(nota_exito), publicado = VALUES(publicado)`,
      [
        leccionId.get(e.lessonId), e.title, e.statement, e.goal, dificultad[e.difficulty], e.starter, e.expectedAnswer,
        json(e.hints), json(e.examples), json(e.constraints), json(e.rules), e.successNote, e.order, e.published,
      ],
    )
    await conn.execute('DELETE FROM caso_prueba WHERE id_ejercicio = ?', [id])
    for (const t of e.tests) {
      const visible = e.examples.some((x) => x.input === t.input)
      await conn.execute('INSERT INTO caso_prueba (id_ejercicio, entrada, salida_esperada, oculto) VALUES (?, ?, ?, ?)', [id, t.input, t.expected, !visible])
    }
  }

  for (const b of badgeDefs) {
    await conn.execute(
      `INSERT INTO insignia (codigo, nombre, regla, objetivo) VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE nombre = VALUES(nombre), regla = VALUES(regla), objetivo = VALUES(objetivo)`,
      [b.id, b.name, b.condition, b.target],
    )
  }

  const demo = [
    ['Camila Rojas Pineda', 'estudiante@uptc.edu.co', 'student', 'Ingeniería de Sistemas y Computación', 1, 'Programación Básica · Grupo 02'],
    ['Profesor Andrés Beltrán', 'docente@uptc.edu.co', 'teacher', 'Escuela de Ingeniería de Sistemas y Computación', null, null],
    ['Administrador UPTC', 'admin@uptc.edu.co', 'admin', null, null, null],
  ] as const
  const hash = await bcrypt.hash('Demo1234', config.BCRYPT_COST)
  for (const [nombre, correo, rol, programa, semestre, grupo] of demo) {
    await conn.execute(
      `INSERT INTO usuario (nombre, correo, hash_contrasena, rol, programa, semestre, grupo) VALUES (?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE nombre = VALUES(nombre), hash_contrasena = VALUES(hash_contrasena), rol = VALUES(rol), activo = TRUE,
         programa = VALUES(programa), semestre = VALUES(semestre), grupo = VALUES(grupo)`,
      [nombre, correo, hash, rol, programa, semestre, grupo],
    )
  }

  await conn.commit()
  console.log(`Seed listo: ${modulesSeed.length} módulos, ${lessonsSeed.length} lecciones, ${exercisesSeed.length} ejercicios, ${badgeDefs.length} insignias, ${demo.length} usuarios demo.`)
} catch (e) {
  await conn.rollback()
  throw e
} finally {
  await conn.end()
}
