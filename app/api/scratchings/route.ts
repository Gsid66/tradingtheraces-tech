import { NextResponse } from 'next/server';
import { query } from '@/lib/database/client';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const jurisdiction = parseInt(searchParams.get('jurisdiction') || '0');
    const hoursAgo = parseInt(searchParams.get('hoursAgo') || '48'); // Default to last 48 hours
    
    console.log(`🔍 [Scratchings API DB] Fetching from database:`, {
      jurisdiction,
      hoursAgo
    });
    
    // Query scratchings from database
    const result = await query(`
      SELECT 
        meeting_id,
        race_id,
        race_number,
        track_name,
        horse_name,
        tab_number,
        scratching_time,
        reason,
        jurisdiction
      FROM pf_scratchings
      WHERE jurisdiction = $1
        AND scratching_time >= NOW() - INTERVAL '1 hour' * $2
      ORDER BY scratching_time DESC
    `, [jurisdiction, hoursAgo]);

    const scratchingsData = result.rows.map(row => ({
      meetingId: row.meeting_id,
      raceId: row.race_id,
      raceNumber: row.race_number,
      trackName: row.track_name,
      horseName: row.horse_name,
      tabNumber: row.tab_number,
      scratchingTime: row.scratching_time,
      reason: row.reason
    }));

    console.log(`✅ [Scratchings API DB] Returning ${scratchingsData.length} scratchings from database`);
    
    return NextResponse.json({
      success: true,
      data: scratchingsData,
      meta: {
        count: scratchingsData.length,
        jurisdiction,
        source: 'database',
        timestamp: new Date().toISOString()
      }
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ [Scratchings API DB] Error fetching scratchings:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch scratchings from database', 
        message: errorMessage,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}
