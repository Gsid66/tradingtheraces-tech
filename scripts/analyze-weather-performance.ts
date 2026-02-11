import { config } from 'dotenv';
import { Client } from 'pg';

config({ path: '.env.local' });

interface AnalysisOptions {
  metric?: string;
  track?: string;
  jockey?: string;
  condition?: string;
  report?: string;
}

interface PerformanceData {
  category: string;
  avgTime: number;
  avgWinMargin: number;
  raceCount: number;
  stdDev: number;
  winRate?: number;
}

/**
 * Weather Performance Analyzer
 * 
 * Analyzes the impact of weather conditions on race performance
 * 
 * Usage:
 *   npx tsx scripts/analyze-weather-performance.ts --metric=wind --track=all
 *   npx tsx scripts/analyze-weather-performance.ts --jockey="Ryan Moore" --condition=rain
 *   npx tsx scripts/analyze-weather-performance.ts --track=randwick --report=full
 */
async function analyzeWeatherPerformance() {
  console.log('📊 Starting weather performance analysis...\n');

  // Parse command line arguments
  const args = process.argv.slice(2);
  const options: AnalysisOptions = {};

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg.startsWith('--')) {
      const [key, value] = arg.substring(2).split('=');
      switch (key) {
        case 'metric':
          options.metric = value;
          break;
        case 'track':
          options.track = value;
          break;
        case 'jockey':
          options.jockey = value;
          break;
        case 'condition':
          options.condition = value;
          break;
        case 'report':
          options.report = value;
          break;
      }
    }
  }

  const dbClient = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 10000,
  });

  try {
    await dbClient.connect();
    console.log('✅ Connected to database\n');

    if (options.metric) {
      await analyzeByMetric(dbClient, options.metric, options.track);
    } else if (options.jockey && options.condition) {
      await analyzeJockeyByCondition(dbClient, options.jockey, options.condition);
    } else if (options.track && options.report === 'full') {
      await fullTrackReport(dbClient, options.track);
    } else {
      await showOverview(dbClient);
    }
  } catch (error) {
    console.error('❌ Fatal error during analysis:', error);
    process.exit(1);
  } finally {
    await dbClient.end();
    console.log('\n✅ Database connection closed');
  }
}

