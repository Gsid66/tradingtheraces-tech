-- Migration 013: Create TTR AU/NZ Ratings Table
-- Purpose: Store TTR AU/NZ racing ratings data from CSV uploads

CREATE TABLE IF NOT EXISTS ttr_au_nz_ratings (
  id SERIAL PRIMARY KEY,
  race_date DATE NOT NULL,
  track VARCHAR(255) NOT NULL,
  race_name TEXT NOT NULL,
  race_number INTEGER,
  saddle_cloth INTEGER,
  horse_name VARCHAR(255) NOT NULL,
  jockey VARCHAR(255),
  trainer VARCHAR(255),
  rating INTEGER,
  price DECIMAL(10, 2),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(race_date, track, race_name, horse_name)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_ttr_au_nz_race_date ON ttr_au_nz_ratings(race_date);
CREATE INDEX IF NOT EXISTS idx_ttr_au_nz_track ON ttr_au_nz_ratings(track);
CREATE INDEX IF NOT EXISTS idx_ttr_au_nz_horse ON ttr_au_nz_ratings(horse_name);
CREATE INDEX IF NOT EXISTS idx_ttr_au_nz_date_track ON ttr_au_nz_ratings(race_date, track);

-- Table comment
COMMENT ON TABLE ttr_au_nz_ratings IS 'TTR Australia & New Zealand racing ratings data imported from CSV files';
