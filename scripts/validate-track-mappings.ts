#!/usr/bin/env node
/**
 * Track Name Mapping Validation Script
 * 
 * This script checks historical data in the database to identify:
 * - Track names in race_cards_ratings that don't match pf_meetings
 * - Potential mapping issues
 * - Suggestions for corrections
 * 
 * Usage:
 *   npx tsx scripts/validate-track-mappings.ts [--fix]
 * 
 * Options:
 *   --fix    Apply corrections to the database (requires confirmation)
 *   --days   Number of days to analyze (default: 30)
 * 
 * Examples:
 *   npx tsx scripts/validate-track-mappings.ts             # Analyze only
 *   npx tsx scripts/validate-track-mappings.ts --fix       # Analyze and fix
 *   npx tsx scripts/validate-track-mappings.ts --days 90   # Analyze 90 days
 */

import { Client } from 'pg';
import { format, subDays } from 'date-fns';
import { createInterface } from 'readline';
import {
  convertTTRToPuntingForm,
  convertPuntingFormToTTR,
  getAllPossibleMatches
} from '../lib/utils/track-name-standardizer';
import {
  PUNTINGFORM_TO_TTR,
  TTR_TO_PUNTINGFORM
} from '../lib/utils/track-name-mappings';

interface TrackMismatch {
  ttrTrackName: string;
  recordCount: number;
  possibleMatches: string[];
  hasMapping: boolean;
}

async function promptConfirmation(message: string): Promise<boolean> {
  const rl = createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    rl.question(`${message} (yes/no): `, (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === 'yes' || answer.toLowerCase() === 'y');
    });
  });
}

async function analyzeTrackMappings(days: number = 30): Promise<TrackMismatch[]> {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();

    const startDate = format(subDays(new Date(), days), 'yyyy-MM-dd');
    
    console.log(`\n📊 Analyzing track mappings for last ${days} days (from ${startDate})...\n`);

    // Get all track names from race_cards_ratings with their join success
    const query = `
      SELECT 
        rcr.track as ttr_track_name,
        COUNT(DISTINCT rcr.id) as record_count,
        COUNT(DISTINCT m.meeting_id) as matched_meetings,
        COUNT(DISTINCT CASE WHEN r.finishing_position IS NOT NULL THEN rcr.id END) as records_with_results
      FROM race_cards_ratings rcr
      LEFT JOIN pf_meetings m ON rcr.race_date = m.meeting_date
        AND rcr.track = m.track_name
      LEFT JOIN pf_races ra ON ra.meeting_id = m.meeting_id 
        AND rcr.race_number = ra.race_number
      LEFT JOIN pf_results r ON r.race_id = ra.race_id
        AND LOWER(TRIM(rcr.horse_name)) = LOWER(TRIM(r.horse_name))
      WHERE rcr.race_date >= $1
      GROUP BY rcr.track
      ORDER BY record_count DESC
    `;

    const result = await client.query(query, [startDate]);
    const mismatches: TrackMismatch[] = [];

    console.log(`Found ${result.rows.length} unique track names in TTR data\n`);

    for (const row of result.rows) {
      const ttrTrackName = row.ttr_track_name;
      const recordCount = parseInt(row.record_count);
      const matchedMeetings = parseInt(row.matched_meetings);
      const recordsWithResults = parseInt(row.records_with_results);
      
      // Get possible PuntingForm matches
      const possibleMatches = convertTTRToPuntingForm(ttrTrackName);
      
      // Check if mapping exists
      const key = ttrTrackName.toLowerCase().trim();
      const hasMapping = !!TTR_TO_PUNTINGFORM[key];
      
      // Calculate match rate
      const matchRate = matchedMeetings > 0 ? (recordsWithResults / recordCount) * 100 : 0;
      
      console.log(`Track: ${ttrTrackName}`);
      console.log(`  Records: ${recordCount}`);
      console.log(`  Matched meetings: ${matchedMeetings}`);
      console.log(`  Records with results: ${recordsWithResults} (${matchRate.toFixed(1)}%)`);
      console.log(`  Has mapping: ${hasMapping ? '✅' : '❌'}`);
      console.log(`  Possible matches: ${possibleMatches.join(', ')}`);
      
      // Identify potential issues
      if (!hasMapping) {
        console.log(`  ⚠️ WARNING: No mapping exists for this track`);
        mismatches.push({
          ttrTrackName,
          recordCount,
          possibleMatches,
          hasMapping: false
        });
      } else if (matchedMeetings === 0 && recordCount > 0) {
        console.log(`  ⚠️ WARNING: Track has ${recordCount} records but no matched meetings`);
        mismatches.push({
          ttrTrackName,
          recordCount,
          possibleMatches,
          hasMapping: true
        });
      } else if (matchRate < 50 && recordCount > 10) {
        console.log(`  ⚠️ WARNING: Low match rate (${matchRate.toFixed(1)}%) - possible naming issue`);
        mismatches.push({
          ttrTrackName,
          recordCount,
          possibleMatches,
          hasMapping
        });
      }
      
      console.log();
    }

    return mismatches;

  } finally {
    await client.end();
  }
}

