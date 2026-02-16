import { NextResponse } from 'next/server';
import { Pool } from 'pg';
import { format } from 'date-fns';
import { parseTTRAUNZCSV, TTRAUNZRating } from '@/lib/parsers/ttr-au-nz-csv-parser';

export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes

// Security: Limit file size to prevent DoS attacks
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const BATCH_SIZE = 100;

interface ImportResult {
  success: boolean;
  recordsImported: number;
  recordsSkipped: number;
  errors: string[];
}

/**
 * Import ratings into database using batch inserts
 */
async function importRatings(pool: Pool, ratings: TTRAUNZRating[]): Promise<ImportResult> {
  let recordsImported = 0;
  let recordsSkipped = 0;
  const errors: string[] = [];

  try {
    // Process in batches for performance
    for (let i = 0; i < ratings.length; i += BATCH_SIZE) {
      const batch = ratings.slice(i, i + BATCH_SIZE);
      
      // Build batch insert query with ON CONFLICT handling
      const values: any[] = [];
      const placeholders: string[] = [];
      let paramIndex = 1;

      batch.forEach((rating) => {
        const placeholder = `($${paramIndex}, $${paramIndex + 1}, $${paramIndex + 2}, $${paramIndex + 3}, $${paramIndex + 4}, $${paramIndex + 5}, $${paramIndex + 6}, $${paramIndex + 7}, $${paramIndex + 8}, $${paramIndex + 9})`;
        placeholders.push(placeholder);
        
        values.push(
          format(rating.race_date, 'yyyy-MM-dd'),
          rating.track_name,
          rating.race_name,
          rating.race_number,
          rating.saddle_cloth,
          rating.horse_name,
          rating.jockey_name,
          rating.trainer_name,
          rating.rating,
          rating.price
        );
        
        paramIndex += 10;
      });

      const query = `
        INSERT INTO race_cards_ratings (
          race_date, track, race_name, race_number, saddle_cloth,
          horse_name, jockey, trainer, rating, price
        )
        VALUES ${placeholders.join(', ')}
        ON CONFLICT (race_date, track, race_name, horse_name)
        DO UPDATE SET
          race_number = EXCLUDED.race_number,
          saddle_cloth = EXCLUDED.saddle_cloth,
          jockey = EXCLUDED.jockey,
          trainer = EXCLUDED.trainer,
          rating = EXCLUDED.rating,
          price = EXCLUDED.price,
          updated_at = NOW()
        RETURNING id
      `;

      try {
        const result = await pool.query(query, values);
        recordsImported += result.rowCount || 0;
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        errors.push(`Batch ${Math.floor(i / BATCH_SIZE) + 1}: ${message}`);
        recordsSkipped += batch.length;
      }
    }

    return {
      success: errors.length === 0,
      recordsImported,
      recordsSkipped,
      errors
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return {
      success: false,
      recordsImported,
      recordsSkipped,
      errors: [message]
    };
  }
}

export async function POST(request: Request) {
  const startTime = Date.now();
  
  try {
    // Parse form data
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json(
        { success: false, message: 'No file provided' },
        { status: 400 }
      );
    }
    
    // Security: Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { success: false, message: `File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB` },
        { status: 400 }
      );
    }
    
    // Check file type
    const fileName = file.name.toLowerCase();
    if (!fileName.endsWith('.csv') && !fileName.endsWith('.txt')) {
      return NextResponse.json(
        { success: false, message: 'Invalid file type. Only CSV files are supported' },
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
    
    // Read file content
    const csvContent = await file.text();
    
    // Parse CSV
    let ratings: TTRAUNZRating[];
    try {
      ratings = parseTTRAUNZCSV(csvContent);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return NextResponse.json(
        { success: false, message: `Failed to parse CSV: ${message}` },
        { status: 400 }
      );
    }
    
    if (ratings.length === 0) {
      return NextResponse.json(
        { success: false, message: 'No valid ratings found in file' },
        { status: 400 }
      );
    }
    
    // Create database pool
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
    });
    
    try {
      // Import ratings
      const result = await importRatings(pool, ratings);
      
      const executionTime = Date.now() - startTime;
      
      // Get unique race dates for response
      const uniqueDates = [...new Set(ratings.map(r => format(r.race_date, 'yyyy-MM-dd')))];
      
      return NextResponse.json({
        success: result.success,
        recordsImported: result.recordsImported,
        recordsProcessed: ratings.length,
        recordsSkipped: result.recordsSkipped,
        executionTime,
        raceDates: uniqueDates,
        message: result.success 
          ? `Successfully imported ${result.recordsImported} ratings`
          : `Imported ${result.recordsImported} ratings with ${result.errors.length} errors`,
        errors: result.errors.length > 0 ? result.errors.slice(0, 5) : undefined,
      });
    } finally {
      await pool.end();
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error in TTR AU/NZ ratings upload:', error);
    
    return NextResponse.json(
      {
        success: false,
        message: `Failed to upload ratings: ${message}`,
        executionTime: Date.now() - startTime,
      },
      { status: 500 }
    );
  }
}
