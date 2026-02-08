-- Create scratchings table
CREATE TABLE IF NOT EXISTS pf_scratchings (
  id SERIAL PRIMARY KEY,
  meeting_id VARCHAR(50) NOT NULL,
  race_id VARCHAR(50),
  race_number INTEGER NOT NULL,
  track_name VARCHAR(255) NOT NULL,
  horse_name VARCHAR(255) NOT NULL,
  tab_number INTEGER,
  scratching_time TIMESTAMP NOT NULL,
  reason TEXT,
  jurisdiction INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  -- Composite unique constraint to prevent duplicates
  UNIQUE(meeting_id, race_number, horse_name, scratching_time)
);

-- Index for common queries
CREATE INDEX idx_scratchings_meeting ON pf_scratchings(meeting_id, race_number);
CREATE INDEX idx_scratchings_date ON pf_scratchings(scratching_time);
CREATE INDEX idx_scratchings_track ON pf_scratchings(track_name, race_number);

-- Add comment
COMMENT ON TABLE pf_scratchings IS 'Persistent storage for horse scratchings from PuntingForm API';
