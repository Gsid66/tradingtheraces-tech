import { config } from 'dotenv';
import { Client } from 'pg';
import { getPuntingFormClient } from '../lib/integrations/punting-form/client';

config({ path: '.env.local' });

async function syncPuntingFormData() {
  console.log('🔄 Starting Punting Form data sync...\n');

  const pfClient = getPuntingFormClient();
  const dbClient = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
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

    let totalRaces = 0;
    let totalRunners = 0;

    // Process each meeting
    for (const meeting of meetings) {
      console.log(`📍 Processing:  ${meeting.track. name} (${meeting.track.state})`);

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
        meeting.track.name,
        meeting.track.trackId,
        meeting.track. location,
        meeting.track. state,
        meeting.track. country,
        meeting.track. abbrev,
        meeting.track.surface,
        new Date().toISOString().split('T')[0], // today's date
        'A' // Active stage
      ]);

      // Fetch races for this meeting
      const fieldsResponse = await pfClient.getAllRacesForMeeting(meeting.meetingId);
      const races = fieldsResponse.payLoad. races || [];

      console.log(`  🏁 Found ${races.length} races`);
      totalRaces += races.length;

      // Process each race
      for (const race of races) {
        // Insert race
        await dbClient. query(`
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
          race. sexRestrictions,
          race.weightType,
          race. limitWeight,
          race.raceClass,
          race.prizeMoney,
          race.prizeMoneyBreakDown,
          race.startTime,
          race.startTimeUTC,
          race.group,
          race.bonusScheme,
          race.description
        ]);

        const runners = race.runners || [];
        console.log(`    🐴 Race ${race.number}:  ${runners.length} runners`);
        totalRunners += runners. length;

        // Process each runner
                   for (const runner of runners) {
          // Skip runners without name
          if (!runner.name) {
            console.log(`      ⚠️  Skipping runner with no name (Tab ${runner.tabNo})`);
            continue;
          }

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
                career_starts = EXCLUDED.career_starts,
                career_wins = EXCLUDED.career_wins,
                career_seconds = EXCLUDED. career_seconds,
                career_thirds = EXCLUDED.career_thirds,
                career_prize_money = EXCLUDED.career_prize_money,
                updated_at = NOW()
            `, [
              runner.runnerId,
              runner.name,
              runner.sex,
              runner.colour,
              runner.age,
              runner.foalDate,
              runner.sire,
              runner.dam,
              runner.sireofDam,
              runner.country,
              runner.careerStarts,
              runner.careerWins,
              runner.careerSeconds,
              runner.careerThirds,
              runner.prizeMoney
            ]);
          }

          // Insert trainer
          if (runner.trainer?. trainerId) {
            await dbClient.query(`
              INSERT INTO pf_trainers (trainer_id, full_name, location)
              VALUES ($1, $2, $3)
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

                    // Insert jockey
          const jockey = runner.jockey;
          if (jockey?.jockeyId && jockey.jockeyId !== '0') {
            await dbClient.query(`
              INSERT INTO pf_jockeys (jockey_id, full_name, apprentice, claim_allowance)
              VALUES ($1, $2, $3, $4)
              ON CONFLICT (jockey_id) DO UPDATE SET
                full_name = EXCLUDED.full_name,
                apprentice = EXCLUDED.apprentice,
                claim_allowance = EXCLUDED.claim_allowance,
                updated_at = NOW()
            `, [
              jockey.jockeyId,
              jockey.fullName?.trim() || 'Unknown',
              jockey.isApprentice || false,
              jockey.claim || 0
            ]);
          }

          // Insert runner
                    await dbClient.query(`
            INSERT INTO pf_runners (
              race_id, form_id, horse_id, horse_name, barrier_number,
              original_barrier, tab_number, jockey_id, jockey_name,
              jockey_claim, trainer_id, trainer_name, weight, handicap,
              fixed_odds, last_five_starts, emergency_indicator, prep_runs,
              gear_changes, starting_price
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
            ON CONFLICT (race_id, form_id) DO UPDATE SET
              barrier_number = EXCLUDED.barrier_number,
              jockey_id = EXCLUDED. jockey_id,
              jockey_name = EXCLUDED.jockey_name,
              weight = EXCLUDED.weight,
              gear_changes = EXCLUDED.gear_changes,
              updated_at = NOW()
          `, [
            race.raceId,
            runner.formId,
            runner.runnerId,
            runner.name,
            runner.barrier,
            runner.originalBarrier,
            runner.tabNo,
            runner. jockey?. jockeyId !== '0' ? runner.jockey?.jockeyId : null,
            runner.jockey?.fullName?.trim() || null,
            runner. jockeyClaim,
            runner.trainer?.trainerId,
            runner.trainer?.fullName,
            runner.weight,
            runner.handicap,
            null,
            runner.last10,
            runner.emergencyIndicator,
            runner.prepRuns,
            runner.gearChanges,
            runner.priceSP
          ]);
        }   
      }

      console.log('');
    }

    console.log('🎉 Sync completed successfully!\n');
    console.log(`📊 Summary:`);
    console.log(`   Meetings: ${meetings.length}`);
    console.log(`   Races: ${totalRaces}`);
    console.log(`   Runners: ${totalRunners}\n`);

  } catch (error:  any) {
    console.error('❌ Sync failed:', error. message);
    console.error(error);
    process.exit(1);
  } finally {
    await dbClient. end();
  }
}

syncPuntingFormData();