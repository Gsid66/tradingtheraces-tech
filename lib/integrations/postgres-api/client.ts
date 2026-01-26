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
    console.log('🔗 Postgres API URL:', url);

    try {
      const response = await fetch(url, {
        cache: 'no-store',
      });

      if (!response.ok) {
        // Get actual error message from API
        let errorMsg = response.statusText;
        try {
          const errorData = await response.json();
          errorMsg = errorData.message || errorData.error || errorMsg;
        } catch {
          errorMsg = await response.text().catch(() => errorMsg);
        }
        
        console.error('❌ Postgres API Error:', response.status, errorMsg);
        throw new Error(`Postgres API (${response.status}): ${errorMsg}`);
      }

      return response.json();
    } catch (error: any) {
      console.error('❌ Postgres API Fetch Failed:', error.message);
      throw error;
    }
  }

  /**
   * Get races by date
   */
  async getRacesByDate(date: string, venue: string = 'all'): Promise<PostgresAPIResponse<TabRace[]>> {
    return this.get(`/api/race-data/races?date=${date}&venue=${venue}`);
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
