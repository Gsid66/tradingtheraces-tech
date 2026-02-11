import { config } from 'dotenv';
import { Client } from 'pg';

config({ path: '.env.local' });

/**
 * Weather Data Cleanup Script
 * 
 * Implements intelligent data retention strategy:
 * - track_weather: Keep last 48 hours only (rolling cache)
 * - track_weather_history: 
 *   - Last 30 days: Keep all readings
 *   - 31-365 days: Keep hourly aggregates (future enhancement)
 *   - 1-5 years: Keep daily summaries (future enhancement)
 * - race_weather_conditions: NEVER DELETE (permanent record)
 * 
 * Run daily via cron or GitHub Actions
 */
async function cleanupWeatherData(dryRun: boolean = false) {
  console.log(`🧹 Starting weather data cleanup${dryRun ? ' (DRY RUN)' : ''}...\n`);

  const dbClient = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 10000,
  });

  try {
    await dbClient.connect();
    console.log('✅ Connected to database\n');

    let totalDeleted = 0;

    // 1. Clean up track_weather table (rolling 48-hour cache)
    console.log('🗑️  Cleaning track_weather table (rolling 48h cache)...');
    if (dryRun) {
      const countResult = await dbClient.query(
        `SELECT COUNT(*) FROM track_weather WHERE fetched_at < NOW() - INTERVAL '48 hours'`
      );
      console.log(`  [DRY RUN] Would delete ${countResult.rows[0].count} old forecast entries\n`);
    } else {
      const trackWeatherResult = await dbClient.query(
        `DELETE FROM track_weather WHERE fetched_at < NOW() - INTERVAL '48 hours'`
      );
      const trackWeatherDeleted = trackWeatherResult.rowCount || 0;
      console.log(`  ✅ Deleted ${trackWeatherDeleted} old forecast entries\n`);
      totalDeleted += trackWeatherDeleted;
    }

    // 2. Clean up track_weather_history (keep last 90 days of detailed data)
    // Note: In production, you might want to aggregate older data instead of deleting
    console.log('🗑️  Cleaning track_weather_history table (keep last 90 days)...');
    if (dryRun) {
      const countResult = await dbClient.query(
        `SELECT COUNT(*) FROM track_weather_history WHERE created_at < NOW() - INTERVAL '90 days'`
      );
      console.log(`  [DRY RUN] Would delete ${countResult.rows[0].count} old history entries\n`);
    } else {
      const historyResult = await dbClient.query(
        `DELETE FROM track_weather_history WHERE created_at < NOW() - INTERVAL '90 days'`
      );
      const historyDeleted = historyResult.rowCount || 0;
      console.log(`  ✅ Deleted ${historyDeleted} old history entries\n`);
      totalDeleted += historyDeleted;
    }

    // 3. Report on race_weather_conditions (NEVER delete, just report stats)
    console.log('📊 Race weather conditions statistics:');
    const raceStatsResult = await dbClient.query(
      `SELECT 
         COUNT(*) as total_races,
         COUNT(*) FILTER (WHERE recorded_at >= NOW() - INTERVAL '30 days') as last_30_days,
         COUNT(*) FILTER (WHERE recorded_at >= NOW() - INTERVAL '7 days') as last_7_days,
         MIN(race_start_time) as earliest_race,
         MAX(race_start_time) as latest_race
       FROM race_weather_conditions`
    );
    
    if (raceStatsResult.rows.length > 0) {
      const stats = raceStatsResult.rows[0];
      console.log(`  📈 Total races with weather: ${stats.total_races}`);
      console.log(`  📅 Last 7 days: ${stats.last_7_days}`);
      console.log(`  📅 Last 30 days: ${stats.last_30_days}`);
      if (stats.earliest_race) {
        console.log(`  📅 Earliest race: ${new Date(stats.earliest_race).toLocaleDateString()}`);
      }
      if (stats.latest_race) {
        console.log(`  📅 Latest race: ${new Date(stats.latest_race).toLocaleDateString()}`);
      }
    }
    console.log('  ℹ️  Race weather conditions are permanently retained\n');

    // 4. Vacuum analyze tables for optimal performance
    if (!dryRun) {
      console.log('🔧 Optimizing database tables...');
      await dbClient.query('VACUUM ANALYZE track_weather');
      console.log('  ✅ Optimized track_weather');
      await dbClient.query('VACUUM ANALYZE track_weather_history');
      console.log('  ✅ Optimized track_weather_history');
      await dbClient.query('VACUUM ANALYZE race_weather_conditions');
      console.log('  ✅ Optimized race_weather_conditions\n');
    } else {
      console.log('  [DRY RUN] Would optimize database tables\n');
    }

    // Summary
    console.log('='.repeat(50));
    console.log('📊 Cleanup Summary:');
    console.log('='.repeat(50));
    console.log(`✅ Total entries deleted: ${totalDeleted}`);
    console.log(`📦 Space freed: Database optimized`);
    console.log(`🔒 Race conditions: Permanently retained`);
    console.log('='.repeat(50) + '\n');

    console.log('✅ Weather data cleanup completed successfully!');
  } catch (error) {
    console.error('❌ Fatal error during cleanup:', error);
    process.exit(1);
  } finally {
    await dbClient.end();
    console.log('\n✅ Database connection closed');
  }
}

// Allow running with --dry-run flag to preview without deleting
const isDryRun = process.argv.includes('--dry-run');

if (isDryRun) {
  console.log('🔍 DRY RUN MODE - No data will be deleted\n');
}

// Run the cleanup
cleanupWeatherData(isDryRun).catch((error) => {
  console.error('❌ Unhandled error:', error);
  process.exit(1);
});
