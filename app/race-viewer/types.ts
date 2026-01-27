// TypeScript interfaces for Race Viewer

export interface RaceCardData {
  date: string; // "2026-01-28"
  meeting_name: string;
  race_number: number;
  race_name: string;
  saddle_number: number;
  horse_name: string;
  jockey: string;
  trainer: string;
  rating: number;
  price: number;
  tab_fixed_win_price?: number | null;
  tab_fixed_place_price?: number | null;
}

export interface FilterParams {
  dateFrom?: string;
  dateTo?: string;
  meeting_name?: string;
  state?: string;
  race_number?: number;
  horse_name?: string;
  jockey?: string;
  trainer?: string;
  minRating?: number;
  maxRating?: number;
  page?: number;
  perPage?: number;
}

export interface ApiResponse {
  data: RaceCardData[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
}

export type SortField = keyof RaceCardData;
export type SortDirection = 'asc' | 'desc';
