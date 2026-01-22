import { config } from 'dotenv';
import { Client } from 'pg';
import { getPuntingFormClient } from '../lib/integrations/punting-form/client';

config({ path: '.env.local' });

async function syncPuntingFormData() {
  console.log('🔄 Starting Punting Form data sync...\n');

  const pfClient = getPuntingFormClient();
  const dbClient = new Client({
    connectionString:  process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 10000,
  });

  try {
    // Connect to database
    await dbClient. connect();
    console.log('✅ Connected to database\n');

    // Fetch today's meetings
    console.log('📅 Fetching today\'s meetings from Punting Form...');
    const meetingsResponse = await pfClient.getTodaysMeetings();
    const meetings = meetingsResponse.payLoad;

    console.log(`✅ Found ${meetings.length} meetings\n`);

    if (meetings.length === 0) {
      console.log('⚠️  No meetings found for today');
      return;
    }

    let successCount = 0;
    let errorCount = 0;
    const errors:  Array<{ meeting: string; error: string }> = [];

    // Process each meeting
    for (const meeting of meetings) {
      try {
        console.log(`📍 Processing:  ${meeting.track.name} (${meeting.track.state})`);

        // Insert meeting (using your existing table structure)
        await dbClient. query(`
          INSERT INTO pf_meetings (
            meeting_id, track_name, track_id, location, state, country, 
            abbrev, surface, meeting_date, stage
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
          ON CONFLICT (meeting_id) DO UPDATE SET
            track_name = EXCLUDED.track_name,
            updated_at = NOW()
        `, [
          meeting.meetingId,
          meeting.track.name,
          meeting.track.trackId,
          meeting.track. location,
          meeting.track. state,
          meeting.track. country,
          meeting.track. abbrev,
          meeting.track.surface,
          new Date().toISOString().split('T')[0],
          meeting.stage || 'A'
        ]);

        // Fetch races for this meeting
        try {
          const fieldsResponse = await pfClient.getAllRacesForMeeting(meeting.meetingId);
          const races = fieldsResponse.payLoad. races || [];

          console.log(`  🏁 Found ${races.length} races`);

          // Process each race
          for (const race of races) {
            // Insert race
            await dbClient.query(`
              INSERT INTO pf_races (
                race_id, meeting_id, race_number, race_name, provider_race_id,
                distance, age_restrictions, jockey_restrictions, sex_restrictions,
                weight_type, limit_weight, race_class, prize_money,
                prize_money_breakdown, start_time, start_time_utc, group_race,
                bonus_scheme, description
              ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
              ON CONFLICT (race_id) DO UPDATE SET
                race_name = EXCLUDED.race_name,
                updated_at = NOW()
            `, [
              race.raceId,
              meeting.meetingId,
              race.number,
              race.name,
              race.providerRaceId,
              race.distance,
              race.ageRestrictions || null,
              race.jockeyRestrictions || null,
              race.sexRestrictions || null,
              race.weightType || null,
              race.limitWeight || null,
              race.raceClass || null,
              race.prizeMoney,
              race.prizeMoneyBreakDown || null,
              race.startTime,
              race.startTimeUTC,
              race.group || null,
              race.bonusScheme || null,
              race.description || null
            ]);

            // Process runners
            const runners = race.runners || [];

            for (const runner of runners) {
              // Skip runners without proper data
              if (!runner.formId || (! runner.name && !runner.horseName)) {
                continue;
              }

              // Insert horse if exists
              if (runner.runnerId) {
                await dbClient.query(`
                  INSERT INTO pf_horses (
                    horse_id, horse_name, sex, colour, age, foaled_date,
                    sire, dam, dams_sire, country_bred, career_starts,
                    career_wins, career_seconds, career_thirds, career_prize_money
                  ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
                  ON CONFLICT (horse_id) DO UPDATE SET
                    career_starts = EXCLUDED.career_starts,
                    career_wins = EXCLUDED.career_wins,
                    career_seconds = EXCLUDED.career_seconds,
                    career_thirds = EXCLUDED. career_thirds,
                    career_prize_money = EXCLUDED. career_prize_money,
                    updated_at = NOW()
                `, [
                  runner.runnerId,
                  runner.name || runner.horseName,
                  runner.sex || null,
                  runner.colour || null,
                  runner. age || null,
                  runner.foalDate || null,
                  runner.sire || null,
                  runner.dam || null,
                  runner.sireofDam || runner.sireDam || null,
                  runner.country || null,
                  runner. careerStarts || 0,
                  runner.careerWins || 0,
                  runner.careerSeconds || 0,
                  runner. careerThirds || 0,
                  runner.prizeMoney || 0
                ]);
              }

              // Insert jockey
              if (runner.jockey?. jockeyId) {
                await dbClient.query(`
                  INSERT INTO pf_jockeys (
                    jockey_id, full_name, is_apprentice, claim, riding_weight
                  ) VALUES ($1, $2, $3, $4, $5)
                  ON CONFLICT (jockey_id) DO UPDATE SET
                    full_name = EXCLUDED.full_name,
                    is_apprentice = EXCLUDED.is_apprentice,
                    claim = EXCLUDED. claim,
                    riding_weight = EXCLUDED.riding_weight,
                    updated_at = NOW()
                `, [
                  runner.jockey.jockeyId,
                  runner. jockey.fullName,
                  runner.jockey.isApprentice || false,
                  runner.jockey.claim || null,
                  runner. jockey.ridingWeight || null
                ]);
              }

              // Insert trainer
              if (runner.trainer?.trainerId) {
                await dbClient.query(`
                  INSERT INTO pf_trainers (
                    trainer_id, full_name, location
                  ) VALUES ($1, $2, $3)
                  ON CONFLICT (trainer_id) DO UPDATE SET
                    full_name = EXCLUDED.full_name,
                    location = EXCLUDED.location,
                    updated_at = NOW()
                `, [
                  runner.trainer. trainerId,
                  runner. trainer.fullName,
                  runner.trainer.location || null
                ]);
              }

              // Insert runner
              await dbClient.query(`
                INSERT INTO pf_runners (
                  form_id, race_id, horse_id, tab_number, barrier_number,
                  original_barrier, jockey_id, jockey_claim, trainer_id,
                  weight, handicap, fixed_odds, last_five_starts,
                  emergency_indicator, prep_runs, gear_changes
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
                ON CONFLICT (form_id) DO UPDATE SET
                  barrier_number = EXCLUDED.barrier_number,
                  weight = EXCLUDED.weight,
                  fixed_odds = EXCLUDED.fixed_odds,
                  updated_at = NOW()
              `, [
                runner.formId,
                race.raceId,
                runner.runnerId || null,
                runner.tabNumber,
                runner.barrierNumber || runner.barrier,
                runner.originalBarrier || null,
                runner.jockey?. jockeyId || null,
                runner.jockeyClaim || 0,
                runner.trainer?.trainerId || null,
                runner.weight || runner.handicapWeight,
                runner.handicap,
                runner.fixedOdds || null,
                runner. lastFiveStarts || runner.last10 || null,
                runner.emergencyIndicator || false,
                runner.prepRuns || 0,
                runner.gearChanges || null
              ]);
            }
          }

          successCount++;
          console.log(`  ✅ Completed ${meeting.track.name}\n`);

        } catch (raceError: any) {
          errorCount++;
          const errorMsg = `Failed to fetch races:  ${raceError.message}`;
          errors.push({ meeting: meeting.track.name, error: errorMsg });
          console.log(`  ❌ ${errorMsg}`);
          console.log(`  ⏭️  Skipping to next meeting.. .\n`);
          continue;
        }

      } catch (meetingError: any) {
        errorCount++;
        const errorMsg = meetingError.message;
        errors.push({ meeting: meeting.track.name, error: errorMsg });
        console.log(`  ❌ Error: ${errorMsg}`);
        console.log(`  ⏭️  Skipping to next meeting...\n`);
        continue;
      }
    }

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 SYNC SUMMARY');
    console.log('='.repeat(60));
    console.log(`✅ Successful: ${successCount}/${meetings. length} meetings`);
    console.log(`❌ Failed: ${errorCount}/${meetings. length} meetings`);
    
    if (errors.length > 0) {
      console.log('\n❌ ERRORS:');
      errors.forEach(({ meeting, error }) => {
        console.log(`  • ${meeting}: ${error}`);
      });
    }
    
    console.log('\n✨ Sync process completed! ');

  } catch (error: any) {
    console.error('❌ Sync failed:', error.message);
    throw error;
  } finally {
    await dbClient.end();
  }
}

syncPuntingFormData();