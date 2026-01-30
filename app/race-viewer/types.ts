// TypeScript interfaces for Race Viewer

export interface CombinedRaceData {
  id: number;
  race_date: string;
  track_name: string;
  state?: string;
  country?: string;
  race_number: number;
  race_name: string;
  saddle_cloth: number;
  horse_name: string;
  jockey_name: string;
  trainer_name: string;
  rating: number;
  price: number;
  finishing_position?: number;
  starting_price?: string | number;
  margin_to_winner?: string | number;
  tab_number?: number;
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
  data: CombinedRaceData[];
  total: number;
}

export type SortField = keyof CombinedRaceData;
export type SortDirection = 'asc' | 'desc';