// Database importer for UK & Ireland racing data
import { Pool, PoolClient } from 'pg';
import { RaceResult, RaceField, ImportResult, Track, Horse, Jockey, Trainer, Race } from './types';
import { getTrackCountry, normalizeTrackName, DB_BATCH_SIZE } from './config';

/**
 * Import results data into the database
 */
export async function importResults(
  pool: Pool,
  results: RaceResult[],
  logId?: number
): Promise<ImportResult> {
  const client = await pool.connect();
  const errors: string[] = [];
  let recordsImported = 0;
  
  try {
    await client.query('BEGIN');
    
    // Process in batches
    for (let i = 0; i < results.length; i += DB_BATCH_SIZE) {
      const batch = results.slice(i, i + DB_BATCH_SIZE);
      
      for (const result of batch) {
        try {
          // Get or create track
          const trackId = await getOrCreateTrack(client, {
            name: normalizeTrackName(result.track_name!),
            country: getTrackCountry(result.track_name!),
          });
          
          // Get or create horse
          const horseId = await getOrCreateHorse(client, {
            name: result.horse_name!,
            age: result.age,
            sex: result.sex,
          });
          
          // Get or create jockey
          const jockeyId = result.jockey_name 
            ? await getOrCreateJockey(client, { name: result.jockey_name })
            : undefined;
          
          // Get or create trainer
          const trainerId = result.trainer_name
            ? await getOrCreateTrainer(client, { name: result.trainer_name })
            : undefined;
          
          // Get or create race
          const raceId = await getOrCreateRace(client, {
            race_date: result.race_date!,
            track_id: trackId,
            race_number: result.race_number!,
          });
          
          // Insert or update result
          await upsertResult(client, { ...result, race_id: raceId, horse_id: horseId, jockey_id: jockeyId, trainer_id: trainerId });
          
          recordsImported++;
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Unknown error';
          errors.push(`Failed to import result for ${result.horse_name}: ${message}`);
        }
      }
    }
    
    await client.query('COMMIT');
    
    // Update scraper log if provided
    if (logId) {
      await updateScraperLog(pool, logId, {
        status: errors.length === 0 ? 'success' : 'partial',
        records_imported: recordsImported,
        records_failed: errors.length,
      });
    }
    
    return {
      success: errors.length === 0,
      recordsImported,
      errors,
    };
  } catch (error) {
    await client.query('ROLLBACK');
    const message = error instanceof Error ? error.message : 'Unknown error';
    errors.push(`Transaction failed: ${message}`);
    
    if (logId) {
      await updateScraperLog(pool, logId, {
        status: 'failed',
        error_message: message,
      });
    }
    
    return {
      success: false,
      recordsImported: 0,
      errors,
    };
  } finally {
    client.release();
  }
}

/**
 * Import race fields data into the database
 */
