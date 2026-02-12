import { query } from '@/lib/database/client';

export interface ConditionData {
  meetingId: string;
  trackName: string;
  trackCondition: string;
  railPosition?: string;
  weather?: string;
  updatedAt: string;
}

export interface ConditionsResult {
  success: boolean;
  data: ConditionData[];
  meta?: {
    count: number;
    source: string;
    timestamp: string;
  };
  error?: string;
  message?: string;
}

/**
 * Fetch track conditions from the database
 * Can be called directly from server components or via API routes
 * 
 * @returns Conditions data with metadata
 */
export async function getConditionsFromDB(): Promise<ConditionsResult> {
  try {
    console.log(`🔍 [Conditions DB] Fetching from database`);
    
    // Query conditions from database
    const result = await query(`
      SELECT 
        meeting_id,
        track_name,
        track_condition,
        rail_position,
        weather,
        updated_at
      FROM pf_track_conditions
      ORDER BY track_name ASC
    `);

    const conditionsData: ConditionData[] = result.rows.map(row => ({
      meetingId: row.meeting_id,
      trackName: row.track_name,
      trackCondition: row.track_condition,
      railPosition: row.rail_position || undefined,
      weather: row.weather || undefined,
      updatedAt: row.updated_at
    }));

    console.log(`✅ [Conditions DB] Returning ${conditionsData.length} conditions from database`);
    
    return {
      success: true,
      data: conditionsData,
      meta: {
        count: conditionsData.length,
        source: 'database',
        timestamp: new Date().toISOString()
      }
    };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ [Conditions DB] Error fetching conditions:', error);
    
    return {
      success: false,
      data: [],
      error: 'Failed to fetch conditions from database',
      message: errorMessage
    };
  }
}

/**
 * Get condition for a specific meeting
 * @param meetingId - The meeting ID to fetch condition for
 */
export async function getConditionForMeeting(meetingId: string): Promise<ConditionData | null> {
  try {
    console.log(`🔍 [Conditions DB] Fetching condition for meeting: ${meetingId}`);
    
    const result = await query(`
      SELECT 
        meeting_id,
        track_name,
        track_condition,
        rail_position,
        weather,
        updated_at
      FROM pf_track_conditions
      WHERE meeting_id = $1
      LIMIT 1
    `, [meetingId]);

    if (result.rows.length === 0) {
      console.log(`⚠️ [Conditions DB] No condition found for meeting: ${meetingId}`);
      return null;
    }

    const row = result.rows[0];
    const condition: ConditionData = {
      meetingId: row.meeting_id,
      trackName: row.track_name,
      trackCondition: row.track_condition,
      railPosition: row.rail_position || undefined,
      weather: row.weather || undefined,
      updatedAt: row.updated_at
    };

    console.log(`✅ [Conditions DB] Found condition for ${condition.trackName}: ${condition.trackCondition}`);
    
    return condition;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ [Conditions DB] Error fetching condition for meeting:', error);
    return null;
  }
}
