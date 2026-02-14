// TypeScript interfaces for UK & Ireland racing data

export interface Track {
  id?: number;
  name: string;
  country: 'UK' | 'IRE';
  location?: string;
  track_type?: 'flat' | 'jumps' | 'mixed';
}

export interface Horse {
  id?: number;
  name: string;
  age?: number;
  sex?: string;
  color?: string;
  sire?: string;
  dam?: string;
}

export interface Jockey {
  id?: number;
  name: string;
  allowance?: number;
}

export interface Trainer {
  id?: number;
  name: string;
  location?: string;
}

export interface Race {
  id?: number;
  race_date: Date | string;
  track_id?: number;
  track_name?: string;
  race_number: number;
  race_time?: string;
  race_name?: string;
  distance?: string; // e.g., "2m3½f", "1m7½f"
  race_class?: string;
  race_type?: string;
  prize_money?: number;
  going?: string;
  number_of_runners?: number;
}

export interface RaceResult {
  id?: number;
  race_id?: number;
  horse_id?: number;
  jockey_id?: number;
  trainer_id?: number;
  
  // Race data from CSV
  race_date?: Date | string;
  track_name?: string;
  race_number?: number;
  horse_name?: string;
  jockey_name?: string;
  trainer_name?: string;
  
  // Result data
  place?: number;
  winning_distance?: string;
  finishing_time?: string;
  
  // Horse details
  weight?: string; // stone-pounds format
  age?: number;
  sex?: string;
  drawn?: number;
  headgear?: string;
  
  // Performance metrics
  official_rating?: number;
  rbd_rating?: number;
  rbd_rank?: number;
  pace?: string;
  stall?: number;
  
  // Odds
  sp_fav?: boolean;
  industry_sp?: string;
  betfair_sp?: string;
  ip_min?: string;
  ip_max?: string;
  
  // Historical flags
  course_winner?: boolean;
  distance_winner?: boolean;
  
  comment?: string;
}

export interface RaceField {
  id?: number;
  race_id?: number;
  horse_id?: number;
  jockey_id?: number;
  trainer_id?: number;
  
  // Pre-race data from CSV
  race_date?: Date | string;
  track_name?: string;
  race_number?: number;
  horse_name?: string;
  jockey_name?: string;
  trainer_name?: string;
  
  // Pre-race details
  weight?: string;
  age?: number;
  sex?: string;
  drawn?: number;
  headgear?: string;
  
  // Ratings
  official_rating?: number;
  rbd_rating?: number;
  rbd_rank?: number;
  
  // Forecasts
  forecasted_odds?: string;
  predicted_place?: number;
  
  // Historical performance
  last_run_days?: number;
  runs_last_12m?: number;
  wins_last_12m?: number;
  places_last_12m?: number;
  
  // Form
  course_form?: string;
  distance_form?: string;
  going_form?: string;
  
  comment?: string;
}

export interface ScraperLog {
  id?: number;
  scraper_type: 'results' | 'ratings' | 'historical';
  scrape_date: Date | string;
  status: 'started' | 'success' | 'failed' | 'partial';
  
  records_processed?: number;
  records_imported?: number;
  records_failed?: number;
  records_skipped?: number;
  
  execution_time_ms?: number;
  file_path?: string;
  error_message?: string;
  error_details?: any;
}

export interface ScraperResult {
  success: boolean;
  recordsImported: number;
  recordsProcessed: number;
  recordsFailed: number;
  recordsSkipped: number;
  executionTime: number;
  message?: string;
  errors?: string[];
}

export interface ParsedCSVData {
  results?: RaceResult[];
  fields?: RaceField[];
  errors?: string[];
}

export interface ImportResult {
  success: boolean;
  recordsImported: number;
  errors: string[];
}

// Column mapping for CSV files
export interface CSVColumnMapping {
  // Common columns
  date?: string;
  track?: string;
  race_number?: string;
  horse?: string;
  jockey?: string;
  trainer?: string;
  
  // Results specific
  place?: string;
  winning_distance?: string;
  finishing_time?: string;
  
  // Common metrics
  weight?: string;
  age?: string;
  distance?: string;
  going?: string;
  official_rating?: string;
  rbd_rating?: string;
  rbd_rank?: string;
  
  // Odds
  sp?: string;
  betfair_sp?: string;
  
  // Pre-race specific
  forecasted_odds?: string;
  predicted_place?: string;
}
