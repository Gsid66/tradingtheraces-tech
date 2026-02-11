import { config } from 'dotenv';
import { Client } from 'pg';
import { getTrackCoordinates } from '../lib/data/track-coordinates';
import {
  fetchWeatherForecast,
  getCurrentWeather,
  getHourlyForecast,
  getWeatherDescription,
} from '../lib/integrations/weather/met-norway-client';

config({ path: '.env.local' });

interface MeetingRow {
  meeting_id: string;
  track_name: string;
  meeting_date: string;
}

async function syncWeatherData() {
  console.log('🌤️  Starting weather data sync...\n');

  const dbClient = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 10000,
  });

  try {
    await dbClient.connect();
    console.log('✅ Connected to database\n');

    // Get today's date in YYYY-MM-DD format
    const today = new Date().toISOString().split('T')[0];
    
    // Fetch all meetings for today
    console.log(`📅 Fetching meetings for ${today}...\n`);
    const meetingsResult = await dbClient.query<MeetingRow>(
      `SELECT DISTINCT meeting_id, track_name, meeting_date 
       FROM pf_meetings 
       WHERE meeting_date::date = $1::date
       ORDER BY track_name`,
      [today]
    );

    const meetings = meetingsResult.rows;
    console.log(`✅ Found ${meetings.length} meetings for today\n`);

    if (meetings.length === 0) {
      console.log('ℹ️  No meetings to sync weather for');
      return;
    }

    let totalUpdated = 0;
    let totalForecastsStored = 0;
    let errors = 0;

    // Process each unique track
    const uniqueTracks = new Set(meetings.map(m => m.track_name.toLowerCase()));
    console.log(`📍 Processing ${uniqueTracks.size} unique tracks\n`);

    for (const trackName of uniqueTracks) {
      try {
        console.log(`\n🏇 Processing ${trackName}...`);
        
        // Get track coordinates
        const coords = getTrackCoordinates(trackName);
        if (!coords) {
          console.warn(`  ⚠️  No coordinates found for track: ${trackName}`);
          errors++;
          continue;
        }

        console.log(`  📍 Coordinates: ${coords.latitude}, ${coords.longitude}`);

        // Fetch weather forecast from MET Norway
        console.log(`  🌐 Fetching weather forecast...`);
        const forecast = await fetchWeatherForecast(coords.latitude, coords.longitude);
        
        // Get current weather
        const current = getCurrentWeather(forecast);
        if (!current) {
          console.warn(`  ⚠️  Could not get current weather for ${trackName}`);
          errors++;
          continue;
        }

        const description = getWeatherDescription(current.weatherSymbol);
        console.log(`  🌤️  Current: ${current.temperature}°C, Wind: ${current.windSpeed} m/s, ${description}`);

        // Update pf_meetings with current weather
        const updateResult = await dbClient.query(
          `UPDATE pf_meetings 
           SET current_temperature = $1,
               current_wind_speed = $2,
               current_wind_direction = $3,
               current_weather_symbol = $4,
               weather_updated_at = NOW()
           WHERE LOWER(track_name) = $5 
             AND meeting_date::date = $6::date`,
          [
            current.temperature,
            current.windSpeed,
            current.windDirection,
            current.weatherSymbol,
            trackName.toLowerCase(),
            today,
          ]
        );

        totalUpdated += updateResult.rowCount || 0;
        console.log(`  ✅ Updated ${updateResult.rowCount} meeting(s)`);

        // Get hourly forecast for next 12 hours
        const hourlyForecast = getHourlyForecast(forecast, 12);
        console.log(`  📊 Storing ${hourlyForecast.length} hourly forecasts...`);

        // Store hourly forecasts in track_weather table
        for (const hourly of hourlyForecast) {
          const hourlyDescription = getWeatherDescription(hourly.weatherSymbol);
          
          try {
            await dbClient.query(
              `INSERT INTO track_weather (
                track_name, 
                latitude, 
                longitude, 
                forecast_time, 
                temperature, 
                wind_speed, 
                wind_direction, 
                precipitation, 
                weather_symbol, 
                weather_description,
                fetched_at
              ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())
              ON CONFLICT (track_name, forecast_time) 
              DO UPDATE SET
                temperature = EXCLUDED.temperature,
                wind_speed = EXCLUDED.wind_speed,
                wind_direction = EXCLUDED.wind_direction,
                precipitation = EXCLUDED.precipitation,
                weather_symbol = EXCLUDED.weather_symbol,
                weather_description = EXCLUDED.weather_description,
                fetched_at = NOW()`,
              [
                trackName.toLowerCase(),
                coords.latitude,
                coords.longitude,
                hourly.time,
                hourly.temperature,
                hourly.windSpeed,
                hourly.windDirection,
                hourly.precipitation,
                hourly.weatherSymbol,
                hourlyDescription,
              ]
            );
            totalForecastsStored++;
          } catch (err) {
            console.warn(`    ⚠️  Error storing forecast for ${hourly.time}: ${err}`);
          }
        }

        console.log(`  ✅ Stored hourly forecasts`);

        // Rate limiting - wait 1 second between API calls to respect MET Norway's fair use policy
        // While MET Norway doesn't specify explicit rate limits, they request respectful usage
        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (error) {
        console.error(`  ❌ Error processing ${trackName}:`, error);
        errors++;
      }
    }

    // Clean up old weather data (older than 24 hours)
    console.log('\n🧹 Cleaning up old weather data...');
    const cleanupResult = await dbClient.query(
      `DELETE FROM track_weather 
       WHERE fetched_at < NOW() - INTERVAL '24 hours'`
    );
    console.log(`✅ Removed ${cleanupResult.rowCount} old forecast entries`);

    // Summary
    console.log('\n' + '='.repeat(50));
    console.log('📊 Weather Sync Summary:');
    console.log('='.repeat(50));
    console.log(`✅ Meetings updated: ${totalUpdated}`);
    console.log(`✅ Forecasts stored: ${totalForecastsStored}`);
    console.log(`❌ Errors: ${errors}`);
    console.log('='.repeat(50) + '\n');

    if (errors > 0) {
      console.log('⚠️  Some tracks had errors. Check logs above for details.');
    } else {
      console.log('✅ All weather data synced successfully!');
    }

  } catch (error) {
    console.error('❌ Fatal error during weather sync:', error);
    process.exit(1);
  } finally {
    await dbClient.end();
    console.log('\n✅ Database connection closed');
  }
}

// Run the sync
syncWeatherData().catch(error => {
  console.error('❌ Unhandled error:', error);
  process.exit(1);
});
