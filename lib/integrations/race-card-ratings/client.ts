export interface TTRRating {
  race_date: string;
  track: string;
  race_name: string;
  race_number: number;
  saddle_cloth: number;
  horse_name: string;
  jockey: string | null;
  trainer: string | null;
  rating: number | null;
  price: number | null;
}

export interface TTRResponse {
  success: boolean;
  data: TTRRating[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export class RaceCardRatingsClient {
  private baseUrl: string;

  constructor(apiUrl: string) {
    this.baseUrl = apiUrl;
  }

  private async get<T>(endpoint: string): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    console.log('🔗 Race Cards API URL:', url);

    const response = await fetch(url, {
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error(`Race Cards API request failed: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Get ratings by date and track
   */
  async getRatingsByDate(date: string, track?: string): Promise<TTRResponse> {
    const params = new URLSearchParams();
    params.set('start_date', date);
    params.set('end_date', date);
    params.set('limit', '500');
    
    if (track) {
      params.set('track', track);
    }
    
    return this.get(`/api/races?${params.toString()}`);
  }

  /**
   * Get ratings for specific race
   */
  async getRatingsForRace(
    date: string, 
    track: string, 
    raceNumber: number
  ): Promise<TTRResponse> {
    const params = new URLSearchParams();
    params.set('start_date', date);
    params.set('end_date', date);
    params.set('track', track);
    params.set('limit', '500');
    
    const response = await this.get<TTRResponse>(`/api/races?${params.toString()}`);
    
    // Filter by race number
    const filteredData = response.data.filter(r => r.race_number === raceNumber);
    
    return {
      ...response,
      data: filteredData
    };
  }
}

export function getRaceCardRatingsClient(): RaceCardRatingsClient | null {
  const apiUrl = process.env.RACE_CARD_RATINGS_API_URL;

  if (!apiUrl) {
    console.warn('⚠️ RACE_CARD_RATINGS_API_URL not set');
    return null;
  }

  return new RaceCardRatingsClient(apiUrl);
}
