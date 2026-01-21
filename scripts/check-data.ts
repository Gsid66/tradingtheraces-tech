import { config } from 'dotenv';
config({ path: '.env.local' });

import { Client } from 'pg';

async function checkData() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    
    // Count records
    const meetings = await client.query('SELECT COUNT(*) FROM pf_meetings');
    const races = await client.query('SELECT COUNT(*) FROM pf_races');
    const horses = await client.query('SELECT COUNT(*) FROM pf_horses');
    const trainers = await client.query('SELECT COUNT(*) FROM pf_trainers');
    const jockeys = await client.query('SELECT COUNT(*) FROM pf_jockeys');
    const runners = await client.query('SELECT COUNT(*) FROM pf_runners');

    console.log('📊 Database Stats:\n');
    console.log(`   Meetings:   ${meetings.rows[0].count}`);
    console.log(`   Races:     ${races. rows[0].count}`);
    console.log(`   Horses:    ${horses.rows[0].count}`);
    console.log(`   Trainers:  ${trainers.rows[0]. count}`);
    console.log(`   Jockeys:   ${jockeys.rows[0].count}`);
    console.log(`   Runners:   ${runners.rows[0].count}\n`);

    // Show sample data
    const sampleHorses = await client.query(`
      SELECT horse_name, sex, age, career_starts, career_wins 
      FROM pf_horses 
      LIMIT 5
    `);

    console.log('🐴 Sample Horses:\n');
    sampleHorses.rows.forEach(horse => {
      console.log(`   ${horse.horse_name} - ${horse.sex}, ${horse.age}yo (${horse.career_wins}/${horse.career_starts} wins)`);
    });

    // Show a race with runners
    const raceWithRunners = await client.query(`
      SELECT 
        r.race_name,
        r.race_number,
        r.distance,
        COUNT(ru.id) as runner_count
      FROM pf_races r
      LEFT JOIN pf_runners ru ON r.race_id = ru.race_id
      GROUP BY r.id, r.race_name, r. race_number, r.distance
      ORDER BY r.race_number
      LIMIT 1
    `);

    console.log('\n🏁 Sample Race:\n');
    const race = raceWithRunners.rows[0];
    console.log(`   ${race.race_name} (Race ${race.race_number})`);
    console.log(`   ${race.distance}m - ${race.runner_count} runners\n`);

  } catch (error:  any) {
    console.error('❌ Error:', error. message);
  } finally {
    await client.end();
  }
}

checkData();