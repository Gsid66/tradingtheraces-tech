import { PFMeetingsListResponse, PFFieldsResponse } from './types';

export class PuntingFormClient {
  private readonly apiKey: string;
  private readonly baseUrl = 'https://api.puntingform.com.au/v2';
  private readonly headers = {
    'accept': 'application/json',
    'User-Agent': 'ReadMe-API-Explorer'
  };

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  private formatDate(date: Date): string {
    const day = date.getDate().toString().padStart(2, '0');
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = months[date.getMonth()];
    const year = date. getFullYear();
    return `${day}-${month}-${year}`;
  }

  async getMeetings(date: Date, stage: 'A' | 'W' | 'N' = 'A'): Promise<PFMeetingsListResponse> {
    const dateStr = this.formatDate(date);
    const stageEncoded = encodeURIComponent(`(${stage})`);
    const url = `${this.baseUrl}/form/meetingslist?meetingDate=${dateStr}&stage=${stageEncoded}&apiKey=${this.apiKey}`;
    
    console.log('🔗 API URL:', url);
    
    const response = await fetch(url, { headers: this.headers });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`PF API error: ${response.status} ${response. statusText} - ${errorText}`);
    }
    
    const data: PFMeetingsListResponse = await response.json();
    
    if (data. statusCode !== 200) {
      throw new Error(`PF API returned error: ${data.error}`);
    }
    
    return data;
  }

  async getFields(meetingId:  string, raceNumber: number = 0): Promise<PFFieldsResponse> {
    const url = `${this.baseUrl}/form/fields?meetingId=${meetingId}&raceNumber=${raceNumber}&apiKey=${this.apiKey}`;
    
    const response = await fetch(url, { headers: this.headers });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`PF API error: ${response.status} ${response.statusText} - ${errorText}`);
    }
    
    const data: PFFieldsResponse = await response.json();
    
    if (data.statusCode !== 200) {
      throw new Error(`PF API returned error: ${data.error}`);
    }
    
    return data;
  }

  async getTodaysMeetings(stage: 'A' | 'W' | 'N' = 'A') {
    return this.getMeetings(new Date(), stage);
  }

  async getAllRacesForMeeting(meetingId:  string) {
    return this.getFields(meetingId, 0);
  }

  async getSingleRace(meetingId: string, raceNumber:  number) {
    return this.getFields(meetingId, raceNumber);
  }
}

let clientInstance: PuntingFormClient | null = null;

export function getPuntingFormClient(): PuntingFormClient {
  if (!clientInstance) {
    const apiKey = process.env. PUNTING_FORM_API_KEY;
    
    if (!apiKey) {
      throw new Error('PUNTING_FORM_API_KEY environment variable is not set');
    }
    
    clientInstance = new PuntingFormClient(apiKey);
  }
  
  return clientInstance;
}