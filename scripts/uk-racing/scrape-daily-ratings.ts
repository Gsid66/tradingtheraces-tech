#!/usr/bin/env node
/**
 * Scrape and import daily ratings from racing-bet-data.com
 * Usage: npx tsx scripts/uk-racing/scrape-daily-ratings.ts [--date=YYYY-MM-DD]
 */

import { config } from 'dotenv';
import { Pool } from 'pg';
import { format } from 'date-fns';
import { scrapeFiles } from '../../lib/scrapers/racing-bet-data/scraper';
import { parseFile } from '../../lib/scrapers/racing-bet-data/parser';
import { importFields, createScraperLog, updateScraperLog } from '../../lib/scrapers/racing-bet-data/db-importer';

// Load environment variables
config({ path: '.env.local' });

interface Args {
  date?: string;
}

/**
 * Parse command line arguments
 */
function parseArgs(): Args {
  const args: any = {};
  
  process.argv.slice(2).forEach(arg => {
    const [key, value] = arg.replace(/^--/, '').split('=');
    args[key] = value;
  });
  
  return args as Args;
}

/**
 * Main scrape function
 */
async function main() {
  const args = parseArgs();
  const startTime = Date.now();
  const scrapeDate = args.date || format(new Date(), 'yyyy-MM-dd');
  
  console.log('🚀 UK/IRE Racing Daily Ratings Scraper');
  console.log('━'.repeat(60));
  console.log(`📅 Date: ${scrapeDate}`);
  console.log('━'.repeat(60));
  console.log('');
  
  // Check for DATABASE_URL
  if (!process.env.DATABASE_URL) {
    console.error('❌ ERROR: DATABASE_URL environment variable is not set');
    console.error('   Please set DATABASE_URL in your .env.local file\n');
    process.exit(1);
  }
  
  // Create database pool
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' 
      ? { rejectUnauthorized: false }
      : undefined,
  });
  
  let logId: number | undefined;
  
  try {
    // Create scraper log
    logId = await createScraperLog(pool, 'ratings', scrapeDate);
    
    // Scrape files
    console.log('🌐 Scraping racing-bet-data.com...');
    const downloadResult = await scrapeFiles('ratings', scrapeDate);
    
    if (!downloadResult.success) {
      console.error(`❌ Failed to download ratings: ${downloadResult.error}\n`);
      await updateScraperLog(pool, logId, {
        status: 'failed',
        error_message: downloadResult.error,
        execution_time_ms: Date.now() - startTime,
      });
      
      console.log('⚠️  Note: The scraper is a placeholder implementation.');
      console.log('   You can manually download files and use import-csv.ts instead:\n');
      console.log('   npx tsx scripts/uk-racing/import-csv.ts --file=<path> --type=ratings\n');
      
      process.exit(1);
    }
    
    console.log(`✅ Downloaded: ${downloadResult.filePath}\n`);
    
    // Parse the file
    console.log('📖 Parsing file...');
    const parsed = await parseFile(downloadResult.filePath!, 'ratings');
    
    if (parsed.errors && parsed.errors.length > 0) {
      console.log(`⚠️  Found ${parsed.errors.length} parsing errors`);
    }
    
    if (!parsed.fields || parsed.fields.length === 0) {
      console.log('⚠️  No valid fields to import\n');
      await updateScraperLog(pool, logId, {
        status: 'failed',
        error_message: 'No valid fields found in file',
        file_path: downloadResult.filePath,
        execution_time_ms: Date.now() - startTime,
      });
      process.exit(1);
    }
    
    console.log(`✅ Parsed ${parsed.fields.length} fields`);
    console.log('💾 Importing into database...\n');
    
    // Import data
    await updateScraperLog(pool, logId, { file_path: downloadResult.filePath });
    const result = await importFields(pool, parsed.fields, logId);
    
    const executionTime = Date.now() - startTime;
    await updateScraperLog(pool, logId, { execution_time_ms: executionTime });
    
    console.log('━'.repeat(60));
    console.log('📊 Scrape & Import Summary:');
    console.log(`   ✅ Records imported: ${result.recordsImported}`);
    console.log(`   ❌ Records failed: ${result.errors.length}`);
    console.log(`   ⏱️  Execution time: ${executionTime}ms`);
    console.log('━'.repeat(60));
    
    if (result.errors.length > 0) {
      console.log('\n⚠️  Errors encountered:');
      result.errors.slice(0, 5).forEach(err => console.log(`   - ${err}`));
      if (result.errors.length > 5) {
        console.log(`   ... and ${result.errors.length - 5} more errors`);
      }
    }
    
    if (result.success) {
      console.log('\n🎉 Scrape completed successfully!\n');
    } else {
      console.log('\n⚠️  Scrape completed with errors\n');
      process.exit(1);
    }
  } catch (error) {
    console.error('\n❌ Fatal error during scrape:');
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
