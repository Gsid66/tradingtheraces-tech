-- Betfair Analysis Authentication Table
CREATE TABLE IF NOT EXISTS betfair_analysis_auth (
  id SERIAL PRIMARY KEY,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
