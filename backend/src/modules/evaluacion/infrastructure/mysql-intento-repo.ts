import type { Pool, ResultSetHeader, RowDataPacket } from 'mysql2/promise'
import type { IntentoRepo, NuevoIntento } from '../domain/puertos.js'

export class MysqlIntentoRepo implements IntentoRepo {
  constructor(private readonly pool: Pool) {}

  async registrar(i: NuevoIntento) {
    const c = await this.pool.getConnection()
    try {
      await c.beginTransaction()
      // Serializa los envíos del mismo usuario para que "primera aprobación" no se dispare dos veces.
      await c.query('SELECT id_usuario FROM usuario WHERE id_usuario = ? FOR UPDATE', [i.usuarioId])
      const [r] = await c.execute<ResultSetHeader>(
        'INSERT INTO intento (id_usuario, id_ejercicio, codigo, resultado, pistas_usadas, retroalimentacion, detalle) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [i.usuarioId, i.ejercicioId, i.codigo, i.passed ? 1 : 0, i.pistasUsadas, i.mensaje, i.fallos.length ? JSON.stringify(i.fallos) : null],
      )
      let primeraAprobacion = false
      if (i.passed) {
        const [previos] = await c.query<RowDataPacket[]>(
          'SELECT 1 FROM intento WHERE id_usuario = ? AND id_ejercicio = ? AND resultado = 1 AND id_intento <> ? LIMIT 1', [i.usuarioId, i.ejercicioId, r.insertId])
        primeraAprobacion = previos.length === 0
        if (primeraAprobacion) {
          await c.execute("INSERT INTO evento_outbox (tipo, payload) VALUES ('IntentoAprobado', ?)", [
            JSON.stringify({ usuarioId: i.usuarioId, ejercicioId: i.ejercicioId, intentoId: r.insertId, dificultad: i.dificultad }),
          ])
        }
      }
      await c.commit()
      return { intentoId: r.insertId, primeraAprobacion }
    } catch (e) {
      await c.rollback()
      throw e
    } finally {
      c.release()
    }
  }
}
