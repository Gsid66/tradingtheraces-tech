import { NextResponse } from 'next/server';
import { Pool } from 'pg';
import { format } from 'date-fns';
import { scrapeFiles } from '@/lib/scrapers/racing-bet-data/scraper';
import { parseFile } from '@/lib/scrapers/racing-bet-data/parser';
import { importFields, createScraperLog, updateScraperLog } from '@/lib/scrapers/racing-bet-data/db-importer';

export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes

export async function POST(request: Request) {
  const startTime = Date.now();
  
  try {
    // TODO: Add authentication check to ensure only admin users can trigger scrapes
    // Example: if (!isAdmin(request)) { return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }); }
    
    // Parse request body
    const body = await request.json().catch(() => ({}));
    const date = body.date || format(new Date(), 'yyyy-MM-dd');
    
    // Check for DATABASE_URL
    if (!process.env.DATABASE_URL) {
      return NextResponse.json(
        { success: false, message: 'Database not configured' },
        { status: 500 }
      );
    }
    
    // Create database pool
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
    });
    
    try {
      // Create scraper log
      const logId = await createScraperLog(pool, 'ratings', date);
      
      // Scrape files
      const downloadResult = await scrapeFiles('ratings', date);
      
      if (!downloadResult.success) {
        await updateScraperLog(pool, logId, {
          status: 'failed',
          error_message: downloadResult.error,
          execution_time_ms: Date.now() - startTime,
        });
        
        return NextResponse.json(
          {
            success: false,
            message: `Failed to download ratings: ${downloadResult.error}`,
            note: 'The scraper is a placeholder. Use the import endpoint with manual file upload instead.',
          },
          { status: 500 }
        );
      }
      
      // Parse the file
      const parsed = await parseFile(downloadResult.filePath!, 'ratings');
      
      if (!parsed.fields || parsed.fields.length === 0) {
        await updateScraperLog(pool, logId, {
          status: 'failed',
          error_message: 'No valid fields found in file',
          file_path: downloadResult.filePath,
          execution_time_ms: Date.now() - startTime,
        });
        
        return NextResponse.json(
          { success: false, message: 'No valid fields found in file' },
          { status: 400 }
        );
      }
      
      // Import data
      await updateScraperLog(pool, logId, { file_path: downloadResult.filePath });
      const result = await importFields(pool, parsed.fields, logId);
      
      const executionTime = Date.now() - startTime;
      await updateScraperLog(pool, logId, { execution_time_ms: executionTime });
      
      return NextResponse.json({
        success: result.success,
        recordsImported: result.recordsImported,
        recordsProcessed: parsed.fields.length,
        recordsFailed: result.errors.length,
        executionTime,
        message: result.success 
          ? 'Ratings scraped and imported successfully'
          : 'Ratings scraped with errors',
        errors: result.errors.length > 0 ? result.errors.slice(0, 5) : undefined,
      });
    } finally {
      await pool.end();
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error in scrape ratings API:', error);
    
    return NextResponse.json(
      {
        success: false,
        message: `Failed to scrape ratings: ${message}`,
        executionTime: Date.now() - startTime,
      },
      { status: 500 }
    );
  }
}
