-- Migration 008: Add Weather Tables
-- Purpose: Store weather data for race tracks from MET Norway API

-- Create track_weather table for hourly forecasts
CREATE TABLE IF NOT EXISTS track_weather (
  id SERIAL PRIMARY KEY,
  track_name VARCHAR(100) NOT NULL,
  latitude DECIMAL(10, 7) NOT NULL,
  longitude DECIMAL(10, 7) NOT NULL,
  forecast_time TIMESTAMP WITH TIME ZONE NOT NULL,
  temperature DECIMAL(5, 2),
  wind_speed DECIMAL(5, 2),
  wind_direction INTEGER,
  precipitation DECIMAL(5, 2),
  weather_symbol VARCHAR(50),
  weather_description TEXT,
  fetched_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure no duplicate entries for same track/time
  UNIQUE(track_name, forecast_time)
);

-- Add indexes for quick lookups
CREATE INDEX IF NOT EXISTS idx_track_weather_track_time ON track_weather(track_name, forecast_time);
CREATE INDEX IF NOT EXISTS idx_track_weather_fetched ON track_weather(fetched_at);
CREATE INDEX IF NOT EXISTS idx_track_weather_forecast_time ON track_weather(forecast_time);

-- Add weather columns to pf_meetings table
ALTER TABLE pf_meetings 
  ADD COLUMN IF NOT EXISTS current_temperature DECIMAL(5, 2),
  ADD COLUMN IF NOT EXISTS current_wind_speed DECIMAL(5, 2),
  ADD COLUMN IF NOT EXISTS current_wind_direction INTEGER,
  ADD COLUMN IF NOT EXISTS current_weather_symbol VARCHAR(50),
  ADD COLUMN IF NOT EXISTS weather_updated_at TIMESTAMP WITH TIME ZONE;

-- Add comment for track_weather table
COMMENT ON TABLE track_weather IS 'Hourly weather forecasts for race tracks from MET Norway API';

-- Add comments for columns
COMMENT ON COLUMN track_weather.track_name IS 'Normalized track name (lowercase)';
COMMENT ON COLUMN track_weather.latitude IS 'Track latitude coordinate';
COMMENT ON COLUMN track_weather.longitude IS 'Track longitude coordinate';
COMMENT ON COLUMN track_weather.forecast_time IS 'Time this forecast is for (in track local time)';
COMMENT ON COLUMN track_weather.temperature IS 'Temperature in degrees Celsius';
COMMENT ON COLUMN track_weather.wind_speed IS 'Wind speed in m/s';
COMMENT ON COLUMN track_weather.wind_direction IS 'Wind direction in degrees (0-360)';
COMMENT ON COLUMN track_weather.precipitation IS 'Precipitation amount in mm';
COMMENT ON COLUMN track_weather.weather_symbol IS 'MET Norway weather symbol code';
COMMENT ON COLUMN track_weather.weather_description IS 'Human-readable weather description';
COMMENT ON COLUMN track_weather.fetched_at IS 'When this forecast was fetched from MET Norway API';

-- Add comments for pf_meetings weather columns
COMMENT ON COLUMN pf_meetings.current_temperature IS 'Current temperature at track in degrees Celsius';
COMMENT ON COLUMN pf_meetings.current_wind_speed IS 'Current wind speed at track in m/s';
COMMENT ON COLUMN pf_meetings.current_wind_direction IS 'Current wind direction at track in degrees (0-360)';
COMMENT ON COLUMN pf_meetings.current_weather_symbol IS 'Current MET Norway weather symbol code';
COMMENT ON COLUMN pf_meetings.weather_updated_at IS 'When weather was last updated for this meeting';
