-- Migration 011: Create UK & Ireland Racing Tables
-- Purpose: Store UK/IRE racing data from racing-bet-data.com

-- ============================================================================
-- REFERENCE DATA TABLES
-- ============================================================================

-- UK Racing Tracks
CREATE TABLE IF NOT EXISTS uk_tracks (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  country VARCHAR(3) NOT NULL CHECK (country IN ('UK', 'IRE')),
  location VARCHAR(100),
  track_type VARCHAR(20) CHECK (track_type IN ('flat', 'jumps', 'mixed')),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(name, country)
);

CREATE INDEX IF NOT EXISTS idx_uk_tracks_name ON uk_tracks(name);
CREATE INDEX IF NOT EXISTS idx_uk_tracks_country ON uk_tracks(country);

-- UK Racing Horses
CREATE TABLE IF NOT EXISTS uk_horses (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  age INTEGER,
  sex VARCHAR(10),
  color VARCHAR(50),
  sire VARCHAR(100),
  dam VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(name)
);

CREATE INDEX IF NOT EXISTS idx_uk_horses_name ON uk_horses(name);

-- UK Racing Jockeys
CREATE TABLE IF NOT EXISTS uk_jockeys (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  allowance INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(name)
);

CREATE INDEX IF NOT EXISTS idx_uk_jockeys_name ON uk_jockeys(name);

-- UK Racing Trainers
CREATE TABLE IF NOT EXISTS uk_trainers (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  location VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(name)
);

CREATE INDEX IF NOT EXISTS idx_uk_trainers_name ON uk_trainers(name);

-- ============================================================================
-- RACE DATA TABLES
-- ============================================================================

-- UK Races
CREATE TABLE IF NOT EXISTS uk_races (
  id SERIAL PRIMARY KEY,
  race_date DATE NOT NULL,
  track_id INTEGER NOT NULL REFERENCES uk_tracks(id) ON DELETE CASCADE,
  race_number INTEGER NOT NULL,
  race_time TIME,
  race_name VARCHAR(255),
  distance VARCHAR(20), -- e.g., "2m3½f", "1m7½f"
  race_class VARCHAR(10), -- e.g., "Class 1", "Class 2"
  race_type VARCHAR(50), -- e.g., "Handicap", "Maiden"
  prize_money DECIMAL(10, 2),
  going VARCHAR(50), -- Track condition
  number_of_runners INTEGER,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(race_date, track_id, race_number)
);

CREATE INDEX IF NOT EXISTS idx_uk_races_date ON uk_races(race_date);
CREATE INDEX IF NOT EXISTS idx_uk_races_track ON uk_races(track_id);
CREATE INDEX IF NOT EXISTS idx_uk_races_date_track ON uk_races(race_date, track_id);

-- UK Race Results (Post-Race Data)
CREATE TABLE IF NOT EXISTS uk_results (
  id SERIAL PRIMARY KEY,
  race_id INTEGER NOT NULL REFERENCES uk_races(id) ON DELETE CASCADE,
  horse_id INTEGER NOT NULL REFERENCES uk_horses(id) ON DELETE CASCADE,
  jockey_id INTEGER REFERENCES uk_jockeys(id) ON DELETE SET NULL,
  trainer_id INTEGER REFERENCES uk_trainers(id) ON DELETE SET NULL,
  
  -- Race Result Data
  place INTEGER,
  winning_distance VARCHAR(20), -- e.g., "33¼", "nk", "hd", "1½"
  finishing_time VARCHAR(20), -- Actual finish time
  
  -- Horse Details
  weight VARCHAR(10), -- e.g., "11-8", "10-13" (stone-pounds format)
  age INTEGER,
  sex VARCHAR(10),
  drawn INTEGER, -- Starting position
  headgear VARCHAR(50), -- e.g., "Blinkers", "Visor"
  
  -- Performance Metrics
  official_rating INTEGER,
  rbd_rating DECIMAL(6, 2), -- RacingBetData rating
  rbd_rank INTEGER, -- RacingBetData rank
  pace VARCHAR(20), -- Running style
  stall INTEGER,
  
  -- Odds Data
  sp_fav BOOLEAN DEFAULT FALSE, -- Starting price favorite
  industry_sp VARCHAR(20), -- Starting price
  betfair_sp VARCHAR(20), -- Betfair starting price
  ip_min VARCHAR(20), -- In-play minimum price
  ip_max VARCHAR(20), -- In-play maximum price
  
  -- Historical Performance Flags
  course_winner BOOLEAN DEFAULT FALSE,
  distance_winner BOOLEAN DEFAULT FALSE,
  
  -- Additional Fields
  comment TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(race_id, horse_id)
);