export async function importFields(
  pool: Pool,
  fields: RaceField[],
  logId?: number
): Promise<ImportResult> {
  const client = await pool.connect();
  const errors: string[] = [];
  let recordsImported = 0;
  
  try {
    await client.query('BEGIN');
    
    // Process in batches
    for (let i = 0; i < fields.length; i += DB_BATCH_SIZE) {
      const batch = fields.slice(i, i + DB_BATCH_SIZE);
      
      for (const field of batch) {
        try {
          // Get or create track
          const trackId = await getOrCreateTrack(client, {
            name: normalizeTrackName(field.track_name!),
            country: getTrackCountry(field.track_name!),
          });
          
          // Get or create horse
          const horseId = await getOrCreateHorse(client, {
            name: field.horse_name!,
            age: field.age,
            sex: field.sex,
          });
          
          // Get or create jockey
          const jockeyId = field.jockey_name
            ? await getOrCreateJockey(client, { name: field.jockey_name })
            : undefined;
          
          // Get or create trainer
          const trainerId = field.trainer_name
            ? await getOrCreateTrainer(client, { name: field.trainer_name })
            : undefined;
          
          // Get or create race
          const raceId = await getOrCreateRace(client, {
            race_date: field.race_date!,
            track_id: trackId,
            race_number: field.race_number!,
          });
          
          // Insert or update field
          await upsertField(client, { ...field, race_id: raceId, horse_id: horseId, jockey_id: jockeyId, trainer_id: trainerId });
          
          recordsImported++;
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Unknown error';
          errors.push(`Failed to import field for ${field.horse_name}: ${message}`);
        }
      }
    }
    
    await client.query('COMMIT');
    
    // Update scraper log if provided
    if (logId) {
      await updateScraperLog(pool, logId, {
        status: errors.length === 0 ? 'success' : 'partial',
        records_imported: recordsImported,
        records_failed: errors.length,
      });
    }
    
    return {
      success: errors.length === 0,
      recordsImported,
      errors,
    };
  } catch (error) {
    await client.query('ROLLBACK');
    const message = error instanceof Error ? error.message : 'Unknown error';
    errors.push(`Transaction failed: ${message}`);
    
    if (logId) {
      await updateScraperLog(pool, logId, {
        status: 'failed',
        error_message: message,
      });
    }
    
    return {
      success: false,
      recordsImported: 0,
      errors,
    };
  } finally {
    client.release();
  }
}

/**
 * Get or create track
 */
async function getOrCreateTrack(client: PoolClient, track: Partial<Track>): Promise<number> {
  const { name, country } = track;
  
  // Try to find existing
  const findResult = await client.query(
    'SELECT id FROM uk_tracks WHERE name = $1 AND country = $2',
    [name, country]
  );
  
  if (findResult.rows.length > 0) {
    return findResult.rows[0].id;
  }
  
  // Create new
  const insertResult = await client.query(
    `INSERT INTO uk_tracks (name, country, location, track_type) 
     VALUES ($1, $2, $3, $4) 
     ON CONFLICT (name, country) DO UPDATE SET updated_at = NOW()
     RETURNING id`,
    [name, country, track.location || null, track.track_type || null]
  );
  
  return insertResult.rows[0].id;
}

/**
 * Get or create horse
 */
async function getOrCreateHorse(client: PoolClient, horse: Partial<Horse>): Promise<number> {
  const { name } = horse;
  
  // Try to find existing
  const findResult = await client.query(
    'SELECT id FROM uk_horses WHERE name = $1',
    [name]
  );
  
  if (findResult.rows.length > 0) {
    return findResult.rows[0].id;
  }
  
  // Create new
  const insertResult = await client.query(
    `INSERT INTO uk_horses (name, age, sex, color, sire, dam) 
     VALUES ($1, $2, $3, $4, $5, $6) 
     ON CONFLICT (name) DO UPDATE SET updated_at = NOW()
     RETURNING id`,
    [name, horse.age || null, horse.sex || null, horse.color || null, horse.sire || null, horse.dam || null]
  );
  
  return insertResult.rows[0].id;
}

/**
 * Get or create jockey
 */
async function getOrCreateJockey(client: PoolClient, jockey: Partial<Jockey>): Promise<number> {
  const { name } = jockey;
  
  // Try to find existing
  const findResult = await client.query(
    'SELECT id FROM uk_jockeys WHERE name = $1',
    [name]
  );
  
  if (findResult.rows.length > 0) {
    return findResult.rows[0].id;
  }
  
  // Create new
  const insertResult = await client.query(
    `INSERT INTO uk_jockeys (name, allowance) 
     VALUES ($1, $2) 
     ON CONFLICT (name) DO UPDATE SET updated_at = NOW()
     RETURNING id`,
    [name, jockey.allowance || 0]
  );
  
  return insertResult.rows[0].id;
}

/**
 * Get or create trainer
 */
