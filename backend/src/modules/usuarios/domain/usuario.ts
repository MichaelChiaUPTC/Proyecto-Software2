export const ROLES = ['student', 'teacher', 'admin'] as const
export type Rol = (typeof ROLES)[number]

export interface Usuario {
  id: number
  nombre: string
  correo: string
  hashContrasena: string
  rol: Rol
  activo: boolean
  programa: string | null
  semestre: number | null
  grupo: string | null
  fechaCreacion: Date
}

/** Forma pública del usuario: mismos nombres que el tipo User del frontend. */
export interface UsuarioPublico {
  id: number
  name: string
  email: string
  role: Rol
  active: boolean
  program: string | null
  semester: number | null
  group: string | null
  joinedAt: string
}

export const normalizarCorreo = (correo: string) => correo.trim().toLowerCase()

export const esCorreoInstitucional = (correo: string) => /^[^\s@]+@uptc\.edu\.co$/.test(normalizarCorreo(correo))

export const MIN_CONTRASENA = 8
export const contrasenaValida = (contrasena: string) => contrasena.length >= MIN_CONTRASENA

export const aUsuarioPublico = (u: Usuario): UsuarioPublico => ({
  id: u.id,
  name: u.nombre,
  email: u.correo,
  role: u.rol,
  active: u.activo,
  program: u.programa,
  semester: u.semestre,
  group: u.grupo,
  joinedAt: u.fechaCreacion.toISOString(),
})
