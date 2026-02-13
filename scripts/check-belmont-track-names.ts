import { config } from 'dotenv';
config({ path: '.env.local' });

import { Client } from 'pg';

async function checkBelmontTrackNames() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('✅ Connected to database\n');
    
    // Check what Belmont track names exist in pf_meetings
    console.log('🔍 Checking pf_meetings for Belmont tracks...\n');
    const meetingsResult = await client.query(`
      SELECT DISTINCT track_name, COUNT(*) as count
      FROM pf_meetings
      WHERE track_name ILIKE '%belmont%'
      GROUP BY track_name
      ORDER BY track_name;
    `);
    
    if (meetingsResult.rows.length > 0) {
      console.log('📍 Found Belmont track names in pf_meetings:');
      meetingsResult.rows.forEach(row => {
        console.log(`   "${row.track_name}" (${row.count} meetings)`);
      });
    } else {
      console.log('❌ No Belmont track names found in pf_meetings');
    }
    
    // Check what Belmont track names exist in race_cards_ratings
    console.log('\n🔍 Checking race_cards_ratings for Belmont tracks...\n');
    const ratingsResult = await client.query(`
      SELECT DISTINCT track, COUNT(*) as count
      FROM race_cards_ratings
      WHERE track ILIKE '%belmont%'
      GROUP BY track
      ORDER BY track;
    `);
    
    if (ratingsResult.rows.length > 0) {
      console.log('📍 Found Belmont track names in race_cards_ratings:');
      ratingsResult.rows.forEach(row => {
        console.log(`   "${row.track}" (${row.count} ratings)`);
      });
    } else {
      console.log('❌ No Belmont track names found in race_cards_ratings');
    }
    
    // Check for results data
    console.log('\n🔍 Checking pf_results for Belmont races...\n');
    const resultsResult = await client.query(`
      SELECT COUNT(DISTINCT r.id) as result_count,
             COUNT(DISTINCT m.meeting_id) as meeting_count
      FROM pf_results r
      INNER JOIN pf_races ra ON r.race_id = ra.race_id
      INNER JOIN pf_meetings m ON ra.meeting_id = m.meeting_id
      WHERE m.track_name ILIKE '%belmont%';
    `);
    
    console.log('📊 Belmont results data:');
    console.log(`   Meetings with results: ${resultsResult.rows[0].meeting_count}`);
    console.log(`   Total results: ${resultsResult.rows[0].result_count}`);
    
    // Try to find a JOIN failure
    console.log('\n🔍 Testing JOIN between tables...\n');
    const joinTest = await client.query(`
      SELECT 
        rcr.track as ttr_track,
        m.track_name as pf_track,
        COUNT(*) as match_count
      FROM race_cards_ratings rcr
      LEFT JOIN pf_meetings m 
        ON rcr.race_date = m.meeting_date 
        AND rcr.track = m.track_name
      WHERE rcr.track ILIKE '%belmont%'
      GROUP BY rcr.track, m.track_name;
    `);
    
    if (joinTest.rows.length > 0) {
      console.log('📊 JOIN results:');
      joinTest.rows.forEach(row => {
        if (row.pf_track) {
          console.log(`   ✅ TTR "${row.ttr_track}" → PF "${row.pf_track}" (${row.match_count} matches)`);
        } else {
          console.log(`   ❌ TTR "${row.ttr_track}" → NO MATCH (${row.match_count} ratings without results)`);
        }
      });
    }
    
    console.log('\n');
    
  } catch (error: any) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

checkBelmontTrackNames();