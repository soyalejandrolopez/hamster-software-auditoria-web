import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import * as schema from './schema'
import path from 'node:path'
import fs from 'node:fs'

let sqliteInstance: Database.Database | null = null

export function getSqliteInstance(): Database.Database {
  if (sqliteInstance) return sqliteInstance

  const isTest = process.env.NODE_ENV === 'test' || process.env.VITEST === 'true'
  let dbPath: string

  if (isTest) {
    dbPath = ':memory:'
  } else {
    const rawPath = process.env.DATABASE_PATH || './data/webauditor.sqlite'
    dbPath = path.isAbsolute(rawPath) ? rawPath : path.resolve(process.cwd(), rawPath)
    const dir = path.dirname(dbPath)
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }
  }

  sqliteInstance = new Database(dbPath)
  sqliteInstance.pragma('journal_mode = WAL')
  sqliteInstance.pragma('foreign_keys = ON')

  initTables(sqliteInstance)

  return sqliteInstance
}

function initTables(sqlite: Database.Database) {
  sqlite.exec(`
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
}

export const db = drizzle(getSqliteInstance(), { schema })

export async function resetDatabaseForTests() {
  const sqlite = getSqliteInstance()
  sqlite.exec(`
    DELETE FROM audit_details;
    DELETE FROM audits;
    DELETE FROM users;
    DELETE FROM system_settings;
  `)
}
