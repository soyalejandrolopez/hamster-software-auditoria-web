import { describe, it, expect, beforeEach } from 'vitest'
import { db, resetDatabaseForTests } from '../server/db'
import { users, audits, auditDetails, systemSettings } from '../server/db/schema'
import { eq } from 'drizzle-orm'
import { ensureAdminSeeded } from '../server/db/seed'

describe('Database Layer with Drizzle ORM', () => {
  beforeEach(async () => {
    await resetDatabaseForTests()
  })

  it('should initialize tables without throwing', async () => {
    const allUsers = await db.select().from(users).all()
    expect(Array.isArray(allUsers)).toBe(true)
  })

  it('should insert and query users with role client and admin', async () => {
    const userId = 'usr_' + Date.now()
    await db.insert(users).values({
      id: userId,
      name: 'Test Client',
      email: 'client@example.com',
      passwordHash: 'hashed_password_xyz',
      role: 'client',
      createdAt: Math.floor(Date.now() / 1000),
      updatedAt: Math.floor(Date.now() / 1000)
    }).run()

    const found = await db.select().from(users).where(eq(users.email, 'client@example.com')).get()
    expect(found).toBeDefined()
    expect(found?.name).toBe('Test Client')
    expect(found?.role).toBe('client')
  })

  it('should auto-seed default admin account if none exists', async () => {
    const admin = await ensureAdminSeeded({
      email: 'admin@monitor.local',
      password: 'AdminPassword123!',
      name: 'Super Admin'
    })

    expect(admin).toBeDefined()
    expect(admin.role).toBe('admin')
    expect(admin.email).toBe('admin@monitor.local')

    // Calling ensureAdminSeeded again should return the existing admin without re-inserting
    const sameAdmin = await ensureAdminSeeded({
      email: 'admin@monitor.local',
      password: 'AdminPassword123!',
      name: 'Super Admin'
    })
    expect(sameAdmin.id).toBe(admin.id)
  })

  it('should insert audit and audit details with cascade relationships', async () => {
    const userId = 'usr_auditor_' + Date.now()
    await db.insert(users).values({
      id: userId,
      name: 'Audit Owner',
      email: 'auditor@example.com',
      passwordHash: 'hashed',
      role: 'client',
      createdAt: Math.floor(Date.now() / 1000),
      updatedAt: Math.floor(Date.now() / 1000)
    }).run()

    const auditId = 'aud_' + Date.now()
    await db.insert(audits).values({
      id: auditId,
      userId,
      url: 'https://example.com',
      domain: 'example.com',
      overallScore: 88,
      seoScore: 92,
      performanceScore: 85,
      securityScore: 90,
      domainScore: 85,
      createdAt: Math.floor(Date.now() / 1000)
    }).run()

    await db.insert(auditDetails).values({
      id: 'dtl_' + auditId,
      auditId,
      seoData: JSON.stringify({ title: 'Example Domain' }),
      performanceData: JSON.stringify({ ttfb: 140 }),
      securityData: JSON.stringify({ https: true }),
      domainData: JSON.stringify({ records: ['93.184.216.34'] }),
      techData: JSON.stringify([{ name: 'Nginx', category: 'Web Server' }]),
      actionPlan: JSON.stringify([{ id: 'hsts', title: 'Enable HSTS', severity: 'warning' }])
    }).run()

    const storedAudit = await db.select().from(audits).where(eq(audits.id, auditId)).get()
    const storedDetails = await db.select().from(auditDetails).where(eq(auditDetails.auditId, auditId)).get()

    expect(storedAudit).toBeDefined()
    expect(storedAudit?.overallScore).toBe(88)
    expect(storedDetails).toBeDefined()
    expect(JSON.parse(storedDetails!.actionPlan)[0].title).toBe('Enable HSTS')
  })

  it('should read and write system settings', async () => {
    await db.insert(systemSettings).values({
      key: 'pagespeed_api_key',
      value: 'TEST_KEY_123'
    }).onConflictDoUpdate({
      target: systemSettings.key,
      set: { value: 'TEST_KEY_123' }
    }).run()

    const setting = await db.select().from(systemSettings).where(eq(systemSettings.key, 'pagespeed_api_key')).get()
    expect(setting?.value).toBe('TEST_KEY_123')
  })
})
