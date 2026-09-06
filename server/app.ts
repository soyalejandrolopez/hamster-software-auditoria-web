import { Hono } from 'hono'
import { authMiddleware } from './middleware/auth'
import { authRoutes } from './routes/auth'
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

  // Health check
  api.get('/health', (c) => c.json({ status: 'ok', timestamp: new Date().toISOString() }))

  app.route('/api', api)

  return app
}
