import { spawn } from 'node:child_process'
import { randomBytes } from 'node:crypto'
import { AppError } from '../../../shared/errors.js'
import type { CasoEjecucion, CodeRunner, ErrorPython, ResultadoCaso } from '../domain/runner.js'
import { HARNESS } from './harness.js'

export interface DockerRunnerOpts {
  image: string
  timeoutMs: number
  memory: string
  cpus: string
  pids: number
  maxConcurrent: number
  dockerBin: string
}

const MAX_STDOUT = 1_000_000 // bytes leídos del contenedor antes de matarlo
const MAX_STDERR = 4_000

/**
 * Un `docker run` por envío: sin red, 128 MB, 0,5 CPU, 64 procesos, sistema de archivos de solo lectura,
 * usuario sin privilegios y sin capacidades. El código viaja por stdin, nunca en los argumentos.
 */
export class DockerRunner implements CodeRunner {
  private activos = 0
  private readonly cola: (() => void)[] = []

  constructor(private readonly o: DockerRunnerOpts) {}

  async run(code: string, tests: CasoEjecucion[]): Promise<ResultadoCaso[]> {
    await this.adquirir()
    try {
      return await this.ejecutar(code, tests)
    } finally {
      this.liberar()
    }
  }

  private async adquirir() {
    if (this.activos < this.o.maxConcurrent) {
      this.activos++
      return
    }
    await new Promise<void>((r) => this.cola.push(r)) // el cupo se hereda de quien libera
  }

  private liberar() {
    const siguiente = this.cola.shift()
    if (siguiente) siguiente()
    else this.activos--
  }

  private ejecutar(code: string, tests: CasoEjecucion[]): Promise<ResultadoCaso[]> {
    const nonce = `@@${randomBytes(16).toString('hex')}@@`
    const payload = Buffer.from(JSON.stringify({ nonce, code, tests }), 'utf8').toString('base64')
    const script = HARNESS.replace('%%PAYLOAD%%', () => payload)
    const nombre = `uptc-run-${randomBytes(8).toString('hex')}`
    const { image, memory, cpus, pids, dockerBin } = this.o
    const args = [
      'run', '--rm', '-i', '--name', nombre, '--network', 'none', '--memory', memory, '--memory-swap', memory,
      '--cpus', cpus, '--pids-limit', String(pids), '--read-only', '--tmpfs', '/tmp:size=8m', '--user', '65534',
      '--cap-drop', 'ALL', '--security-opt', 'no-new-privileges', image, 'python', '-',
    ]
    const matar = () => void spawn(dockerBin, ['kill', nombre], { stdio: 'ignore' }).on('error', () => {})

    return new Promise((resolve, reject) => {
      const child = spawn(dockerBin, args, { stdio: ['pipe', 'pipe', 'pipe'] })
      let stdout = ''
      let stderr = ''
      let bytes = 0
      let agotado = false
      let desbordado = false
      let terminado = false

      const terminar = (codigoSalida: number | null) => {
        if (terminado) return
        terminado = true
        clearTimeout(timer)
        clearInterval(reintento)
        clearTimeout(duro)
        if (agotado || desbordado) spawn(dockerBin, ['rm', '-f', nombre], { stdio: 'ignore' }).on('error', () => {})
        if (codigoSalida === 125 || codigoSalida === 126 || codigoSalida === 127) {
          console.error(`DockerRunner: docker run falló (${codigoSalida}): ${stderr}`)
          reject(new AppError(503, 'EJECUTOR_NO_DISPONIBLE', 'El servicio de corrección no está disponible por ahora. Intenta de nuevo en unos minutos.'))
          return
        }
        resolve(interpretar(stdout, nonce, tests, { agotado, desbordado, codigoSalida }))
      }

      const detener = () => {
        matar()
        child.kill()
      }
      let reintento: NodeJS.Timeout | undefined
      let duro: NodeJS.Timeout | undefined
      const timer = setTimeout(() => {
        agotado = true
        detener()
        // Si el cliente docker muriera antes que el contenedor, se insiste hasta que termine.
        reintento = setInterval(detener, 500)
        duro = setTimeout(() => {
          child.kill('SIGKILL')
          terminar(null)
        }, 2000)
      }, this.o.timeoutMs)

      child.stdout.on('data', (d: Buffer) => {
        bytes += d.length
        if (bytes > MAX_STDOUT) {
          if (!desbordado) {
            desbordado = true
            detener()
          }
          return
        }
        stdout += d.toString('utf8')
      })
      child.stderr.on('data', (d: Buffer) => {
        if (stderr.length < MAX_STDERR) stderr += d.toString('utf8')
      })
      child.on('error', (e) => {
        if (terminado) return
        terminado = true
        clearTimeout(timer)
        console.error('DockerRunner: no se pudo lanzar docker', e)
        reject(new AppError(503, 'EJECUTOR_NO_DISPONIBLE', 'El servicio de corrección no está disponible por ahora. Intenta de nuevo en unos minutos.'))
      })
      child.on('close', (c) => terminar(c))
      child.stdin.on('error', () => {}) // EPIPE si el contenedor muere antes de leer
      child.stdin.end(script)
    })
  }
}

interface Salida {
  agotado: boolean
  desbordado: boolean
  codigoSalida: number | null
}

/** Convierte el stdout del arnés en un resultado por caso. Solo cuentan las líneas que empiezan con el nonce. */
export function interpretar(stdout: string, nonce: string, tests: CasoEjecucion[], s: Salida): ResultadoCaso[] {
  const resultados = new Map<number, ResultadoCaso>()
  let fatal: ErrorPython | null = null
  for (const l of stdout.split('\n')) {
    if (!l.startsWith(nonce)) continue
    try {
      const o = JSON.parse(l.slice(nonce.length)) as { fatal?: ErrorPython; i?: number; passed?: boolean; actual?: string | null; error?: ErrorPython | null }
      if (o.fatal) fatal = o.fatal
      else if (typeof o.i === 'number' && o.i >= 0 && o.i < tests.length) {
        resultados.set(o.i, { passed: o.passed === true && !o.error, actual: o.actual ?? null, error: o.error ?? null, timedOut: false })
      }
    } catch {
      // línea corrupta: se ignora
    }
  }
  return tests.map((_, i) => {
    const r = resultados.get(i)
    if (r) return r
    if (fatal) return { passed: false, actual: null, error: fatal, timedOut: false }
    if (s.agotado) return { passed: false, actual: null, error: null, timedOut: true }
    const msg = s.desbordado
      ? 'El programa produjo demasiada salida.'
      : s.codigoSalida === 137
        ? 'El programa usó más memoria de la permitida y fue detenido.'
        : 'La ejecución terminó de forma inesperada.'
    return { passed: false, actual: null, error: { type: 'EjecucionInterrumpida', message: msg, line: null }, timedOut: false }
  })
}
