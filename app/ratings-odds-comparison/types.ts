// TypeScript interfaces for Ratings vs Odds Comparison

export interface RatingsOddsData {
  race_date: string;
  track?: string;
  meeting_name?: string;
  race_number: number;
  race_name: string;
  saddle_cloth: number;
  horse_name: string;
  jockey: string | null; // Make nullable since PFAI doesn't provide these
  trainer: string | null; // Make nullable since PFAI doesn't provide these
  rating: number | null;
  price: string | number | null;
  tab_fixed_win?: number | null;
  tab_fixed_place?: number | null;
  isScratched?: boolean;
  scratchingReason?: string;
  scratchingTime?: string;
}

export interface ApiResponse {
  data: RatingsOddsData[];
  total: number;
}
