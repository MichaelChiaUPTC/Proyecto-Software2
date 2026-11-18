import type { ReporteRepo } from '../domain/puertos.js'
import { aCsv, construirFila, distribucion, necesitaAtencion, SIN_GRUPO, sinModulo, type FilaEstudiante } from '../domain/reporte.js'

export class ReporteService {
  constructor(private readonly repo: ReporteRepo) {}

  private async filas(grupo?: string) {
    const filtro = grupo === undefined ? undefined : grupo === SIN_GRUPO ? null : grupo
    const [c, datos] = await Promise.all([this.repo.catalogo(), this.repo.estudiantes(filtro)])
    return { c, filas: datos.map((d) => construirFila(d, c)) }
  }

  async reportes(grupo?: string): Promise<FilaEstudiante[]> {
    return (await this.filas(grupo)).filas.map(sinModulo)
  }

  async csv(grupo?: string): Promise<string> {
    return aCsv(await this.reportes(grupo))
  }

  async dashboard() {
    const [{ c, filas }, n] = await Promise.all([this.filas(), this.repo.conteos()])
    const rows = filas.map(sinModulo)
    const ahora = Date.now()
    return {
      rows,
      active: rows.filter((r) => ahora - new Date(r.lastActivity).getTime() < 7 * 864e5).length,
      total: rows.length,
      attention: rows.filter((r) => necesitaAtencion(r, ahora)).sort((a, b) => a.lastActivity.localeCompare(b.lastActivity)),
      published: n.modulosPublicados,
      modulesTotal: n.modulosTotal,
      lessonsPublished: n.leccionesPublicadas,
      exercisesPublished: n.ejerciciosPublicados,
      avg: rows.length ? Math.round(rows.reduce((a, r) => a + r.progress, 0) / rows.length) : 0,
      perModule: distribucion(filas, c),
      recent: [...rows].sort((a, b) => b.lastActivity.localeCompare(a.lastActivity)).slice(0, 6),
    }
  }
}
