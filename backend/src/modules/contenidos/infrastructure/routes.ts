import { Router } from 'express'
import type { Pool } from 'mysql2/promise'
import { z } from 'zod'
import { config } from '../../../shared/config.js'
import { crearRequireAuth, requireRole } from '../../usuarios/infrastructure/auth-middleware.js'
import { MysqlUsuarioRepo } from '../../usuarios/infrastructure/mysql-usuario-repo.js'
import { JwtTokens } from '../../usuarios/infrastructure/seguridad.js'
import { ContenidoService } from '../application/contenido-service.js'
import { MysqlContenidoRepo } from './mysql-contenido-repo.js'

const id = z.coerce.number({ error: 'Identificador inválido.' }).int('Identificador inválido.').positive('Identificador inválido.')
const texto = (nombre: string, max: number, min = 1) =>
  z.string({ error: `${nombre} es obligatorio.` }).trim().min(min, `${nombre} es obligatorio.`).max(max, `${nombre} es demasiado largo (máximo ${max} caracteres).`)
const lista = <T extends z.ZodType>(item: T, max: number, nombre: string) => z.array(item, { error: `${nombre} debe ser una lista.` }).max(max, `${nombre}: máximo ${max} elementos.`)
const opcional = <T extends z.ZodType>(s: T) => s.optional()

const caso = z.object({ input: texto('La entrada del caso', 1000), expected: texto('La salida esperada', 1000) })
const bloque = z.discriminatedUnion('type', [
  z.object({ type: z.literal('p'), text: texto('El texto', 5000) }),
  z.object({ type: z.literal('h'), id: texto('El id del encabezado', 60), text: texto('El texto', 200) }),
  z.object({ type: z.literal('code'), code: texto('El código', 5000), caption: opcional(texto('El pie', 300)), lang: opcional(texto('El lenguaje', 20)) }),
  z.object({ type: z.literal('callout'), title: texto('El título', 100), text: texto('El texto', 2000) }),
  z.object({ type: z.literal('list'), items: lista(texto('El elemento', 500), 50, 'La lista') }),
  z.object({
    type: z.literal('flow'),
    caption: opcional(texto('El pie', 300)),
    steps: lista(
      z.object({
        kind: z.enum(['start', 'decision', 'action', 'end']),
        label: texto('La etiqueta', 200),
        yes: opcional(texto('El destino', 100)),
        no: opcional(texto('El destino', 100)),
      }),
      50,
      'Los pasos',
    ),
  }),
], { error: 'Bloque de lección inválido.' })

const moduloSchema = z.object({ code: texto('El código', 10), title: texto('El título', 100), summary: z.string().trim().max(300, 'El resumen es demasiado largo.').default('') })
const leccionSchema = z.object({
  title: texto('El título', 100),
  minutes: z.number({ error: 'Los minutos deben ser un número.' }).int().min(1, 'Los minutos deben ser al menos 1.').max(600, 'Los minutos son demasiados.').default(5),
  blocks: lista(bloque, 200, 'Los bloques'),
})
const regex = texto('El patrón', 200).refine((p) => { try { new RegExp(p); return true } catch { return false } }, 'El patrón de la regla no es una expresión regular válida.')
const ejercicioSchema = z.object({
  title: texto('El título', 100),
  statement: texto('El enunciado', 5000),
  goal: z.string().trim().max(255, 'El objetivo es demasiado largo.').default(''),
  difficulty: z.enum(['basic', 'medium', 'advanced'], { error: 'Dificultad inválida (basic, medium o advanced).' }),
  examples: lista(caso, 10, 'Los ejemplos').default([]),
  constraints: lista(texto('La restricción', 300), 10, 'Las restricciones').default([]),
  hints: lista(texto('La pista', 500), 10, 'Las pistas').default([]),
  starter: z.string().max(5000, 'El código inicial es demasiado largo.').default(''),
  expectedAnswer: z.string().max(5000, 'La solución es demasiado larga.').default(''),
  tests: lista(caso.extend({ hidden: z.boolean().default(false) }), 50, 'Los casos de prueba').default([]),
  rules: lista(z.object({ pattern: regex, message: texto('El mensaje', 300), concept: texto('El concepto', 100) }), 20, 'Las reglas').default([]),
  successNote: z.string().trim().max(1000, 'La nota de éxito es demasiado larga.').default(''),
})
const kind = z.enum(['modules', 'lessons', 'exercises'], { error: 'Tipo de contenido inválido.' })
const moverSchema = z.object({ dir: z.union([z.literal(-1), z.literal(1)], { error: 'dir debe ser -1 o 1.' }) })
const filtro = z.object({ moduleId: id.optional(), lessonId: id.optional() })

