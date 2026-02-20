import { NextResponse } from 'next/server';
import { query } from '@/lib/database/client';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const result = await query(
      `SELECT DISTINCT race_date::text AS date FROM race_cards_ratings ORDER BY race_date DESC`
    );
    const dates: string[] = result.rows.map((row: { date: string }) => row.date);
    return NextResponse.json({ success: true, dates });
  } catch (error: unknown) {
    console.error('Error fetching available dates:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to fetch available dates', message },
      { status: 500 }
    );
  }
}
