import { Hono } from 'hono'
import { z } from 'zod'
import { db } from '../db'
import { audits, auditDetails, systemSettings } from '../db/schema'
import { eq, desc, and } from 'drizzle-orm'
import { requireAuth } from '../utils/hono-middleware'
import { runAudit } from '../services/auditor'

export const auditRoutes = new Hono()

auditRoutes.use('*', requireAuth)

const scanSchema = z.object({
  url: z.string().min(3, 'URL requerida')
})

// Trigger a new website audit
auditRoutes.post('/scan', async (c) => {
  try {
    const user = c.get('user')!
    const body = await c.req.json()
    const parsed = scanSchema.safeParse(body)
    if (!parsed.success) {
      return c.json({ error: parsed.error.issues[0].message }, 400)
    }

    // Retrieve optional PageSpeed API Key from settings
    const pageSpeedSetting = await db.select().from(systemSettings).where(eq(systemSettings.key, 'pagespeed_api_key')).get()
    const pageSpeedApiKey = pageSpeedSetting?.value || process.env.PAGESPEED_API_KEY

    // Run the comprehensive audit
    const result = await runAudit(parsed.data.url, { pageSpeedApiKey })

    // Save to Database
    const auditId = 'aud_' + Math.random().toString(36).substring(2, 10)
    const now = Math.floor(Date.now() / 1000)

    await db.insert(audits).values({
      id: auditId,
      userId: user.id,
      url: result.url,
      domain: result.domain,
      overallScore: result.overallScore,
      seoScore: result.seo.score,
      performanceScore: result.performance.score,
      securityScore: result.security.score,
      domainScore: result.domainData.score,
      createdAt: now
    }).run()

    await db.insert(auditDetails).values({
      id: 'dtl_' + auditId,
      auditId,
      seoData: JSON.stringify(result.seo),
      performanceData: JSON.stringify(result.performance),
      securityData: JSON.stringify(result.security),
      domainData: JSON.stringify(result.domainData),
      techData: JSON.stringify(result.tech.detected),
      actionPlan: JSON.stringify(result.actionPlan)
    }).run()

    const savedAudit = await db.select().from(audits).where(eq(audits.id, auditId)).get()

    return c.json({
      audit: savedAudit,
      details: {
        seo: result.seo,
        performance: result.performance,
        security: result.security,
        domainData: result.domainData,
        tech: result.tech.detected,
        actionPlan: result.actionPlan
      }
    }, 201)
  } catch (err: any) {
    return c.json({ error: err.message || 'Error al ejecutar la auditoría' }, 500)
  }
})

// List audits (client sees own, admin sees all)
auditRoutes.get('/', async (c) => {
  try {
    const user = c.get('user')!
    let list

    if (user.role === 'admin') {
      list = await db.select().from(audits).orderBy(desc(audits.createdAt)).all()
    } else {
      list = await db.select().from(audits).where(eq(audits.userId, user.id)).orderBy(desc(audits.createdAt)).all()
    }

    return c.json({ audits: list })
  } catch (err: any) {
    return c.json({ error: err.message }, 500)
  }
})

// Get single audit by ID with full details
auditRoutes.get('/:id', async (c) => {
  try {
    const user = c.get('user')!
    const id = c.req.param('id')

    const audit = await db.select().from(audits).where(eq(audits.id, id)).get()
    if (!audit) {
      return c.json({ error: 'Auditoría no encontrada' }, 404)
    }

    if (user.role !== 'admin' && audit.userId !== user.id) {
      return c.json({ error: 'No tienes permiso para ver esta auditoría' }, 403)
    }

    const details = await db.select().from(auditDetails).where(eq(auditDetails.auditId, id)).get()

    return c.json({
      audit,
      details: details ? {
        seo: JSON.parse(details.seoData),
        performance: JSON.parse(details.performanceData),
        security: JSON.parse(details.securityData),
        domainData: JSON.parse(details.domainData),
        tech: JSON.parse(details.techData),
        actionPlan: JSON.parse(details.actionPlan)
      } : null
    })
  } catch (err: any) {
    return c.json({ error: err.message }, 500)
  }
})

// Delete an audit
auditRoutes.delete('/:id', async (c) => {
  try {
    const user = c.get('user')!
    const id = c.req.param('id')

    const audit = await db.select().from(audits).where(eq(audits.id, id)).get()
    if (!audit) {
      return c.json({ error: 'Auditoría no encontrada' }, 404)
    }

    if (user.role !== 'admin' && audit.userId !== user.id) {
      return c.json({ error: 'No tienes permiso para eliminar esta auditoría' }, 403)
    }

    await db.delete(audits).where(eq(audits.id, id)).run()
    return c.json({ success: true })
  } catch (err: any) {
    return c.json({ error: err.message }, 500)
  }
})

// Get score evolution for a domain
auditRoutes.get('/history/:domain', async (c) => {
  try {
    const user = c.get('user')!
    const domain = c.req.param('domain').toLowerCase()

    let history
    if (user.role === 'admin') {
      history = await db.select().from(audits).where(eq(audits.domain, domain)).orderBy(desc(audits.createdAt)).all()
    } else {
      history = await db.select().from(audits).where(and(eq(audits.domain, domain), eq(audits.userId, user.id))).orderBy(desc(audits.createdAt)).all()
    }

    return c.json({ domain, history })
  } catch (err: any) {
    return c.json({ error: err.message }, 500)
  }
})
