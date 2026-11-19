import type { Pool, ResultSetHeader, RowDataPacket } from 'mysql2/promise'
import { AppError } from '../../../shared/errors.js'
import type {
  CasoCompleto, ContenidoRepo, DatosEjercicio, DatosLeccion, DatosModulo, Dificultad, Ejercicio, Kind, Leccion, Modulo,
} from '../domain/contenido.js'

const DIF_A_BD: Record<Dificultad, string> = { basic: 'baja', medium: 'media', advanced: 'alta' }
const DIF_DE_BD: Record<string, Dificultad> = { baja: 'basic', media: 'medium', alta: 'advanced' }
const TEMP = 65535 // orden provisional para el intercambio (columnas SMALLINT UNSIGNED)

// Nombres fijos (nunca vienen del usuario): tabla, clave y columna que define el grupo de orden.
const TABLAS: Record<Kind, { tabla: string; pk: string; grupo: string | null }> = {
  modules: { tabla: 'modulo', pk: 'id_modulo', grupo: null },
  lessons: { tabla: 'leccion', pk: 'id_leccion', grupo: 'id_modulo' },
  exercises: { tabla: 'ejercicio', pk: 'id_ejercicio', grupo: 'id_leccion' },
}

const json = (v: unknown) => JSON.stringify(v)
const aModulo = (f: RowDataPacket): Modulo => ({ id: f.id_modulo, order: f.orden, code: f.codigo, title: f.titulo, summary: f.resumen, published: Boolean(f.publicado) })
const aLeccion = (f: RowDataPacket): Leccion => ({
  id: f.id_leccion, moduleId: f.id_modulo, order: f.orden, title: f.titulo, minutes: f.minutos, published: Boolean(f.publicado), blocks: f.contenido,
})
const aEjercicio = (f: RowDataPacket, tests: CasoCompleto[]): Ejercicio => ({
  id: f.id_ejercicio, moduleId: f.id_modulo, lessonId: f.id_leccion, order: f.orden, title: f.titulo, statement: f.enunciado, goal: f.objetivo,
  difficulty: DIF_DE_BD[f.dificultad]!, published: Boolean(f.publicado), examples: f.ejemplos, constraints: f.restricciones, hints: f.pistas,
  starter: f.starter, expectedAnswer: f.solucion, tests, rules: f.reglas, successNote: f.nota_exito,
})

const SEL_EJ = `SELECT e.*, l.id_modulo FROM ejercicio e JOIN leccion l ON l.id_leccion = e.id_leccion JOIN modulo m ON m.id_modulo = l.id_modulo`

export class MysqlContenidoRepo implements ContenidoRepo {
  constructor(private readonly pool: Pool) {}

  async listarModulos(soloVisibles: boolean) {
    const [f] = await this.pool.query<RowDataPacket[]>(`SELECT * FROM modulo ${soloVisibles ? 'WHERE publicado = 1' : ''} ORDER BY orden, id_modulo`)
    return f.map(aModulo)
  }

  async moduloPorId(id: number, soloVisibles: boolean) {
    const [f] = await this.pool.query<RowDataPacket[]>(`SELECT * FROM modulo WHERE id_modulo = ? ${soloVisibles ? 'AND publicado = 1' : ''}`, [id])
    return f[0] ? aModulo(f[0]) : null
  }

  async listarLecciones({ moduloId, soloVisibles }: { moduloId?: number; soloVisibles: boolean }) {
    const cond = ['1 = 1']
    const p: number[] = []
    if (soloVisibles) cond.push('l.publicado = 1', 'm.publicado = 1')
    if (moduloId !== undefined) {
      cond.push('l.id_modulo = ?')
      p.push(moduloId)
    }
    const [f] = await this.pool.query<RowDataPacket[]>(
      `SELECT l.* FROM leccion l JOIN modulo m ON m.id_modulo = l.id_modulo WHERE ${cond.join(' AND ')} ORDER BY m.orden, l.orden`, p)
    return f.map(aLeccion)
  }

  async leccionPorId(id: number, soloVisibles: boolean) {
    const [f] = await this.pool.query<RowDataPacket[]>(
      `SELECT l.* FROM leccion l JOIN modulo m ON m.id_modulo = l.id_modulo WHERE l.id_leccion = ? ${soloVisibles ? 'AND l.publicado = 1 AND m.publicado = 1' : ''}`, [id])
    return f[0] ? aLeccion(f[0]) : null
  }

