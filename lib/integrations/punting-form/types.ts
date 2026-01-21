export interface PFTrack {
  name: string;
  trackId: string;
  location: string;
  state: string;
  country: string;
  abbrev: string;
  surface: string | null;
}

export interface PFMeeting {
  track: PFTrack;
  races: number | null;
  meetingId:  string;
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

export interface PFMeetingsListResponse {
  statusCode: number;
  status:  number;
  error: string | null;
  errors: any[] | null;
  payLoad: PFMeeting[];
  processTime: number;
  timeStamp: string;
}

export interface PFTrainer {
  fullName: string;
  trainerId: string;
  location: string;
}

export interface PFJockey {
  jockeyId: string;
  fullName:  string;
  isApprentice?:  boolean;    // ← Add this
  claim?: number;            // ← Add this
  ridingWeight?: number;
}

export interface PFRunner {
  horseName?:  string;
  barrierNumber?: number;
  tabNumber?: number;
  jockey?: PFJockey;
  trainer?: PFTrainer;
  weight?: number;
  fixedOdds?: number | null;
  lastFiveStarts?: string;
  [key: string]: any;
}

export interface PFRace {
  raceNumber?:  number;
  raceName?: string | null;
  raceTime?: string;
  distance?: number;
  raceClass?: string;
  runners?: PFRunner[];
  [key: string]: any;
}

export interface PFFieldsPayload {
  track: PFTrack;
  races: PFRace[];
}

export interface PFFieldsResponse {
  statusCode: number;
  status: number;
  error: string | null;
  errors: any[] | null;
  payLoad: PFFieldsPayload;  // ← Changed from PFRace[] to object with track and races
  processTime:  number;
  timeStamp:  string;
}