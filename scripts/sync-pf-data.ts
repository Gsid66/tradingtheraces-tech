import { config } from 'dotenv';
import { Client } from 'pg';
import { getPuntingFormClient } from '../lib/integrations/punting-form/client';
import { convertPuntingFormToTTR } from '../lib/utils/track-name-standardizer';

config({ path: '.env.local' });

async function syncPuntingFormData() {
  console.log('🔄 Starting Punting Form data sync...\n');

  const pfClient = getPuntingFormClient();
  const dbClient = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 10000,
  });

  try {
    // Connect to database
    await dbClient.connect();
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

    let totalRaces = 0;
    let totalRunners = 0;

    // Process each meeting
    for (const meeting of meetings) {
      const originalTrackName = meeting.track.name;
      const surface = meeting.track.surface;
      
      // Convert PuntingForm track name to TTR format for consistency
      // This ensures Beaumont (synthetic) is stored as Newcastle to match TTR data
      const ttrTrackNames = convertPuntingFormToTTR(originalTrackName, surface);
      const ttrTrackName = ttrTrackNames[0]; // Use first (canonical) name
      
      console.log(`📍 Processing: ${originalTrackName} (${meeting.track.state})${originalTrackName !== ttrTrackName ? ` -> ${ttrTrackName}` : ''}`);

      // Insert meeting
      await dbClient.query(`
        INSERT INTO pf_meetings (
          meeting_id, track_name, track_id, location, state, country, 
          abbrev, surface, meeting_date, stage
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        ON CONFLICT (meeting_id) DO UPDATE SET
          track_name = EXCLUDED.track_name,
          updated_at = NOW()
      `, [
        meeting.meetingId,
        ttrTrackName,  // Use converted TTR track name
        meeting.track.trackId,
        meeting.track.location,
        meeting.track.state,
        meeting.track.country,
        meeting.track.abbrev,
        meeting.track.surface,
        new Date().toISOString().split('T')[0],
        'A'
      ]);

      // Fetch races for this meeting
      const fieldsResponse = await pfClient.getAllRacesForMeeting(meeting.meetingId);
      const races = fieldsResponse.payLoad.races || [];

      console.log(`  🏁 Found ${races.length} races`);
      totalRaces += races.length;

      let meetingRunnerCount = 0;

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
          race.ageRestrictions,
          race.jockeyRestrictions,
          race.sexRestrictions,
          race.weightType,
          race.limitWeight,
          race.raceClass,
          race.prizeMoney,
          race.prizeMoneyBreakDown,
          race.startTime,
          race.startTimeUTC,
          race.group,
          race.bonusScheme,
          race.description
        ]);

        // Process runners
        const runners = race.runners || [];
        totalRunners += runners.length;
        meetingRunnerCount += runners.length;

        for (const runner of runners) {
          // Insert horse
          if (runner.runnerId) {
            await dbClient.query(`
              INSERT INTO pf_horses (
                horse_id, horse_name, sex, colour, age, foaled_date,
                sire, dam, dams_sire, country_bred, career_starts,
                career_wins, career_seconds, career_thirds, career_prize_money
              ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
              ON CONFLICT (horse_id) DO UPDATE SET
                horse_name = EXCLUDED.horse_name,
                sex = EXCLUDED.sex,
                colour = EXCLUDED.colour,
                age = EXCLUDED.age,
                career_starts = EXCLUDED.career_starts,
                career_wins = EXCLUDED.career_wins,
                career_seconds = EXCLUDED.career_seconds,
                career_thirds = EXCLUDED.career_thirds,
                career_prize_money = EXCLUDED.career_prize_money,
                updated_at = NOW()
            `, [
              runner.runnerId,
              runner.name || runner.horseName,
              runner.sex,
              runner.colour,
              runner.age,
              runner.foalDate,
              runner.sire,
              runner.dam,
              runner.sireofDam || runner.sireDam,
              runner.country,
              runner.careerStarts || 0,
              runner.careerWins || 0,
              runner.careerSeconds || 0,
              runner.careerThirds || 0,
              runner.prizeMoney || 0
            ]);
          }

          // Insert jockey
          if (runner.jockey && runner.jockey.jockeyId) {
            await dbClient.query(`
              INSERT INTO pf_jockeys (
                jockey_id, full_name, apprentice, claim_allowance
              ) VALUES ($1, $2, $3, $4)
              ON CONFLICT (jockey_id) DO UPDATE SET
                full_name = EXCLUDED.full_name,
                apprentice = EXCLUDED.apprentice,
                claim_allowance = EXCLUDED.claim_allowance,
                updated_at = NOW()
            `, [
              runner.jockey.jockeyId,
              runner.jockey.fullName,
              runner.jockey.isApprentice || false,
              runner.jockey.claim || 0
            ]);
          }

          // Insert trainer
          if (runner.trainer && runner.trainer.trainerId) {
            await dbClient.query(`
              INSERT INTO pf_trainers (
                trainer_id, full_name, location
              ) VALUES ($1, $2, $3)
              ON CONFLICT (trainer_id) DO UPDATE SET
                full_name = EXCLUDED.full_name,
                location = EXCLUDED.location,
                updated_at = NOW()
            `, [
              runner.trainer.trainerId,
              runner.trainer.fullName,
              runner.trainer.location
            ]);
          }

          // Insert runner - Check if exists first
          const existingRunner = await dbClient.query(
            'SELECT id FROM pf_runners WHERE form_id = $1',
            [runner.formId]
          );

          if (existingRunner.rows.length === 0) {
            // Insert new runner - MUST include horse_name
            await dbClient.query(`
              INSERT INTO pf_runners (
                form_id, race_id, horse_id, horse_name, tab_number, barrier_number,
                original_barrier, jockey_id, jockey_name, jockey_claim, trainer_id,
                trainer_name, weight, handicap, fixed_odds, last_five_starts,
                emergency_indicator, prep_runs, gear_changes
              ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
            `, [
              runner.formId,
              race.raceId,
              runner.runnerId,
              runner.name || runner.horseName || 'Unknown', // FIX: Provide default value
              runner.tabNumber,
              runner.barrierNumber || runner.barrier,
              runner.originalBarrier,
              runner.jockey?.jockeyId,
              runner.jockey?.fullName,
              runner.jockeyClaim || 0,
              runner.trainer?.trainerId,
              runner.trainer?.fullName,
              runner.weight || runner.handicapWeight,
              runner.handicap,
              runner.fixedOdds,
              runner.lastFiveStarts || runner.last10,
              runner.emergencyIndicator || false,
              runner.prepRuns || 0,
              runner.gearChanges
            ]);
          } else {
            // Update existing runner
            await dbClient.query(`
              UPDATE pf_runners SET
                horse_name = $1,
                barrier_number = $2,
                weight = $3,
                fixed_odds = $4,
                jockey_name = $5,
                trainer_name = $6,
                updated_at = NOW()
              WHERE form_id = $7
            `, [
              runner.name || runner.horseName || 'Unknown',
              runner.barrierNumber || runner.barrier,
              runner.weight || runner.handicapWeight,
              runner.fixedOdds,
              runner.jockey?.fullName,
              runner.trainer?.fullName,
              runner.formId
            ]);
          }
        }
      }

      console.log(`  ✅ Completed ${meeting.track.name}`);
      console.log(`     Races: ${races.length}, Runners: ${meetingRunnerCount}\n`);
    }

    console.log('='.repeat(60));
    console.log('📊 SYNC SUMMARY');
    console.log('='.repeat(60));
    console.log(`✅ Meetings processed: ${meetings.length}`);
    console.log(`✅ Total races: ${totalRaces}`);
    console.log(`✅ Total runners: ${totalRunners}`);
    console.log('\n✨ Sync completed successfully!\n');

  } catch (error: any) {
    console.error('❌ Sync failed:', error.message);
    console.error('\nFull error:', error);
    throw error;
  } finally {
    await dbClient.end();
  }
}

syncPuntingFormData();