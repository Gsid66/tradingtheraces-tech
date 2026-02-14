// Zod validation schemas for UK & Ireland racing data
import { z } from 'zod';

// Track schema
export const TrackSchema = z.object({
  name: z.string().min(1).max(100),
  country: z.enum(['UK', 'IRE']),
  location: z.string().max(100).optional(),
  track_type: z.enum(['flat', 'jumps', 'mixed']).optional(),
});

// Horse schema
export const HorseSchema = z.object({
  name: z.string().min(1).max(100),
  age: z.number().int().positive().optional(),
  sex: z.string().max(10).optional(),
  color: z.string().max(50).optional(),
  sire: z.string().max(100).optional(),
  dam: z.string().max(100).optional(),
});

// Jockey schema
export const JockeySchema = z.object({
  name: z.string().min(1).max(100),
  allowance: z.number().int().default(0),
});

// Trainer schema
export const TrainerSchema = z.object({
  name: z.string().min(1).max(100),
  location: z.string().max(100).optional(),
});

// Race schema
export const RaceSchema = z.object({
  race_date: z.union([z.date(), z.string()]),
  track_name: z.string().min(1),
  race_number: z.number().int().positive(),
  race_time: z.string().optional(),
  race_name: z.string().max(255).optional(),
  distance: z.string().max(20).optional(),
  race_class: z.string().max(10).optional(),
  race_type: z.string().max(50).optional(),
  prize_money: z.number().optional(),
  going: z.string().max(50).optional(),
  number_of_runners: z.number().int().optional(),
});

// Race Result schema
export const RaceResultSchema = z.object({
  race_date: z.union([z.date(), z.string()]),
  track_name: z.string().min(1),
  race_number: z.number().int().positive(),
  horse_name: z.string().min(1),
  jockey_name: z.string().optional(),
  trainer_name: z.string().optional(),
  
  place: z.number().int().positive().optional(),
  winning_distance: z.string().max(20).optional(),
  finishing_time: z.string().max(20).optional(),
  
  weight: z.string().max(10).optional(),
  age: z.number().int().positive().optional(),
  sex: z.string().max(10).optional(),
  drawn: z.number().int().optional(),
  headgear: z.string().max(50).optional(),
  
  official_rating: z.number().int().optional(),
  rbd_rating: z.number().optional(),
  rbd_rank: z.number().int().optional(),
  pace: z.string().max(20).optional(),
  stall: z.number().int().optional(),
  
  sp_fav: z.boolean().optional(),
  industry_sp: z.string().max(20).optional(),
  betfair_sp: z.string().max(20).optional(),
  ip_min: z.string().max(20).optional(),
  ip_max: z.string().max(20).optional(),
  
  course_winner: z.boolean().optional(),
  distance_winner: z.boolean().optional(),
  
  comment: z.string().optional(),
});

// Race Field schema (pre-race)
export const RaceFieldSchema = z.object({
  race_date: z.union([z.date(), z.string()]),
  track_name: z.string().min(1),
  race_number: z.number().int().positive(),
  horse_name: z.string().min(1),
  jockey_name: z.string().optional(),
  trainer_name: z.string().optional(),
  
  weight: z.string().max(10).optional(),
  age: z.number().int().positive().optional(),
  sex: z.string().max(10).optional(),
  drawn: z.number().int().optional(),
  headgear: z.string().max(50).optional(),
  
  official_rating: z.number().int().optional(),
  rbd_rating: z.number().optional(),
  rbd_rank: z.number().int().optional(),
  
  forecasted_odds: z.string().max(20).optional(),
  predicted_place: z.number().int().optional(),
  
  last_run_days: z.number().int().optional(),
  runs_last_12m: z.number().int().optional(),
  wins_last_12m: z.number().int().optional(),
  places_last_12m: z.number().int().optional(),
  
  course_form: z.string().max(50).optional(),
  distance_form: z.string().max(50).optional(),
  going_form: z.string().max(50).optional(),
  
  comment: z.string().optional(),
});

// Scraper log schema
export const ScraperLogSchema = z.object({
  scraper_type: z.enum(['results', 'ratings', 'historical']),
  scrape_date: z.union([z.date(), z.string()]),
  status: z.enum(['started', 'success', 'failed', 'partial']),
  records_processed: z.number().int().default(0),
  records_imported: z.number().int().default(0),
  records_failed: z.number().int().default(0),
  records_skipped: z.number().int().default(0),
  execution_time_ms: z.number().int().optional(),
  file_path: z.string().optional(),
  error_message: z.string().optional(),
  error_details: z.any().optional(),
});

// Helper function to validate array of results
export function validateResults(data: unknown[]): { valid: z.infer<typeof RaceResultSchema>[]; errors: string[] } {
  const valid: z.infer<typeof RaceResultSchema>[] = [];
  const errors: string[] = [];
  
  data.forEach((item, index) => {
    try {
      const validated = RaceResultSchema.parse(item);
      valid.push(validated);
    } catch (err) {
      if (err instanceof z.ZodError) {
        errors.push(`Row ${index + 1}: ${err.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')}`);
      } else {
        errors.push(`Row ${index + 1}: Unknown validation error`);
      }
    }
  });
  
  return { valid, errors };
}

// Helper function to validate array of fields
export function validateFields(data: unknown[]): { valid: z.infer<typeof RaceFieldSchema>[]; errors: string[] } {
  const valid: z.infer<typeof RaceFieldSchema>[] = [];
  const errors: string[] = [];
  
  data.forEach((item, index) => {
    try {
      const validated = RaceFieldSchema.parse(item);
      valid.push(validated);
    } catch (err) {
      if (err instanceof z.ZodError) {
        errors.push(`Row ${index + 1}: ${err.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')}`);
      } else {
        errors.push(`Row ${index + 1}: Unknown validation error`);
      }
    }
  });
  
  return { valid, errors };
}
