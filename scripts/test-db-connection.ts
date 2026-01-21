import { config } from 'dotenv';
import { Client } from 'pg';

config({ path: '.env.local' });

async function testConnection() {
  console.log('🔄 Testing database connection...\n');
  
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL not found in environment');
    process.exit(1);
  }
  
  console.log('📡 Connecting to:', process.env.DATABASE_URL.replace(/:[^:@]+@/, ':****@'));
  
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized:  false
    }
  });

  try {
    await client.connect();
    console.log('✅ Connected successfully!\n');
    
    const result = await client. query('SELECT version()');
    console.log('📊 PostgreSQL version:', result.rows[0].version. split(' ').slice(0, 2).join(' '));
    
    const tables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    
    console.log(`\n📋 Existing tables:  ${tables.rows.length}`);
    tables.rows.forEach(row => console.log(`  - ${row.table_name}`));
    
    console.log('\n✅ Connection test passed!\n');
    
  } catch (error:  any) {
    console.error('❌ Connection failed:', error.message);
    console.error('\nError details:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

testConnection();