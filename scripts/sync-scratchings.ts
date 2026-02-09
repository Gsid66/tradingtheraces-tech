import { config } from 'dotenv';
import { Client } from 'pg';
import { getPuntingFormClient, PFScratchingRaw } from '../lib/integrations/punting-form/client';

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
    let skippedScratchings = 0;

    // Fetch scratchings for both AU and NZ
    for (const jurisdiction of [0, 1]) {
      const jurisdictionName = jurisdiction === 0 ? 'AU' : 'NZ';
      console.log(`📋 Fetching ${jurisdictionName} scratchings...`);

      const scratchingsResponse = await pfClient.getScratchings(jurisdiction);
      const scratchings = scratchingsResponse.payLoad || [];

      console.log(`✅ Found ${scratchings.length} scratchings for ${jurisdictionName}`);
      totalScratchings += scratchings.length;

      // Group scratchings by meetingId to minimize API calls
      const scratchingsByMeeting = new Map<string, PFScratchingRaw[]>();
      for (const scratching of scratchings) {
        const meetingId = scratching.meetingId;
        if (!scratchingsByMeeting.has(meetingId)) {
          scratchingsByMeeting.set(meetingId, []);
        }
        scratchingsByMeeting.get(meetingId)!.push(scratching);
      }

      console.log(`📦 Grouped into ${scratchingsByMeeting.size} meetings`);

      // Process each meeting
      for (const [meetingId, meetingScratchings] of scratchingsByMeeting.entries()) {
        console.log(`\n🏇 Processing meeting ${meetingId} with ${meetingScratchings.length} scratchings...`);
        
        try {
          // Fetch race data for this meeting to get runner information
          const raceFieldsResponse = await pfClient.getAllRacesForMeeting(meetingId);
          const raceFields = raceFieldsResponse.payLoad;

          // Build a lookup map: runnerId -> horseName
          const runnerLookup = new Map<string, string>();
          for (const race of raceFields.races) {
            if (race.runners) {
              for (const runner of race.runners) {
                const runnerId = String(runner.runnerId);
                const horseName = runner.horseName || runner.name;
                if (runnerId && horseName) {
                  runnerLookup.set(runnerId, horseName);
                }
              }
            }
          }

          console.log(`  📋 Found ${runnerLookup.size} runners in race data`);

          // Process each scratching for this meeting
          for (const scratching of meetingScratchings) {
            try {
              const runnerId = String(scratching.runnerId);
              const horseName = runnerLookup.get(runnerId);

              if (!horseName) {
                console.warn(`  ⚠️  Could not find horse name for runnerId ${runnerId} in meeting ${meetingId}`);
                skippedScratchings++;
                continue;
              }

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
                scratching.meetingId,
                scratching.raceId,
                scratching.raceNo,
                scratching.track,
                horseName,
                scratching.tabNo,
                scratching.timeStamp,
                null, // reason is not provided by the API
                jurisdiction
              ]);

              if (result.rows[0]?.inserted) {
                newScratchings++;
                console.log(`  ✅ Added: ${horseName} - R${scratching.raceNo} at ${scratching.track}`);
              } else {
                console.log(`  📝 Updated: ${horseName} - R${scratching.raceNo} at ${scratching.track}`);
              }
            } catch (error: unknown) {
              const errorMessage = error instanceof Error ? error.message : 'Unknown error';
              console.error(`  ❌ Error inserting scratching:`, errorMessage);
            }
          }
        } catch (error: unknown) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          console.error(`  ❌ Error fetching race data for meeting ${meetingId}:`, errorMessage);
          skippedScratchings += meetingScratchings.length;
        }
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('📊 SYNC SUMMARY');
    console.log('='.repeat(60));
    console.log(`✅ Total scratchings fetched: ${totalScratchings}`);
    console.log(`✅ New scratchings added: ${newScratchings}`);
    console.log(`✅ Existing scratchings updated: ${totalScratchings - newScratchings - skippedScratchings}`);
    console.log(`⚠️  Scratchings skipped (no horse name): ${skippedScratchings}`);
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
