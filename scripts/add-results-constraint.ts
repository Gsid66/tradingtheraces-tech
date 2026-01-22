import { config } from 'dotenv';
config({ path: '.env.local' });

import { Client } from 'pg';

async function addConstraint() {
  const dbClient = new Client({
    connectionString:  process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await dbClient.connect();
    console.log('✅ Connected to database\n');

    console.log('📝 Adding unique constraint on (race_id, horse_id)...\n');

    // First, remove any duplicates if they exist
    await dbClient. query(`
      DELETE FROM pf_results a USING pf_results b
      WHERE a.id < b.id
      AND a.race_id = b.race_id
      AND a.horse_id = b. horse_id;
    `);

    console.log('🧹 Cleaned up any duplicate records\n');

    // Now add the unique constraint
    await dbClient.query(`
      ALTER TABLE pf_results 
      ADD CONSTRAINT pf_results_race_horse_unique 
      UNIQUE (race_id, horse_id);
    `);

    console.log('✅ Unique constraint added successfully!\n');

  } catch (error: any) {
    console.error('❌ Error:', error.message);
  } finally {
    await dbClient.end();
  }
}

addConstraint();