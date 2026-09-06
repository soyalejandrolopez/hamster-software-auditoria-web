import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core'

export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  role: text('role', { enum: ['admin', 'client'] }).notNull().default('client'),
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull()
})

export const audits = sqliteTable('audits', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }),
  url: text('url').notNull(),
  domain: text('domain').notNull(),
  overallScore: integer('overall_score').notNull(),
  seoScore: integer('seo_score').notNull(),
  performanceScore: integer('performance_score').notNull(),
  securityScore: integer('security_score').notNull(),
  domainScore: integer('domain_score').notNull(),
  createdAt: integer('created_at').notNull()
})

export const auditDetails = sqliteTable('audit_details', {
  id: text('id').primaryKey(),
  auditId: text('audit_id').notNull().unique().references(() => audits.id, { onDelete: 'cascade' }),
  seoData: text('seo_data').notNull(),
  performanceData: text('performance_data').notNull(),
  securityData: text('security_data').notNull(),
  domainData: text('domain_data').notNull(),
  techData: text('tech_data').notNull(),
  actionPlan: text('action_plan').notNull()
})

export const systemSettings = sqliteTable('system_settings', {
  key: text('key').primaryKey(),
  value: text('value').notNull()
})

export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert
export type Audit = typeof audits.$inferSelect
export type NewAudit = typeof audits.$inferInsert
export type AuditDetail = typeof auditDetails.$inferSelect
export type NewAuditDetail = typeof auditDetails.$inferInsert
export type SystemSetting = typeof systemSettings.$inferSelect
