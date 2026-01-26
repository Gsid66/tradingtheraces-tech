export interface TTRRating {
  horse_name: string;
  runner_number: number;
  ttr_rating: number;
  ttr_price: number;
  meeting_name: string;
  race_number: number;
  meeting_date: string;
}

export interface TTRResponse {
  success: boolean;
  data: TTRRating[];
  count: number;
}

export class RaceCardRatingsClient {
  private baseUrl: string;

  constructor(apiUrl: string) {
    this.baseUrl = apiUrl;
  }

  private async get<T>(endpoint: string): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    console.log('🔗 TTR Ratings API URL:', url);

    const response = await fetch(url, {
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error(`TTR Ratings API request failed: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Get TTR ratings by date
   */
  async getRatingsByDate(date: string, track?: string): Promise<TTRResponse> {
    let endpoint = `/api/ratings?date=${date}`;
    if (track) {
      endpoint += `&track=${track}`;
    }
    return this.get(endpoint);
  }

  /**
   * Get TTR ratings for specific race
   */
  async getRatingsForRace(date: string, track: string, raceNumber: number): Promise<TTRResponse> {
    return this.get(`/api/ratings?date=${date}&track=${track}&race=${raceNumber}`);
  }
}

export function getRaceCardRatingsClient(): RaceCardRatingsClient {
  const apiUrl = process.env.RACE_CARD_RATINGS_API_URL;

  if (!apiUrl) {
    console.warn('RACE_CARD_RATINGS_API_URL environment variable is not set');
    throw new Error('RACE_CARD_RATINGS_API_URL environment variable is not set');
  }

  return new RaceCardRatingsClient(apiUrl);
}
