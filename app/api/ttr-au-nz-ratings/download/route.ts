import { NextResponse } from 'next/server';
import { Client } from 'pg';
import { format, parseISO, isValid } from 'date-fns';

export const dynamic = 'force-dynamic';

interface TTRRatingData {
  race_date: string;
  track_name: string;
  race_name: string;
  race_number: number;
  saddle_cloth: number | null;
  horse_name: string;
  jockey_name: string | null;
  trainer_name: string | null;
  rating: number | null;
  price: number | null;
}

/**
 * Fetch ratings data from database for a specific date
 */
async function getRatingsForDate(date: string): Promise<TTRRatingData[]> {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL not configured');
  }

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();

    const query = `
      SELECT 
        race_date, track as track_name, race_name, race_number,
        saddle_cloth, horse_name, jockey as jockey_name, trainer as trainer_name,
        rating, price
      FROM race_cards_ratings
      WHERE race_date = $1
      ORDER BY track, race_number, rating DESC NULLS LAST
    `;

    const result = await client.query(query, [date]);
    return result.rows;
  } finally {
    await client.end();
  }
}

/**
 * Convert ratings data to CSV format
 */
function convertToCSV(ratings: TTRRatingData[]): string {
  // CSV Header
  const headers = [
    'Date',
    'Track',
    'Race',
    'Race Number',
    'Saddle Cloth',
    'Horse',
    'Jockey',
    'Trainer',
    'Rating',
    'Price'
  ];

  // CSV Rows - ensure ALL values are strings
  const rows = ratings.map(rating => [
    String(rating.race_date || ''),
    String(rating.track_name || ''),
    String(rating.race_name || ''),
    String(rating.race_number || ''),
    rating.saddle_cloth !== null ? String(rating.saddle_cloth) : '',
    String(rating.horse_name || ''),
    String(rating.jockey_name || ''),
    String(rating.trainer_name || ''),
    rating.rating !== null ? String(rating.rating) : '',
    rating.price !== null ? String(rating.price) : ''
  ]);

  // Escape CSV values (handle commas and quotes)
  const escapeCSVValue = (value: string): string => {
    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  };

  // Combine headers and rows
  const csvLines = [
    headers.join(','),
    ...rows.map(row => row.map(escapeCSVValue).join(','))
  ];

  return csvLines.join('\n');
}

export async function GET(request: Request) {
  const startTime = Date.now();

  try {
    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const dateParam = searchParams.get('date');

    // Default to today's date if not provided
    const today = new Date();
    const defaultDate = format(today, 'yyyy-MM-dd');
    const date = dateParam || defaultDate;

    // Validate date format
    const parsedDate = parseISO(date);
    if (!isValid(parsedDate)) {
      return NextResponse.json(
        {
          success: false,
          message: `Invalid date format: "${date}". Please use YYYY-MM-DD format.`
        },
        { status: 400 }
      );
    }

    // Fetch ratings data
    let ratings: TTRRatingData[];
    try {
      ratings = await getRatingsForDate(date);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error('Error fetching ratings:', error);
      return NextResponse.json(
        {
          success: false,
          message: `Failed to fetch ratings: ${message}`
        },
        { status: 500 }
      );
    }

    // Check if data exists
    if (ratings.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: `No ratings data found for date: ${date}`
        },
        { status: 404 }
      );
    }

    // Convert to CSV
    const csvContent = convertToCSV(ratings);

    // Create response with CSV file
    const response = new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="ttr-au-nz-ratings-${date}.csv"`,
      }
    });

    const executionTime = Date.now() - startTime;
    console.log(`✅ Downloaded ${ratings.length} AU/NZ ratings for ${date} in ${executionTime}ms`);

    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error in TTR AU/NZ ratings download:', error);

    return NextResponse.json(
      {
        success: false,
        message: `Failed to download ratings: ${message}`,
        executionTime: Date.now() - startTime,
      },
      { status: 500 }
    );
  }
}
