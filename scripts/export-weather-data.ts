import { config } from 'dotenv';
import { Client } from 'pg';
import { writeFileSync } from 'fs';
import { join } from 'path';

config({ path: '.env.local' });

interface ExportOptions {
  format: 'csv' | 'json';
  track?: string;
  startDate?: string;
  endDate?: string;
  withResults?: boolean;
  meetingId?: string;
  output?: string;
}

/**
 * Export weather data for analysis
 * 
 * Usage:
 *   npx tsx scripts/export-weather-data.ts --track=randwick --format=csv
 *   npx tsx scripts/export-weather-data.ts --start=2025-01-01 --end=2025-12-31
 *   npx tsx scripts/export-weather-data.ts --with-results --output=analysis.csv
 *   npx tsx scripts/export-weather-data.ts --meeting-id=abc123 --format=json
 */
async function exportWeatherData() {
  console.log('📊 Starting weather data export...\n');

  // Parse command line arguments
  const args = process.argv.slice(2);
  const options: ExportOptions = {
    format: 'csv',
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg.startsWith('--')) {
      const [key, value] = arg.substring(2).split('=');
      switch (key) {
        case 'format':
          options.format = value as 'csv' | 'json';
          break;
        case 'track':
          options.track = value;
          break;
        case 'start':
          options.startDate = value;
          break;
        case 'end':
          options.endDate = value;
          break;
        case 'with-results':
          options.withResults = true;
          break;
        case 'meeting-id':
          options.meetingId = value;
          break;
        case 'output':
          options.output = value;
          break;
      }
    }
  }

  console.log('Configuration:');
  console.log(`  Format: ${options.format.toUpperCase()}`);
  if (options.track) console.log(`  Track: ${options.track}`);
  if (options.startDate) console.log(`  Start Date: ${options.startDate}`);
  if (options.endDate) console.log(`  End Date: ${options.endDate}`);
  if (options.withResults) console.log(`  Include Results: Yes`);
  if (options.meetingId) console.log(`  Meeting ID: ${options.meetingId}`);
  console.log('');

  const dbClient = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 10000,
  });

  try {
    await dbClient.connect();
    console.log('✅ Connected to database\n');

    let query = '';
    let params: any[] = [];
    let paramIndex = 1;

    if (options.withResults) {
      // Export with race results joined
      query = `
        SELECT 
          rwc.*,
          r.race_name,
          r.race_distance,
          r.race_class,
          r.track_condition,
          rr.winner_name,
          rr.winner_number,
          rr.winning_time,
          rr.winning_margin,
          rr.second_place,
          rr.third_place
        FROM race_weather_conditions rwc
        LEFT JOIN pf_races r ON rwc.race_id = r.race_id
        LEFT JOIN race_results rr ON rwc.race_id = rr.race_id
        WHERE 1=1
      `;
    } else {
      // Export weather history
      query = `
        SELECT 
          track_name,
          meeting_id,
          observation_time,
          temperature,
          feels_like_temperature,
          wind_speed,
          wind_gust,
          wind_direction,
          wind_direction_compass,
          humidity,
          precipitation,
          precipitation_probability,
          weather_symbol,
          weather_description,
          visibility,
          pressure,
          cloud_cover,
          uv_index,
          created_at
        FROM track_weather_history
        WHERE 1=1
      `;
    }

    // Add filters
    if (options.track) {
      query += ` AND LOWER(track_name) = $${paramIndex}`;
      params.push(options.track.toLowerCase());
      paramIndex++;
    }

    if (options.meetingId) {
      query += ` AND meeting_id = $${paramIndex}`;
      params.push(options.meetingId);
      paramIndex++;
    }

    if (options.startDate) {
      const column = options.withResults ? 'race_start_time' : 'observation_time';
      query += ` AND ${column} >= $${paramIndex}::date`;
      params.push(options.startDate);
      paramIndex++;
    }

    if (options.endDate) {
      const column = options.withResults ? 'race_start_time' : 'observation_time';
      query += ` AND ${column} <= $${paramIndex}::date`;
      params.push(options.endDate);
      paramIndex++;
    }

    // Add order by
    if (options.withResults) {
      query += ' ORDER BY rwc.race_start_time DESC';
    } else {
      query += ' ORDER BY observation_time DESC';
    }

    console.log('🔍 Fetching data...\n');
    const result = await dbClient.query(query, params);

    console.log(`✅ Found ${result.rows.length} records\n`);

    if (result.rows.length === 0) {
      console.log('ℹ️  No data to export');
      return;
    }

    // Generate output filename
    const timestamp = new Date().toISOString().split('T')[0];
    const defaultFilename = options.withResults
      ? `weather-results-${timestamp}.${options.format}`
      : `weather-history-${timestamp}.${options.format}`;
    const outputPath = options.output || defaultFilename;

    console.log('📝 Generating export file...\n');

    if (options.format === 'csv') {
      // Generate CSV
      const headers = Object.keys(result.rows[0]);
      const csvLines = [headers.join(',')];

      for (const row of result.rows) {
        const values = headers.map((header) => {
          const value = row[header];
          if (value === null || value === undefined) return '';
          // Escape commas and quotes in values
          const stringValue = String(value);
          if (stringValue.includes(',') || stringValue.includes('"')) {
            return `"${stringValue.replace(/"/g, '""')}"`;
          }
          return stringValue;
        });
        csvLines.push(values.join(','));
      }

      const csvContent = csvLines.join('\n');
      writeFileSync(outputPath, csvContent, 'utf-8');
    } else {
      // Generate JSON
      const jsonContent = JSON.stringify(result.rows, null, 2);
      writeFileSync(outputPath, jsonContent, 'utf-8');
    }

    console.log('✅ Export completed successfully!\n');
    console.log('='.repeat(50));
    console.log('📊 Export Summary:');
    console.log('='.repeat(50));
    console.log(`📁 File: ${outputPath}`);
    console.log(`📊 Records: ${result.rows.length}`);
    console.log(`📄 Format: ${options.format.toUpperCase()}`);
    console.log('='.repeat(50) + '\n');

    console.log(`💡 Open with: ${options.format === 'csv' ? 'Excel, LibreOffice, or any CSV viewer' : 'Any text editor or JSON viewer'}\n`);
  } catch (error) {
    console.error('❌ Fatal error during export:', error);
    process.exit(1);
  } finally {
    await dbClient.end();
    console.log('✅ Database connection closed');
  }
}

// Run the export
exportWeatherData().catch((error) => {
  console.error('❌ Unhandled error:', error);
  process.exit(1);
});
