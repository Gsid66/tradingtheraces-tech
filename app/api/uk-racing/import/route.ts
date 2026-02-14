import { NextResponse } from 'next/server';
import { Pool } from 'pg';
import { format } from 'date-fns';
import { writeFile, unlink } from 'fs/promises';
import { join } from 'path';
import { parseFile } from '@/lib/scrapers/racing-bet-data/parser';
import { importResults, importFields, createScraperLog, updateScraperLog } from '@/lib/scrapers/racing-bet-data/db-importer';

export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes

export async function POST(request: Request) {
  const startTime = Date.now();
  let tempFilePath: string | null = null;
  
  try {
    // Parse form data
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const type = formData.get('type') as 'results' | 'ratings';
    const date = (formData.get('date') as string) || format(new Date(), 'yyyy-MM-dd');
    
    if (!file) {
      return NextResponse.json(
        { success: false, message: 'No file provided' },
        { status: 400 }
      );
    }
    
    if (!type || !['results', 'ratings'].includes(type)) {
      return NextResponse.json(
        { success: false, message: 'Invalid type. Must be "results" or "ratings"' },
        { status: 400 }
      );
    }
    
    // Check file type
    const fileName = file.name.toLowerCase();
    if (!fileName.endsWith('.csv') && !fileName.endsWith('.xlsx') && !fileName.endsWith('.xls')) {
      return NextResponse.json(
        { success: false, message: 'Invalid file type. Only CSV and Excel files are supported' },
        { status: 400 }
      );
    }
    
    // Check for DATABASE_URL
    if (!process.env.DATABASE_URL) {
      return NextResponse.json(
        { success: false, message: 'Database not configured' },
        { status: 500 }
      );
    }
    
    // Save file temporarily
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    tempFilePath = join('/tmp', `upload-${Date.now()}-${file.name}`);
    await writeFile(tempFilePath, buffer);
    
    // Create database pool
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
    });
    
    try {
      // Create scraper log
      const logId = await createScraperLog(pool, type, date, tempFilePath);
      
      // Parse the file
      const parsed = await parseFile(tempFilePath, type);
      
      if (parsed.errors && parsed.errors.length > 0) {
        console.log(`⚠️  Found ${parsed.errors.length} parsing errors`);
      }
      
      // Import data
      let result;
      if (type === 'results') {
        if (!parsed.results || parsed.results.length === 0) {
          await updateScraperLog(pool, logId, {
            status: 'failed',
            error_message: 'No valid results found in file',
            execution_time_ms: Date.now() - startTime,
          });
          
          return NextResponse.json(
            { success: false, message: 'No valid results found in file' },
            { status: 400 }
          );
        }
        
        result = await importResults(pool, parsed.results, logId);
      } else {
        // ratings
        if (!parsed.fields || parsed.fields.length === 0) {
          await updateScraperLog(pool, logId, {
            status: 'failed',
            error_message: 'No valid fields found in file',
            execution_time_ms: Date.now() - startTime,
          });
          
          return NextResponse.json(
            { success: false, message: 'No valid fields found in file' },
            { status: 400 }
          );
        }
        
        result = await importFields(pool, parsed.fields, logId);
      }
      
      const executionTime = Date.now() - startTime;
      await updateScraperLog(pool, logId, { execution_time_ms: executionTime });
      
      return NextResponse.json({
        success: result.success,
        recordsImported: result.recordsImported,
        recordsProcessed: type === 'results' ? parsed.results?.length : parsed.fields?.length,
        recordsFailed: result.errors.length,
        executionTime,
        message: result.success 
          ? `${type} imported successfully`
          : `${type} imported with errors`,
        errors: result.errors.length > 0 ? result.errors.slice(0, 5) : undefined,
      });
    } finally {
      await pool.end();
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error in import API:', error);
    
    return NextResponse.json(
      {
        success: false,
        message: `Failed to import file: ${message}`,
        executionTime: Date.now() - startTime,
      },
      { status: 500 }
    );
  } finally {
    // Clean up temp file
    if (tempFilePath) {
      try {
        await unlink(tempFilePath);
      } catch {
        // Ignore cleanup errors
      }
    }
  }
}
