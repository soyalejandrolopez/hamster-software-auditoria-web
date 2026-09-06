import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

export interface TokenPayload {
  userId: string
  email: string
  role: 'admin' | 'client'
}

const JWT_SECRET = process.env.JWT_SECRET || 'webauditor-super-secret-jwt-key-change-in-production-2026'

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10)
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

export function signToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' })
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload
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
