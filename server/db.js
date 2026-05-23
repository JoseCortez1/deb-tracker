import pg from "pg";
import { fileURLToPath } from "url";
import crypto from "crypto";

const { Pool } = pg;

const DATABASE_URL =
  process.env.DATABASE_URL ||
  "postgresql://deb_tracker:deb_tracker_2026@localhost:5432/deb_tracker";

let pool;
let ready;

async function getPool() {
  if (pool) return pool;
  pool = new Pool({ connectionString: DATABASE_URL });
  ready = migrate();
  await ready;
  return pool;
}

async function migrate() {
  const p = await getPool();
  try {
    await p.query(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        username TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT now()
      );
      CREATE TABLE IF NOT EXISTS expenses (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        amount REAL NOT NULL,
        category TEXT NOT NULL,
        description TEXT DEFAULT '',
        date TEXT NOT NULL,
        is_recurring INTEGER DEFAULT 0,
        created_at TEXT NOT NULL DEFAULT now()
      );
      CREATE TABLE IF NOT EXISTS debts (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        emoji TEXT DEFAULT '💳',
        initial_balance REAL NOT NULL,
        current_balance REAL NOT NULL,
        min_payment REAL DEFAULT 0,
        color TEXT DEFAULT '#6b7280',
        paid INTEGER DEFAULT 0,
        created_at TEXT NOT NULL DEFAULT now()
      );
      CREATE TABLE IF NOT EXISTS custom_categories (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        icon TEXT DEFAULT '📌',
        color TEXT DEFAULT '#6b7280',
        created_at TEXT NOT NULL DEFAULT now()
      );
      CREATE TABLE IF NOT EXISTS user_config (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        key TEXT NOT NULL,
        value TEXT DEFAULT '',
        UNIQUE(user_id, key)
      );
      CREATE INDEX IF NOT EXISTS idx_expenses_user ON expenses(user_id);
      CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(date);
      CREATE INDEX IF NOT EXISTS idx_debts_user ON debts(user_id);
      CREATE INDEX IF NOT EXISTS idx_categories_user ON custom_categories(user_id);
      CREATE INDEX IF NOT EXISTS idx_config_user ON user_config(user_id);
    `);

    // Migraciones incrementales (para DBs existentes)
    try { await p.query(`ALTER TABLE expenses ADD COLUMN IF NOT EXISTS icon TEXT DEFAULT ''`); } catch (e) {}

    console.log("PostgreSQL migration OK");
  } catch (err) {
    console.error("Migration error:", err.message);
  }
}

export async function query(sql, params = []) {
  const p = await getPool();
  try {
    const result = await p.query(sql, params);
    return result.rows;
  } catch (err) {
    console.error("query error:", err.message);
    throw err;
  }
}

export async function one(sql, params = []) {
  const rows = await query(sql, params);
  return rows.length > 0 ? rows[0] : null;
}

export async function run(sql, params = []) {
  const p = await getPool();
  try {
    const result = await p.query(sql, params);
    return { rowCount: result.rowCount, rows: result.rows };
  } catch (err) {
    console.error("run error:", err.message);
    throw err;
  }
}

export function newId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID)
    return crypto.randomUUID();
  return "" + Date.now() + "_" + Math.random().toString(36).slice(2, 10);
}

export function getDb() {
  return getPool();
}

export { getPool };
