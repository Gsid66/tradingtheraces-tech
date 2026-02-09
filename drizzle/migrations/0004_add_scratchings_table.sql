-- ============================================================
-- Scratchings Table
-- Migration: 0004_add_scratchings_table
-- Description: Table for tracking horse scratchings/withdrawals
-- ============================================================

-- ============================================================
-- SCRATCHINGS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS pf_scratchings (
  id SERIAL PRIMARY KEY,
  meeting_id VARCHAR(100) NOT NULL,
  race_id VARCHAR(100),
  race_number INTEGER NOT NULL,
  track_name VARCHAR(200) NOT NULL,
  horse_name VARCHAR(500) NOT NULL,
  tab_number INTEGER,
  scratching_time TIMESTAMP NOT NULL,
  reason TEXT,
  jurisdiction INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  -- Unique constraint to prevent duplicate scratchings
  CONSTRAINT pf_scratchings_unique UNIQUE (meeting_id, race_number, horse_name, scratching_time)
);

CREATE INDEX IF NOT EXISTS idx_pf_scratchings_meeting ON pf_scratchings(meeting_id);
CREATE INDEX IF NOT EXISTS idx_pf_scratchings_track ON pf_scratchings(track_name);
CREATE INDEX IF NOT EXISTS idx_pf_scratchings_horse ON pf_scratchings(horse_name);
CREATE INDEX IF NOT EXISTS idx_pf_scratchings_time ON pf_scratchings(scratching_time);
CREATE INDEX IF NOT EXISTS idx_pf_scratchings_jurisdiction ON pf_scratchings(jurisdiction);
