#!/usr/bin/env node
/**
 * Import UK/IRE racing data from CSV files
 * Usage: npx tsx scripts/uk-racing/import-csv.ts --file=./data/results.csv --type=results
 */

import { config } from 'dotenv';
import { Pool } from 'pg';
import * as path from 'path';
import { parseFile } from '../../lib/scrapers/racing-bet-data/parser';
import { importResults, importFields, createScraperLog, updateScraperLog } from '../../lib/scrapers/racing-bet-data/db-importer';
import { format } from 'date-fns';

// Load environment variables
config({ path: '.env.local' });

interface Args {
  file: string;
  type: 'results' | 'ratings';
  date?: string;
}

/**
 * Parse command line arguments
 */
function parseArgs(): Args {
  const args: Record<string, string> = {};
  
  process.argv.slice(2).forEach(arg => {
    const [key, value] = arg.replace(/^--/, '').split('=');
    args[key] = value;
  });
  
  if (!args.file) {
    console.error('❌ Error: --file argument is required');
    console.log('\nUsage: npx tsx scripts/uk-racing/import-csv.ts --file=<path> --type=<results|ratings> [--date=YYYY-MM-DD]');
    console.log('\nExamples:');
    console.log('  npx tsx scripts/uk-racing/import-csv.ts --file=./data/results.csv --type=results');
    console.log('  npx tsx scripts/uk-racing/import-csv.ts --file=./data/ratings.xlsx --type=ratings --date=2026-02-14');
    process.exit(1);
  }
  
  if (!args.type || !['results', 'ratings'].includes(args.type)) {
    console.error('❌ Error: --type must be either "results" or "ratings"');
    process.exit(1);
  }
  
  return args as Args;
}

/**
 * Main import function
 */
async function main() {
  const args = parseArgs();
  const startTime = Date.now();
  
  console.log('🚀 UK/IRE Racing Data Import');
  console.log('━'.repeat(60));
  console.log(`📁 File: ${args.file}`);
  console.log(`📊 Type: ${args.type}`);
  console.log(`📅 Date: ${args.date || 'auto-detect from file'}`);
  console.log('━'.repeat(60));
  console.log('');
  
  // Check for DATABASE_URL
  if (!process.env.DATABASE_URL) {
    console.error('❌ ERROR: DATABASE_URL environment variable is not set');
    console.error('   Please set DATABASE_URL in your .env.local file\n');
    process.exit(1);
  }
  
  // Resolve file path
  const filePath = path.resolve(process.cwd(), args.file);
  
  // Create database pool
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' 
      ? { rejectUnauthorized: false }
      : undefined,
  });
  
  let logId: number | undefined;
  
  try {
    // Parse the file
    console.log('📖 Parsing file...');
    const parsed = await parseFile(filePath, args.type);
    
    if (parsed.errors && parsed.errors.length > 0) {
      console.log(`⚠️  Found ${parsed.errors.length} parsing errors:`);
      parsed.errors.slice(0, 10).forEach(err => console.log(`   - ${err}`));
      if (parsed.errors.length > 10) {
        console.log(`   ... and ${parsed.errors.length - 10} more errors`);
      }
      console.log('');
    }
    
    // Determine scrape date
    const scrapeDate = args.date || format(new Date(), 'yyyy-MM-dd');
    
    // Create scraper log
    logId = await createScraperLog(pool, args.type, scrapeDate, filePath);
    
    // Import data
    if (args.type === 'results') {
      if (!parsed.results || parsed.results.length === 0) {
        console.log('⚠️  No valid results to import\n');
        await updateScraperLog(pool, logId, {
          status: 'failed',
          error_message: 'No valid results found in file',
        });
        process.exit(1);
      }
      
      console.log(`✅ Parsed ${parsed.results.length} results`);
      console.log('💾 Importing into database...\n');
      
      const result = await importResults(pool, parsed.results, logId);
      
      const executionTime = Date.now() - startTime;
      await updateScraperLog(pool, logId, { execution_time_ms: executionTime });
      
      console.log('━'.repeat(60));
      console.log('📊 Import Summary:');
      console.log(`   ✅ Records imported: ${result.recordsImported}`);
      console.log(`   ❌ Records failed: ${result.errors.length}`);
      console.log(`   ⏱️  Execution time: ${executionTime}ms`);
      console.log('━'.repeat(60));
      
      if (result.errors.length > 0) {
        console.log('\n⚠️  Errors encountered:');
        result.errors.slice(0, 10).forEach(err => console.log(`   - ${err}`));
        if (result.errors.length > 10) {
          console.log(`   ... and ${result.errors.length - 10} more errors`);
        }
      }
      
      if (result.success) {
        console.log('\n🎉 Import completed successfully!\n');
      } else {
        console.log('\n⚠️  Import completed with errors\n');
        process.exit(1);
      }
    } else {
      // ratings/fields
      if (!parsed.fields || parsed.fields.length === 0) {
        console.log('⚠️  No valid fields to import\n');
        await updateScraperLog(pool, logId, {
          status: 'failed',
          error_message: 'No valid fields found in file',
        });
        process.exit(1);
      }
      
      console.log(`✅ Parsed ${parsed.fields.length} fields`);
      console.log('💾 Importing into database...\n');
      
      const result = await importFields(pool, parsed.fields, logId);
      
      const executionTime = Date.now() - startTime;
      await updateScraperLog(pool, logId, { execution_time_ms: executionTime });
      
      console.log('━'.repeat(60));
      console.log('📊 Import Summary:');
      console.log(`   ✅ Records imported: ${result.recordsImported}`);
      console.log(`   ❌ Records failed: ${result.errors.length}`);
      console.log(`   ⏱️  Execution time: ${executionTime}ms`);
      console.log('━'.repeat(60));
      
      if (result.errors.length > 0) {
        console.log('\n⚠️  Errors encountered:');
        result.errors.slice(0, 10).forEach(err => console.log(`   - ${err}`));
        if (result.errors.length > 10) {
          console.log(`   ... and ${result.errors.length - 10} more errors`);
        }
      }
      
      if (result.success) {
        console.log('\n🎉 Import completed successfully!\n');
      } else {
        console.log('\n⚠️  Import completed with errors\n');
        process.exit(1);
      }
    }
  } catch (error) {
    console.error('\n❌ Fatal error during import:');
    console.error(error);
    
    if (logId) {
      await updateScraperLog(pool, logId, {
        status: 'failed',
        error_message: error instanceof Error ? error.message : 'Unknown error',
        execution_time_ms: Date.now() - startTime,
      });
    }
    
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run the script
main();
