import { Hono } from 'hono'
import { authMiddleware } from './utils/hono-middleware'
import { authRoutes } from './routes/auth'
import { auditRoutes } from './routes/audits'
import { adminRoutes } from './routes/admin'
import { ensureAdminSeeded } from './db/seed'

let adminSeeded = false

export function createHonoApp() {
  const app = new Hono()

  // Ensure initial admin exists on first launch
  if (!adminSeeded && process.env.NODE_ENV !== 'test') {
    adminSeeded = true
    ensureAdminSeeded().catch((err) => console.error('[Seed] Error seeding admin:', err))
  }

  // Base API router
  const api = new Hono()
  api.use('*', authMiddleware)

  // Register sub-routers
  api.route('/auth', authRoutes)
  api.route('/audits', auditRoutes)
  api.route('/admin', adminRoutes)

  // Health check
  api.get('/health', (c) => c.json({ status: 'ok', timestamp: new Date().toISOString() }))

  app.route('/api', api)

  return app
}
