import { config } from 'dotenv';
config({ path: '.env.local' });

import { readFileSync } from 'fs';
import { join } from 'path';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function createTable() {
  const client = await pool.connect();
  try {
    console.log('🔧 Creating bf_results_au table...\n');

    const sqlPath = join(process.cwd(), 'drizzle/migrations/create_bf_results_au_table.sql');
    const sql = readFileSync(sqlPath, 'utf-8');

    await client.query(sql);
    console.log('✅ Migration executed successfully\n');

    // Show table structure
    const columns = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'bf_results_au'
      ORDER BY ordinal_position
    `);
    console.log('📋 Table structure:');
    columns.rows.forEach(col => {
      console.log(`  • ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? 'NOT NULL' : ''}`);
    });

    // Show indexes
    const indexes = await client.query(`
      SELECT indexname, indexdef
      FROM pg_indexes
      WHERE tablename = 'bf_results_au'
      ORDER BY indexname
    `);
    console.log('\n📑 Indexes:');
    indexes.rows.forEach(idx => {
      console.log(`  • ${idx.indexname}`);
    });
  } catch (error: any) {
    console.error('❌ Error:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

createTable();
