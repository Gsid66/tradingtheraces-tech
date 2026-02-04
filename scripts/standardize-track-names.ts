/**
 * Database Migration Script: Standardize Track Names
 * 
 * This script updates all track names in the race_cards_ratings table
 * to match the canonical track names used by PuntingForm API.
 * 
 * Usage:
 *   npx tsx scripts/standardize-track-names.ts
 * 
 * Features:
 * - Fetches all distinct track names from race_cards_ratings
 * - Maps them to canonical PuntingForm track names
 * - Updates all records in a transaction (safe rollback on error)
 * - Logs all transformations
 * - Shows statistics
 * - Idempotent (can be run multiple times safely)
 */

import { Client } from 'pg';
import * as dotenv from 'dotenv';
import { standardizeTrackName, validateTrackName } from '../lib/utils/track-name-standardizer';

// Load environment variables
dotenv.config();

interface TrackNameCount {
  track: string;
  count: number;
}

interface TransformResult {
  original: string;
  standardized: string;
  recordCount: number;
  changed: boolean;
}

/**
 * Fetch all distinct track names from race_cards_ratings
 */
async function fetchDistinctTrackNames(client: Client): Promise<TrackNameCount[]> {
  const query = `
    SELECT 
      track,
      COUNT(*) as count
    FROM race_cards_ratings
    GROUP BY track
    ORDER BY count DESC
  `;
  
  const result = await client.query(query);
  return result.rows;
}

/**
 * Build transformation map
 */
async function buildTransformationMap(
  trackNames: TrackNameCount[]
): Promise<Map<string, { standardized: string; count: number }>> {
  const transformMap = new Map<string, { standardized: string; count: number }>();
  
  console.log('\n🔍 Building transformation map...\n');
  
  for (const { track, count } of trackNames) {
    try {
      // Get standardized name
      const standardized = await standardizeTrackName(track, { forceRefresh: false });
      
      // Validate the result
      const validation = await validateTrackName(standardized);
      
      transformMap.set(track, { standardized, count: parseInt(count.toString()) });
      
      if (track !== standardized) {
        console.log(`  ✓ "${track}" -> "${standardized}" (${count} records)`);
      } else {
        console.log(`  ○ "${track}" (already standardized, ${count} records)`);
      }
      
      if (validation.suggestion && !validation.valid) {
        console.warn(`    ⚠️ Warning: "${standardized}" not found in current meetings. Suggestion: "${validation.suggestion}"`);
      }
    } catch (error) {
      console.error(`  ✗ Failed to standardize "${track}":`, error);
      // Keep original if standardization fails
      transformMap.set(track, { standardized: track, count: parseInt(count.toString()) });
    }
  }
  
  return transformMap;
}

/**
 * Update track names in the database
 */
async function updateTrackNames(
  client: Client,
  transformMap: Map<string, { standardized: string; count: number }>
): Promise<TransformResult[]> {
  const results: TransformResult[] = [];
  
  console.log('\n📝 Updating track names in database...\n');
  
  // Begin transaction
  await client.query('BEGIN');
  
  try {
    for (const [original, { standardized, count }] of transformMap) {
      const changed = original !== standardized;
      
      if (changed) {
        // Update all records with this track name
        const updateQuery = `
          UPDATE race_cards_ratings
          SET track = $1
          WHERE track = $2
        `;
        
        const result = await client.query(updateQuery, [standardized, original]);
        
        console.log(`  ✓ Updated "${original}" -> "${standardized}" (${result.rowCount} records)`);
        
        results.push({
          original,
          standardized,
          recordCount: result.rowCount || 0,
          changed: true,
        });
      } else {
        console.log(`  ○ No change needed for "${original}" (${count} records)`);
        
        results.push({
          original,
          standardized,
          recordCount: count,
          changed: false,
        });
      }
    }
    
    // Commit transaction
    await client.query('COMMIT');
    console.log('\n✅ Transaction committed successfully\n');
  } catch (error) {
    // Rollback on error
    await client.query('ROLLBACK');
    console.error('\n❌ Transaction rolled back due to error:', error);
    throw error;
  }
  
  return results;
}

/**
 * Print statistics
 */
function printStatistics(results: TransformResult[]): void {
  console.log('━'.repeat(80));
  console.log('📊 MIGRATION STATISTICS');
  console.log('━'.repeat(80));
  console.log();
  
  const totalTracks = results.length;
  const changedTracks = results.filter(r => r.changed).length;
  const unchangedTracks = totalTracks - changedTracks;
  const totalRecords = results.reduce((sum, r) => sum + r.recordCount, 0);
  const changedRecords = results.filter(r => r.changed).reduce((sum, r) => sum + r.recordCount, 0);
  
  console.log(`Total track names:        ${totalTracks}`);
  console.log(`Tracks changed:           ${changedTracks}`);
  console.log(`Tracks unchanged:         ${unchangedTracks}`);
  console.log(`Total records:            ${totalRecords}`);
  console.log(`Records updated:          ${changedRecords}`);
  console.log();
  
  if (changedTracks > 0) {
    console.log('Changed track names:');
    console.log();
    results
      .filter(r => r.changed)
      .forEach(r => {
        console.log(`  • "${r.original}" -> "${r.standardized}" (${r.recordCount} records)`);
      });
    console.log();
  }
  
  console.log('━'.repeat(80));
}

/**
 * Main migration function
 */
async function main() {
  console.log('━'.repeat(80));
  console.log('🏇 TRACK NAME STANDARDIZATION MIGRATION');
  console.log('━'.repeat(80));
  console.log();
  console.log('This script will standardize all track names in race_cards_ratings');
  console.log('to match the canonical names from PuntingForm API.');
  console.log();
  
  // Check for required environment variables
  if (!process.env.DATABASE_URL) {
    console.error('❌ ERROR: DATABASE_URL environment variable is not set');
    process.exit(1);
  }
  
  if (!process.env.PUNTING_FORM_API_KEY) {
    console.error('❌ ERROR: PUNTING_FORM_API_KEY environment variable is not set');
    process.exit(1);
  }
  
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });
  
  try {
    // Connect to database
    console.log('🔌 Connecting to database...');
    await client.connect();
    console.log('✅ Connected to database\n');
    
    // Fetch distinct track names
    console.log('🔍 Fetching distinct track names from race_cards_ratings...');
    const trackNames = await fetchDistinctTrackNames(client);
    console.log(`✅ Found ${trackNames.length} distinct track names\n`);
    
    if (trackNames.length === 0) {
      console.log('ℹ️ No track names found in race_cards_ratings table');
      return;
    }
    
    // Build transformation map
    const transformMap = await buildTransformationMap(trackNames);
    
    // Ask for confirmation (skip in CI/automated environments)
    if (process.env.CI !== 'true' && process.stdin.isTTY) {
      const readline = require('readline').createInterface({
        input: process.stdin,
        output: process.stdout
      });
      
      const answer = await new Promise<string>(resolve => {
        readline.question('\n⚠️ Proceed with updates? (yes/no): ', resolve);
      });
      
      readline.close();
      
      if (answer.toLowerCase() !== 'yes') {
        console.log('\n❌ Migration cancelled by user');
        return;
      }
    }
    
    // Update track names
    const results = await updateTrackNames(client, transformMap);
    
    // Print statistics
    printStatistics(results);
    
    console.log('✅ Migration completed successfully!\n');
    
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

// Run the migration
main();
