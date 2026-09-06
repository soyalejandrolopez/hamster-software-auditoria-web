import type { MiddlewareHandler } from 'hono'
import { verifyToken, parseCustomCookies, TokenPayload } from './auth'
import { db } from '../db'
import { users, User } from '../db/schema'
import { eq } from 'drizzle-orm'

declare module 'hono' {
  interface ContextVariableMap {
    user: Omit<User, 'passwordHash'> | null
    tokenPayload: TokenPayload | null
  }
}

export const authMiddleware: MiddlewareHandler = async (c, next) => {
  const cookieHeader = c.req.header('cookie')
  const cookies = parseCustomCookies(cookieHeader)
  let token = cookies['auth_token']

  if (!token) {
    const authHeader = c.req.header('authorization')
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7)
    }
  }

  if (token) {
    const payload = verifyToken(token)
    if (payload) {
      c.set('tokenPayload', payload)
      const user = await db.select().from(users).where(eq(users.id, payload.userId)).get()
      if (user) {
        const { passwordHash: _, ...safeUser } = user
        c.set('user', safeUser)
      } else {
        c.set('user', null)
      }
    } else {
      c.set('user', null)
      c.set('tokenPayload', null)
    }
  } else {
    c.set('user', null)
    c.set('tokenPayload', null)
  }

  await next()
}

export const requireAuth: MiddlewareHandler = async (c, next) => {
  const user = c.get('user')
  if (!user) {
    return c.json({ error: 'No autenticado. Por favor inicia sesión.' }, 401)
  }
  await next()
}

export const requireAdmin: MiddlewareHandler = async (c, next) => {
  const user = c.get('user')
  if (!user) {
    return c.json({ error: 'No autenticado. Por favor inicia sesión.' }, 401)
  }
  if (user.role !== 'admin') {
    return c.json({ error: 'Acceso denegado. Se requiere rol de Administrador.' }, 403)
  }
  await next()
}