async function getOrCreateTrainer(client: PoolClient, trainer: Partial<Trainer>): Promise<number> {
  const { name } = trainer;
  
  // Try to find existing
  const findResult = await client.query(
    'SELECT id FROM uk_trainers WHERE name = $1',
    [name]
  );
  
  if (findResult.rows.length > 0) {
    return findResult.rows[0].id;
  }
  
  // Create new
  const insertResult = await client.query(
    `INSERT INTO uk_trainers (name, location) 
     VALUES ($1, $2) 
     ON CONFLICT (name) DO UPDATE SET updated_at = NOW()
     RETURNING id`,
    [name, trainer.location || null]
  );
  
  return insertResult.rows[0].id;
}

/**
 * Get or create race
 */
async function getOrCreateRace(client: PoolClient, race: Partial<Race> & { track_id: number }): Promise<number> {
  const { race_date, track_id, race_number } = race;
  
  // Try to find existing
  const findResult = await client.query(
    'SELECT id FROM uk_races WHERE race_date = $1 AND track_id = $2 AND race_number = $3',
    [race_date, track_id, race_number]
  );
  
  if (findResult.rows.length > 0) {
    return findResult.rows[0].id;
  }
  
  // Create new
  const insertResult = await client.query(
    `INSERT INTO uk_races (race_date, track_id, race_number, race_time, race_name, distance, race_class, race_type, prize_money, going, number_of_runners) 
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) 
     ON CONFLICT (race_date, track_id, race_number) DO UPDATE SET updated_at = NOW()
     RETURNING id`,
    [
      race_date, 
      track_id, 
      race_number, 
      race.race_time || null, 
      race.race_name || null, 
      race.distance || null, 
      race.race_class || null, 
      race.race_type || null, 
      race.prize_money || null, 
      race.going || null, 
      race.number_of_runners || null
    ]
  );
  
  return insertResult.rows[0].id;
}

/**
 * Upsert result
 */
async function upsertResult(client: PoolClient, result: Partial<RaceResult> & { race_id: number; horse_id: number }): Promise<void> {
  await client.query(
    `INSERT INTO uk_results (
      race_id, horse_id, jockey_id, trainer_id, place, winning_distance, finishing_time,
      weight, age, sex, drawn, headgear, official_rating, rbd_rating, rbd_rank,
      pace, stall, sp_fav, industry_sp, betfair_sp, ip_min, ip_max,
      course_winner, distance_winner, comment
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25)
    ON CONFLICT (race_id, horse_id) DO UPDATE SET
      jockey_id = EXCLUDED.jockey_id,
      trainer_id = EXCLUDED.trainer_id,
      place = EXCLUDED.place,
      winning_distance = EXCLUDED.winning_distance,
      finishing_time = EXCLUDED.finishing_time,
      weight = EXCLUDED.weight,
      age = EXCLUDED.age,
      sex = EXCLUDED.sex,
      drawn = EXCLUDED.drawn,
      headgear = EXCLUDED.headgear,
      official_rating = EXCLUDED.official_rating,
      rbd_rating = EXCLUDED.rbd_rating,
      rbd_rank = EXCLUDED.rbd_rank,
      pace = EXCLUDED.pace,
      stall = EXCLUDED.stall,
      sp_fav = EXCLUDED.sp_fav,
      industry_sp = EXCLUDED.industry_sp,
      betfair_sp = EXCLUDED.betfair_sp,
      ip_min = EXCLUDED.ip_min,
      ip_max = EXCLUDED.ip_max,
      course_winner = EXCLUDED.course_winner,
      distance_winner = EXCLUDED.distance_winner,
      comment = EXCLUDED.comment,
      updated_at = NOW()`,
    [
      result.race_id,
      result.horse_id,
      result.jockey_id,
      result.trainer_id,
      result.place,
      result.winning_distance,
      result.finishing_time,
      result.weight,
      result.age,
      result.sex,
      result.drawn,
      result.headgear,
      result.official_rating,
      result.rbd_rating,
      result.rbd_rank,
      result.pace,
      result.stall,
      result.sp_fav,
      result.industry_sp,
      result.betfair_sp,
      result.ip_min,
      result.ip_max,
      result.course_winner,
      result.distance_winner,
      result.comment,
    ]
  );
}