  private async conCasos(filas: RowDataPacket[]): Promise<Ejercicio[]> {
    if (!filas.length) return []
    const [casos] = await this.pool.query<RowDataPacket[]>('SELECT * FROM caso_prueba WHERE id_ejercicio IN (?) ORDER BY id_caso', [filas.map((f) => f.id_ejercicio)])
    return filas.map((f) =>
      aEjercicio(f, casos.filter((c) => c.id_ejercicio === f.id_ejercicio).map((c) => ({ input: c.entrada, expected: c.salida_esperada, hidden: Boolean(c.oculto) }))))
  }

  async listarEjercicios({ moduloId, leccionId, soloVisibles }: { moduloId?: number; leccionId?: number; soloVisibles: boolean }) {
    const cond = ['1 = 1']
    const p: number[] = []
    if (soloVisibles) cond.push('e.publicado = 1', 'l.publicado = 1', 'm.publicado = 1')
    if (moduloId !== undefined) {
      cond.push('l.id_modulo = ?')
      p.push(moduloId)
    }
    if (leccionId !== undefined) {
      cond.push('e.id_leccion = ?')
      p.push(leccionId)
    }
    const [f] = await this.pool.query<RowDataPacket[]>(`${SEL_EJ} WHERE ${cond.join(' AND ')} ORDER BY m.orden, l.orden, e.orden`, p)
    return this.conCasos(f)
  }

  async ejercicioPorId(id: number, soloVisibles: boolean) {
    const [f] = await this.pool.query<RowDataPacket[]>(`${SEL_EJ} WHERE e.id_ejercicio = ? ${soloVisibles ? 'AND e.publicado = 1 AND l.publicado = 1 AND m.publicado = 1' : ''}`, [id])
    return (await this.conCasos(f))[0] ?? null
  }

  private async siguienteOrden(tabla: string, grupo: string | null, id: number | null) {
    const [f] = await this.pool.query<RowDataPacket[]>(`SELECT COALESCE(MAX(orden), 0) + 1 AS n FROM ${tabla} ${grupo ? `WHERE ${grupo} = ?` : ''}`, id === null ? [] : [id])
    return f[0]!.n as number
  }

  async crearModulo(d: DatosModulo) {
    try {
      const orden = await this.siguienteOrden('modulo', null, null)
      const [r] = await this.pool.execute<ResultSetHeader>('INSERT INTO modulo (codigo, titulo, resumen, orden) VALUES (?, ?, ?, ?)', [d.code, d.title, d.summary, orden])
      return (await this.moduloPorId(r.insertId, false))!
    } catch (e) {
      throw duplicado(e)
    }
  }

  async actualizarModulo(id: number, d: DatosModulo) {
    try {
      await this.pool.execute('UPDATE modulo SET codigo = ?, titulo = ?, resumen = ? WHERE id_modulo = ?', [d.code, d.title, d.summary, id])
    } catch (e) {
      throw duplicado(e)
    }
  }

  async crearLeccion(moduloId: number, d: DatosLeccion) {
    const orden = await this.siguienteOrden('leccion', 'id_modulo', moduloId)
    const [r] = await this.pool.execute<ResultSetHeader>('INSERT INTO leccion (id_modulo, titulo, contenido, minutos, orden) VALUES (?, ?, ?, ?, ?)', [moduloId, d.title, json(d.blocks), d.minutes, orden])
    return (await this.leccionPorId(r.insertId, false))!
  }

  async actualizarLeccion(id: number, d: DatosLeccion) {
    await this.pool.execute('UPDATE leccion SET titulo = ?, contenido = ?, minutos = ? WHERE id_leccion = ?', [d.title, json(d.blocks), d.minutes, id])
  }

