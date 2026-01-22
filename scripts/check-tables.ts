import { config } from 'dotenv';
config({ path: '.env.local' });

import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized:  false
  }
});

async function checkTables() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 Checking database connection...\n');
    console.log('📍 DATABASE_URL:', process.env.DATABASE_URL?. substring(0, 50) + '...\n');

    // List all tables
    const result = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);

    console.log('📊 Tables in database:');
    result.rows.forEach(row => {
      console.log(`  • ${row.table_name}`);
    });

    // Check if pf_tracks exists and has data
    try {
      const trackCount = await client.query('SELECT COUNT(*) FROM pf_tracks');
      console.log(`\n✅ pf_tracks table exists with ${trackCount.rows[0]. count} records`);
    } catch (e) {
      console.log('\n❌ pf_tracks table does NOT exist');
    }

  } catch (error:  any) {
    console.error('❌ Error:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

checkTables();