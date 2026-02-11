import { config } from 'dotenv';
import { Client } from 'pg';

config({ path: '.env.local' });

interface CorrelationResult {
  metric: string;
  target: string;
  pearsonR: number;
  sampleSize: number;
  pValue?: number;
  significant: boolean;
}

/**
 * Calculate Weather Correlations
 * 
 * Calculates Pearson correlation coefficients between weather metrics and race outcomes
 * 
 * Usage:
 *   npx tsx scripts/calculate-weather-correlations.ts
 *   npx tsx scripts/calculate-weather-correlations.ts --track=randwick
 *   npx tsx scripts/calculate-weather-correlations.ts --output=correlations.json
 */
async function calculateWeatherCorrelations() {
  console.log('📊 Calculating weather correlations...\n');

  // Parse command line arguments
  const args = process.argv.slice(2);
  let track: string | null = null;
  let outputFile: string | null = null;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg.startsWith('--')) {
      const [key, value] = arg.substring(2).split('=');
      if (key === 'track') track = value;
      if (key === 'output') outputFile = value;
    }
  }

  if (track) {
    console.log(`Track: ${track}`);
  } else {
    console.log('Track: All tracks');
  }
  console.log('');

  const dbClient = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 10000,
  });

  try {
    await dbClient.connect();
    console.log('✅ Connected to database\n');

    const correlations: CorrelationResult[] = [];

    // Weather metrics to analyze
    const weatherMetrics = [
      { name: 'Temperature', column: 'temperature' },
      { name: 'Wind Speed', column: 'wind_speed' },
      { name: 'Humidity', column: 'humidity' },
      { name: 'Pressure', column: 'pressure' },
      { name: 'Cloud Cover', column: 'cloud_cover' },
      { name: 'Weather Impact Score', column: 'weather_impact_score' },
    ];

    // Race outcome targets
    const outcomeTargets = [
      { name: 'Winning Time', column: 'winning_time' },
      { name: 'Winning Margin', column: 'winning_margin' },
    ];

    console.log('🔬 Calculating correlations...\n');

    for (const metric of weatherMetrics) {
      for (const target of outcomeTargets) {
        const correlation = await calculatePearsonCorrelation(
          dbClient,
          metric.column,
          target.column,
          track
        );
        
        if (correlation) {
          correlations.push({
            metric: metric.name,
            target: target.name,
            pearsonR: correlation.r,
            sampleSize: correlation.n,
            significant: Math.abs(correlation.r) > 0.3 && correlation.n > 30,
          });
        }
      }
    }

    // Display results
    console.log('='.repeat(80));
    console.log('WEATHER CORRELATION MATRIX');
    console.log('='.repeat(80));
    console.log(
      sprintf('%-25s %-20s %12s %12s %15s', 'Weather Metric', 'Target', 'Correlation', 'Sample Size', 'Significant?')
    );
    console.log('-'.repeat(80));

    // Sort by absolute correlation strength
    correlations.sort((a, b) => Math.abs(b.pearsonR) - Math.abs(a.pearsonR));

    for (const corr of correlations) {
      const strength = getCorrelationStrength(corr.pearsonR);
      const significant = corr.significant ? '✓' : ' ';
      console.log(
        sprintf(
          '%-25s %-20s %12.3f %12d %10s %s',
          corr.metric,
          corr.target,
          corr.pearsonR,
          corr.sampleSize,
          strength,
          significant
        )
      );
    }

    console.log('='.repeat(80));

    // Interpretation guide
    console.log('\n📚 Interpretation Guide:');
    console.log('  Correlation Strength:');
    console.log('    0.0 - 0.3  = Weak');
    console.log('    0.3 - 0.5  = Moderate');
    console.log('    0.5 - 0.7  = Strong');
    console.log('    0.7 - 1.0  = Very Strong');
    console.log('\n  Positive correlation: As metric increases, target increases');
    console.log('  Negative correlation: As metric increases, target decreases');
    console.log('  ✓ = Statistically significant (|r| > 0.3, n > 30)\n');

    // Insights
    console.log('💡 Key Insights:\n');
    const significantCorrs = correlations.filter(c => c.significant);
    
    if (significantCorrs.length === 0) {
      console.log('  • No statistically significant correlations found');
      console.log('  • May need more data or weather has minimal impact');
    } else {
      for (const corr of significantCorrs.slice(0, 5)) {
        const direction = corr.pearsonR > 0 ? 'increases' : 'decreases';
        console.log(
          `  • ${corr.metric} ${direction} ${corr.target} (r=${corr.pearsonR.toFixed(3)})`
        );
      }
    }

    // Track-specific analysis
    if (!track) {
      console.log('\n💡 Tip: Run with --track=name for track-specific correlations\n');
    }

    // Save to file if requested
    if (outputFile) {
      const fs = require('fs');
      const output = {
        timestamp: new Date().toISOString(),
        track: track || 'all',
        correlations,
      };
      fs.writeFileSync(outputFile, JSON.stringify(output, null, 2));
      console.log(`\n✅ Correlations saved to ${outputFile}\n`);
    }

  } catch (error) {
    console.error('❌ Fatal error during correlation calculation:', error);
    process.exit(1);
  } finally {
    await dbClient.end();
    console.log('✅ Database connection closed');
  }
}

