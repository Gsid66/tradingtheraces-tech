-- ============================================================
-- Betfair Results AU Table
-- Migration: create_bf_results_au_table
-- Description: Table for storing Betfair Australian racing results data
-- ============================================================

CREATE TABLE IF NOT EXISTS bf_results_au (
  id SERIAL PRIMARY KEY,
  date DATE NOT NULL,
  track VARCHAR(100) NOT NULL,
  race INTEGER NOT NULL,
  distance VARCHAR(20),
  class VARCHAR(50),
  market BIGINT,
  selection BIGINT,
  number INTEGER,
  horse VARCHAR(255) NOT NULL,
  race_speed VARCHAR(50),
  speed_cat VARCHAR(50),
  early_speed DECIMAL(10, 3),
  late_speed INTEGER,
  rp DECIMAL(10, 2),
  win_result SMALLINT,
  win_bsp DECIMAL(10, 2),
  place_result SMALLINT,
  place_bsp DECIMAL(10, 2),
  value DECIMAL(12, 9),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  CONSTRAINT idx_bf_results_au_unique UNIQUE (date, track, race, number)
);

CREATE INDEX IF NOT EXISTS idx_bf_results_au_date ON bf_results_au(date);
CREATE INDEX IF NOT EXISTS idx_bf_results_au_track ON bf_results_au(track);
CREATE INDEX IF NOT EXISTS idx_bf_results_au_horse ON bf_results_au(horse);
CREATE INDEX IF NOT EXISTS idx_bf_results_au_market ON bf_results_au(market);
CREATE INDEX IF NOT EXISTS idx_bf_results_au_date_track ON bf_results_au(date, track);
CREATE INDEX IF NOT EXISTS idx_bf_results_au_date_track_race ON bf_results_au(date, track, race);
