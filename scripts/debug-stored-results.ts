import { config } from 'dotenv';
config({ path:  '.env.local' });

import { Client } from 'pg';

async function debugResults() {
  const dbClient = new Client({
    connectionString:   process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await dbClient.connect();
    
    console.log('\n🔍 Checking raw data in pf_results.. .\n');
    
    const result = await dbClient.query(`
      SELECT *
      FROM pf_results
      LIMIT 3;
    `);

    console.log('📊 First 3 records:\n');
    result.rows.forEach((row, idx) => {
      console.log(`\n--- Record ${idx + 1} ---`);
      console.log(JSON.stringify(row, null, 2));
    });

    console.log('\n\n📊 Summary statistics:\n');
    
    const stats = await dbClient. query(`
      SELECT 
        COUNT(*) as total_records,
        COUNT(DISTINCT race_id) as distinct_races,
        COUNT(CASE WHEN finishing_position > 0 THEN 1 END) as records_with_position,
        COUNT(CASE WHEN starting_price > 0 THEN 1 END) as records_with_price,
        COUNT(CASE WHEN finishing_time_display IS NOT NULL THEN 1 END) as records_with_time,
        COUNT(CASE WHEN margin_to_winner > 0 THEN 1 END) as records_with_margin
      FROM pf_results;
    `);

    console.log(stats.rows[0]);

  } catch (error: any) {
    console.error('❌ Error:', error.message);
  } finally {
    await dbClient.end();
  }
}

debugResults();