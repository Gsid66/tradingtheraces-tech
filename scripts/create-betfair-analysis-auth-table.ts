import * as bcrypt from 'bcryptjs';
import { Client } from 'pg';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function createBetfairAnalysisAuthTable() {
  console.log('\n🔧 Betfair Analysis Authentication Setup\n');

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('✅ Connected to database');

    // Create table
    console.log('\n📋 Creating betfair_analysis_auth table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS betfair_analysis_auth (
        id SERIAL PRIMARY KEY,
        password_hash VARCHAR(255) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);
    console.log('✅ betfair_analysis_auth table created');

    // Insert initial password only if none exists
    const existing = await client.query('SELECT COUNT(*) FROM betfair_analysis_auth');
    if (parseInt(existing.rows[0].count, 10) === 0) {
      const initialPassword = 'changeme123';
      console.log('\n🔐 Setting initial password...');
      const passwordHash = await bcrypt.hash(initialPassword, 10);
      await client.query(
        'INSERT INTO betfair_analysis_auth (password_hash) VALUES ($1)',
        [passwordHash]
      );
      console.log('✅ Initial password set');
      console.log('\n🔐 Initial Password: changeme123');
      console.log('\n⚠️  IMPORTANT: Change the password immediately via the admin panel!');
    } else {
      console.log('\nℹ️  Password already exists — skipping initial password insertion.');
    }

    console.log('\n✨ Setup complete!\n');
    console.log('📍 Access URL: /betfair-analysis');
    console.log('   Admin panel: /admin/betfair-analysis-password\n');

  } catch (error) {
    console.error('❌ Error during setup:', error);
    throw error;
  } finally {
    await client.end();
  }
}

createBetfairAnalysisAuthTable()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
