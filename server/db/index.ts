import { createClient, type Client } from '@libsql/client'
import { drizzle } from 'drizzle-orm/libsql'
import * as schema from './schema'
import path from 'node:path'
import fs from 'node:fs'

// ─── Resilient In-Memory Store for Edge / Cloudflare Workers without Remote DB ───
interface InMemoryStore {
  users: Array<{
    id: string
    name: string
    email: string
    password_hash: string
    role: string
    created_at: number
    updated_at: number
  }>
  audits: Array<{
    id: string
    user_id: string | null
    url: string
    domain: string
    overall_score: number
    seo_score: number
    performance_score: number
    security_score: number
    domain_score: number
    accessibility_score: number | null
    created_at: number
  }>
  audit_details: Array<{
    id: string
    audit_id: string
    seo_data: string
    performance_data: string
    security_data: string
    domain_data: string
    tech_data: string
    accessibility_data: string | null
    links_data: string | null
    action_plan: string
  }>
  system_settings: Array<{
    key: string
    value: string
  }>
}

const memoryStore: InMemoryStore = {
  users: [
    {
      id: 'usr_admin_principal',
      name: 'Administrador Hamster Software',
      email: 'admin@monitor.local',
      password_hash: '$2a$10$vr25vhg9nqRWjSEIkqvkiuf40UVZkXFdxmq.xJqhvQEmCTobin8YK', // Admin123!*
      role: 'admin',
      created_at: Math.floor(Date.now() / 1000) - 30 * 86400,
      updated_at: Math.floor(Date.now() / 1000)
    },
    {
      id: 'usr_client_carlos',
      name: 'Carlos Mendoza',
      email: 'carlos.mendoza@empresa.com',
      password_hash: '$2a$10$uLQKBuVM.u/z5HtQaFU7.OIhK3.kLo3V1IBHTSIwrIE98QZ33hNma', // Cliente123!*
      role: 'client',
      created_at: Math.floor(Date.now() / 1000) - 20 * 86400,
      updated_at: Math.floor(Date.now() / 1000)
    }
  ],
  audits: [
    {
      id: 'aud_sample_stripe',
      user_id: 'usr_admin_principal',
      url: 'https://stripe.com',
      domain: 'stripe.com',
      overall_score: 95,
      seo_score: 94,
      performance_score: 92,
      security_score: 98,
      domain_score: 100,
      accessibility_score: 92,
      created_at: Math.floor(Date.now() / 1000) - 10 * 86400
    },
    {
      id: 'aud_sample_tienda',
      user_id: 'usr_client_carlos',
      url: 'https://tienda-modamujer.es',
      domain: 'tienda-modamujer.es',
      overall_score: 72,
      seo_score: 68,
      performance_score: 65,
      security_score: 78,
      domain_score: 85,
      accessibility_score: 65,
      created_at: Math.floor(Date.now() / 1000) - 5 * 86400
    }
  ],
  audit_details: [
    {
      id: 'det_sample_stripe',
      audit_id: 'aud_sample_stripe',
      seo_data: JSON.stringify({ score: 94, metaTitle: 'Stripe | Infraestructura financiera para Internet', metaDescription: 'Infraestructura de pagos online y offline para millones de empresas.' }),
      performance_data: JSON.stringify({ score: 92, ttfb: 78, loadTime: 450 }),
      security_data: JSON.stringify({ score: 98, isHttps: true }),
      domain_data: JSON.stringify({ score: 100, records: { a: ['199.60.103.28'] } }),
      tech_data: JSON.stringify({ frameworks: [{ name: 'React' }], servers: [{ name: 'Cloudflare' }] }),
      accessibility_data: JSON.stringify({ score: 92, passes: 12, violations: [] }),
      links_data: JSON.stringify({ totalChecked: 15, brokenCount: 0, internalCount: 12, externalCount: 3 }),
      action_plan: JSON.stringify([])
    }
  ],
  system_settings: []
}

