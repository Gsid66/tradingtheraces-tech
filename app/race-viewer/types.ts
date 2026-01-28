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
    // API response structure
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
  // Normalized pagination fields used by the app
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
}

export type SortField = keyof RaceCardData;
export type SortDirection = 'asc' | 'desc';
