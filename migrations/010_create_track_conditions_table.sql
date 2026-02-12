-- Create track conditions table
-- Migration: 010_create_track_conditions_table
-- Description: Store track conditions with history for scheduled sync

CREATE TABLE IF NOT EXISTS pf_track_conditions (
  id SERIAL PRIMARY KEY,
  meeting_id VARCHAR(100) NOT NULL,
  track_name VARCHAR(200) NOT NULL,
  track_condition VARCHAR(100) NOT NULL,
  rail_position VARCHAR(200),
  weather VARCHAR(200),
  penetrometer VARCHAR(100),
  jurisdiction INTEGER DEFAULT 0,
  updated_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT fk_meeting FOREIGN KEY (meeting_id) REFERENCES pf_meetings(meeting_id) ON DELETE CASCADE
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_track_conditions_meeting ON pf_track_conditions(meeting_id);
CREATE INDEX IF NOT EXISTS idx_track_conditions_track ON pf_track_conditions(track_name);
CREATE INDEX IF NOT EXISTS idx_track_conditions_updated ON pf_track_conditions(updated_at);
CREATE INDEX IF NOT EXISTS idx_track_conditions_jurisdiction ON pf_track_conditions(jurisdiction);

-- Add comment
COMMENT ON TABLE pf_track_conditions IS 'Track conditions from PuntingForm API with scheduled sync history';
