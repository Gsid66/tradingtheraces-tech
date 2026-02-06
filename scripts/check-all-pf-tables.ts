import { config } from 'dotenv';
config({ path: '.env.local' });

import { Client } from 'pg';

async function checkAllTables() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    
    console.log('🔍 CHECKING ALL PUNTING FORM TABLES\n');
    console.log('═'.repeat(70));

    // List of all PF tables from the migration
    const tables = [
      'pf_meetings',
      'pf_races',
      'pf_horses',
      'pf_jockeys',
      'pf_trainers',
      'pf_runners',
      'pf_jockey_stats',
      'pf_trainer_stats',
      'pf_trainer_jockey_stats',
      'pf_track_stats',
      'pf_sectionals',
      'pf_gear_changes',
      'pf_speed_maps',
      'pf_results'
    ];

    for (const table of tables) {
      const result = await client.query(`SELECT COUNT(*) FROM ${table}`);
      const count = parseInt(result.rows[0].count);
      
      const status = count > 0 ? '✅' : '❌';
      console.log(`${status} ${table.padEnd(30)} ${count.toLocaleString()} records`);
    }

    console.log('\n' + '═'.repeat(70));
    console.log('\n📊 DETAILED CHECK - Tables with Data:\n');

    // Check which tables have data and show sample
    for (const table of tables) {
      const countResult = await client.query(`SELECT COUNT(*) FROM ${table}`);
      const count = parseInt(countResult.rows[0].count);
      
      if (count > 0) {
        console.log(`\n${table.toUpperCase()}:`);
        
        // Get column names
        const columnsResult = await client.query(`
          SELECT column_name 
          FROM information_schema.columns 
          WHERE table_name = '${table}'
          ORDER BY ordinal_position
          LIMIT 10
        `);
        
        const columns = columnsResult.rows.map(r => r.column_name).join(', ');
        console.log(`  Columns: ${columns}${columnsResult.rows.length >= 10 ? '...' : ''}`);
      }
    }

    console.log('\n' + '═'.repeat(70));
    console.log('\n⚠️  EMPTY TABLES (need to populate):\n');

    for (const table of tables) {
      const result = await client.query(`SELECT COUNT(*) FROM ${table}`);
      const count = parseInt(result.rows[0].count);
      
      if (count === 0) {
        console.log(`❌ ${table}`);
        
              // Show what this table is supposed to contain
        const tableDescriptions: Record<string, string> = {
          'pf_sectionals': 'Sectional times (400m, 600m, 800m splits)',
          'pf_speed_maps': 'Expected running positions and early speed ratings',
          'pf_gear_changes': 'Equipment changes (blinkers, tongue ties, etc)',
          'pf_jockey_stats': 'Detailed jockey performance statistics',
          'pf_trainer_stats': 'Detailed trainer performance statistics',
          'pf_trainer_jockey_stats': 'Jockey/Trainer combination statistics',
          'pf_track_stats': 'Horse performance by track and condition',
        };
        
        if (tableDescriptions[table]) {
          console.log(`   → ${tableDescriptions[table]}`);
        } 
      }
    }

  } finally {
    await client.end();
  }
}

checkAllTables().catch(console.error);