async function generateMappingSuggestions(mismatches: TrackMismatch[]): Promise<void> {
  if (mismatches.length === 0) {
    console.log('✅ No mapping issues found!\n');
    return;
  }

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('💡 MAPPING SUGGESTIONS');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  console.log('Add these mappings to lib/utils/track-name-mappings.ts:\n');

  // TTR_TO_PUNTINGFORM suggestions
  const ttrToPF: string[] = [];
  const pfToTTR: string[] = [];

  for (const mismatch of mismatches) {
    if (!mismatch.hasMapping) {
      const key = mismatch.ttrTrackName.toLowerCase().trim();
      const matches = mismatch.possibleMatches;
      
      ttrToPF.push(`  '${key}': [${matches.map(m => `'${m}'`).join(', ')}],`);
      
      for (const match of matches) {
        const pfKey = match.toLowerCase().trim();
        pfToTTR.push(`  '${pfKey}': '${mismatch.ttrTrackName}',`);
      }
    }
  }

  if (ttrToPF.length > 0) {
    console.log('// Add to TTR_TO_PUNTINGFORM:');
    ttrToPF.forEach(line => console.log(line));
    console.log();
  }

  if (pfToTTR.length > 0) {
    console.log('// Add to PUNTINGFORM_TO_TTR:');
    pfToTTR.forEach(line => console.log(line));
    console.log();
  }
}

async function main() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🔍 Track Name Mapping Validation');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  // Parse command line arguments
  const args = process.argv.slice(2);
  const shouldFix = args.includes('--fix');
  const daysIndex = args.indexOf('--days');
  const days = daysIndex !== -1 ? parseInt(args[daysIndex + 1]) : 30;

  if (isNaN(days) || days < 1 || daysIndex !== -1 && !args[daysIndex + 1]) {
    console.error('❌ Invalid --days value.');
    console.error('   Usage: npx tsx scripts/validate-track-mappings.ts --days <number>');
    console.error('   Example: npx tsx scripts/validate-track-mappings.ts --days 90');
    console.error('   The number must be a positive integer.');
    process.exit(1);
  }

  // Analyze track mappings
  const mismatches = await analyzeTrackMappings(days);

  // Generate suggestions
  await generateMappingSuggestions(mismatches);

  // Summary
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📈 SUMMARY');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const totalMismatches = mismatches.length;
  const missingMappings = mismatches.filter(m => !m.hasMapping).length;
  const lowMatchRate = mismatches.filter(m => m.hasMapping).length;

  console.log(`Total issues found: ${totalMismatches}`);
  console.log(`Missing mappings: ${missingMappings}`);
  console.log(`Low match rates: ${lowMatchRate}\n`);

  if (totalMismatches > 0) {
    console.log('⚠️ Action required: Update track name mappings as suggested above');
    
    if (shouldFix) {
      console.log('\n⚠️ --fix flag not implemented yet');
      console.log('   Please manually update lib/utils/track-name-mappings.ts');
      console.log('   Then run scripts/standardize-track-names.ts to update the database');
    } else {
      console.log('\n💡 To see fix suggestions, run with --fix flag');
    }
    
    process.exit(1);
  } else {
    console.log('✅ All track mappings are valid!');
    process.exit(0);
  }
}

// Run the script
main().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
