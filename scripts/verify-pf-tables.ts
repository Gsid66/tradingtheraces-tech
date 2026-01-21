import { config } from 'dotenv';
import { Client } from 'pg';

config({ path: '.env.local' });

async function verifyTables() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    await client.connect();
    console.log('✅ Connected to database\n');

    const result = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name LIKE 'pf_%'
      ORDER BY table_name;
    `);

    console.log('📊 Punting Form Tables:\n');
    result.rows.forEach((row, i) => {
      console.log(`  ${i + 1}. ${row. table_name}`);
    });

    console.log(`\n✅ Total:  ${result.rows.length} tables created\n`);

  } catch (error:  any) {
    console.error('❌ Error:', error. message);
  } finally {
    await client. end();
  }
}

verifyTables();