// TypeScript interfaces for Race Viewer

export interface RaceCardData {
  race_date: string; // "2026-01-28T00:00:00.000Z"
  track?: string; // Track/meeting name (primary field)
  meeting_name?: string; // Alternative field name from API
  race_number: number;
  race_name: string;
  saddle_cloth: number;
  horse_name: string;
  jockey: string;
  trainer: string;
  rating: number | null;
  price: string | number | null;
}

export interface FilterParams {
  dateFrom?: string;
  dateTo?: string;
}

export interface ApiResponse {
  data: RaceCardData[];
  total: number;
}

export type SortField = keyof RaceCardData;
export type SortDirection = 'asc' | 'desc';
