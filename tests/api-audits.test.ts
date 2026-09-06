import { describe, it, expect, beforeEach } from 'vitest'
import { resetDatabaseForTests, db } from '../server/db'
import { users, audits, auditDetails, systemSettings } from '../server/db/schema'
import { createHonoApp } from '../server/app'
import { ensureAdminSeeded } from '../server/db/seed'
import { hashPassword, signToken } from '../server/utils/auth'

describe('Hono Audits & Admin API Endpoints', () => {
  let app: ReturnType<typeof createHonoApp>
  let clientToken: string
  let clientCookie: string
  let clientId: string
  let adminToken: string
  let adminCookie: string
  let adminId: string

  beforeEach(async () => {
    await resetDatabaseForTests()
    app = createHonoApp()

    // Create client
    clientId = 'usr_client_' + Date.now()
    const passwordHash = await hashPassword('Password123!')
    const now = Math.floor(Date.now() / 1000)

    await db.insert(users).values({
      id: clientId,
      name: 'Cliente Test',
      email: 'cliente@test.com',
      passwordHash,
      role: 'client',
      createdAt: now,
      updatedAt: now
    }).run()

    clientToken = await signToken({ userId: clientId, email: 'cliente@test.com', role: 'client' })
    clientCookie = `auth_token=${clientToken}`

    // Create admin
    const admin = await ensureAdminSeeded({
      email: 'admin@monitor.local',
      password: 'AdminPassword123!',
      name: 'Admin Global'
    })
    adminId = admin.id
    adminToken = await signToken({ userId: admin.id, email: admin.email, role: 'admin' })
    adminCookie = `auth_token=${adminToken}`
  })

  it('should list empty audits initially for client', async () => {
    const res = await app.request('/api/audits', {
      headers: { Cookie: clientCookie }
    })
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.audits).toEqual([])
  })

  it('should return 401 on /api/audits without authentication', async () => {
    const res = await app.request('/api/audits')
    expect(res.status).toBe(401)
  })

  it('should allow guest to view a public audit without authentication', async () => {
    const auditId = 'aud_guest_1'
    const now = Math.floor(Date.now() / 1000)

    await db.insert(audits).values({
      id: auditId,
      userId: null,
      url: 'https://guest-example.com',
      domain: 'guest-example.com',
      overallScore: 88,
      seoScore: 90,
      performanceScore: 85,
      securityScore: 85,
      domainScore: 90,
      accessibilityScore: 95,
      createdAt: now
    }).run()

    await db.insert(auditDetails).values({
      id: 'dtl_' + auditId,
      auditId,
      seoData: JSON.stringify({ title: 'Guest Site' }),
      performanceData: JSON.stringify({ ttfb: 120 }),
      securityData: JSON.stringify({ https: true }),
      domainData: JSON.stringify({ a: ['1.2.3.4'] }),
      techData: JSON.stringify([]),
      accessibilityData: JSON.stringify({ score: 95 }),
      linksData: JSON.stringify({ broken: [] }),
      actionPlan: JSON.stringify([])
    }).run()

    // Request WITHOUT any Cookie or Auth header
    const res = await app.request(`/api/audits/${auditId}`)
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.audit.domain).toBe('guest-example.com')
    expect(data.audit.userId).toBeNull()
    expect(data.details.accessibility.score).toBe(95)
  })

  it('should fetch audit details and delete audit by owner', async () => {
    // Seed an audit for the client
    const auditId = 'aud_test_1'
    const now = Math.floor(Date.now() / 1000)

    await db.insert(audits).values({
      id: auditId,
      userId: clientId,
      url: 'https://example.com',
      domain: 'example.com',
      overallScore: 90,
      seoScore: 95,
      performanceScore: 85,
      securityScore: 90,
      domainScore: 90,
      createdAt: now
    }).run()

    await db.insert(auditDetails).values({
      id: 'dtl_' + auditId,
      auditId,
      seoData: JSON.stringify({ title: 'Sample' }),
      performanceData: JSON.stringify({ ttfb: 100 }),
      securityData: JSON.stringify({ https: true }),
      domainData: JSON.stringify({ a: ['1.2.3.4'] }),
      techData: JSON.stringify([{ name: 'Nuxt' }]),
      actionPlan: JSON.stringify([{ id: 'test_action', title: 'Action 1' }])
    }).run()

    // Get detail
    const detailRes = await app.request(`/api/audits/${auditId}`, {
      headers: { Cookie: clientCookie }
    })
    expect(detailRes.status).toBe(200)
    const detailData = await detailRes.json()
    expect(detailData.audit.domain).toBe('example.com')
    expect(detailData.details.actionPlan[0].title).toBe('Action 1')

    // Delete
    const deleteRes = await app.request(`/api/audits/${auditId}`, {
      method: 'DELETE',
      headers: { Cookie: clientCookie }
    })
    expect(deleteRes.status).toBe(200)

    // Verify deleted
    const verifyRes = await app.request(`/api/audits/${auditId}`, {
      headers: { Cookie: clientCookie }
    })
    expect(verifyRes.status).toBe(404)
  })

  it('should block non-admin users from /api/admin/stats', async () => {
    const res = await app.request('/api/admin/stats', {
      headers: { Cookie: clientCookie }
    })
    expect(res.status).toBe(403)
  })

  it('should allow admin to access stats, users, and update settings', async () => {
    const statsRes = await app.request('/api/admin/stats', {
      headers: { Cookie: adminCookie }
    })
    expect(statsRes.status).toBe(200)
    const stats = await statsRes.json()
    expect(stats.totalUsers).toBeGreaterThanOrEqual(2)

    const usersRes = await app.request('/api/admin/users', {
      headers: { Cookie: adminCookie }
    })
    expect(usersRes.status).toBe(200)
    const usersData = await usersRes.json()
    expect(usersData.users.some((u: any) => u.email === 'cliente@test.com')).toBe(true)

    // Update settings
    const putSettingsRes = await app.request('/api/admin/settings', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Cookie: adminCookie
      },
      body: JSON.stringify({
        key: 'pagespeed_api_key',
        value: 'AIzaSySecretGoogleKey'
      })
    })
    expect(putSettingsRes.status).toBe(200)

    const getSettingsRes = await app.request('/api/admin/settings', {
      headers: { Cookie: adminCookie }
    })
    expect(getSettingsRes.status).toBe(200)
    const settingsData = await getSettingsRes.json()
    expect(settingsData.settings['pagespeed_api_key']).toBe('AIzaSySecretGoogleKey')
  })
})