/**
 * Upsert field
 */
async function upsertField(client: PoolClient, field: Partial<RaceField> & { race_id: number; horse_id: number }): Promise<void> {
  await client.query(
    `INSERT INTO uk_race_fields (
      race_id, horse_id, jockey_id, trainer_id, weight, age, sex, drawn, headgear,
      official_rating, rbd_rating, rbd_rank, forecasted_odds, predicted_place,
      last_run_days, runs_last_12m, wins_last_12m, places_last_12m,
      course_form, distance_form, going_form, comment
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22)
    ON CONFLICT (race_id, horse_id) DO UPDATE SET
      jockey_id = EXCLUDED.jockey_id,
      trainer_id = EXCLUDED.trainer_id,
      weight = EXCLUDED.weight,
      age = EXCLUDED.age,
      sex = EXCLUDED.sex,
      drawn = EXCLUDED.drawn,
      headgear = EXCLUDED.headgear,
      official_rating = EXCLUDED.official_rating,
      rbd_rating = EXCLUDED.rbd_rating,
      rbd_rank = EXCLUDED.rbd_rank,
      forecasted_odds = EXCLUDED.forecasted_odds,
      predicted_place = EXCLUDED.predicted_place,
      last_run_days = EXCLUDED.last_run_days,
      runs_last_12m = EXCLUDED.runs_last_12m,
      wins_last_12m = EXCLUDED.wins_last_12m,
      places_last_12m = EXCLUDED.places_last_12m,
      course_form = EXCLUDED.course_form,
      distance_form = EXCLUDED.distance_form,
      going_form = EXCLUDED.going_form,
      comment = EXCLUDED.comment,
      updated_at = NOW()`,
    [
      field.race_id,
      field.horse_id,
      field.jockey_id,
      field.trainer_id,
      field.weight,
      field.age,
      field.sex,
      field.drawn,
      field.headgear,
      field.official_rating,
      field.rbd_rating,
      field.rbd_rank,
      field.forecasted_odds,
      field.predicted_place,
      field.last_run_days,
      field.runs_last_12m,
      field.wins_last_12m,
      field.places_last_12m,
      field.course_form,
      field.distance_form,
      field.going_form,
      field.comment,
    ]
  );
}

/**
 * Create scraper log entry
 */
export async function createScraperLog(
  pool: Pool,
  scraper_type: 'results' | 'ratings' | 'historical',
  scrape_date: string,
  file_path?: string
): Promise<number> {
  const result = await pool.query(
    `INSERT INTO scraper_logs (scraper_type, scrape_date, status, file_path) 
     VALUES ($1, $2, 'started', $3) 
     RETURNING id`,
    [scraper_type, scrape_date, file_path || null]
  );
  
  return result.rows[0].id;
}

/**
 * Update scraper log
 */
export async function updateScraperLog(
  pool: Pool,
  id: number,
  updates: {
    status?: 'started' | 'success' | 'failed' | 'partial';
    records_processed?: number;
    records_imported?: number;
    records_failed?: number;
    records_skipped?: number;
    execution_time_ms?: number;
    file_path?: string;
    error_message?: string;
    error_details?: unknown;
  }
): Promise<void> {
  const fields: string[] = [];
  const values: unknown[] = [];
  let paramIndex = 1;
  
  Object.entries(updates).forEach(([key, value]) => {
    if (value !== undefined) {
      fields.push(`${key} = $${paramIndex}`);
      values.push(value);
      paramIndex++;
    }
  });
  
  fields.push('updated_at = NOW()');
  values.push(id);
  
  await pool.query(
    `UPDATE scraper_logs SET ${fields.join(', ')} WHERE id = $${paramIndex}`,
    values
  );
}
