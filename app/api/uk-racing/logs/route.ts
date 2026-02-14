import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/database/client';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const type = searchParams.get('type'); // 'results', 'ratings', 'historical', or null for all
    const status = searchParams.get('status'); // 'success', 'failed', 'partial', or null for all
    
    const db = getDatabase();
    
    let query = `
      SELECT 
        id,
        scraper_type,
        scrape_date,
        status,
        records_processed,
        records_imported,
        records_failed,
        records_skipped,
        execution_time_ms,
        file_path,
        error_message,
        created_at,
        updated_at
      FROM scraper_logs
      WHERE 1=1
    `;
    
    const params: unknown[] = [];
    let paramIndex = 1;
    
    if (type) {
      query += ` AND scraper_type = $${paramIndex}`;
      params.push(type);
      paramIndex++;
    }
    
    if (status) {
      query += ` AND status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }
    
    query += ` ORDER BY created_at DESC LIMIT $${paramIndex}`;
    params.push(limit);
    
    const result = await db.query(query, params);
    
    return NextResponse.json({
      success: true,
      logs: result.rows,
      count: result.rows.length,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error fetching scraper logs:', error);
    
    return NextResponse.json(
      {
        success: false,
        message: `Failed to fetch logs: ${message}`,
        logs: [],
      },
      { status: 500 }
    );
  }
}
