import { Hono } from 'hono'
import { z } from 'zod'
import { db } from '../db'
import { users, audits, systemSettings } from '../db/schema'
import { eq, count, sql, desc } from 'drizzle-orm'
import { requireAdmin } from '../middleware/auth'

export const adminRoutes = new Hono()

adminRoutes.use('*', requireAdmin)

// Global System Statistics
adminRoutes.get('/stats', async (c) => {
  try {
    const totalUsersResult = await db.select({ count: count() }).from(users).get()
    const totalAuditsResult = await db.select({ count: count() }).from(audits).get()

    const avgScoreResult = await db.select({
      avgOverall: sql<number>`round(avg(${audits.overallScore}), 1)`,
      avgSeo: sql<number>`round(avg(${audits.seoScore}), 1)`,
      avgPerf: sql<number>`round(avg(${audits.performanceScore}), 1)`,
      avgSec: sql<number>`round(avg(${audits.securityScore}), 1)`
    }).from(audits).get()

    // Most scanned domains
    const topDomains = await db.select({
      domain: audits.domain,
      count: count()
    })
    .from(audits)
    .groupBy(audits.domain)
    .orderBy(desc(count()))
    .limit(5)
    .all()

    return c.json({
      totalUsers: totalUsersResult?.count || 0,
      totalAudits: totalAuditsResult?.count || 0,
      averages: {
        overall: avgScoreResult?.avgOverall || 0,
        seo: avgScoreResult?.avgSeo || 0,
        performance: avgScoreResult?.avgPerf || 0,
        security: avgScoreResult?.avgSec || 0
      },
      topDomains
    })
  } catch (err: any) {
    return c.json({ error: err.message }, 500)
  }
})

// List all registered users
adminRoutes.get('/users', async (c) => {
  try {
    const allUsers = await db.select().from(users).orderBy(desc(users.createdAt)).all()

    // Attach audit counts
    const userStats = await Promise.all(
      allUsers.map(async (u) => {
        const auditCount = await db.select({ count: count() }).from(audits).where(eq(audits.userId, u.id)).get()
        return {
          id: u.id,
          name: u.name,
          email: u.email,
          role: u.role,
          createdAt: u.createdAt,
          auditsCount: auditCount?.count || 0
        }
      })
    )

    return c.json({ users: userStats })
  } catch (err: any) {
    return c.json({ error: err.message }, 500)
  }
})

// Delete a user
adminRoutes.delete('/users/:id', async (c) => {
  try {
    const id = c.req.param('id')
    const userToDelete = await db.select().from(users).where(eq(users.id, id)).get()

    if (!userToDelete) {
      return c.json({ error: 'Usuario no encontrado' }, 404)
    }

    if (userToDelete.role === 'admin') {
      const adminCount = await db.select({ count: count() }).from(users).where(eq(users.role, 'admin')).get()
      if ((adminCount?.count || 0) <= 1) {
        return c.json({ error: 'No se puede eliminar el único administrador del sistema.' }, 400)
      }
    }

    await db.delete(users).where(eq(users.id, id)).run()
    return c.json({ success: true })
  } catch (err: any) {
    return c.json({ error: err.message }, 500)
  }
})

// System Settings
adminRoutes.get('/settings', async (c) => {
  try {
    const settingsList = await db.select().from(systemSettings).all()
    const settingsMap: Record<string, string> = {}
    for (const item of settingsList) {
      settingsMap[item.key] = item.value
    }
    return c.json({ settings: settingsMap })
  } catch (err: any) {
    return c.json({ error: err.message }, 500)
  }
})

const updateSettingSchema = z.object({
  key: z.string().min(1),
  value: z.string()
})

adminRoutes.put('/settings', async (c) => {
  try {
    const body = await c.req.json()
    const parsed = updateSettingSchema.safeParse(body)
    if (!parsed.success) {
      return c.json({ error: parsed.error.issues[0].message }, 400)
    }

    await db.insert(systemSettings).values({
      key: parsed.data.key,
      value: parsed.data.value
    }).onConflictDoUpdate({
      target: systemSettings.key,
      set: { value: parsed.data.value }
    }).run()

    return c.json({ success: true, key: parsed.data.key, value: parsed.data.value })
  } catch (err: any) {
    return c.json({ error: err.message }, 500)
  }
})
