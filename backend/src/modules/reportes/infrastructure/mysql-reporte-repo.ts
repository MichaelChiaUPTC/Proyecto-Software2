import type { Pool, RowDataPacket } from 'mysql2/promise'
import { cargarCatalogo } from '../../progreso/infrastructure/mysql-progreso-repo.js'
import type { ConteoContenido, ReporteRepo } from '../domain/puertos.js'
import type { DatosEstudiante } from '../domain/reporte.js'

export class MysqlReporteRepo implements ReporteRepo {
  constructor(private readonly pool: Pool) {}

  catalogo() {
    return cargarCatalogo(this.pool)
  }

  async conteos(): Promise<ConteoContenido> {
    const [f] = await this.pool.query<RowDataPacket[]>(
      `SELECT (SELECT COUNT(*) FROM modulo) AS mt, (SELECT COUNT(*) FROM modulo WHERE publicado = 1) AS mp,
              (SELECT COUNT(*) FROM leccion WHERE publicado = 1) AS lp, (SELECT COUNT(*) FROM ejercicio WHERE publicado = 1) AS ep`)
    const r = f[0]!
    return { modulosTotal: Number(r.mt), modulosPublicados: Number(r.mp), leccionesPublicadas: Number(r.lp), ejerciciosPublicados: Number(r.ep) }
  }

  async estudiantes(grupo?: string | null): Promise<DatosEstudiante[]> {
    const q = async (sql: string, p: unknown[] = []) => (await this.pool.query<RowDataPacket[]>(sql, p))[0]
    const filtro = grupo === undefined ? '' : grupo === null ? 'AND grupo IS NULL' : 'AND grupo = ?'
    // Los intentos se agregan en SQL (una fila por usuario y ejercicio); no se traen todos.
    const [usuarios, porEjercicio, lecciones] = await Promise.all([
      q(`SELECT id_usuario, nombre, correo, grupo, fecha_creacion FROM usuario WHERE rol = 'student' AND activo = 1 ${filtro} ORDER BY nombre`, grupo ? [grupo] : []),
      q('SELECT id_usuario, id_ejercicio, COUNT(*) AS intentos, SUM(resultado) AS aprobados, MAX(fecha) AS ultima FROM intento GROUP BY id_usuario, id_ejercicio'),
      q('SELECT id_usuario, id_leccion, fecha FROM leccion_completada'),
    ])
    const datos = new Map<number, DatosEstudiante>(usuarios.map((u) => [u.id_usuario, {
      id: u.id_usuario, nombre: u.nombre, correo: u.correo, grupo: u.grupo, creado: u.fecha_creacion,
      ejercicios: new Map(), lecciones: [], intentos: 0, aprobados: 0, ultima: null,
    }]))
    const masReciente = (d: DatosEstudiante, f: Date) => { if (!d.ultima || f > d.ultima) d.ultima = f }
    for (const r of porEjercicio) {
      const d = datos.get(r.id_usuario)
      if (!d) continue
      const aprobados = Number(r.aprobados)
      d.ejercicios.set(r.id_ejercicio, { intentos: Number(r.intentos), aprobado: aprobados > 0 })
      d.intentos += Number(r.intentos)
      d.aprobados += aprobados
      masReciente(d, r.ultima)
    }
    for (const r of lecciones) {
      const d = datos.get(r.id_usuario)
      if (!d) continue
      d.lecciones.push(r.id_leccion)
      masReciente(d, r.fecha)
    }
    return [...datos.values()]
  }
}
