import { config } from 'dotenv';
config({ path: '.env.local' });

import { Client } from 'pg';

async function checkTable() {
  const dbClient = new Client({
    connectionString:  process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await dbClient.connect();
    
    const result = await dbClient. query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'pf_results'
      ORDER BY ordinal_position
    `);

    console.log('\n📋 pf_results table columns:\n');
    result.rows.forEach(row => {
      console.log(`   ${row.column_name} (${row.data_type})`);
    });
    console.log('');

  } catch (error: any) {
    console.error('❌ Error:', error.message);
  } finally {
    await dbClient.end();
  }
}

checkTable();