/**
 * Calculate Pearson correlation coefficient between two variables
 */
async function calculatePearsonCorrelation(
  client: Client,
  weatherColumn: string,
  outcomeColumn: string,
  track: string | null
): Promise<{ r: number; n: number } | null> {
  try {
    let query = `
      SELECT 
        COUNT(*) as n,
        AVG(rwc.${weatherColumn}) as mean_x,
        AVG(rr.${outcomeColumn}) as mean_y,
        STDDEV_POP(rwc.${weatherColumn}) as std_x,
        STDDEV_POP(rr.${outcomeColumn}) as std_y,
        SUM((rwc.${weatherColumn} - (SELECT AVG(rwc2.${weatherColumn}) FROM race_weather_conditions rwc2 JOIN race_results rr2 ON rwc2.race_id = rr2.race_id WHERE rr2.${outcomeColumn} IS NOT NULL AND rwc2.${weatherColumn} IS NOT NULL ${track ? `AND LOWER(rwc2.track_name) = '${track.toLowerCase()}'` : ''})) * 
            (rr.${outcomeColumn} - (SELECT AVG(rr2.${outcomeColumn}) FROM race_weather_conditions rwc2 JOIN race_results rr2 ON rwc2.race_id = rr2.race_id WHERE rr2.${outcomeColumn} IS NOT NULL AND rwc2.${weatherColumn} IS NOT NULL ${track ? `AND LOWER(rwc2.track_name) = '${track.toLowerCase()}'` : ''}))) as covariance
      FROM race_weather_conditions rwc
      JOIN race_results rr ON rwc.race_id = rr.race_id
      WHERE rr.${outcomeColumn} IS NOT NULL
        AND rwc.${weatherColumn} IS NOT NULL
    `;

    if (track) {
      query += ` AND LOWER(rwc.track_name) = '${track.toLowerCase()}'`;
    }

    const result = await client.query(query);
    
    if (result.rows.length === 0 || result.rows[0].n < 10) {
      return null;
    }

    const row = result.rows[0];
    const n = parseInt(row.n);
    const stdX = parseFloat(row.std_x);
    const stdY = parseFloat(row.std_y);
    const covariance = parseFloat(row.covariance);

    // Calculate Pearson r
    if (stdX === 0 || stdY === 0) {
      return null;
    }

    const r = covariance / (n * stdX * stdY);

    return { r, n };
  } catch (error) {
    console.warn(`⚠️  Error calculating correlation for ${weatherColumn} vs ${outcomeColumn}:`, error);
    return null;
  }
}

/**
 * Get correlation strength description
 */
function getCorrelationStrength(r: number): string {
  const abs = Math.abs(r);
  if (abs < 0.3) return 'Weak';
  if (abs < 0.5) return 'Moderate';
  if (abs < 0.7) return 'Strong';
  return 'Very Strong';
}

/**
 * Helper function for formatted output
 */
function sprintf(format: string, ...args: any[]): string {
  let result = format;
  for (const arg of args) {
    result = result.replace(/%[-]?[\d.]*[sdf]/, String(arg));
  }
  return result;
}

// Run the calculation
calculateWeatherCorrelations().catch((error) => {
  console.error('❌ Unhandled error:', error);
  process.exit(1);
});
