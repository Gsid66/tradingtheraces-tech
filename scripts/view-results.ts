import { config } from 'dotenv';
config({ path:  '.env.local' });

import { Client } from 'pg';

async function viewResults() {
  const dbClient = new Client({
    connectionString:  process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await dbClient.connect();
    
    const result = await dbClient.query(`
      SELECT 
        horse_name,
        finishing_position,
        finishing_time_display,
        margin_to_winner,
        jockey_name,
        starting_price
      FROM pf_results
      WHERE finishing_position > 0 AND finishing_position <= 3
      ORDER BY race_id, finishing_position
      LIMIT 30;
    `);

    console.log('\n🏆 Top 3 Finishers (Sample):\n');
    
    let currentRace = null;
    result.rows.forEach(row => {
      console.log(`${row.finishing_position}. ${row.horse_name} - ${row.finishing_time_display || 'N/A'} - $${parseFloat(row.starting_price).toFixed(2)} (${row.jockey_name}) - Margin: ${parseFloat(row.margin_to_winner).toFixed(2)}L`);
    });
    console.log('');

    // Also show some statistics
    const stats = await dbClient.query(`
      SELECT 
        COUNT(*) as total_starters,
        COUNT(CASE WHEN finishing_position = 1 THEN 1 END) as winners,
        ROUND(AVG(CASE WHEN finishing_position = 1 THEN starting_price END), 2) as avg_winner_price,
        MAX(CASE WHEN finishing_position = 1 THEN starting_price END) as biggest_winner_price
      FROM pf_results
      WHERE finishing_position > 0;
    `);

    console.log('📊 Statistics:\n');
    console.log(`   Total finishers: ${stats.rows[0].total_starters}`);
    console.log(`   Winners: ${stats.rows[0]. winners}`);
    console.log(`   Avg winner price: $${stats.rows[0].avg_winner_price}`);
    console.log(`   Biggest upset: $${stats.rows[0].biggest_winner_price}\n`);

  } catch (error: any) {
    console.error('❌ Error:', error.message);
  } finally {
    await dbClient.end();
  }
}

viewResults();