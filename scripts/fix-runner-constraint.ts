import { config } from 'dotenv';
config({ path: '.env.local' });

import { Client } from 'pg';

async function addConstraint() {
  console.log('🔧 Adding unique constraint to pf_runners...\n');

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('✅ Connected to database\n');

    await client.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_pf_runners_race_form 
      ON pf_runners(race_id, form_id);
    `);

    console.log('✅ Unique constraint added!\n');

  } catch (error:  any) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

addConstraint();