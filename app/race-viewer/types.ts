// TypeScript interfaces for Race Viewer

export interface RaceCardData {
  race_date: string; // "2026-01-28T00:00:00.000Z"
  track: string; // Changed from meeting_name
  race_number: number;
  race_name: string;
  saddle_cloth: number;
  horse_name: string;
  jockey: string;
  trainer: string;
  rating: number | null;
  price: string | number | null;
  tab_fixed_win?: number | null;
  tab_fixed_place?: number | null;
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
  pagination?: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
}

export type SortField = keyof RaceCardData;
export type SortDirection = 'asc' | 'desc';
