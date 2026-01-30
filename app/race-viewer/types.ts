// TypeScript interfaces for Race Viewer

export interface RaceResultData {
  race_id: number;  // Changed from result_id
  meeting_date: string;
  track_name: string;
  state: string;
  country: string;
  race_number: number;
  race_name: string;
  distance: number;
  start_time: string;
  horse_name: string;
  finishing_position: number;
  tab_number: number;
  jockey_name: string;
  trainer_name: string;
  starting_price: string | number;
  margin_to_winner: string | number;
}

export interface FilterParams {
  dateFrom?: string;
  dateTo?: string;
  horseName?: string;
  jockeyName?: string;
  trainerName?: string;
  trackName?: string;
  state?: string;
  position?: string;
  limit?: number;
  offset?: number;
}

export interface ApiResponse {
  data: RaceResultData[];
  total: number;
}

export type SortField = keyof RaceResultData;
export type SortDirection = 'asc' | 'desc';