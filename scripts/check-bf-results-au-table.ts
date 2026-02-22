import { config } from 'dotenv';
config({ path: '.env.local' });

import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function checkTable() {
  const client = await pool.connect();
  try {
    console.log('🔍 Checking bf_results_au table...\n');

    // Record count
    const countResult = await client.query('SELECT COUNT(*) as count FROM bf_results_au');
    console.log(`📊 Total records: ${countResult.rows[0].count}`);

    // Date range
    const dateRange = await client.query('SELECT MIN(date) as min_date, MAX(date) as max_date FROM bf_results_au');
    console.log(`📅 Date range: ${dateRange.rows[0].min_date} to ${dateRange.rows[0].max_date}`);

    // Top tracks
    const tracks = await client.query(`
      SELECT track, COUNT(*) as race_count
      FROM bf_results_au
      GROUP BY track
      ORDER BY race_count DESC
      LIMIT 10
    `);
    console.log('\n🏇 Top tracks by race count:');
    tracks.rows.forEach(row => {
      console.log(`  • ${row.track}: ${row.race_count}`);
    });

    // Sample records
    const sample = await client.query('SELECT * FROM bf_results_au ORDER BY created_at DESC LIMIT 3');
    console.log('\n📋 Sample records (most recent):');
    sample.rows.forEach(row => {
      console.log(`  • ${row.date} ${row.track} R${row.race} #${row.number} ${row.horse}`);
    });
  } catch (error: any) {
    console.error('❌ Error:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

checkTable();
