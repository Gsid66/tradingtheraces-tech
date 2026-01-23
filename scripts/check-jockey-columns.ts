import { config } from 'dotenv';
import { Client } from 'pg';

config({ path: '.env.local' });

async function checkColumns() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    
    const result = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'pf_jockeys'
      ORDER BY ordinal_position;
    `);

    console.log('📋 pf_jockeys table columns:\n');
    result.rows.forEach(row => {
      console.log(`  - ${row.column_name} (${row.data_type})`);
    });

  } finally {
    await client.end();
  }
}

checkColumns();