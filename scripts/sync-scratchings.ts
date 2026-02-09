import { config } from 'dotenv';
import { Client } from 'pg';
import { getPuntingFormClient } from '../lib/integrations/punting-form/client';

config({ path: '.env.local' });

async function syncScratchings() {
  console.log('🔄 Starting scratchings sync...\n');

  const pfClient = getPuntingFormClient();
  const dbClient = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 10000,
  });

  try {
    await dbClient.connect();
    console.log('✅ Connected to database\n');

    let totalScratchings = 0;
    let newScratchings = 0;

    // Fetch scratchings for both AU and NZ
    for (const jurisdiction of [0, 1]) {
      const jurisdictionName = jurisdiction === 0 ? 'AU' : 'NZ';
      console.log(`📋 Fetching ${jurisdictionName} scratchings...`);

      const scratchingsResponse = await pfClient.getScratchings(jurisdiction);
      const scratchings = scratchingsResponse.payLoad || [];

      console.log(`✅ Found ${scratchings.length} scratchings for ${jurisdictionName}`);
      totalScratchings += scratchings.length;

      for (const scratching of scratchings) {
        try {
          const itemRecord = scratching as unknown as Record<string, unknown>;
          
          const result = await dbClient.query(`
            INSERT INTO pf_scratchings (
              meeting_id, race_id, race_number, track_name, horse_name,
              tab_number, scratching_time, reason, jurisdiction
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            ON CONFLICT (meeting_id, race_number, horse_name, scratching_time) 
            DO UPDATE SET
              reason = EXCLUDED.reason,
              updated_at = NOW()
            RETURNING (xmax = 0) AS inserted
          `, [
            String(itemRecord.meetingId || itemRecord.MeetingId || ''),
            String(itemRecord.raceId || itemRecord.RaceId || ''),
            Number(itemRecord.raceNumber || itemRecord.RaceNumber || 0),
            String(itemRecord.trackName || itemRecord.TrackName || itemRecord.track || ''),
            String(itemRecord.horseName || itemRecord.HorseName || itemRecord.name || ''),
            Number(itemRecord.tabNumber || itemRecord.TabNumber || 0),
            String(itemRecord.scratchingTime || itemRecord.ScratchingTime || new Date().toISOString()),
            (itemRecord.reason || itemRecord.Reason) ? String(itemRecord.reason || itemRecord.Reason) : null,
            jurisdiction
          ]);

          if (result.rows[0]?.inserted) {
            newScratchings++;
            console.log(`  ✅ Added: ${itemRecord.horseName} - R${itemRecord.raceNumber} at ${itemRecord.trackName}`);
          }
        } catch (error: unknown) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          console.error(`  ❌ Error inserting scratching:`, errorMessage);
        }
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('📊 SYNC SUMMARY');
    console.log('='.repeat(60));
    console.log(`✅ Total scratchings fetched: ${totalScratchings}`);
    console.log(`✅ New scratchings added: ${newScratchings}`);
    console.log(`✅ Existing scratchings updated: ${totalScratchings - newScratchings}`);
    console.log('\n✨ Scratchings sync completed!\n');

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ Sync failed:', errorMessage);
    throw error;
  } finally {
    await dbClient.end();
  }
}

syncScratchings().catch(console.error);
