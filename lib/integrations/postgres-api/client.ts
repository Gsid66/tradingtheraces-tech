export interface PostgresAPIResponse<T> {
  success: boolean;
  data: T;
  count?: number;
  message?: string;
}

export interface TabRunner {
  runner_id: number;
  betwatch_runner_id: string;
  runner_number: number;
  horse_name: string;
  barrier: number;
  jockey: string;
  trainer: string;
  weight: number;
  tab_fixed_win_price: number | null;
  tab_fixed_place_price: number | null;
  tab_fixed_win_timestamp: string | null;
  tab_fixed_place_timestamp: string | null;
}

export interface TabRace {
  race_id: number;
  betwatch_race_id: string;
  meeting_name: string;
  meeting_location: string;
  meeting_date: string;
  race_number: number;
  race_name: string;
  race_distance: number;
  race_start_time: string;
  race_status: string;
  runners: TabRunner[];
}

export class PostgresAPIClient {
  private baseUrl: string;

  constructor(apiUrl: string) {
    this.baseUrl = apiUrl;
  }

  private async get<T>(endpoint: string): Promise<PostgresAPIResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;
    console.log('🔗 Postgres API Request:', url);

    try {
      const response = await fetch(url, {
        cache: 'no-store',
      });

      console.log('📡 Postgres API Response Status:', response.status, response.statusText);

      if (!response.ok) {
        let errorMsg = response.statusText;
        try {
          const errorData = await response.json();
          errorMsg = errorData.message || errorData.error || errorMsg;
          console.error('❌ Postgres API Error Body:', errorData);
        } catch {
          errorMsg = await response.text().catch(() => errorMsg);
        }
        
        console.error('❌ Postgres API Error:', response.status, errorMsg);
        throw new Error(`Postgres API (${response.status}): ${errorMsg}`);
      }

      const data = await response.json();
      
      // Log summary of response
      if (data.success && Array.isArray(data.data)) {
        console.log('✅ Postgres API Success:', {
          count: data.data.length,
          sampleMeeting: data.data[0]?.meeting_name,
          sampleLocation: data.data[0]?.meeting_location
        });
      } else {
        console.log('⚠️ Postgres API Response:', data);
      }
      
      return data;
    } catch (error: any) {
      console.error('❌ Postgres API Fetch Failed:', {
        url,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Get races by date
   * @param date - Date in YYYY-MM-DD format
   * @param location - Optional location filter: 'AU' for Australia, 'NZ' for New Zealand, or omit for all
   */
  async getRacesByDate(date: string, location?: 'AU' | 'NZ'): Promise<PostgresAPIResponse<TabRace[]>> {
    // For AU, use the known working parameter
    if (location === 'AU') {
      const locationParam = '&location=Australia';
      return this.get(`/api/race-data/races?date=${date}${locationParam}`);
    }
    
    // For NZ, try multiple variations until one works
    if (location === 'NZ') {
      // Try different NZ location parameter variations in order of likelihood
      const nzVariations = [
        'New Zealand',  // Most common
        'NZ',           // Abbreviation
        'NZL',          // ISO code (current)
        'new-zealand'   // URL-friendly
      ];
      
      for (const variant of nzVariations) {
        console.log(`🔍 Trying NZ races with location="${variant}"`);
        
        try {
          const result = await this.get<TabRace[]>(`/api/race-data/races?date=${date}&location=${encodeURIComponent(variant)}`);
          
          if (result.success && result.data && Array.isArray(result.data) && result.data.length > 0) {
            console.log(`✅ Found ${result.data.length} NZ races using location="${variant}"`);
            return result;
          } else {
            console.log(`❌ No races found with location="${variant}"`);
          }
        } catch (err: any) {
          console.log(`❌ Error with location="${variant}":`, err.message);
        }
      }
      
      console.warn(`⚠️ No NZ races found with any location parameter. Trying to filter from all races...`);
      
      // Fallback: Fetch all races and filter by meeting_location
      try {
        const allRacesResult = await this.get<TabRace[]>(`/api/race-data/races?date=${date}`);
        
        if (allRacesResult.success && Array.isArray(allRacesResult.data)) {
          const nzRaces = allRacesResult.data.filter((race: TabRace) => {
            const meetingLoc = (race.meeting_location || '').toLowerCase();
            return meetingLoc.includes('new zealand') || meetingLoc.includes('nz');
          });
          
          if (nzRaces.length > 0) {
            console.log(`✅ Filtered ${nzRaces.length} NZ races from ${allRacesResult.data.length} total races`);
            return {
              success: true,
              data: nzRaces
            };
          }
        }
      } catch (err: any) {
        console.error('❌ Fallback filtering failed:', err.message);
      }
      
      console.warn(`⚠️ No NZ races found with any method`);
      return { success: true, data: [] };
    }
    
    // No location filter - fetch all
    return this.get(`/api/race-data/races?date=${date}`);
  }

  /**
   * Get specific race with runners and TAB odds
   */
  async getRaceById(raceId: string): Promise<PostgresAPIResponse<TabRace>> {
    return this.get(`/api/race-data/races/${raceId}`);
  }

  /**
   * Get race results
   */
  async getRaceResults(raceId: string): Promise<PostgresAPIResponse<any>> {
    return this.get(`/api/race-data/races/${raceId}/results`);
  }
}

export function getPostgresAPIClient(): PostgresAPIClient | null {
  const apiUrl = process.env.POSTGRES_API_URL;

  if (!apiUrl) {
    console.warn('⚠️ POSTGRES_API_URL not set - TAB odds unavailable');
    return null;
  }

  return new PostgresAPIClient(apiUrl);
}
