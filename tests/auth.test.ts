import { describe, it, expect, beforeEach } from 'vitest'
import { resetDatabaseForTests } from '../server/db'
import { createHonoApp } from '../server/app'
import { ensureAdminSeeded } from '../server/db/seed'

describe('Hono Authentication Module', () => {
  let app: ReturnType<typeof createHonoApp>

  beforeEach(async () => {
    await resetDatabaseForTests()
    app = createHonoApp()
  })

  it('should register a new client successfully and set auth cookie', async () => {
    const res = await app.request('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Maria Perez',
        email: 'maria@example.com',
        password: 'Password123!'
      })
    })

    expect(res.status).toBe(201)
    const data = await res.json()
    expect(data.user).toBeDefined()
    expect(data.user.email).toBe('maria@example.com')
    expect(data.user.role).toBe('client')
    expect(data.user.passwordHash).toBeUndefined()

    // Verify Set-Cookie header contains auth_token
    const cookie = res.headers.get('set-cookie')
    expect(cookie).toContain('auth_token=')
  })

  it('should reject registration if email is already registered', async () => {
    // First registration
    await app.request('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Maria Perez',
        email: 'maria@example.com',
        password: 'Password123!'
      })
    })

    // Duplicate registration
    const res2 = await app.request('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Maria Otra',
        email: 'maria@example.com',
        password: 'Password999!'
      })
    })

    expect(res2.status).toBe(400)
    const err = await res2.json()
    expect(err.error).toMatch(/correo.*registrado/i)
  })

  it('should login with valid credentials and fail with invalid credentials', async () => {
    await app.request('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Juan Perez',
        email: 'juan@example.com',
        password: 'SecretPassword123!'
      })
    })

    // Bad password
    const failRes = await app.request('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'juan@example.com',
        password: 'WrongPassword'
      })
    })
    expect(failRes.status).toBe(401)

    // Good password
    const successRes = await app.request('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'juan@example.com',
        password: 'SecretPassword123!'
      })
    })
    expect(successRes.status).toBe(200)
    const cookie = successRes.headers.get('set-cookie')
    expect(cookie).toContain('auth_token=')
  })

  it('should return the current user with /api/auth/me when token is provided', async () => {
    const regRes = await app.request('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Clara Gomez',
        email: 'clara@example.com',
        password: 'ClaraPassword123!'
      })
    })
    const regCookie = regRes.headers.get('set-cookie')!.split(';')[0]

    const meRes = await app.request('/api/auth/me', {
      headers: { Cookie: regCookie }
    })
    expect(meRes.status).toBe(200)
    const meData = await meRes.json()
    expect(meData.user.email).toBe('clara@example.com')
    expect(meData.user.role).toBe('client')
  })

  it('should allow admin login and correctly report admin role', async () => {
    await ensureAdminSeeded({
      email: 'admin@monitor.local',
      password: 'AdminPassword123!',
      name: 'Site Admin'
    })

    const loginRes = await app.request('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@monitor.local',
        password: 'AdminPassword123!'
      })
    })

    expect(loginRes.status).toBe(200)
    const data = await loginRes.json()
    expect(data.user.role).toBe('admin')
    expect(data.user.name).toBe('Site Admin')
  })

  it('should clear cookie on logout', async () => {
    const res = await app.request('/api/auth/logout', { method: 'POST' })
    expect(res.status).toBe(200)
    const cookie = res.headers.get('set-cookie')
    expect(cookie).toContain('Max-Age=0')
  })
})
