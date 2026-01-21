import { config } from 'dotenv';
import { Client } from 'pg';
import fs from 'fs';
import path from 'path';

config({ path: '.env.local' });

async function runMigration() {
  console.log('🔄 Starting Punting Form migration...\n');

  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL not found');
    process.exit(1);
  }

  const client = new Client({
    connectionString:  process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    },
    connectionTimeoutMillis: 10000,
  });

  try {
    console.log('📡 Connecting to database...');
    await client.connect();
    console.log('✅ Connected to Render PostgreSQL\n');

    const migrationPath = path. join(process.cwd(), 'drizzle', 'migrations', '0002_add_punting_form_tables.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');

    console.log('📝 Running migration.. .');
    console.log('⏳ This may take a minute...\n');
    
    await client.query(sql);

    console.log('✅ Migration completed successfully!\n');
    console.log('✨ Created 14 Punting Form tables\n');

  } catch (error:  any) {
    console.error('❌ Migration failed:', error.message);
    console.error('\nFull error:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigration();