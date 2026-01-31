import { config } from 'dotenv';
config({ path: '.env.local' });

import { Client } from 'pg';
import { getPuntingFormClient } from '../lib/integrations/punting-form/client';

async function syncResults(targetDateString?: string) {
  const startTime = Date.now();
  console.log(`🏁 Syncing race results...\n`);

  const pfClient = getPuntingFormClient();
  const dbClient = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await dbClient.connect();
    console.log('✅ Connected to database\n');

    // ✅ USE PROVIDED DATE OR DEFAULT TO YESTERDAY
    if (!targetDateString) {
      // Default to yesterday in Sydney
      const now = new Date();
      const sydneyOffset = 11 * 60; // 11 hours in minutes
      const sydneyTime = new Date(now.getTime() + sydneyOffset * 60 * 1000);
      sydneyTime.setUTCDate(sydneyTime.getUTCDate() - 1); // Yesterday
      
      const year = sydneyTime.getUTCFullYear();
      const month = String(sydneyTime.getUTCMonth() + 1).padStart(2, '0');
      const day = String(sydneyTime.getUTCDate()).padStart(2, '0');
      targetDateString = `${year}-${month}-${day}`;
    }

    console.log(`📅 Target date: ${targetDateString}\n`);
    
    // Create date for API
    const targetDate = new Date(`${targetDateString}T12:00:00Z`);

    // Get meetings for that date
    const meetingsResponse = await pfClient.getMeetingsByDate(targetDate);
    const meetings = meetingsResponse.payLoad;

    if (!meetings || meetings.length === 0) {
      console.log('⚠️  No meetings found for this date\n');
      return;
    }

    console.log(`📍 Found ${meetings.length} meetings\n`);

    let totalRaces = 0;
    let totalResults = 0;
    let skippedResults = 0;

    for (const meeting of meetings) {
      console.log(`📍 ${meeting.track.name}... `);

      try {
        const resultsResponse = await pfClient.getMeetingResults(meeting.meetingId);
        
        const meetingData = resultsResponse.payLoad[0];
        
        if (!meetingData || !meetingData.raceResults || meetingData.raceResults.length === 0) {
          console.log(`   ⚠️  No results available yet\n`);
          continue;
        }

        // Insert meeting first (required for foreign key)
        await dbClient.query(`
          INSERT INTO pf_meetings (
            meeting_id, track_name, track_id, state, country, 
            meeting_date, rail_position, stage
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          ON CONFLICT (meeting_id) DO UPDATE SET
            rail_position = EXCLUDED.rail_position,
            meeting_date = EXCLUDED.meeting_date,
            updated_at = NOW()
        `, [
          meeting.meetingId,
          meeting.track.name,
          meeting.track.trackId || null,
          meeting.track.state,
          meeting.track.country,
          targetDateString,
          meetingData.railPosition || null,
          meeting.stage || 'RESULTS'
        ]);

        const races = meetingData.raceResults;
        totalRaces += races.length;
        let meetingResultCount = 0;

        for (const race of races) {
          // Convert winning time string to seconds
          let winningTimeSeconds = null;
          if (race.officialRaceTimeString) {
            const timeParts = race.officialRaceTimeString.split(':');
            if (timeParts.length === 2) {
              const minutes = parseInt(timeParts[0]);
              const seconds = parseFloat(timeParts[1]);
              winningTimeSeconds = (minutes * 60) + seconds;
            }
          }

          // Insert race
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
            race.raceNumber,
            race.name || `Race ${race.raceNumber}`,
            race.distance,
            race.jumpTime || null,
            'FINAL',
            winningTimeSeconds
          ]);

          const runners = race.runners || [];

          for (const runner of runners) {
            try {
              // Insert horse
              if (runner.runnerId) {
                await dbClient.query(`
                  INSERT INTO pf_horses (
                    horse_id, horse_name
                  ) VALUES ($1, $2)
                  ON CONFLICT (horse_id) DO NOTHING
                `, [
                  runner.runnerId?.toString(),
                  runner.runner
                ]);
              }

              // Insert jockey
              if (runner.jockeyId) {
                await dbClient.query(`
                  INSERT INTO pf_jockeys (
                    jockey_id, full_name
                  ) VALUES ($1, $2)
                  ON CONFLICT (jockey_id) DO NOTHING
                `, [
                  runner.jockeyId?.toString(),
                  runner.jockey
                ]);
              }

              // Insert trainer
              if (runner.trainerId) {
                await dbClient.query(`
                  INSERT INTO pf_trainers (
                    trainer_id, full_name
                  ) VALUES ($1, $2)
                  ON CONFLICT (trainer_id) DO NOTHING
                `, [
                  runner.trainerId?.toString(),
                  runner.trainer
                ]);
              }

              // Convert time string to seconds
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
                  finishing_position = EXCLUDED.finishing_position,
                  margin_to_winner = EXCLUDED.margin_to_winner,
                  finishing_time = EXCLUDED.finishing_time,
                  finishing_time_display = EXCLUDED.finishing_time_display,
                  starting_price = EXCLUDED.starting_price,
                  stewards_comment = EXCLUDED.stewards_comment,
                  race_comment = EXCLUDED.race_comment,
                  updated_at = NOW()
              `, [
                race.raceId,
                runner.formId,
                runner.runnerId?.toString(),
                runner.runner,
                runner.position,
                runner.tabNo,
                runner.barrier,
                finishingTimeSeconds,
                race.officialRaceTimeString,
                runner.margin,
                runner.jockeyId?.toString(),
                runner.jockey,
                runner.trainerId?.toString(),
                runner.trainer,
                runner.weight,
                runner.price,
                null,
                runner.stewardsReports,
                runner.inRun
              ]);

              totalResults++;
              meetingResultCount++;
            } catch (error: any) {
              console.error(`      ❌ Error inserting result for ${runner.runner}:`, error.message);
              skippedResults++;
            }
          }
        }

        console.log(`   ✅ ${races.length} races, ${meetingResultCount} results\n`);

      } catch (error: any) {
        console.error(`   ❌ Error fetching results:`, error.message, '\n');
      }
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    console.log('🎉 Results sync completed!\n');
    console.log(`📊 Summary:`);
    console.log(`   Date: ${targetDateString}`);
    console.log(`   Meetings: ${meetings.length}`);
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

// Get date from command line args (YYYY-MM-DD format)
const dateArg = process.argv[2];
syncResults(dateArg);