CREATE INDEX IF NOT EXISTS idx_uk_results_race ON uk_results(race_id);
CREATE INDEX IF NOT EXISTS idx_uk_results_horse ON uk_results(horse_id);
CREATE INDEX IF NOT EXISTS idx_uk_results_jockey ON uk_results(jockey_id);
CREATE INDEX IF NOT EXISTS idx_uk_results_trainer ON uk_results(trainer_id);
CREATE INDEX IF NOT EXISTS idx_uk_results_place ON uk_results(place);

-- UK Race Fields (Pre-Race Entry Data)
CREATE TABLE IF NOT EXISTS uk_race_fields (
  id SERIAL PRIMARY KEY,
  race_id INTEGER NOT NULL REFERENCES uk_races(id) ON DELETE CASCADE,
  horse_id INTEGER NOT NULL REFERENCES uk_horses(id) ON DELETE CASCADE,
  jockey_id INTEGER REFERENCES uk_jockeys(id) ON DELETE SET NULL,
  trainer_id INTEGER REFERENCES uk_trainers(id) ON DELETE SET NULL,
  
  -- Pre-Race Details
  weight VARCHAR(10), -- e.g., "11-8", "10-13"
  age INTEGER,
  sex VARCHAR(10),
  drawn INTEGER,
  headgear VARCHAR(50),
  
  -- Pre-Race Ratings & Predictions
  official_rating INTEGER,
  rbd_rating DECIMAL(6, 2),
  rbd_rank INTEGER,
  
  -- Forecasted Odds
  forecasted_odds VARCHAR(20),
  predicted_place INTEGER,
  
  -- Historical Performance
  last_run_days INTEGER, -- Days since last race
  runs_last_12m INTEGER, -- Number of runs in last 12 months
  wins_last_12m INTEGER,
  places_last_12m INTEGER,
  
  -- Form Indicators
  course_form VARCHAR(50), -- Form at this course
  distance_form VARCHAR(50), -- Form at this distance
  going_form VARCHAR(50), -- Form on this going
  
  -- Additional Fields
  comment TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(race_id, horse_id)
);

CREATE INDEX IF NOT EXISTS idx_uk_race_fields_race ON uk_race_fields(race_id);
CREATE INDEX IF NOT EXISTS idx_uk_race_fields_horse ON uk_race_fields(horse_id);
CREATE INDEX IF NOT EXISTS idx_uk_race_fields_jockey ON uk_race_fields(jockey_id);
CREATE INDEX IF NOT EXISTS idx_uk_race_fields_trainer ON uk_race_fields(trainer_id);

-- ============================================================================
-- SCRAPER AUDIT & LOGGING
-- ============================================================================

