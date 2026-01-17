import { Pool } from 'pg'

let pool

export function getPool() {
  if (!pool) {
    const connectionString = process.env.DATABASE_URL
    
    if (!connectionString) {
      throw new Error('DATABASE_URL environment variable is not set')
    }
    
    pool = new Pool({
      connectionString,
      ssl: {
        rejectUnauthorized:  false  // Required for Render
      },
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,  // Increased timeout
    })
  }
  return pool
}

export async function query(text, params) {
  const pool = getPool()
  const start = Date.now()
  try {
    const res = await pool. query(text, params)
    const duration = Date.now() - start
    console.log('Executed query', { text:  text. substring(0, 50), duration, rows: res.rowCount })
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
