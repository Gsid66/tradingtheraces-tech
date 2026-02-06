import { config } from 'dotenv';
config({ path: '.env.local' });

import { Client } from 'pg';

async function checkExistingTables() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    
    console.log('🔍 CHECKING EXISTING PUNTING FORM TABLES\n');
    console.log('═'.repeat(70));

    // Get all tables that start with 'pf_'
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name LIKE 'pf_%'
      ORDER BY table_name
    `);

    console.log(`\n📊 Found ${tablesResult.rows.length} Punting Form tables:\n`);

    for (const row of tablesResult.rows) {
      const table = row.table_name;
      const countResult = await client.query(`SELECT COUNT(*) FROM ${table}`);
      const count = parseInt(countResult.rows[0].count);
      
      const status = count > 0 ? '✅' : '⚠️ ';
      console.log(`${status} ${table.padEnd(30)} ${count.toLocaleString()} records`);
      
      if (count > 0) {
        // Show columns
        const columnsResult = await client.query(`
          SELECT column_name, data_type
          FROM information_schema.columns 
          WHERE table_name = '${table}'
          ORDER BY ordinal_position
        `);
        
        console.log(`    Columns (${columnsResult.rows.length}):`);
        columnsResult.rows.slice(0, 10).forEach(col => {
          console.log(`      - ${col.column_name} (${col.data_type})`);
        });
        if (columnsResult.rows.length > 10) {
          console.log(`      ... and ${columnsResult.rows.length - 10} more`);
        }
        console.log('');
      }
    }

    console.log('═'.repeat(70));
    console.log('\n📋 WHAT DATA ARE WE STORING?\n');

    // Check runners table specifically for what fields we have
    const runnersColumns = await client.query(`
      SELECT column_name
      FROM information_schema.columns 
      WHERE table_name = 'pf_runners'
      ORDER BY ordinal_position
    `);

    console.log('pf_runners fields:');
    runnersColumns.rows.forEach(col => {
      console.log(`  - ${col.column_name}`);
    });

    console.log('\n═'.repeat(70));
    console.log('\n🔍 WHAT DATA IS AVAILABLE BUT NOT STORED?\n');
    
    console.log('From the API response, these fields exist but may not be in the database:');
    console.log('  - distanceRecord (performance at specific distances)');
    console.log('  - trackRecord (performance at specific tracks)');
    console.log('  - trackDistRecord (track + distance combination)');
    console.log('  - goodRecord, firmRecord, softRecord, heavyRecord (track conditions)');
    console.log('  - firstUpRecord, secondUpRecord (spell stats)');
    console.log('  - jockeyA2E_Career, jockeyA2E_Last100 (jockey stats)');
    console.log('  - trainerA2E_Career, trainerA2E_Last100 (trainer stats)');
    console.log('  - trainerJockeyA2E_Career, trainerJockeyA2E_Last100 (combo stats)');
    console.log('  - group1Record, group2Record, group3Record (class level)');
    console.log('  - jumpsRecord, syntheticRecord');
    console.log('  - forms[] (detailed form history)');
    console.log('  - position, margin (last start info)');
    console.log('  - ballotNumber, silkColours, owners');

  } finally {
    await client.end();
  }
}

checkExistingTables().catch(console.error);