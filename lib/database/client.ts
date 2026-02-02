import { Pool } from 'pg';

let pool: Pool | null = null;

export function getDatabase() {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }, // ✅ Always use SSL for Render
    });
  }
  return pool;
}

export async function query(text: string, params?: any[]) {
  const db = getDatabase();
  return db.query(text, params);
}