async function analyzeByMetric(client: Client, metric: string, track?: string) {
  console.log(`📈 Analyzing ${metric} impact${track ? ` for ${track}` : ' across all tracks'}...\n`);

  let query = '';
  const params: any[] = [];
  let paramIndex = 1;

  switch (metric.toLowerCase()) {
    case 'wind':
      query = `
        SELECT 
          CASE 
            WHEN rwc.wind_speed * 3.6 < 15 THEN 'Light (<15 km/h)'
            WHEN rwc.wind_speed * 3.6 < 30 THEN 'Moderate (15-30 km/h)'
            WHEN rwc.wind_speed * 3.6 < 45 THEN 'Strong (30-45 km/h)'
            ELSE 'Severe (>45 km/h)'
          END as category,
          AVG(rr.winning_time) as avg_time,
          AVG(rr.winning_margin) as avg_margin,
          COUNT(*) as race_count,
          STDDEV(rr.winning_time) as std_dev
        FROM race_weather_conditions rwc
        JOIN race_results rr ON rwc.race_id = rr.race_id
        WHERE rr.winning_time IS NOT NULL
      `;
      break;

    case 'temperature':
    case 'temp':
      query = `
        SELECT 
          CASE 
            WHEN rwc.temperature < 10 THEN 'Cold (<10°C)'
            WHEN rwc.temperature < 20 THEN 'Cool (10-20°C)'
            WHEN rwc.temperature < 30 THEN 'Warm (20-30°C)'
            ELSE 'Hot (>30°C)'
          END as category,
          AVG(rr.winning_time) as avg_time,
          AVG(rr.winning_margin) as avg_margin,
          COUNT(*) as race_count,
          STDDEV(rr.winning_time) as std_dev
        FROM race_weather_conditions rwc
        JOIN race_results rr ON rwc.race_id = rr.race_id
        WHERE rr.winning_time IS NOT NULL
      `;
      break;

    case 'humidity':
      query = `
        SELECT 
          CASE 
            WHEN rwc.humidity < 40 THEN 'Low (<40%)'
            WHEN rwc.humidity < 60 THEN 'Moderate (40-60%)'
            WHEN rwc.humidity < 80 THEN 'High (60-80%)'
            ELSE 'Very High (>80%)'
          END as category,
          AVG(rr.winning_time) as avg_time,
          AVG(rr.winning_margin) as avg_margin,
          COUNT(*) as race_count,
          STDDEV(rr.winning_time) as std_dev
        FROM race_weather_conditions rwc
        JOIN race_results rr ON rwc.race_id = rr.race_id
        WHERE rr.winning_time IS NOT NULL AND rwc.humidity IS NOT NULL
      `;
      break;

    default:
      console.log(`❌ Unknown metric: ${metric}`);
      console.log('Available metrics: wind, temperature, humidity');
      return;
  }

  if (track && track !== 'all') {
    query += ` AND LOWER(rwc.track_name) = $${paramIndex}`;
    params.push(track.toLowerCase());
    paramIndex++;
  }

  query += ' GROUP BY category ORDER BY category';

  const result = await client.query(query, params);

  if (result.rows.length === 0) {
    console.log('ℹ️  No data available for analysis');
    return;
  }

  console.log('='.repeat(70));
  console.log(`${metric.toUpperCase()} IMPACT ANALYSIS`);
  console.log('='.repeat(70));
  console.log(
    sprintf(
      '%-25s %12s %12s %10s %10s',
      'Category',
      'Avg Time',
      'Avg Margin',
      'Races',
      'Std Dev'
    )
  );
  console.log('-'.repeat(70));

  for (const row of result.rows) {
    console.log(
      sprintf(
        '%-25s %12.2f %12.2f %10d %10.2f',
        row.category,
        row.avg_time || 0,
        row.avg_margin || 0,
        row.race_count,
        row.std_dev || 0
      )
    );
  }

  console.log('='.repeat(70));
  console.log('\n💡 Insights:');
  
  // Generate insights
  const avgTimes = result.rows.map(r => r.avg_time).filter(t => t !== null);
  const maxTime = Math.max(...avgTimes);
  const minTime = Math.min(...avgTimes);
  const timeDiff = maxTime - minTime;
  
  console.log(`  • Time variation: ${timeDiff.toFixed(2)}s across ${metric} conditions`);
  console.log(`  • Sample size: ${result.rows.reduce((sum, r) => sum + parseInt(r.race_count), 0)} races`);
  
  if (timeDiff > 1) {
    console.log(`  • Significant ${metric} impact detected (>${timeDiff.toFixed(1)}s variation)`);
  } else {
    console.log(`  • Minimal ${metric} impact (<${timeDiff.toFixed(1)}s variation)`);
  }
}

async function analyzeJockeyByCondition(client: Client, jockey: string, condition: string) {
  console.log(`🏇 Analyzing ${jockey}'s performance in ${condition} conditions...\n`);

  let weatherFilter = '';
  switch (condition.toLowerCase()) {
    case 'rain':
      weatherFilter = "rwc.weather_condition ILIKE '%rain%'";
      break;
    case 'wind':
      weatherFilter = 'rwc.wind_speed * 3.6 > 30';
      break;
    case 'hot':
      weatherFilter = 'rwc.temperature > 30';
      break;
    case 'cold':
      weatherFilter = 'rwc.temperature < 10';
      break;
    default:
      weatherFilter = `rwc.weather_condition ILIKE '%${condition}%'`;
  }

  const query = `
    SELECT 
      COUNT(*) FILTER (WHERE rr.winner_name ILIKE $1) as wins,
      COUNT(*) as rides,
      AVG(rr.winning_time) FILTER (WHERE rr.winner_name ILIKE $1) as avg_win_time,
      AVG(rr.winning_margin) FILTER (WHERE rr.winner_name ILIKE $1) as avg_win_margin
    FROM race_weather_conditions rwc
    JOIN race_results rr ON rwc.race_id = rr.race_id
    WHERE ${weatherFilter}
      AND (rr.winner_name ILIKE $1 
           OR rr.second_place ILIKE $1 
           OR rr.third_place ILIKE $1)
  `;

  const result = await client.query(query, [`%${jockey}%`]);
  
  if (result.rows.length === 0 || result.rows[0].rides === '0') {
    console.log(`ℹ️  No data found for ${jockey} in ${condition} conditions`);
    return;
  }

  const data = result.rows[0];
  const winRate = (parseInt(data.wins) / parseInt(data.rides)) * 100;

  console.log('='.repeat(50));
  console.log(`${jockey.toUpperCase()} - ${condition.toUpperCase()} CONDITIONS`);
  console.log('='.repeat(50));
  console.log(`Rides: ${data.rides}`);
  console.log(`Wins: ${data.wins}`);
  console.log(`Win Rate: ${winRate.toFixed(2)}%`);
  if (data.avg_win_time) {
    console.log(`Avg Win Time: ${parseFloat(data.avg_win_time).toFixed(2)}s`);
  }
  if (data.avg_win_margin) {
    console.log(`Avg Win Margin: ${parseFloat(data.avg_win_margin).toFixed(2)}L`);
  }
  console.log('='.repeat(50));
}

