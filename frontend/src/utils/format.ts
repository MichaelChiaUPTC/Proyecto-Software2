const rtf = new Intl.RelativeTimeFormat('es', { numeric: 'auto' })

export function relativeTime(iso: string): string {
  const diff = new Date(iso).getTime() - Date.now()
  const min = Math.round(diff / 60000)
  if (Math.abs(min) < 1) return 'ahora mismo'
  if (Math.abs(min) < 60) return rtf.format(min, 'minute')
  const h = Math.round(min / 60)
  if (Math.abs(h) < 24) return rtf.format(h, 'hour')
  const d = Math.round(h / 24)
  if (Math.abs(d) < 30) return rtf.format(d, 'day')
  return rtf.format(Math.round(d / 30), 'month')
}

export function shortDate(iso: string): string {
  return new Date(iso).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })
}

export function daysSince(iso: string): number {
  return Math.floor((Date.now() - new Date(iso).getTime()) / 864e5)
}

export function initials(name: string): string {
  const parts = name.replace(/^Profesor\s+/i, '').split(' ').filter(Boolean)
  return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase()
}

export function greeting(): string {
  const h = new Date().getHours()
  if (h < 12) return 'Buenos días'
  if (h < 19) return 'Buenas tardes'
  return 'Buenas noches'
}

export const difficultyLabel = { basic: 'Básico', medium: 'Intermedio', advanced: 'Avanzado' } as const

export function cx(...c: (string | false | null | undefined)[]): string {
  return c.filter(Boolean).join(' ')
}

export function plural(n: number, one: string, many: string): string {
  return `${n} ${n === 1 ? one : many}`
}
