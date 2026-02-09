import { format } from 'date-fns';
import type { PFMeeting as PFMeetingType } from './types';

// Re-export the complete PFMeeting type
export type { PFMeetingType as PFMeeting };

// Response wrapper for all Punting Form API calls
export interface PuntingFormResponse<T> {
  payLoad: T;
  statusCode: number;
  status: number;
  error: string | null;
  errors: any[] | null;
  message?: string;
  processTime?: number;
  timeStamp?: string;
}

// Track information
export interface PFTrack {
  trackId: string;
  name: string;
  location: string;
  state: string;
  country: string;
  abbrev: string;
  surface: string;
}

// Jockey information
export interface PFJockey {
  jockeyId: string;
  fullName: string;
  isApprentice?: boolean;
  claim?: number;
  ridingWeight?: number;
}

// Trainer information
export interface PFTrainer {
  trainerId: string;
  fullName: string;
  location: string;
}

// Runner information
export interface PFRunner {
  formId: string;
  horseId?: string;
  horseName?: string;
  name?: string;
  runnerId?: number;
  barrierNumber: number;
  originalBarrier?: number;
  tabNumber: number;
  tabNo?: number;
  barrier?: number;
  jockey?: PFJockey;
  jockeyClaim: number;
  trainer?: PFTrainer;
  weight: number;
  handicap: number;
  handicapWeight?: number;
  fixedOdds?: number;
  lastFiveStarts?: string;
  emergencyIndicator: boolean;
  prepRuns: number;
  gearChanges?: string;
  sex?: string;
  colour?: string;
  age?: number;
  foalDate?: string;
  sire?: string;
  dam?: string;
  sireofDam?: string;
  sireDam?: string;
  country?: string;
  careerStarts?: number;
  careerWins?: number;
  careerSeconds?: number;
  careerThirds?: number;
  prizeMoney?: number;
  last10?: string;
  priceSP?: number;
}

// Race information
export interface PFRace {
  raceId: string;
  number: number;
  name: string;
  providerRaceId: string;
  distance: number;
  ageRestrictions?: string;
  jockeyRestrictions?: string;
  sexRestrictions?: string;
  weightType?: string;
  limitWeight?: number;
  raceClass?: string;
  prizeMoney: number;
  prizeMoneyBreakDown?: string;
  startTime: string;
  startTimeUTC: string;
  group?: string;
  bonusScheme?: string;
  description?: string;
  runners?: PFRunner[];
}

// Fields response payload (from /form/fields endpoint)
export interface PFRaceFields {
  track: PFTrack;
  races: PFRace[];
  meetingId: string;
  tabMeeting: boolean;
  railPosition: string;
  meetingDate: string;
  stage: string;
  expectedCondition: string | null;
  isBarrierTrial: boolean;
  isJumps: boolean;
  hasSectionals: boolean;
  formUpdated: string;
  resultsUpdated: string | null;
  sectionalsUpdated: string | null;
  ratingsUpdated: string;
}

// Scratching information (raw API response)
// Note: The API does not provide horseName (only runnerId)
// The reason field is optional and may not be provided by the API
export interface PFScratchingRaw {
  meetingId: string;
  raceId: string;
  runnerId: string;  // API provides runnerId, not horseName
  meetingDate: string;
  meetingDateUTC: string | null;
  track: string;  // API uses 'track', not 'trackName'
  raceNo: number;  // API uses 'raceNo', not 'raceNumber'
  tabNo: number;  // API uses 'tabNo', not 'tabNumber'
  timeStamp: string;  // API uses 'timeStamp', not 'scratchingTime'
  deduction: number;
  country: string;
  code: string;
  reason?: string;  // Optional: may not be provided by API
}

// Scratching information (normalized format used by frontend)
export interface PFScratching {
  meetingId: string;
  raceId: string;
  raceNumber: number;
  trackName: string;
  horseName: string;
  tabNumber: number;
  scratchingTime: string;
  reason?: string;
}

// Track condition information
export interface PFCondition {
  meetingId: string;
  trackName: string;
  trackCondition: string; // e.g., "Good 4", "Heavy 8", "Synthetic"
  railPosition?: string;
  weather?: string;
  updatedAt: string;
}

export class PuntingFormClient {
  private apiKey: string;
  private baseUrl: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
    this.baseUrl = 'https://api.puntingform.com.au/v2';
  }

  private async get<T>(endpoint: string): Promise<T> {
    const url = `${this.baseUrl}${endpoint}&apiKey=${this.apiKey}`;
    console.log('🔗 API URL:', url);

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Get race meetings for a specific date
   */
  async getMeetingsByDate(date: Date): Promise<PuntingFormResponse<PFMeetingType[]>> {
    const formattedDate = format(date, 'dd-MMM-yyyy');
    return this.get(`/form/meetingslist?meetingDate=${formattedDate}&stage=(A)`);
  }

  /**
   * Get today's race meetings
   */
  async getTodaysMeetings(): Promise<PuntingFormResponse<PFMeetingType[]>> {
    return this.getMeetingsByDate(new Date());
  }

  /**
   * Get all races and fields for a specific meeting
   * Uses the /form/fields endpoint which returns full meeting details
   */
  async getAllRacesForMeeting(meetingId: string): Promise<PuntingFormResponse<PFRaceFields>> {
    return this.get(`/form/fields?meetingId=${meetingId}`);
  }

  /**
   * Get results for a specific race
   */
  async getRaceResults(raceId: string): Promise<PuntingFormResponse<any>> {
    return this.get(`/form/results?raceId=${raceId}`);
  }

  /**
   * Get results for a specific meeting
   */
  async getMeetingResults(meetingId: string): Promise<PuntingFormResponse<any>> {
    return this.get(`/form/results?meetingId=${meetingId}`);
  }

  /**
   * Get races for a specific meeting
   */
  async getRacesByMeeting(meetingId: number): Promise<PuntingFormResponse<PFRace[]>> {
    return this.get(`/form/races?meetingId=${meetingId}`);
  }

  /**
   * Get runners for a specific race
   */
  async getRunnersByRace(raceId: number): Promise<PuntingFormResponse<{ runners: PFRunner[] }>> {
    return this.get(`/form/runners?raceId=${raceId}`);
  }

  /**
   * Get results for a specific date
   */
  async getResultsByDate(date: Date): Promise<PuntingFormResponse<any>> {
    const formattedDate = format(date, 'dd-MMM-yyyy');
    return this.get(`/form/results?meetingDate=${formattedDate}`);
  }

  /**
   * Get scratchings for a jurisdiction
   * @param jurisdiction - 0 (AU), 1 (NZ), 2 (International)
   */
  async getScratchings(jurisdiction: number = 0): Promise<PuntingFormResponse<PFScratchingRaw[]>> {
    return this.get(`/Updates/Scratchings?jurisdiction=${jurisdiction}`);
  }

  /**
   * Get track conditions for a jurisdiction
   * @param jurisdiction - 0 (AU), 1 (NZ), 2 (International)
   */
  async getConditions(jurisdiction: number = 0): Promise<PuntingFormResponse<PFCondition[]>> {
    return this.get(`/Updates/Conditions?jurisdiction=${jurisdiction}`);
  }
}

export function getPuntingFormClient(): PuntingFormClient {
  const apiKey = process.env.PUNTING_FORM_API_KEY;

  if (!apiKey) {
    throw new Error('PUNTING_FORM_API_KEY environment variable is not set');
  }

  return new PuntingFormClient(apiKey);
}