import type { Pool, RowDataPacket } from 'mysql2/promise'
import type { IntentoFallido, Pista, PistaRepo } from '../domain/puertos.js'

export class MysqlPistaRepo implements PistaRepo {
  constructor(private readonly pool: Pool) {}

  async ultimoIntentoFallido(usuarioId: number, ejercicioId: number): Promise<IntentoFallido | null> {
    const [f] = await this.pool.query<RowDataPacket[]>(
      'SELECT id_intento, codigo, detalle FROM intento WHERE id_usuario = ? AND id_ejercicio = ? AND resultado = 0 ORDER BY id_intento DESC LIMIT 1',
      [usuarioId, ejercicioId])
    const r = f[0]
    if (!r) return null
    const d = typeof r.detalle === 'string' ? JSON.parse(r.detalle) : r.detalle
    return { id: Number(r.id_intento), codigo: r.codigo, fallos: Array.isArray(d) ? d : [] }
  }

  async deIntento(intentoId: number): Promise<Pista | null> {
    const [f] = await this.pool.query<RowDataPacket[]>('SELECT texto, fuente FROM pista_ia WHERE id_intento = ?', [intentoId])
    return f[0] ? { texto: f[0].texto, fuente: f[0].fuente } : null
  }

  async contarIaHoy(usuarioId: number) {
    const [f] = await this.pool.query<RowDataPacket[]>(
      "SELECT COUNT(*) AS n FROM pista_ia WHERE id_usuario = ? AND fuente = 'ai' AND fecha >= CURDATE()", [usuarioId])
    return f[0]!.n as number
  }

  async contarDeEjercicio(usuarioId: number, ejercicioId: number) {
    const [f] = await this.pool.query<RowDataPacket[]>(
      'SELECT COUNT(*) AS n FROM pista_ia p JOIN intento i ON i.id_intento = p.id_intento WHERE p.id_usuario = ? AND i.id_ejercicio = ?', [usuarioId, ejercicioId])
    return f[0]!.n as number
  }

  async guardar(intentoId: number, usuarioId: number, p: Pista) {
    await this.pool.execute('INSERT IGNORE INTO pista_ia (id_intento, id_usuario, texto, fuente) VALUES (?, ?, ?, ?)', [intentoId, usuarioId, p.texto, p.fuente])
    return (await this.deIntento(intentoId))!
  }
}
