import bcrypt from 'bcrypt'
import jwt, { type SignOptions } from 'jsonwebtoken'
import { ROLES } from '../domain/usuario.js'
import type { Hasher, Tokens } from '../domain/puertos.js'

export class BcryptHasher implements Hasher {
  constructor(private readonly costo: number) {}
  hash(contrasena: string) {
    return bcrypt.hash(contrasena, this.costo)
  }
  comparar(contrasena: string, hash: string) {
    return bcrypt.compare(contrasena, hash)
  }
}

export class JwtTokens implements Tokens {
  constructor(
    private readonly secreto: string,
    private readonly expiraEn: string,
  ) {}

  firmar({ id, rol }: { id: number; rol: (typeof ROLES)[number] }) {
    return jwt.sign({ rol }, this.secreto, {
      algorithm: 'HS256',
      subject: String(id),
      expiresIn: this.expiraEn as SignOptions['expiresIn'],
    })
  }

  verificar(token: string) {
    try {
      const p = jwt.verify(token, this.secreto, { algorithms: ['HS256'] })
      if (typeof p === 'string' || !p.sub || !ROLES.includes(p.rol)) return null
      return { id: Number(p.sub), rol: p.rol }
    } catch {
      return null
    }
  }
}
