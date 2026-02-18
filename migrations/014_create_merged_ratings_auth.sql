-- Migration 014: Create Merged Ratings Authentication Table
-- Purpose: Store authentication credentials for merged ratings page access

CREATE TABLE IF NOT EXISTS merged_ratings_auth (
  id SERIAL PRIMARY KEY,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Table comment
COMMENT ON TABLE merged_ratings_auth IS 'Authentication credentials for merged ratings page user access';