  private async guardarEjercicio(id: number, leccionId: number | null, d: DatosEjercicio) {
    const conn = await this.pool.getConnection()
    try {
      await conn.beginTransaction()
      const campos = [d.title, d.statement, d.goal, DIF_A_BD[d.difficulty], d.starter, d.expectedAnswer, json(d.hints), json(d.examples), json(d.constraints), json(d.rules), d.successNote]
      if (leccionId !== null) {
        const [o] = await conn.query<RowDataPacket[]>('SELECT COALESCE(MAX(orden), 0) + 1 AS n FROM ejercicio WHERE id_leccion = ? FOR UPDATE', [leccionId])
        const [r] = await conn.execute<ResultSetHeader>(
          `INSERT INTO ejercicio (titulo, enunciado, objetivo, dificultad, starter, solucion, pistas, ejemplos, restricciones, reglas, nota_exito, id_leccion, orden)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [...campos, leccionId, o[0]!.n])
        id = r.insertId
      } else {
        await conn.execute(
          `UPDATE ejercicio SET titulo = ?, enunciado = ?, objetivo = ?, dificultad = ?, starter = ?, solucion = ?, pistas = ?, ejemplos = ?, restricciones = ?, reglas = ?, nota_exito = ?
           WHERE id_ejercicio = ?`, [...campos, id])
        await conn.execute('DELETE FROM caso_prueba WHERE id_ejercicio = ?', [id])
      }
      for (const t of d.tests) {
        await conn.execute('INSERT INTO caso_prueba (id_ejercicio, entrada, salida_esperada, oculto) VALUES (?, ?, ?, ?)', [id, t.input, t.expected, t.hidden ? 1 : 0])
      }
      await conn.commit()
      return id
    } catch (e) {
      await conn.rollback()
      throw e
    } finally {
      conn.release()
    }
  }

  async crearEjercicio(leccionId: number, d: DatosEjercicio) {
    return (await this.ejercicioPorId(await this.guardarEjercicio(0, leccionId, d), false))!
  }

  async actualizarEjercicio(id: number, d: DatosEjercicio) {
    await this.guardarEjercicio(id, null, d)
  }

  async contarHijos(kind: 'modules' | 'exercises', id: number) {
    const sql = kind === 'modules' ? 'SELECT COUNT(*) AS n FROM leccion WHERE id_modulo = ?' : 'SELECT COUNT(*) AS n FROM caso_prueba WHERE id_ejercicio = ?'
    const [f] = await this.pool.query<RowDataPacket[]>(sql, [id])
    return f[0]!.n as number
  }

  async fijarPublicado(kind: Kind, id: number, valor: boolean) {
    const t = TABLAS[kind]
    await this.pool.execute(`UPDATE ${t.tabla} SET publicado = ? WHERE ${t.pk} = ?`, [valor ? 1 : 0, id])
  }

  async mover(kind: Kind, id: number, dir: -1 | 1) {
    const t = TABLAS[kind]
    const conn = await this.pool.getConnection()
    try {
      await conn.beginTransaction()
      const [a] = await conn.query<RowDataPacket[]>(`SELECT orden${t.grupo ? `, ${t.grupo} AS g` : ''} FROM ${t.tabla} WHERE ${t.pk} = ? FOR UPDATE`, [id])
      if (a[0]) {
        const [vecinos] = await conn.query<RowDataPacket[]>(
          `SELECT ${t.pk} AS id, orden FROM ${t.tabla} WHERE orden ${dir < 0 ? '<' : '>'} ? ${t.grupo ? `AND ${t.grupo} = ?` : ''}
           ORDER BY orden ${dir < 0 ? 'DESC' : 'ASC'} LIMIT 1 FOR UPDATE`, t.grupo ? [a[0].orden, a[0].g] : [a[0].orden])
        const v = vecinos[0]
        if (v) {
          const set = (pk: number, orden: number) => conn.execute(`UPDATE ${t.tabla} SET orden = ? WHERE ${t.pk} = ?`, [orden, pk])
          await set(id, TEMP) // evita chocar con la clave única (grupo, orden)
          await set(v.id, a[0].orden)
          await set(id, v.orden)
        }
      }
      await conn.commit()
    } catch (e) {
      await conn.rollback()
      throw e
    } finally {
      conn.release()
    }
  }
}

function duplicado(e: unknown) {
  return (e as { code?: string }).code === 'ER_DUP_ENTRY' ? new AppError(409, 'CODIGO_EXISTENTE', 'Ya existe un módulo con ese código.') : e
}
