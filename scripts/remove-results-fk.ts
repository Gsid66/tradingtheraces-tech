import { config } from 'dotenv';
config({ path: '.env.local' });

import { Client } from 'pg';

async function removeForeignKey() {
  const dbClient = new Client({
    connectionString:  process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await dbClient.connect();
    console.log('✅ Connected to database\n');

    console.log('📝 Removing foreign key constraint.. .\n');

    await dbClient.query(`
      ALTER TABLE pf_results 
      DROP CONSTRAINT IF EXISTS pf_results_runner_id_fkey;
    `);

    console.log('✅ Foreign key constraint removed!\n');

  } catch (error: any) {
    console.error('❌ Error:', error.message);
  } finally {
    await dbClient.end();
  }
}

removeForeignKey();