import type { Pool, PoolConnection, ResultSetHeader, RowDataPacket } from 'mysql2/promise'
import { badgeDefs } from '../domain/insignias.js'
import { armarProgreso, type Dificultad } from '../domain/progreso.js'
import type { ProgresoRepo, Snapshot } from '../domain/puertos.js'

const DIF: Record<string, Dificultad> = { baja: 'basic', media: 'medium', alta: 'advanced' }
type Db = Pick<Pool, 'query'>

export const TIPOS_PROCESABLES = ['IntentoAprobado', 'LeccionCompletada']

async function cargar(db: Db, usuarioId: number): Promise<Snapshot> {
  const q = async (sql: string, p: unknown[] = []) => (await db.query<RowDataPacket[]>(sql, p))[0]
  const [modulos, lecciones, ejercicios, todasL, todasE, hechas, intentos, insignias] = await Promise.all([
    q('SELECT id_modulo, codigo, titulo, resumen, orden FROM modulo WHERE publicado = 1 ORDER BY orden'),
    q(`SELECT l.id_leccion, l.id_modulo, l.titulo, l.minutos, l.orden FROM leccion l JOIN modulo m ON m.id_modulo = l.id_modulo
       WHERE l.publicado = 1 AND m.publicado = 1`),
    q(`SELECT e.id_ejercicio, e.id_leccion, l.id_modulo, e.titulo, e.objetivo, e.dificultad, e.orden FROM ejercicio e
       JOIN leccion l ON l.id_leccion = e.id_leccion JOIN modulo m ON m.id_modulo = l.id_modulo
       WHERE e.publicado = 1 AND l.publicado = 1 AND m.publicado = 1`),
    q('SELECT id_leccion, titulo FROM leccion'),
    q('SELECT id_ejercicio, titulo FROM ejercicio'),
    q('SELECT id_leccion, fecha FROM leccion_completada WHERE id_usuario = ? ORDER BY fecha, id_leccion', [usuarioId]),
    q('SELECT id_intento, id_ejercicio, fecha, resultado, pistas_usadas, retroalimentacion FROM intento WHERE id_usuario = ? ORDER BY id_intento', [usuarioId]),
    q('SELECT i.codigo, ui.fecha FROM usuario_insignia ui JOIN insignia i ON i.id_insignia = ui.id_insignia WHERE ui.id_usuario = ?', [usuarioId]),
  ])
  return {
    catalogo: {
      modules: modulos.map((m) => ({ id: m.id_modulo, order: m.orden, code: m.codigo, title: m.titulo, summary: m.resumen })),
      lessons: lecciones.map((l) => ({ id: l.id_leccion, moduleId: l.id_modulo, order: l.orden, title: l.titulo, minutes: l.minutos })),
      exercises: ejercicios.map((e) => ({ id: e.id_ejercicio, moduleId: e.id_modulo, lessonId: e.id_leccion, order: e.orden, title: e.titulo, goal: e.objetivo, difficulty: DIF[e.dificultad]! })),
    },
    progreso: armarProgreso(
      intentos.map((i) => ({ id: Number(i.id_intento), ejercicioId: i.id_ejercicio, fecha: i.fecha, resultado: Boolean(i.resultado), pistas: i.pistas_usadas, retro: i.retroalimentacion })),
      hechas.map((l) => ({ id: l.id_leccion, fecha: l.fecha })),
      insignias.map((b) => ({ codigo: b.codigo, fecha: b.fecha })),
    ),
    titulos: {
      ejercicios: new Map(todasE.map((e) => [e.id_ejercicio, e.titulo])),
      lecciones: new Map(todasL.map((l) => [l.id_leccion, l.titulo])),
    },
  }
}

export class MysqlProgresoRepo implements ProgresoRepo {
  private insigniasListas = false
  constructor(private readonly pool: Pool) {}

  snapshot(usuarioId: number) {
    return cargar(this.pool, usuarioId)
  }

  private async tx<T>(fn: (c: PoolConnection) => Promise<T>): Promise<T> {
    const c = await this.pool.getConnection()
    try {
      await c.beginTransaction()
      const r = await fn(c)
      await c.commit()
      return r
    } catch (e) {
      await c.rollback()
      throw e
    } finally {
      c.release()
    }
  }

  async completarLeccion(usuarioId: number, leccionId: number) {
    return this.tx(async (c) => {
      const [r] = await c.execute<ResultSetHeader>('INSERT IGNORE INTO leccion_completada (id_usuario, id_leccion) VALUES (?, ?)', [usuarioId, leccionId])
      if (r.affectedRows === 0) return false
      await c.execute("INSERT INTO evento_outbox (tipo, payload) VALUES ('LeccionCompletada', ?)", [JSON.stringify({ usuarioId, leccionId })])
      return true
    })
  }

  async asegurarInsignias() {
    if (this.insigniasListas) return
    for (const b of badgeDefs) {
      await this.pool.execute(
        `INSERT INTO insignia (codigo, nombre, regla, objetivo) VALUES (?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE nombre = VALUES(nombre), regla = VALUES(regla), objetivo = VALUES(objetivo)`,
        [b.id, b.name, b.condition, b.target],
      )
    }
    this.insigniasListas = true
  }

  async procesarSiguiente(otorgar: (s: Snapshot) => string[]) {
    return this.tx(async (c) => {
      // SKIP LOCKED: si otro proceso (o el intervalo de respaldo) ya tomó el evento, se pasa al siguiente.
      const [ev] = await c.query<RowDataPacket[]>(
        `SELECT id, payload FROM evento_outbox WHERE procesado IS NULL AND tipo IN (?) ORDER BY id LIMIT 1 FOR UPDATE SKIP LOCKED`, [TIPOS_PROCESABLES])
      const e = ev[0]
      if (!e) return false
      const usuarioId = Number((typeof e.payload === 'string' ? JSON.parse(e.payload) : e.payload)?.usuarioId)
      if (Number.isInteger(usuarioId) && usuarioId > 0) {
        for (const codigo of otorgar(await cargar(c, usuarioId))) {
          const [r] = await c.execute<ResultSetHeader>(
            'INSERT IGNORE INTO usuario_insignia (id_usuario, id_insignia) SELECT ?, id_insignia FROM insignia WHERE codigo = ?', [usuarioId, codigo])
          if (r.affectedRows === 1) {
            const nombre = badgeDefs.find((b) => b.id === codigo)!.name
            await c.execute("INSERT INTO evento_outbox (tipo, payload) VALUES ('InsigniaObtenida', ?)", [JSON.stringify({ usuarioId, insignia: codigo, nombre, origen: e.id })])
          }
        }
      }
      await c.execute('UPDATE evento_outbox SET procesado = NOW() WHERE id = ?', [e.id])
      return true
    })
  }

  async marcaInsignias(usuarioId: number) {
    const [f] = await this.pool.query<RowDataPacket[]>(
      "SELECT COALESCE(MAX(id), 0) AS m FROM evento_outbox WHERE tipo = 'InsigniaObtenida' AND JSON_EXTRACT(payload, '$.usuarioId') = ?", [usuarioId])
    return Number(f[0]!.m)
  }

  async insigniasDesde(usuarioId: number, marca: number) {
    const [f] = await this.pool.query<RowDataPacket[]>(
      `SELECT JSON_UNQUOTE(JSON_EXTRACT(payload, '$.nombre')) AS nombre FROM evento_outbox
       WHERE tipo = 'InsigniaObtenida' AND id > ? AND JSON_EXTRACT(payload, '$.usuarioId') = ? ORDER BY id`, [marca, usuarioId])
    return f.map((r) => r.nombre as string)
  }
}