export function contenidosRouter(pool: Pool): Router {
  const svc = new ContenidoService(new MysqlContenidoRepo(pool))
  const requireAuth = crearRequireAuth(new JwtTokens(config.JWT_SECRET, config.JWT_EXPIRES_IN), new MysqlUsuarioRepo(pool))
  const router = Router()

  // ---- Estudiante (solo publicado) ----
  router.get('/modules', requireAuth, async (_req, res) => void res.json({ modules: await svc.modulos() }))
  router.get('/modules/:id', requireAuth, async (req, res) => void res.json(await svc.modulo(id.parse(req.params.id))))
  router.get('/lessons/:id', requireAuth, async (req, res) => void res.json({ lesson: await svc.leccion(id.parse(req.params.id)) }))
  router.get('/exercises', requireAuth, async (req, res) => {
    const f = filtro.parse(req.query)
    res.json({ exercises: await svc.ejercicios({ moduloId: f.moduleId, leccionId: f.lessonId }) })
  })
  router.get('/exercises/:id', requireAuth, async (req, res) => void res.json({ exercise: await svc.ejercicio(id.parse(req.params.id)) }))

  // ---- Docente / admin ----
  const t = '/teacher/content'
  const docente = [requireAuth, requireRole('teacher', 'admin')]
  router.get(t, ...docente, async (_req, res) => void res.json(await svc.todo()))
  router.post(`${t}/modules`, ...docente, async (req, res) => void res.status(201).json({ module: await svc.crearModulo(moduloSchema.parse(req.body)) }))
  router.put(`${t}/modules/:id`, ...docente, async (req, res) => void res.json({ module: await svc.editarModulo(id.parse(req.params.id), moduloSchema.parse(req.body)) }))
  router.post(`${t}/lessons`, ...docente, async (req, res) => {
    const { moduleId, ...d } = leccionSchema.extend({ moduleId: id }).parse(req.body)
    res.status(201).json({ lesson: await svc.crearLeccion(moduleId, d) })
  })
  router.put(`${t}/lessons/:id`, ...docente, async (req, res) => void res.json({ lesson: await svc.editarLeccion(id.parse(req.params.id), leccionSchema.parse(req.body)) }))
  router.post(`${t}/exercises`, ...docente, async (req, res) => {
    const { lessonId, ...d } = ejercicioSchema.extend({ lessonId: id }).parse(req.body)
    res.status(201).json({ exercise: await svc.crearEjercicio(lessonId, d) })
  })
  router.put(`${t}/exercises/:id`, ...docente, async (req, res) => void res.json({ exercise: await svc.editarEjercicio(id.parse(req.params.id), ejercicioSchema.parse(req.body)) }))
  router.post(`${t}/:kind/:id/publish`, ...docente, async (req, res) => {
    res.json({ item: await svc.alternarPublicacion(kind.parse(req.params.kind), id.parse(req.params.id)) })
  })
  router.post(`${t}/:kind/:id/move`, ...docente, async (req, res) => {
    res.json(await svc.mover(kind.parse(req.params.kind), id.parse(req.params.id), moverSchema.parse(req.body).dir))
  })

  return router
}
