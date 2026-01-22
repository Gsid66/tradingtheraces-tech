import { config } from 'dotenv';
config({ path: '.env.local' });

import { Client } from 'pg';

async function addColumn() {
  const dbClient = new Client({
    connectionString:  process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await dbClient.connect();
    console.log('✅ Connected to database\n');

    console.log('📝 Adding finishing_time_display column...\n');

    await dbClient.query(`
      ALTER TABLE pf_results 
      ADD COLUMN IF NOT EXISTS finishing_time_display VARCHAR(20);
    `);

    console.log('✅ Column added successfully!\n');

  } catch (error: any) {
    console.error('❌ Error:', error.message);
  } finally {
    await dbClient.end();
  }
}

addColumn();