function createInMemoryLibSqlClient(): Client {
  return {
    async execute(stmt: any) {
      const sql: string = (typeof stmt === 'string' ? stmt : stmt.sql || '').trim()
      const args: any[] = typeof stmt === 'string' ? [] : (stmt.args || [])
      const lowerSql = sql.toLowerCase()

      // DDL or PRAGMA statements
      if (lowerSql.startsWith('pragma') || lowerSql.startsWith('create') || lowerSql.startsWith('alter')) {
        return { columns: [], columnTypes: [], rows: [], rowsAffected: 0, lastInsertRowid: null }
      }

      // INSERT
      if (lowerSql.startsWith('insert')) {
        const tableMatch = sql.match(/insert\s+into\s+["']?(\w+)["']?\s*\(([^)]+)\)/i)
        if (tableMatch) {
          const table = tableMatch[1].toLowerCase()
          const rawCols = tableMatch[2].split(',').map(c => c.trim().replace(/["']/g, ''))
          const record: any = {}
          rawCols.forEach((col, idx) => {
            record[col] = args[idx] !== undefined ? args[idx] : null
          })
          if (table === 'users') {
            memoryStore.users.push(record)
          } else if (table === 'audits') {
            memoryStore.audits.unshift(record)
          } else if (table === 'audit_details') {
            memoryStore.audit_details.unshift(record)
          } else if (table === 'system_settings') {
            const existing = memoryStore.system_settings.find(s => s.key === record.key)
            if (existing) existing.value = record.value
            else memoryStore.system_settings.push(record)
          }
        }
        return { columns: [], columnTypes: [], rows: [], rowsAffected: 1, lastInsertRowid: 1 }
      }

      // DELETE
      if (lowerSql.startsWith('delete')) {
        if (lowerSql.includes('from "users"') || lowerSql.includes('from users')) {
          if (args.length > 0) memoryStore.users = memoryStore.users.filter(u => u.id !== args[0])
          else memoryStore.users = []
        } else if (lowerSql.includes('from "audits"') || lowerSql.includes('from audits')) {
          if (args.length > 0) {
            memoryStore.audits = memoryStore.audits.filter(a => a.id !== args[0])
            memoryStore.audit_details = memoryStore.audit_details.filter(d => d.audit_id !== args[0])
          } else {
            memoryStore.audits = []
          }
        } else if (lowerSql.includes('from "audit_details"') || lowerSql.includes('from audit_details')) {
          if (args.length > 0) memoryStore.audit_details = memoryStore.audit_details.filter(d => d.audit_id !== args[0])
          else memoryStore.audit_details = []
        } else if (lowerSql.includes('from "system_settings"') || lowerSql.includes('from system_settings')) {
          memoryStore.system_settings = []
        }
        return { columns: [], columnTypes: [], rows: [], rowsAffected: 1, lastInsertRowid: null }
      }

      // SELECT
      if (lowerSql.startsWith('select')) {
        // Table: users
        if (lowerSql.includes('from "users"') || lowerSql.includes('from users')) {
          let list = [...memoryStore.users]
          if (lowerSql.includes('where') && args.length > 0) {
            list = list.filter(u => u.id === args[0] || u.email === args[0] || u.role === args[0])
          }
          if (lowerSql.includes('order by')) {
            list.sort((a, b) => b.created_at - a.created_at)
          }
          if (lowerSql.includes('count(')) {
            return { columns: ['count'], columnTypes: ['INTEGER'], rows: [[list.length]], rowsAffected: 0, lastInsertRowid: null }
          }
          const cols = ['id', 'name', 'email', 'password_hash', 'role', 'created_at', 'updated_at']
          const rows = list.map(u => cols.map(c => (u as any)[c]))
          return { columns: cols, columnTypes: cols.map(() => 'TEXT'), rows, rowsAffected: 0, lastInsertRowid: null }
        }

        // Table: audits
        if (lowerSql.includes('from "audits"') || lowerSql.includes('from audits')) {
          let list = [...memoryStore.audits]
          if (lowerSql.includes('where') && args.length > 0) {
            if (args.length === 1) {
              list = list.filter(a => a.id === args[0] || a.user_id === args[0] || a.domain === args[0])
            } else if (args.length === 2) {
              list = list.filter(a => a.domain === args[0] && a.user_id === args[1])
            }
          }
          if (lowerSql.includes('order by')) {
            list.sort((a, b) => b.created_at - a.created_at)
          }
          if (lowerSql.includes('count(')) {
            return { columns: ['count'], columnTypes: ['INTEGER'], rows: [[list.length]], rowsAffected: 0, lastInsertRowid: null }
          }
          if (lowerSql.includes('avg(')) {
            const sum = list.reduce((acc, a) => acc + (a.overall_score || 0), 0)
            const avg = list.length > 0 ? Math.round(sum / list.length) : 0
            return { columns: ['avg'], columnTypes: ['INTEGER'], rows: [[avg]], rowsAffected: 0, lastInsertRowid: null }
          }
          // Top domains query: select "domain", count(...), avg(...) from "audits" group by "domain"
          if (lowerSql.includes('group by') && lowerSql.includes('domain')) {
            const domainMap = new Map<string, { count: number; sum: number }>()
            for (const a of list) {
              const d = domainMap.get(a.domain) || { count: 0, sum: 0 }
              d.count++
              d.sum += a.overall_score || 0
              domainMap.set(a.domain, d)
            }
            const rows = Array.from(domainMap.entries()).map(([domain, data]) => [
              domain,
              data.count,
              Math.round(data.sum / data.count)
            ])
            return {
              columns: ['domain', 'count', 'avgScore'],
              columnTypes: ['TEXT', 'INTEGER', 'INTEGER'],
              rows,
              rowsAffected: 0,
              lastInsertRowid: null
            }
          }
          const cols = ['id', 'user_id', 'url', 'domain', 'overall_score', 'seo_score', 'performance_score', 'security_score', 'domain_score', 'accessibility_score', 'created_at']
          const rows = list.map(a => cols.map(c => (a as any)[c]))
          return { columns: cols, columnTypes: cols.map(() => 'TEXT'), rows, rowsAffected: 0, lastInsertRowid: null }
        }

        // Table: audit_details
        if (lowerSql.includes('from "audit_details"') || lowerSql.includes('from audit_details')) {
          let list = [...memoryStore.audit_details]
          if (lowerSql.includes('where') && args.length > 0) {
            list = list.filter(d => d.audit_id === args[0] || d.id === args[0])
          }
          const cols = ['id', 'audit_id', 'seo_data', 'performance_data', 'security_data', 'domain_data', 'tech_data', 'accessibility_data', 'links_data', 'action_plan']
          const rows = list.map(d => cols.map(c => (d as any)[c]))
          return { columns: cols, columnTypes: cols.map(() => 'TEXT'), rows, rowsAffected: 0, lastInsertRowid: null }
        }

        // Table: system_settings
        if (lowerSql.includes('from "system_settings"') || lowerSql.includes('from system_settings')) {
          let list = [...memoryStore.system_settings]
          if (lowerSql.includes('where') && args.length > 0) {
            list = list.filter(s => s.key === args[0])
          }
          const cols = ['key', 'value']
          const rows = list.map(s => [s.key, s.value])
          return { columns: cols, columnTypes: ['TEXT', 'TEXT'], rows, rowsAffected: 0, lastInsertRowid: null }
        }
      }

      return { columns: [], columnTypes: [], rows: [], rowsAffected: 0, lastInsertRowid: null }
    },
    async executeMultiple() {},
    async batch() { return [] },
    async sync() {},
    async close() {}
  } as unknown as Client
}

let clientInstance: Client | null = null

export function getLibSqlClient(): Client {
  if (clientInstance) return clientInstance

  const remoteUrl = process.env.TURSO_DATABASE_URL || process.env.DATABASE_URL
  const authToken = process.env.TURSO_AUTH_TOKEN || process.env.DATABASE_AUTH_TOKEN

  // 1. If remote LibSQL / Turso is configured, connect directly
  if (remoteUrl && (remoteUrl.startsWith('libsql:') || remoteUrl.startsWith('https:') || remoteUrl.startsWith('http:'))) {
    try {
      clientInstance = createClient({ url: remoteUrl, authToken })
      initTables(clientInstance).catch(err => {
        console.error('[DB Init Error]', err)
      })
      return clientInstance
    } catch (err) {
      console.error('[DB Remote Connection Error]', err)
    }
  }

  // 2. If running on Cloudflare Workers / Edge runtime and no remote database is configured, use in-memory store
  const isCloudflareWorker = typeof (globalThis as any).WebSocketPair !== 'undefined' ||
    (typeof navigator !== 'undefined' && navigator.userAgent?.includes('Cloudflare')) ||
    Boolean(process.env.CF_PAGES) ||
    Boolean(process.env.CF_WORKER)

  if (isCloudflareWorker) {
    clientInstance = createInMemoryLibSqlClient()
    return clientInstance
  }

  // 3. In Node.js environment (local dev or tests), try local SQLite file
  const isTest = process.env.NODE_ENV === 'test' || process.env.VITEST === 'true'

  try {
    let url: string
    if (isTest) {
      const poolId = process.env.VITEST_POOL_ID || process.pid || '0'
      const testDbPath = path.resolve(process.cwd(), `./data/test-webauditor-${poolId}.sqlite`)
      const dir = path.dirname(testDbPath)
      if (typeof fs?.existsSync === 'function' && !fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true })
      }
      url = `file:${testDbPath}`
    } else {
      const rawPath = process.env.DATABASE_PATH || './data/webauditor.sqlite'
      const dbPath = path.isAbsolute(rawPath) ? rawPath : path.resolve(process.cwd(), rawPath)
      const dir = path.dirname(dbPath)
      if (typeof fs?.existsSync === 'function' && !fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true })
      }
      url = `file:${dbPath}`
    }

    clientInstance = createClient({ url })
    initTables(clientInstance).catch(err => {
      console.error('[DB Init Error]', err)
    })
    return clientInstance
  } catch (err) {
    // Fallback if local filesystem fails
    clientInstance = createInMemoryLibSqlClient()
    return clientInstance
  }
}

export async function initTables(client: Client) {
  try {
    await client.execute('PRAGMA foreign_keys = ON;')
    await client.execute('PRAGMA journal_mode = WAL;')
  } catch {
    // Pragma might not be supported in some environments
  }

  await client.executeMultiple(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'client' CHECK(role IN ('admin', 'client')),
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS audits (
      id TEXT PRIMARY KEY,
      user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
      url TEXT NOT NULL,
      domain TEXT NOT NULL,
      overall_score INTEGER NOT NULL,
      seo_score INTEGER NOT NULL,
      performance_score INTEGER NOT NULL,
      security_score INTEGER NOT NULL,
      domain_score INTEGER NOT NULL,
      accessibility_score INTEGER,
      created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS audit_details (
      id TEXT PRIMARY KEY,
      audit_id TEXT NOT NULL UNIQUE REFERENCES audits(id) ON DELETE CASCADE,
      seo_data TEXT NOT NULL,
      performance_data TEXT NOT NULL,
      security_data TEXT NOT NULL,
      domain_data TEXT NOT NULL,
      tech_data TEXT NOT NULL,
      accessibility_data TEXT,
      links_data TEXT,
      action_plan TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS system_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_audits_user_id ON audits(user_id);
    CREATE INDEX IF NOT EXISTS idx_audits_domain ON audits(domain);
    CREATE INDEX IF NOT EXISTS idx_audits_created_at ON audits(created_at);
  `)

  // Run soft migrations for columns added after initial schema
  try {
    await client.execute('ALTER TABLE audits ADD COLUMN accessibility_score INTEGER;')
  } catch {
    // Column already exists or table freshly created
  }
  try {
    await client.execute('ALTER TABLE audit_details ADD COLUMN accessibility_data TEXT;')
  } catch {
    // Column already exists
  }
  try {
    await client.execute('ALTER TABLE audit_details ADD COLUMN links_data TEXT;')
  } catch {
    // Column already exists
  }
}

export const db = drizzle(getLibSqlClient(), { schema })

export async function resetDatabaseForTests() {
  const client = getLibSqlClient()
  await initTables(client)
  await client.executeMultiple(`
    DELETE FROM audit_details;
    DELETE FROM audits;
    DELETE FROM users;
    DELETE FROM system_settings;
  `)
}
