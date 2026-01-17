// Database connection helper for PostgreSQL
import { Pool } from 'pg'

let pool

export function getPool() {
  if (!pool) {
    pool = new Pool({
      connectionString: process. env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized:  false } : false,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    })
  }
  return pool
}

export async function query(text, params) {
  const pool = getPool()
  const start = Date.now()
  try {
    const res = await pool.query(text, params)
    const duration = Date.now() - start
    console.log('Executed query', { text, duration, rows: res.rowCount })
    return res
  } catch (error) {
    console.error('Database query error:', error)
    throw error
  }
}

export async function getClient() {
  const pool = getPool()
  const client = await pool.connect()
  return client
}
