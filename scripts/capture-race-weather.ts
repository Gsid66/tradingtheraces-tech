import { config } from 'dotenv';
import { Client } from 'pg';
import { getTrackCoordinates } from '../lib/data/track-coordinates';
import {
  fetchWeatherForecast,
  getWeatherAtTime,
  getWeatherDescription,
  degreesToCompass,
} from '../lib/integrations/weather/met-norway-client';
import {
  calculateTrackBias,
  calculateWindImpact,
  calculateWeatherImpactScore,
  generateConditionsNote,
} from '../lib/integrations/weather/weather-analysis';

config({ path: '.env.local' });

interface RaceRow {
  race_id: string;
  meeting_id: string;
  track_name: string;
  race_number: number;
  race_start_time: string;
}

/**
 * Capture weather conditions at race start times
 * This script can be run:
 * 1. Before races to capture forecast conditions
 * 2. After races to capture actual conditions
 * 3. As a backfill for historical data
 */
async function captureRaceWeather() {
  console.log('🏇 Starting race-time weather capture...\n');

  const dbClient = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 10000,
  });

  try {
    await dbClient.connect();
    console.log('✅ Connected to database\n');

    // Get command line arguments
    const args = process.argv.slice(2);
    const backfillDays = args.includes('--backfill')
      ? parseInt(args[args.indexOf('--backfill') + 1] || '7')
      : 0;
    const meetingId = args.includes('--meeting-id')
      ? args[args.indexOf('--meeting-id') + 1]
      : null;

    let query = '';
    let params: any[] = [];

    if (meetingId) {
      // Capture for specific meeting
      console.log(`📅 Capturing weather for meeting: ${meetingId}\n`);
      query = `
        SELECT race_id, meeting_id, track_name, race_number, race_start_time
        FROM pf_races
        WHERE meeting_id = $1
        ORDER BY race_number
      `;
      params = [meetingId];
    } else if (backfillDays > 0) {
      // Backfill mode - capture historical races
      console.log(`📅 Backfilling weather for last ${backfillDays} days\n`);
      query = `
        SELECT race_id, meeting_id, track_name, race_number, race_start_time
        FROM pf_races
        WHERE race_start_time >= NOW() - INTERVAL '${backfillDays} days'
          AND race_start_time <= NOW()
          AND race_id NOT IN (SELECT race_id FROM race_weather_conditions)
        ORDER BY race_start_time
      `;
    } else {
      // Default - capture upcoming races (next 24 hours)
      console.log('📅 Capturing weather for upcoming races (next 24 hours)\n');
      query = `
        SELECT race_id, meeting_id, track_name, race_number, race_start_time
        FROM pf_races
        WHERE race_start_time >= NOW()
          AND race_start_time <= NOW() + INTERVAL '24 hours'
          AND race_id NOT IN (SELECT race_id FROM race_weather_conditions)
        ORDER BY race_start_time
      `;
    }

    const racesResult = await dbClient.query<RaceRow>(query, params);
    const races = racesResult.rows;

    console.log(`✅ Found ${races.length} races to process\n`);

    if (races.length === 0) {
      console.log('ℹ️  No races to capture weather for');
      return;
    }

    let captured = 0;
    let errors = 0;

    // Group races by track to minimize API calls
    const racesByTrack = new Map<string, RaceRow[]>();
    for (const race of races) {
      const trackKey = race.track_name.toLowerCase();
      if (!racesByTrack.has(trackKey)) {
        racesByTrack.set(trackKey, []);
      }
      racesByTrack.get(trackKey)!.push(race);
    }

    console.log(`📍 Processing ${racesByTrack.size} unique tracks\n`);

    for (const [trackName, trackRaces] of racesByTrack) {
      try {
        console.log(`\n🏇 Processing ${trackName} (${trackRaces.length} races)...`);

        // Get track coordinates
        const coords = getTrackCoordinates(trackName);
        if (!coords) {
          console.warn(`  ⚠️  No coordinates found for track: ${trackName}`);
          errors += trackRaces.length;
          continue;
        }

        console.log(`  📍 Coordinates: ${coords.latitude}, ${coords.longitude}`);

        // Fetch weather forecast
        console.log(`  🌐 Fetching weather forecast...`);
        const forecast = await fetchWeatherForecast(coords.latitude, coords.longitude);

        // Process each race
        for (const race of trackRaces) {
          try {
            const raceTime = new Date(race.race_start_time);
            console.log(
              `  🏁 Race ${race.race_number} at ${raceTime.toLocaleTimeString('en-AU')}`
            );

            // Get weather at race time
            const weather = getWeatherAtTime(forecast, raceTime);
            if (!weather) {
              console.warn(`    ⚠️  Could not get weather for race time`);
              errors++;
              continue;
            }

            // Calculate track bias
            const trackBias = calculateTrackBias(
              weather.windDirection,
              weather.windSpeed
            );

            // Calculate wind impact
            const windImpact = calculateWindImpact(
              weather.windSpeed,
              weather.windGust,
              weather.windDirection
            );

            // Calculate overall weather impact score
            const impactScore = calculateWeatherImpactScore({
              windSpeed: weather.windSpeed,
              windGust: weather.windGust,
              precipitation: weather.precipitation,
              temperature: weather.temperature,
              visibility: weather.visibility,
              humidity: weather.humidity,
            });

            // Generate conditions note
            const conditionsNote = generateConditionsNote({
              windSpeed: weather.windSpeed,
              windDirection: weather.windDirection,
              precipitation: weather.precipitation,
              temperature: weather.temperature,
              weatherSymbol: weather.weatherSymbol,
            });

            const weatherCondition = getWeatherDescription(weather.weatherSymbol);

            // Store in race_weather_conditions table
            await dbClient.query(
              `INSERT INTO race_weather_conditions (
                race_id,
                meeting_id,
                track_name,
                race_number,
                race_start_time,
                temperature,
                feels_like,
                wind_speed,
                wind_gust,
                wind_direction,
                wind_direction_compass,
                humidity,
                precipitation_last_hour,
                precipitation_probability,
                weather_symbol,
                weather_condition,
                visibility,
                pressure,
                cloud_cover,
                track_bias_direction,
                wind_impact_category,
                weather_impact_score,
                conditions_note
              ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23)
              ON CONFLICT (race_id) DO UPDATE SET
                temperature = EXCLUDED.temperature,
                feels_like = EXCLUDED.feels_like,
                wind_speed = EXCLUDED.wind_speed,
                wind_gust = EXCLUDED.wind_gust,
                wind_direction = EXCLUDED.wind_direction,
                wind_direction_compass = EXCLUDED.wind_direction_compass,
                humidity = EXCLUDED.humidity,
                precipitation_last_hour = EXCLUDED.precipitation_last_hour,
                precipitation_probability = EXCLUDED.precipitation_probability,
                weather_symbol = EXCLUDED.weather_symbol,
                weather_condition = EXCLUDED.weather_condition,
                visibility = EXCLUDED.visibility,
                pressure = EXCLUDED.pressure,
                cloud_cover = EXCLUDED.cloud_cover,
                track_bias_direction = EXCLUDED.track_bias_direction,
                wind_impact_category = EXCLUDED.wind_impact_category,
                weather_impact_score = EXCLUDED.weather_impact_score,
                conditions_note = EXCLUDED.conditions_note,
                recorded_at = NOW()`,
              [
                race.race_id,
                race.meeting_id,
                trackName,
                race.race_number,
                raceTime,
                weather.temperature,
                weather.feelsLike,
                weather.windSpeed,
                weather.windGust,
                weather.windDirection,
                degreesToCompass(weather.windDirection),
                weather.humidity,
                weather.precipitation,
                weather.precipitationProbability,
                weather.weatherSymbol,
                weatherCondition,
                weather.visibility,
                weather.pressure,
                weather.cloudCover,
                trackBias.direction,
                windImpact.category,
                impactScore.score,
                conditionsNote,
              ]
            );

            captured++;
            console.log(
              `    ✅ ${weather.temperature}°C, ${weatherCondition}, Impact: ${impactScore.score}/10`
            );
          } catch (err) {
            console.error(`    ❌ Error processing race ${race.race_id}:`, err);
            errors++;
          }
        }

        // Rate limiting - wait 1 second between API calls
        await new Promise((resolve) => setTimeout(resolve, 1000));
      } catch (error) {
        console.error(`  ❌ Error processing ${trackName}:`, error);
        errors += trackRaces.length;
      }
    }

    // Summary
    console.log('\n' + '='.repeat(50));
    console.log('📊 Race Weather Capture Summary:');
    console.log('='.repeat(50));
    console.log(`✅ Races captured: ${captured}`);
    console.log(`❌ Errors: ${errors}`);
    console.log('='.repeat(50) + '\n');

    if (errors > 0) {
      console.log('⚠️  Some races had errors. Check logs above for details.');
    } else {
      console.log('✅ All race weather conditions captured successfully!');
    }
  } catch (error) {
    console.error('❌ Fatal error during race weather capture:', error);
    process.exit(1);
  } finally {
    await dbClient.end();
    console.log('\n✅ Database connection closed');
  }
}

// Run the capture
captureRaceWeather().catch((error) => {
  console.error('❌ Unhandled error:', error);
  process.exit(1);
});