-- Scraper Logs
CREATE TABLE IF NOT EXISTS scraper_logs (
  id SERIAL PRIMARY KEY,
  scraper_type VARCHAR(50) NOT NULL, -- 'results', 'ratings', 'historical'
  scrape_date DATE NOT NULL,
  status VARCHAR(20) NOT NULL CHECK (status IN ('started', 'success', 'failed', 'partial')),
  
  -- Statistics
  records_processed INTEGER DEFAULT 0,
  records_imported INTEGER DEFAULT 0,
  records_failed INTEGER DEFAULT 0,
  records_skipped INTEGER DEFAULT 0,
  
  -- Execution Details
  execution_time_ms INTEGER,
  file_path TEXT,
  error_message TEXT,
  error_details JSONB,
  
  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_scraper_logs_type ON scraper_logs(scraper_type);
CREATE INDEX IF NOT EXISTS idx_scraper_logs_date ON scraper_logs(scrape_date);
CREATE INDEX IF NOT EXISTS idx_scraper_logs_status ON scraper_logs(status);
CREATE INDEX IF NOT EXISTS idx_scraper_logs_created ON scraper_logs(created_at DESC);

-- ============================================================================
-- PERFORMANCE VIEWS
-- ============================================================================

-- Overall Performance Statistics
CREATE OR REPLACE VIEW uk_performance_stats AS
SELECT 
  COUNT(DISTINCT r.race_id) as total_races,
  COUNT(DISTINCT r.horse_id) as total_horses,
  COUNT(DISTINCT r.jockey_id) as total_jockeys,
  COUNT(DISTINCT r.trainer_id) as total_trainers,
  COUNT(DISTINCT rc.track_id) as total_tracks,
  MIN(rc.race_date) as earliest_race,
  MAX(rc.race_date) as latest_race
FROM uk_results r
JOIN uk_races rc ON r.race_id = rc.id;

-- Horse Performance Statistics
CREATE OR REPLACE VIEW uk_horse_performance AS
SELECT 
  h.id as horse_id,
  h.name as horse_name,
  COUNT(*) as total_runs,
  SUM(CASE WHEN r.place = 1 THEN 1 ELSE 0 END) as wins,
  SUM(CASE WHEN r.place <= 3 THEN 1 ELSE 0 END) as places,
  ROUND(
    100.0 * SUM(CASE WHEN r.place = 1 THEN 1 ELSE 0 END) / NULLIF(COUNT(*), 0),
    2
  ) as win_percentage,
  ROUND(
    100.0 * SUM(CASE WHEN r.place <= 3 THEN 1 ELSE 0 END) / NULLIF(COUNT(*), 0),
    2
  ) as place_percentage,
  ROUND(AVG(r.rbd_rating), 2) as avg_rbd_rating,
  MAX(rc.race_date) as last_race_date
FROM uk_horses h
JOIN uk_results r ON h.id = r.horse_id
JOIN uk_races rc ON r.race_id = rc.id
GROUP BY h.id, h.name;

-- Jockey Performance Statistics
CREATE OR REPLACE VIEW uk_jockey_performance AS
SELECT 
  j.id as jockey_id,
  j.name as jockey_name,
  COUNT(*) as total_rides,
  SUM(CASE WHEN r.place = 1 THEN 1 ELSE 0 END) as wins,
  SUM(CASE WHEN r.place <= 3 THEN 1 ELSE 0 END) as places,
  ROUND(
    100.0 * SUM(CASE WHEN r.place = 1 THEN 1 ELSE 0 END) / NULLIF(COUNT(*), 0),
    2
  ) as win_percentage,
  ROUND(
    100.0 * SUM(CASE WHEN r.place <= 3 THEN 1 ELSE 0 END) / NULLIF(COUNT(*), 0),
    2
  ) as place_percentage,
  MAX(rc.race_date) as last_ride_date
FROM uk_jockeys j
JOIN uk_results r ON j.id = r.jockey_id
JOIN uk_races rc ON r.race_id = rc.id
GROUP BY j.id, j.name;

-- Trainer Performance Statistics
CREATE OR REPLACE VIEW uk_trainer_performance AS
SELECT 
  t.id as trainer_id,
  t.name as trainer_name,
  COUNT(*) as total_runners,
  SUM(CASE WHEN r.place = 1 THEN 1 ELSE 0 END) as wins,
  SUM(CASE WHEN r.place <= 3 THEN 1 ELSE 0 END) as places,
  ROUND(
    100.0 * SUM(CASE WHEN r.place = 1 THEN 1 ELSE 0 END) / NULLIF(COUNT(*), 0),
    2
  ) as win_percentage,
  ROUND(
    100.0 * SUM(CASE WHEN r.place <= 3 THEN 1 ELSE 0 END) / NULLIF(COUNT(*), 0),
    2
  ) as place_percentage,
  MAX(rc.race_date) as last_runner_date
FROM uk_trainers t
JOIN uk_results r ON t.id = r.trainer_id
JOIN uk_races rc ON r.race_id = rc.id
GROUP BY t.id, t.name;

-- ============================================================================
-- TABLE COMMENTS
-- ============================================================================

COMMENT ON TABLE uk_tracks IS 'UK & Ireland racing venues/tracks';
COMMENT ON TABLE uk_horses IS 'Racing horses in UK & Ireland';
COMMENT ON TABLE uk_jockeys IS 'Jockeys in UK & Ireland racing';
COMMENT ON TABLE uk_trainers IS 'Trainers in UK & Ireland racing';
COMMENT ON TABLE uk_races IS 'Race events (one per race)';
COMMENT ON TABLE uk_results IS 'Post-race results and performance data';
COMMENT ON TABLE uk_race_fields IS 'Pre-race field data and predictions';
COMMENT ON TABLE scraper_logs IS 'Audit trail for scraper operations';

COMMENT ON VIEW uk_performance_stats IS 'Overall statistics across all UK/IRE racing data';
COMMENT ON VIEW uk_horse_performance IS 'Performance statistics by horse';
COMMENT ON VIEW uk_jockey_performance IS 'Performance statistics by jockey';
COMMENT ON VIEW uk_trainer_performance IS 'Performance statistics by trainer';
