import bcrypt from 'bcryptjs'
import { sign, verify } from 'hono/jwt'

export interface TokenPayload {
  userId: string
  email: string
  role: 'admin' | 'client'
  exp?: number
}

const JWT_SECRET = process.env.JWT_SECRET || 'webauditor-super-secret-jwt-key-change-in-production-2026'

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10)
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

export async function signToken(payload: TokenPayload): Promise<string> {
  const exp = Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60 // 7 days
  return sign({ ...payload, exp }, JWT_SECRET, 'HS256')
}

export async function verifyToken(token: string): Promise<TokenPayload | null> {
  try {
    const payload = await verify(token, JWT_SECRET, 'HS256')
    return payload as unknown as TokenPayload
  } catch {
    return null
  }
}

export function parseCustomCookies(cookieHeader?: string | null): Record<string, string> {
  if (!cookieHeader) return {}
  const cookies: Record<string, string> = {}
  const items = cookieHeader.split(';')
  for (const item of items) {
    const [name, ...rest] = item.trim().split('=')
    if (name) {
      cookies[name] = decodeURIComponent(rest.join('='))
    }
  }
  return cookies
}
