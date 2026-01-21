-- ============================================================
-- Punting Form Database Schema
-- Migration: 0002_add_punting_form_tables
-- Description:  Comprehensive racing data schema for AI/ML analysis
-- ============================================================

-- ============================================================
-- 1. MEETINGS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS pf_meetings (
  id SERIAL PRIMARY KEY,
  meeting_id VARCHAR(100) UNIQUE NOT NULL,
  track_name VARCHAR(200) NOT NULL,
  track_id VARCHAR(100),
  location VARCHAR(50),
  state VARCHAR(50),
  country VARCHAR(50),
  abbrev VARCHAR(50),
  surface VARCHAR(100),
  meeting_date DATE NOT NULL,
  rail_position VARCHAR(200),
  stage VARCHAR(50),
  expected_condition VARCHAR(200),
  actual_condition VARCHAR(200),
  weather VARCHAR(200),
  track_rating VARCHAR(100),
  is_barrier_trial BOOLEAN DEFAULT false,
  is_jumps BOOLEAN DEFAULT false,
  has_sectionals BOOLEAN DEFAULT false,
  tab_meeting BOOLEAN DEFAULT false,
  form_updated TIMESTAMP,
  results_updated TIMESTAMP,
  sectionals_updated TIMESTAMP,
  ratings_updated TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pf_meetings_date ON pf_meetings(meeting_date);
CREATE INDEX IF NOT EXISTS idx_pf_meetings_track ON pf_meetings(track_name);
CREATE INDEX IF NOT EXISTS idx_pf_meetings_state ON pf_meetings(state);
CREATE INDEX IF NOT EXISTS idx_pf_meetings_country ON pf_meetings(country);

-- ============================================================
-- 2. RACES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS pf_races (
  id SERIAL PRIMARY KEY,
  race_id VARCHAR(100) UNIQUE NOT NULL,
  meeting_id VARCHAR(100) REFERENCES pf_meetings(meeting_id) ON DELETE CASCADE,
  race_number INTEGER NOT NULL,
  race_name VARCHAR(500),
  provider_race_id VARCHAR(100),
  distance INTEGER,
  age_restrictions VARCHAR(200),
  jockey_restrictions VARCHAR(500),
  sex_restrictions VARCHAR(200),
  weight_type VARCHAR(100),
  limit_weight DECIMAL(5,1),
  race_class VARCHAR(500),
  prize_money INTEGER,
  prize_money_breakdown TEXT,
  start_time TIMESTAMP,
  start_time_utc TIMESTAMP,
  actual_start_time TIMESTAMP,
  group_race VARCHAR(50),
  bonus_scheme VARCHAR(200),
  description TEXT,
  result_status VARCHAR(100),
  winning_time DECIMAL(10,3),
  winning_margin DECIMAL(5,2),
  rail_position VARCHAR(200),
  track_condition VARCHAR(200),
  weather_condition VARCHAR(200),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pf_races_meeting ON pf_races(meeting_id);
CREATE INDEX IF NOT EXISTS idx_pf_races_start_time ON pf_races(start_time);
CREATE INDEX IF NOT EXISTS idx_pf_races_distance ON pf_races(distance);
CREATE INDEX IF NOT EXISTS idx_pf_races_class ON pf_races(race_class);

-- ============================================================
-- 3. HORSES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS pf_horses (
  id SERIAL PRIMARY KEY,
  horse_id VARCHAR(100) UNIQUE NOT NULL,
  horse_name VARCHAR(500) NOT NULL,
  sex VARCHAR(50),
  colour VARCHAR(100),
  age INTEGER,
  foaled_date DATE,
  sire VARCHAR(500),
  dam VARCHAR(500),
  dams_sire VARCHAR(500),
  country_bred VARCHAR(50),
  career_starts INTEGER DEFAULT 0,
  career_wins INTEGER DEFAULT 0,
  career_seconds INTEGER DEFAULT 0,
  career_thirds INTEGER DEFAULT 0,
  career_prize_money DECIMAL(12,2) DEFAULT 0,
  last_run_date DATE,
  retired BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pf_horses_name ON pf_horses(horse_name);
CREATE INDEX IF NOT EXISTS idx_pf_horses_sire ON pf_horses(sire);

-- ============================================================
-- 4. TRAINERS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS pf_trainers (
  id SERIAL PRIMARY KEY,
  trainer_id VARCHAR(100) UNIQUE NOT NULL,
  full_name VARCHAR(500) NOT NULL,
  location VARCHAR(500),
  state VARCHAR(50),
  career_starts INTEGER DEFAULT 0,
  career_wins INTEGER DEFAULT 0,
  career_seconds INTEGER DEFAULT 0,
  career_thirds INTEGER DEFAULT 0,
  career_prize_money DECIMAL(12,2) DEFAULT 0,
  strike_rate DECIMAL(5,2),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pf_trainers_name ON pf_trainers(full_name);
CREATE INDEX IF NOT EXISTS idx_pf_trainers_location ON pf_trainers(location);

-- ============================================================
-- 5. JOCKEYS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS pf_jockeys (
  id SERIAL PRIMARY KEY,
  jockey_id VARCHAR(100) UNIQUE NOT NULL,
  full_name VARCHAR(500) NOT NULL,
  apprentice BOOLEAN DEFAULT false,
  claim_allowance DECIMAL(3,1) DEFAULT 0,
  career_starts INTEGER DEFAULT 0,
  career_wins INTEGER DEFAULT 0,
  career_seconds INTEGER DEFAULT 0,
  career_thirds INTEGER DEFAULT 0,
  career_prize_money DECIMAL(12,2) DEFAULT 0,
  strike_rate DECIMAL(5,2),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pf_jockeys_name ON pf_jockeys(full_name);

-- ============================================================
-- 6. RUNNERS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS pf_runners (
  id SERIAL PRIMARY KEY,
  race_id VARCHAR(100) REFERENCES pf_races(race_id) ON DELETE CASCADE,
  form_id VARCHAR(100),
  horse_id VARCHAR(100) REFERENCES pf_horses(horse_id),
  horse_name VARCHAR(500) NOT NULL,
  barrier_number INTEGER,
  original_barrier INTEGER,
  tab_number INTEGER,
  jockey_id VARCHAR(100) REFERENCES pf_jockeys(jockey_id),
  jockey_name VARCHAR(500),
  jockey_claim DECIMAL(3,1) DEFAULT 0,
  trainer_id VARCHAR(100) REFERENCES pf_trainers(trainer_id),
  trainer_name VARCHAR(500),
  weight DECIMAL(5,1),
  handicap DECIMAL(5,1),
  fixed_odds DECIMAL(8,2),
  starting_price DECIMAL(8,2),
  last_five_starts VARCHAR(100),
  emergency_indicator BOOLEAN DEFAULT false,
  prep_runs INTEGER,
  gear_changes TEXT,
  scratched BOOLEAN DEFAULT false,
  scratched_time TIMESTAMP,
  finishing_position INTEGER,
  finishing_time DECIMAL(10,3),
  margins VARCHAR(200),
  prize_money_won DECIMAL(10,2),
  rating DECIMAL(6,2),
  speed_rating DECIMAL(6,2),
  class_rating DECIMAL(6,2),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pf_runners_race ON pf_runners(race_id);
CREATE INDEX IF NOT EXISTS idx_pf_runners_horse ON pf_runners(horse_id);
CREATE INDEX IF NOT EXISTS idx_pf_runners_jockey ON pf_runners(jockey_id);
CREATE INDEX IF NOT EXISTS idx_pf_runners_trainer ON pf_runners(trainer_id);
CREATE INDEX IF NOT EXISTS idx_pf_runners_horse_name ON pf_runners(horse_name);

-- ============================================================
-- 7. HORSE FORM TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS pf_horse_form (
  id SERIAL PRIMARY KEY,
  horse_id VARCHAR(100) REFERENCES pf_horses(horse_id),
  race_id VARCHAR(100),
  form_id VARCHAR(100),
  race_date DATE NOT NULL,
  track_name VARCHAR(200),
  track_condition VARCHAR(200),
  distance INTEGER,
  race_class VARCHAR(500),
  barrier INTEGER,
  position INTEGER,
  total_runners INTEGER,
  jockey_name VARCHAR(500),
  trainer_name VARCHAR(500),
  weight DECIMAL(5,1),
  finishing_time DECIMAL(10,3),
  margin DECIMAL(5,2),
  sectional_800 DECIMAL(6,2),
  sectional_400 DECIMAL(6,2),
  sectional_200 DECIMAL(6,2),
  starting_price DECIMAL(8,2),
  prize_money DECIMAL(10,2),
  race_comment TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pf_horse_form_horse ON pf_horse_form(horse_id);
CREATE INDEX IF NOT EXISTS idx_pf_horse_form_date ON pf_horse_form(race_date);
CREATE INDEX IF NOT EXISTS idx_pf_horse_form_track ON pf_horse_form(track_name);

-- ============================================================
-- 8. DIVIDENDS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS pf_dividends (
  id SERIAL PRIMARY KEY,
  race_id VARCHAR(100) REFERENCES pf_races(race_id) ON DELETE CASCADE,
  win_runner_number INTEGER,
  win_dividend DECIMAL(8,2),
  place_1_runner INTEGER,
  place_1_dividend DECIMAL(8,2),
  place_2_runner INTEGER,
  place_2_dividend DECIMAL(8,2),
  place_3_runner INTEGER,
  place_3_dividend DECIMAL(8,2),
  quinella_dividend DECIMAL(10,2),
  exacta_dividend DECIMAL(10,2),
  trifecta_dividend DECIMAL(12,2),
  first_four_dividend DECIMAL(12,2),
  daily_double_dividend DECIMAL(10,2),
  quadrella_dividend DECIMAL(15,2),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pf_dividends_race ON pf_dividends(race_id);

-- ============================================================
-- 9. TRAINER JOCKEY STATS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS pf_trainer_jockey_stats (
  id SERIAL PRIMARY KEY,
  trainer_id VARCHAR(100) REFERENCES pf_trainers(trainer_id),
  jockey_id VARCHAR(100) REFERENCES pf_jockeys(jockey_id),
  period VARCHAR(100),
  starts INTEGER DEFAULT 0,
  wins INTEGER DEFAULT 0,
  seconds INTEGER DEFAULT 0,
  thirds INTEGER DEFAULT 0,
  strike_rate DECIMAL(5,2),
  profit_on_turnover DECIMAL(8,2),
  avg_odds DECIMAL(6,2),
  roi DECIMAL(6,2),
  a2e_ratio DECIMAL(6,4),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pf_tj_stats_trainer ON pf_trainer_jockey_stats(trainer_id);
CREATE INDEX IF NOT EXISTS idx_pf_tj_stats_jockey ON pf_trainer_jockey_stats(jockey_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_pf_tj_stats_combo ON pf_trainer_jockey_stats(trainer_id, jockey_id, period);

-- ============================================================
-- 10. TRACK STATS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS pf_track_stats (
  id SERIAL PRIMARY KEY,
  horse_id VARCHAR(100) REFERENCES pf_horses(horse_id),
  track_name VARCHAR(200),
  track_condition VARCHAR(200),
  distance INTEGER,
  starts INTEGER DEFAULT 0,
  wins INTEGER DEFAULT 0,
  seconds INTEGER DEFAULT 0,
  thirds INTEGER DEFAULT 0,
  strike_rate DECIMAL(5,2),
  avg_finishing_position DECIMAL(4,2),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pf_track_stats_horse ON pf_track_stats(horse_id);
CREATE INDEX IF NOT EXISTS idx_pf_track_stats_track ON pf_track_stats(track_name);

-- ============================================================
-- 11. SECTIONALS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS pf_sectionals (
  id SERIAL PRIMARY KEY,
  race_id VARCHAR(100) REFERENCES pf_races(race_id) ON DELETE CASCADE,
  runner_id INTEGER REFERENCES pf_runners(id) ON DELETE CASCADE,
  horse_name VARCHAR(500),
  sectional_1200 DECIMAL(6,2),
  sectional_1000 DECIMAL(6,2),
  sectional_800 DECIMAL(6,2),
  sectional_600 DECIMAL(6,2),
  sectional_400 DECIMAL(6,2),
  sectional_200 DECIMAL(6,2),
  last_600_rating DECIMAL(6,2),
  last_400_rating DECIMAL(6,2),
  last_200_rating DECIMAL(6,2),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pf_sectionals_race ON pf_sectionals(race_id);
CREATE INDEX IF NOT EXISTS idx_pf_sectionals_runner ON pf_sectionals(runner_id);

-- ============================================================
-- 12. GEAR CHANGES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS pf_gear_changes (
  id SERIAL PRIMARY KEY,
  runner_id INTEGER REFERENCES pf_runners(id) ON DELETE CASCADE,
  gear_type VARCHAR(200),
  gear_status VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pf_gear_runner ON pf_gear_changes(runner_id);
CREATE INDEX IF NOT EXISTS idx_pf_gear_type ON pf_gear_changes(gear_type);

-- ============================================================
-- 13. SPEED MAPS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS pf_speed_maps (
  id SERIAL PRIMARY KEY,
  race_id VARCHAR(100) REFERENCES pf_races(race_id) ON DELETE CASCADE,
  runner_id INTEGER REFERENCES pf_runners(id) ON DELETE CASCADE,
  run_style VARCHAR(100),
  early_speed_rating INTEGER,
  expected_position_400m INTEGER,
  expected_position_800m INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pf_speed_maps_race ON pf_speed_maps(race_id);

-- ============================================================
-- 14. RESULTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS pf_results (
  id SERIAL PRIMARY KEY,
  race_id VARCHAR(100) REFERENCES pf_races(race_id) ON DELETE CASCADE,
  runner_id INTEGER REFERENCES pf_runners(id) ON DELETE CASCADE,
  horse_id VARCHAR(100) REFERENCES pf_horses(horse_id),
  horse_name VARCHAR(500) NOT NULL,
  finishing_position INTEGER,
  tab_number INTEGER,
  barrier_number INTEGER,
  finishing_time DECIMAL(10,3),
  margin_to_winner DECIMAL(6,2),
  margin_to_next DECIMAL(6,2),
  jockey_id VARCHAR(100) REFERENCES pf_jockeys(jockey_id),
  jockey_name VARCHAR(500),
  trainer_id VARCHAR(100) REFERENCES pf_trainers(trainer_id),
  trainer_name VARCHAR(500),
  weight_carried DECIMAL(5,1),
  starting_price DECIMAL(8,2),
  fixed_odds_final DECIMAL(8,2),
  prize_money_won DECIMAL(10,2),
  position_400m INTEGER,
  position_800m INTEGER,
  position_1200m INTEGER,
  last_600m_time DECIMAL(6,2),
  last_400m_time DECIMAL(6,2),
  last_200m_time DECIMAL(6,2),
  speed_rating DECIMAL(6,2),
  class_rating DECIMAL(6,2),
  beaten_margin_rating DECIMAL(6,2),
  stewards_comment TEXT,
  race_comment TEXT,
  result_posted_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pf_results_race ON pf_results(race_id);
CREATE INDEX IF NOT EXISTS idx_pf_results_horse ON pf_results(horse_id);
CREATE INDEX IF NOT EXISTS idx_pf_results_position ON pf_results(finishing_position);
CREATE INDEX IF NOT EXISTS idx_pf_results_jockey ON pf_results(jockey_id);
CREATE INDEX IF NOT EXISTS idx_pf_results_trainer ON pf_results(trainer_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_pf_results_race_runner ON pf_results(race_id, runner_id);