/**
 * TTR Ratings Client - Punting Form API Integration (PFAI)
 * 
 * This client fetches ratings from Punting Form's /Ratings/MeetingRatings endpoint
 * and transforms them to match the existing TTR data structure.
 */

// PFAI API Response Types
export interface PFAIRunner {
  raceNo: number;
  runnerName: string;
  tabNo: number;
  pfaiScore: number;
  pfaiPrice: number;
  timeRank?: number;
  weightClassRank?: number;
  predictedSettlePostion?: number;
  runStyle?: string;
  isReliable?: boolean;
}

export interface PFAIResponse {
  payLoad: PFAIRunner[];
  statusCode: number;
  status: number;
  error: string | null;
  errors: any[] | null;
}

// Transformed TTR Rating Type (matches existing structure)
export interface TTRRating {
  horse_name: string;
  rating: number;
  price: number;
  tab_number: number;
  race_number: number;
  // Optional metadata from PFAI
  time_rank?: number | null;
  class_rank?: number | null;
  predicted_settle?: number | null;
  run_style?: string | null;
  is_reliable?: boolean;
}

// Response wrapper for consistency with existing code
export interface TTRResponse {
  success: boolean;
  data: TTRRating[];
}

export class TTRRatingsClient {
  private apiKey: string;
  private baseUrl: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
    this.baseUrl = 'https://api.puntingform.com.au/v2';
  }

  private async get<T>(endpoint: string): Promise<T> {
    const url = `${this.baseUrl}${endpoint}&apiKey=${this.apiKey}`;
    
    // Don't log API key in production
    if (process.env.NODE_ENV === 'development') {
      console.log('🔗 PFAI TTR API URL:', url.replace(this.apiKey, '***'));
    }

    const response = await fetch(url, {
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error(`PFAI API request failed: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Transform PFAI runner data to TTR format
   */
  private transformRunner(runner: PFAIRunner): TTRRating {
    return {
      horse_name: runner.runnerName,
      rating: runner.pfaiScore || 0,
      price: runner.pfaiPrice || 999.99,
      tab_number: runner.tabNo || 0,
      race_number: runner.raceNo,
      // Optional metadata
      time_rank: runner.timeRank ?? null,
      class_rank: runner.weightClassRank ?? null,
      predicted_settle: runner.predictedSettlePostion ?? null,
      run_style: runner.runStyle?.trim() || null,
      is_reliable: runner.isReliable !== false,
    };
  }

  /**
   * Get ratings for a specific race
   * @param meetingId - The Punting Form meeting ID
   * @param raceNumber - The race number
   */
  async getRatingsForRace(
    meetingId: string,
    raceNumber: number
  ): Promise<TTRResponse> {
    try {
      console.log('🔍 Fetching PFAI TTR ratings:', { meetingId, raceNumber });

      const response = await this.get<PFAIResponse>(
        `/Ratings/MeetingRatings?meetingId=${meetingId}`
      );

      if (!response.payLoad || !Array.isArray(response.payLoad)) {
        console.warn('⚠️ PFAI response has no payLoad array');
        return {
          success: false,
          data: [],
        };
      }

      // Filter for specific race and transform
      const raceRunners = response.payLoad
        .filter((runner) => runner.raceNo === raceNumber)
        .map((runner) => this.transformRunner(runner));

      console.log(`✅ PFAI TTR ratings retrieved: ${raceRunners.length} runners for race ${raceNumber}`);

      return {
        success: true,
        data: raceRunners,
      };
    } catch (error: any) {
      console.error('❌ PFAI TTR ratings fetch failed:', error.message);
      return {
        success: false,
        data: [],
      };
    }
  }

  /**
   * Get all ratings for a meeting
   * @param meetingId - The Punting Form meeting ID
   */
  async getRatingsForMeeting(meetingId: string): Promise<TTRResponse> {
    try {
      console.log('🔍 Fetching PFAI TTR ratings for meeting:', { meetingId });

      const response = await this.get<PFAIResponse>(
        `/Ratings/MeetingRatings?meetingId=${meetingId}`
      );

      if (!response.payLoad || !Array.isArray(response.payLoad)) {
        console.warn('⚠️ PFAI response has no payLoad array');
        return {
          success: false,
          data: [],
        };
      }

      // Transform all runners
      const allRatings = response.payLoad.map((runner) =>
        this.transformRunner(runner)
      );

      console.log(`✅ PFAI TTR ratings retrieved: ${allRatings.length} total runners`);

      return {
        success: true,
        data: allRatings,
      };
    } catch (error: any) {
      console.error('❌ PFAI TTR ratings fetch failed:', error.message);
      return {
        success: false,
        data: [],
      };
    }
  }
}

/**
 * Factory function to get TTR Ratings Client
 * Returns null if API key is not configured
 */
export function getTTRRatingsClient(): TTRRatingsClient | null {
  // Server-side only check
  if (typeof window !== 'undefined') {
    console.warn('⚠️ getTTRRatingsClient called on client side');
    return null;
  }

  const apiKey = process.env.PUNTING_FORM_API_KEY;

  // Debug logging in development
  if (process.env.NODE_ENV === 'development') {
    console.log('🔍 TTR Ratings Client environment check:', {
      isServer: typeof window === 'undefined',
      hasApiKey: !!apiKey,
    });
  }

  if (!apiKey) {
    console.warn('⚠️ PUNTING_FORM_API_KEY environment variable is not set');
    return null;
  }

  return new TTRRatingsClient(apiKey);
}
