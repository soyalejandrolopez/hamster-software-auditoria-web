import bcrypt from 'bcryptjs'
import { db } from './index'
import { users } from './schema'
import { eq } from 'drizzle-orm'

export interface SeedAdminOptions {
  email?: string
  password?: string
  name?: string
}

export async function ensureAdminSeeded(options?: SeedAdminOptions) {
  const adminEmail = options?.email || process.env.ADMIN_EMAIL || 'admin@monitor.local'
  const adminPassword = options?.password || process.env.ADMIN_PASSWORD || 'Admin123!*'
  const adminName = options?.name || process.env.ADMIN_NAME || 'Administrador Hamster Software'

  // Check if an admin exists
  const existingAdmin = await db.select().from(users).where(eq(users.role, 'admin')).get()
  if (existingAdmin) {
    return existingAdmin
  }

  // Create admin user
  const passwordHash = await bcrypt.hash(adminPassword, 10)
  const now = Math.floor(Date.now() / 1000)
  const adminId = 'usr_admin_' + Math.random().toString(36).substring(2, 9)

  await db.insert(users).values({
    id: adminId,
    name: adminName,
    email: adminEmail,
    passwordHash,
    role: 'admin',
    createdAt: now,
    updatedAt: now
  }).run()

  const created = await db.select().from(users).where(eq(users.id, adminId)).get()
  return created!
}
