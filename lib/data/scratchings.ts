import { query } from '@/lib/database/client';

export interface ScratchingData {
  meetingId: string;
  raceId: string;
  raceNumber: number;
  trackName: string;
  horseName: string;
  tabNumber: number;
  scratchingTime: string;
  reason?: string;
}

export interface ScratchingsResult {
  success: boolean;
  data: ScratchingData[];
  meta?: {
    count: number;
    jurisdiction: number;
    source: string;
    timestamp: string;
  };
  error?: string;
  message?: string;
}

/**
 * Fetch scratchings from the database
 * Can be called directly from server components or via API routes
 * 
 * @param jurisdiction - 0 (AU), 1 (NZ), 2 (Both)
 * @param hoursAgo - Number of hours to look back (default: 48)
 * @returns Scratchings data with metadata
 */
export async function getScratchingsFromDB(
  jurisdiction: number = 0,
  hoursAgo: number = 48
): Promise<ScratchingsResult> {
  try {
    // Validate jurisdiction parameter
    if (jurisdiction < 0 || jurisdiction > 2) {
      console.error(`❌ [Scratchings DB] Invalid jurisdiction: ${jurisdiction}`);
      return {
        success: false,
        data: [],
        error: 'Invalid jurisdiction parameter',
        message: 'Jurisdiction must be 0 (AU), 1 (NZ), or 2 (Both)'
      };
    }

    // Validate hoursAgo parameter
    if (hoursAgo < 0 || hoursAgo > 168) { // Max 1 week
      console.error(`❌ [Scratchings DB] Invalid hoursAgo: ${hoursAgo}`);
      return {
        success: false,
        data: [],
        error: 'Invalid hoursAgo parameter',
        message: 'hoursAgo must be between 0 and 168 hours'
      };
    }

    console.log(`🔍 [Scratchings DB] Fetching from database:`, {
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

    const scratchingsData: ScratchingData[] = result.rows.map(row => ({
      meetingId: row.meeting_id,
      raceId: row.race_id,
      raceNumber: row.race_number,
      trackName: row.track_name,
      horseName: row.horse_name,
      tabNumber: row.tab_number,
      scratchingTime: row.scratching_time,
      reason: row.reason
    }));

    console.log(`✅ [Scratchings DB] Returning ${scratchingsData.length} scratchings from database`);
    
    return {
      success: true,
      data: scratchingsData,
      meta: {
        count: scratchingsData.length,
        jurisdiction,
        source: 'database',
        timestamp: new Date().toISOString()
      }
    };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ [Scratchings DB] Error fetching scratchings:', error);
    
    return {
      success: false,
      data: [],
      error: 'Failed to fetch scratchings from database',
      message: errorMessage
    };
  }
}
