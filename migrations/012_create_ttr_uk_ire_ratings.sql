-- Migration 012: Create TTR UK/Ireland Ratings Table
-- Purpose: Store TTR UK/IRE racing ratings data from CSV uploads

-- ============================================================================
-- TTR UK/IRE RATINGS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS ttr_uk_ire_ratings (
  id SERIAL PRIMARY KEY,
  race_date DATE NOT NULL,
  track_name VARCHAR(100) NOT NULL,
  race_name TEXT NOT NULL,
  race_number INTEGER NOT NULL,
  saddle_cloth INTEGER,
  horse_name VARCHAR(100) NOT NULL,
  jockey_name VARCHAR(100),
  trainer_name VARCHAR(100),
  rating DECIMAL(10, 2),
  price DECIMAL(10, 2),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(race_date, track_name, race_number, horse_name)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_ttr_uk_ire_race_date ON ttr_uk_ire_ratings(race_date);
CREATE INDEX IF NOT EXISTS idx_ttr_uk_ire_track ON ttr_uk_ire_ratings(track_name);
CREATE INDEX IF NOT EXISTS idx_ttr_uk_ire_horse ON ttr_uk_ire_ratings(horse_name);

-- Table comment
COMMENT ON TABLE ttr_uk_ire_ratings IS 'TTR UK & Ireland racing ratings data imported from CSV files';
