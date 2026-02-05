import { config } from 'dotenv';
import { Client } from 'pg';

config({ path: '.env.local' });

async function fixSandownTrackNames() {
  console.log('🔄 Starting Sandown track name fix...\n');
  
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('✅ Connected to database\n');
    
    // Start transaction
    await client.query('BEGIN');
    
    try {
      // Update pf_meetings: "Sandown-Hillside" → "Sandown Hillside"
      console.log('📍 Updating pf_meetings table...');
      const meetingsResult = await client.query(`
        UPDATE pf_meetings 
        SET track_name = 'Sandown Hillside'
        WHERE track_name = 'Sandown-Hillside'
        RETURNING meeting_id, track_name, meeting_date;
      `);
      
      if (meetingsResult.rowCount && meetingsResult.rowCount > 0) {
        console.log(`✅ Updated ${meetingsResult.rowCount} meeting records:`);
        meetingsResult.rows.forEach(row => {
          console.log(`   - Meeting ${row.meeting_id} on ${row.meeting_date}`);
        });
      } else {
        console.log('ℹ️  No meetings with "Sandown-Hillside" found');
      }
      
      // Update pf_meetings: "Sandown-Lakeside" → "Sandown Lakeside"
      console.log('\n📍 Checking for Sandown Lakeside variants...');
      const lakesideResult = await client.query(`
        UPDATE pf_meetings 
        SET track_name = 'Sandown Lakeside'
        WHERE track_name = 'Sandown-Lakeside'
        RETURNING meeting_id, track_name, meeting_date;
      `);
      
      if (lakesideResult.rowCount && lakesideResult.rowCount > 0) {
        console.log(`✅ Updated ${lakesideResult.rowCount} Lakeside meeting records`);
      } else {
        console.log('ℹ️  No meetings with "Sandown-Lakeside" found');
      }
      
      // Update race_cards_ratings if needed (should already be correct)
      console.log('\n📍 Checking race_cards_ratings table...');
      const ratingsResult = await client.query(`
        UPDATE race_cards_ratings 
        SET track = 'Sandown Hillside'
        WHERE track IN ('Sandown-Hillside', 'sandown hillside', 'sandown-hillside')
          AND track != 'Sandown Hillside'
        RETURNING id, track, race_date;
      `);
      
      if (ratingsResult.rowCount && ratingsResult.rowCount > 0) {
        console.log(`✅ Updated ${ratingsResult.rowCount} rating records`);
      } else {
        console.log('ℹ️  No ratings records needed updating');
      }
      
      // Commit transaction
      await client.query('COMMIT');
      
      console.log('\n📊 Summary:');
      console.log(`   Meetings fixed: ${(meetingsResult.rowCount || 0) + (lakesideResult.rowCount || 0)}`);
      console.log(`   Ratings fixed: ${ratingsResult.rowCount || 0}`);
      console.log('\n✨ Migration completed successfully!\n');
      
    } catch (error) {
      // Rollback on error
      await client.query('ROLLBACK');
      throw error;
    }
    
  } catch (error: any) {
    console.error('❌ Migration failed:', error.message);
    console.error('\nFull error:', error);
    throw error;
  } finally {
    await client.end();
  }
}

fixSandownTrackNames();
