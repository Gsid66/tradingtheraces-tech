import { format } from 'date-fns';

export interface PuntingFormResponse<T> {
  payLoad: T;
  statusCode: number;
  message: string;
}

export interface PFTrack {
  trackId:  string;
  name:  string;
  location: string;
  state: string;
  country: string;
  abbrev:  string;
  surface: string;
}

export interface PFMeeting {
  meetingId: string;
  track:  PFTrack;
  meetingDate: string;
  stage: string;
}

export interface PFJockey {
  jockeyId: string;
  fullName: string;
  isApprentice?: boolean;
  claim?: number;
  ridingWeight?: number;
}

export interface PFTrainer {
  trainerId: string;
  fullName: string;
  location:   string;
}

export interface PFRunner {
  formId:  string;
  horseId? :  string;
  horseName?: string;
  name?:  string;
  runnerId?:   number;
  barrierNumber:  number;
  originalBarrier?:  number;
  tabNumber: number;
  tabNo?: number;
  barrier?: number;
  jockey?:  PFJockey;
  jockeyClaim: number;
  trainer?:  PFTrainer;
  weight: number;
  handicap:   number;
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
  country?:  string;
  careerStarts?: number;
  careerWins?:  number;
  careerSeconds? :  number;
  careerThirds?: number;
  prizeMoney?: number;
  last10?: string;
  priceSP?: number;
}

export interface PFRace {
  raceId:  string;
  number: number;
  name: string;
  providerRaceId: string;
  distance: number;
  ageRestrictions?: string;
  jockeyRestrictions?: string;
  sexRestrictions?: string;
  weightType?: string;
  limitWeight?:  number;
  raceClass?:  string;
  prizeMoney:  number;
  prizeMoneyBreakDown?: string;
  startTime: string;
  startTimeUTC: string;
  group?: string;
  bonusScheme?: string;
  description?: string;
  runners?:   PFRunner[];
}

export interface PFRaceFields {
  races: PFRace[];
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
  async getMeetingsByDate(date: Date): Promise<PuntingFormResponse<PFMeeting[]>> {
    const formattedDate = format(date, 'dd-MMM-yyyy');
    return this.get(`/form/meetingslist?meetingDate=${formattedDate}&stage=(A)`);
  }

  /**
   * Get today's race meetings
   */
  async getTodaysMeetings(): Promise<PuntingFormResponse<PFMeeting[]>> {
    return this.getMeetingsByDate(new Date());
  }

  /**
   * Get all races and fields for a specific meeting
   */
  async getAllRacesForMeeting(meetingId:   string): Promise<PuntingFormResponse<PFRaceFields>> {
    return this.get(`/form/alltabformguideformeeting?meetingId=${meetingId}`);
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
  async getRunnersByRace(raceId:  number): Promise<PuntingFormResponse<{ runners: PFRunner[] }>> {
    return this.get(`/form/runners?raceId=${raceId}`);
  }

  /**
   * Get results for a specific date
   */
  async getResultsByDate(date:  Date): Promise<PuntingFormResponse<any>> {
    const formattedDate = format(date, 'dd-MMM-yyyy');
    return this.get(`/form/results?meetingDate=${formattedDate}`);
  }
}

export function getPuntingFormClient(): PuntingFormClient {
  const apiKey = process.env.PUNTING_FORM_API_KEY;

  if (!apiKey) {
    throw new Error('PUNTING_FORM_API_KEY environment variable is not set');
  }

  return new PuntingFormClient(apiKey);
}