import { config } from 'dotenv';
import { Client } from 'pg';

config({ path: '.env.local' });

async function checkConstraints() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    
    const result = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'pf_runners'
      ORDER BY ordinal_position;
    `);

    console.log('📋 pf_runners table columns:\n');
    result.rows.forEach(row => {
      console.log(`  - ${row.column_name} (${row.data_type})`);
    });

    const constraints = await client.query(`
      SELECT constraint_name, constraint_type
      FROM information_schema.table_constraints
      WHERE table_name = 'pf_runners';
    `);

    console.log('\n🔒 pf_runners constraints:\n');
    constraints.rows.forEach(row => {
      console.log(`  - ${row.constraint_name} (${row.constraint_type})`);
    });

  } finally {
    await client.end();
  }
}

checkConstraints();