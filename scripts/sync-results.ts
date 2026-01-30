import { config } from 'dotenv';
config({ path: '.env.local' });

import { Client } from 'pg';
import { getPuntingFormClient } from '../lib/integrations/punting-form/client';

async function syncResults(daysAgo: number = 1) {
  const startTime = Date.now();
  console.log(`🏁 Syncing race results.. .\n`);

  const pfClient = getPuntingFormClient();
  const dbClient = new Client({
    connectionString:  process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await dbClient.connect();
    console.log('✅ Connected to database\n');

    // Get target date
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() - daysAgo);
    console.log(`📅 Fetching results for ${targetDate.toLocaleDateString()}...\n`);

    // Get meetings for that date
    const meetingsResponse = await pfClient.getMeetingsByDate(targetDate);
    const meetings = meetingsResponse.payLoad;

    if (! meetings || meetings.length === 0) {
      console.log('⚠️  No meetings found for this date\n');
      return;
    }

    console.log(`📍 Found ${meetings.length} meetings\n`);

    let totalRaces = 0;
    let totalResults = 0;
    let skippedResults = 0;

    for (const meeting of meetings) {
      console.log(`📍 ${meeting.track. name}... `);

      try {
        const resultsResponse = await pfClient.getMeetingResults(meeting.meetingId);
        
        // The response is an array of meeting objects
        // Each meeting object has a 'raceResults' property
        const meetingData = resultsResponse.payLoad[0];
        
        if (! meetingData || !meetingData.raceResults || meetingData.raceResults. length === 0) {
          console.log(`   ⚠️  No results available yet\n`);
          continue;
        }

        const races = meetingData.raceResults;
        totalRaces += races.length;
        let meetingResultCount = 0;

        // Insert meeting first (required for foreign key)
        await dbClient.query(`
          INSERT INTO pf_meetings (
            meeting_id, track_name, track_id, state, country, 
            meeting_date, rail_position, stage
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          ON CONFLICT (meeting_id) DO UPDATE SET
            rail_position = EXCLUDED.rail_position,
            updated_at = NOW()
        `, [
          meeting.meetingId,
          meeting.track.name,
          meeting.track.trackId || null,
          meeting.track.state,
          meeting.track.country,
          targetDate.toISOString().split('T')[0], // YYYY-MM-DD format
          meetingData.railPosition || null,
          meeting.stage || 'RESULTS'
        ]);

        for (const race of races) {
          const runners = race. runners || [];

          // Insert race (required for foreign key)
          await dbClient.query(`
            INSERT INTO pf_races (
              race_id, meeting_id, race_number, race_name, distance, 
              start_time, result_status, winning_time
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            ON CONFLICT (race_id) DO UPDATE SET
              result_status = EXCLUDED.result_status,
              winning_time = EXCLUDED.winning_time,
              updated_at = NOW()
          `, [
            race.raceId,
            meeting.meetingId,
            race.number,
            race.name || `Race ${race.number}`,
            race.distance,
            race.jumpTime || null,
            'FINAL',
            race.officialRaceTimeString
          ]);

          for (const runner of runners) {
            try {
              // Convert time string "01:44.30" to seconds for numeric field
              let finishingTimeSeconds = null;
              if (race.officialRaceTimeString) {
                const timeParts = race.officialRaceTimeString.split(':');
                if (timeParts.length === 2) {
                  const minutes = parseInt(timeParts[0]);
                  const seconds = parseFloat(timeParts[1]);
                  finishingTimeSeconds = (minutes * 60) + seconds;
                }
              }

              await dbClient.query(`
                INSERT INTO pf_results (
                  race_id, runner_id, horse_id, horse_name, finishing_position,
                  tab_number, barrier_number, finishing_time, finishing_time_display, margin_to_winner,
                  jockey_id, jockey_name, trainer_id, trainer_name,
                  weight_carried, starting_price, prize_money_won,
                  stewards_comment, race_comment
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
                ON CONFLICT (race_id, horse_id) DO UPDATE SET
                  finishing_position = EXCLUDED. finishing_position,
                  margin_to_winner = EXCLUDED. margin_to_winner,
                  finishing_time = EXCLUDED. finishing_time,
                  finishing_time_display = EXCLUDED. finishing_time_display,
                  starting_price = EXCLUDED. starting_price,
                  stewards_comment = EXCLUDED.stewards_comment,
                  race_comment = EXCLUDED.race_comment,
                  updated_at = NOW()
              `, [
                race.raceId,                      // $1 race_id
                runner.formId,                    // $2 runner_id
                runner. runnerId?. toString(),      // $3 horse_id
                runner.runner,                    // $4 horse_name
                runner.position,                  // $5 finishing_position
                runner.tabNo,                     // $6 tab_number
                runner.barrier,                   // $7 barrier_number
                finishingTimeSeconds,             // $8 finishing_time (numeric for sorting/calculations)
                race.officialRaceTimeString,      // $9 finishing_time_display (e.g.  "01:44.30")
                runner.margin,                    // $10 margin_to_winner
                runner.jockeyId?.toString(),      // $11 jockey_id
                runner. jockey,                    // $12 jockey_name
                runner.trainerId?.toString(),     // $13 trainer_id
                runner.trainer,                   // $14 trainer_name
                runner.weight,                    // $15 weight_carried
                runner. price,                     // $16 starting_price
                null,                             // $17 prize_money_won
                runner.stewardsReports,           // $18 stewards_comment
                runner.inRun                      // $19 race_comment
              ]);

              totalResults++;
              meetingResultCount++;
            } catch (error:  any) {
              console.error(`      ❌ Error inserting result for ${runner.runner}:`, error.message);
              skippedResults++;
            }
          }
        }

        console.log(`   ✅ ${races.length} races, ${meetingResultCount} results\n`);

      } catch (error: any) {
        console.error(`   ❌ Error fetching results: `, error.message, '\n');
      }
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    console.log('🎉 Results sync completed!\n');
    console.log(`📊 Summary:`);
    console.log(`   Meetings:  ${meetings.length}`);
    console.log(`   Races: ${totalRaces}`);
    console.log(`   Results: ${totalResults}`);
    console.log(`   Skipped: ${skippedResults}`);
    console.log(`   Duration: ${duration}s\n`);

  } catch (error: any) {
    console.error('❌ Sync failed:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await dbClient.end();
  }
}

// Get daysAgo from command line args, default to 1 (yesterday)
const daysAgo = process.argv[2] ?  parseInt(process.argv[2]) : 1;
syncResults(daysAgo);