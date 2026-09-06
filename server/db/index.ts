import { createClient, type Client } from '@libsql/client'
import { drizzle } from 'drizzle-orm/libsql'
import * as schema from './schema'
import path from 'node:path'
import fs from 'node:fs'

let clientInstance: Client | null = null

export function getLibSqlClient(): Client {
  if (clientInstance) return clientInstance

  const isTest = process.env.NODE_ENV === 'test' || process.env.VITEST === 'true'
  let url: string

  if (isTest) {
    // Isolated test sqlite file per Vitest worker to avoid lock contention
    const poolId = process.env.VITEST_POOL_ID || process.pid || '0'
    const testDbPath = path.resolve(process.cwd(), `./data/test-webauditor-${poolId}.sqlite`)
    const dir = path.dirname(testDbPath)
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }
    url = `file:${testDbPath}`
  } else {
    const remoteUrl = process.env.TURSO_DATABASE_URL || process.env.DATABASE_URL
    const authToken = process.env.TURSO_AUTH_TOKEN || process.env.DATABASE_AUTH_TOKEN

    if (remoteUrl && (remoteUrl.startsWith('libsql:') || remoteUrl.startsWith('https:') || remoteUrl.startsWith('http:'))) {
      clientInstance = createClient({ url: remoteUrl, authToken })
      initTables(clientInstance).catch(err => {
        console.error('[DB Init Error]', err)
      })
      return clientInstance
    }

    const rawPath = process.env.DATABASE_PATH || './data/webauditor.sqlite'
    const dbPath = path.isAbsolute(rawPath) ? rawPath : path.resolve(process.cwd(), rawPath)
    try {
      const dir = path.dirname(dbPath)
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true })
      }
    } catch {
      // In read-only serverless filesystem environments
    }
    url = `file:${dbPath}`
  }

  clientInstance = createClient({ url })

  // Initialize PRAGMAs and tables
  initTables(clientInstance).catch(err => {
    console.error('[DB Init Error]', err)
  })

  return clientInstance
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
