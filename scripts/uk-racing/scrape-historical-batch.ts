#!/usr/bin/env node
/**
 * Scrape and import historical batch of racing data
 * Usage: npx tsx scripts/uk-racing/scrape-historical-batch.ts --from=YYYY-MM-DD --to=YYYY-MM-DD [--type=results|ratings|both]
 */

import { config } from 'dotenv';
import { Pool } from 'pg';
import { format, parseISO, eachDayOfInterval, isAfter } from 'date-fns';
import { scrapeFiles } from '../../lib/scrapers/racing-bet-data/scraper';
import { parseFile } from '../../lib/scrapers/racing-bet-data/parser';
import { importResults, importFields, createScraperLog, updateScraperLog } from '../../lib/scrapers/racing-bet-data/db-importer';

// Load environment variables
config({ path: '.env.local' });

interface Args {
  from: string;
  to: string;
  type?: 'results' | 'ratings' | 'both';
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
  
  if (!args.from || !args.to) {
    console.error('❌ Error: --from and --to arguments are required');
    console.log('\nUsage: npx tsx scripts/uk-racing/scrape-historical-batch.ts --from=YYYY-MM-DD --to=YYYY-MM-DD [--type=results|ratings|both]');
    console.log('\nExample:');
    console.log('  npx tsx scripts/uk-racing/scrape-historical-batch.ts --from=2026-01-01 --to=2026-01-31 --type=results');
    process.exit(1);
  }
  
  args.type = args.type || 'both';
  
  if (!['results', 'ratings', 'both'].includes(args.type)) {
    console.error('❌ Error: --type must be "results", "ratings", or "both"');
    process.exit(1);
  }
  
  return args as Args;
}

/**
 * Process a single date
 */
async function processDate(
  pool: Pool,
  date: Date,
  type: 'results' | 'ratings'
): Promise<{ success: boolean; recordsImported: number; errors: string[] }> {
  const dateStr = format(date, 'yyyy-MM-dd');
  const startTime = Date.now();
  
  try {
    // Create scraper log
    const logId = await createScraperLog(pool, type, dateStr);
    
    // Scrape files
    console.log(`   🌐 Scraping ${type} for ${dateStr}...`);
    const downloadResult = await scrapeFiles(type, dateStr);
    
    if (!downloadResult.success) {
      await updateScraperLog(pool, logId, {
        status: 'failed',
        error_message: downloadResult.error,
        execution_time_ms: Date.now() - startTime,
      });
      return { success: false, recordsImported: 0, errors: [downloadResult.error || 'Download failed'] };
    }
    
    // Parse the file
    const parsed = await parseFile(downloadResult.filePath!, type);
    
    if (type === 'results') {
      if (!parsed.results || parsed.results.length === 0) {
        await updateScraperLog(pool, logId, {
          status: 'failed',
          error_message: 'No valid results found',
          file_path: downloadResult.filePath,
          execution_time_ms: Date.now() - startTime,
        });
        return { success: false, recordsImported: 0, errors: ['No valid results found'] };
      }
      
      // Import data
      await updateScraperLog(pool, logId, { file_path: downloadResult.filePath });
      const result = await importResults(pool, parsed.results, logId);
      
      await updateScraperLog(pool, logId, { execution_time_ms: Date.now() - startTime });
      
      return {
        success: result.success,
        recordsImported: result.recordsImported,
        errors: result.errors,
      };
    } else {
      // ratings
      if (!parsed.fields || parsed.fields.length === 0) {
        await updateScraperLog(pool, logId, {
          status: 'failed',
          error_message: 'No valid fields found',
          file_path: downloadResult.filePath,
          execution_time_ms: Date.now() - startTime,
        });
        return { success: false, recordsImported: 0, errors: ['No valid fields found'] };
      }
      
      // Import data
      await updateScraperLog(pool, logId, { file_path: downloadResult.filePath });
      const result = await importFields(pool, parsed.fields, logId);
      
      await updateScraperLog(pool, logId, { execution_time_ms: Date.now() - startTime });
      
      return {
        success: result.success,
        recordsImported: result.recordsImported,
        errors: result.errors,
      };
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, recordsImported: 0, errors: [message] };
  }
}

/**
 * Main batch scrape function
 */
async function main() {
  const args = parseArgs();
  const startTime = Date.now();
  
  console.log('🚀 UK/IRE Racing Historical Batch Scraper');
  console.log('━'.repeat(60));
  console.log(`📅 From: ${args.from}`);
  console.log(`📅 To: ${args.to}`);
  console.log(`📊 Type: ${args.type}`);
  console.log('━'.repeat(60));
  console.log('');
  
  // Validate dates
  const fromDate = parseISO(args.from);
  const toDate = parseISO(args.to);
  
  if (isAfter(fromDate, toDate)) {
    console.error('❌ Error: "from" date must be before "to" date\n');
    process.exit(1);
  }
  
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
  
  try {
    // Get all dates in range
    const dates = eachDayOfInterval({ start: fromDate, end: toDate });
    
    console.log(`📆 Processing ${dates.length} dates...\n`);
    
    let totalImported = 0;
    let totalFailed = 0;
    const allErrors: string[] = [];
    
    for (const date of dates) {
      const dateStr = format(date, 'yyyy-MM-dd');
      console.log(`\n📅 ${dateStr}`);
      
      if (args.type === 'both' || args.type === 'results') {
        const result = await processDate(pool, date, 'results');
        if (result.success) {
          console.log(`   ✅ Results: ${result.recordsImported} imported`);
          totalImported += result.recordsImported;
        } else {
          console.log(`   ❌ Results: Failed`);
          totalFailed++;
          allErrors.push(...result.errors);
        }
        
        // Delay between requests
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
      
      if (args.type === 'both' || args.type === 'ratings') {
        const result = await processDate(pool, date, 'ratings');
        if (result.success) {
          console.log(`   ✅ Ratings: ${result.recordsImported} imported`);
          totalImported += result.recordsImported;
        } else {
          console.log(`   ❌ Ratings: Failed`);
          totalFailed++;
          allErrors.push(...result.errors);
        }
        
        // Delay between requests
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
    
    const executionTime = Date.now() - startTime;
    
    console.log('\n━'.repeat(60));
    console.log('📊 Batch Scrape Summary:');
    console.log(`   📆 Dates processed: ${dates.length}`);
    console.log(`   ✅ Records imported: ${totalImported}`);
    console.log(`   ❌ Failed operations: ${totalFailed}`);
    console.log(`   ⏱️  Total execution time: ${Math.round(executionTime / 1000)}s`);
    console.log('━'.repeat(60));
    
    if (allErrors.length > 0) {
      console.log('\n⚠️  Errors encountered:');
      allErrors.slice(0, 10).forEach(err => console.log(`   - ${err}`));
      if (allErrors.length > 10) {
        console.log(`   ... and ${allErrors.length - 10} more errors`);
      }
    }
    
    console.log('\n🎉 Batch scrape completed!\n');
  } catch (error) {
    console.error('\n❌ Fatal error during batch scrape:');
    console.error(error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run the script
main();