async function fullTrackReport(client: Client, track: string) {
  console.log(`📋 Full Weather Report for ${track}...\n`);

  const params = [track === 'all' ? '%' : track.toLowerCase()];
  
  // Overall stats
  const statsQuery = `
    SELECT 
      COUNT(DISTINCT rwc.race_id) as total_races,
      AVG(rwc.temperature) as avg_temp,
      AVG(rwc.wind_speed * 3.6) as avg_wind_kmh,
      AVG(rwc.humidity) as avg_humidity,
      COUNT(*) FILTER (WHERE rwc.precipitation_last_hour > 0) as rainy_races
    FROM race_weather_conditions rwc
    WHERE rwc.track_name LIKE $1
  `;
  
  const statsResult = await client.query(statsQuery, params);
  const stats = statsResult.rows[0];

  console.log('='.repeat(50));
  console.log('TRACK WEATHER STATISTICS');
  console.log('='.repeat(50));
  console.log(`Total Races Analyzed: ${stats.total_races}`);
  console.log(`Average Temperature: ${parseFloat(stats.avg_temp).toFixed(1)}°C`);
  console.log(`Average Wind Speed: ${parseFloat(stats.avg_wind_kmh).toFixed(1)} km/h`);
  console.log(`Average Humidity: ${parseFloat(stats.avg_humidity).toFixed(0)}%`);
  console.log(`Rainy Races: ${stats.rainy_races} (${((parseInt(stats.rainy_races) / parseInt(stats.total_races)) * 100).toFixed(1)}%)`);
  console.log('='.repeat(50));

  // Weather impact analysis
  console.log('\n📊 WEATHER IMPACT SCORES:\n');
  const impactQuery = `
    SELECT 
      weather_impact_score,
      COUNT(*) as races
    FROM race_weather_conditions
    WHERE track_name LIKE $1
    GROUP BY weather_impact_score
    ORDER BY weather_impact_score
  `;
  
  const impactResult = await client.query(impactQuery, params);
  
  for (const row of impactResult.rows) {
    const bar = '█'.repeat(Math.min(50, row.races));
    console.log(`Score ${row.weather_impact_score}/10: ${bar} (${row.races} races)`);
  }

  console.log('\n');
}

async function showOverview(client: Client) {
  console.log('📊 WEATHER ANALYSIS OVERVIEW\n');
  
  console.log('Available Commands:');
  console.log('  --metric=wind [--track=name]      Analyze wind impact');
  console.log('  --metric=temperature [--track=name]  Analyze temperature impact');
  console.log('  --metric=humidity [--track=name]     Analyze humidity impact');
  console.log('  --jockey="Name" --condition=rain  Jockey performance by condition');
  console.log('  --track=name --report=full        Full track weather report');
  console.log('\nExamples:');
  console.log('  npx tsx scripts/analyze-weather-performance.ts --metric=wind --track=randwick');
  console.log('  npx tsx scripts/analyze-weather-performance.ts --jockey="Ryan Moore" --condition=rain');
  console.log('  npx tsx scripts/analyze-weather-performance.ts --track=flemington --report=full\n');
}

// Helper function for formatted output
function sprintf(format: string, ...args: any[]): string {
  let result = format;
  for (const arg of args) {
    result = result.replace(/%[-]?[\d.]*[sdf]/, String(arg));
  }
  return result;
}

// Run the analysis
analyzeWeatherPerformance().catch((error) => {
  console.error('❌ Unhandled error:', error);
  process.exit(1);
});
