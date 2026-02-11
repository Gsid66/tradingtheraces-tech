-- Fix migration: Change wind_direction from INTEGER to NUMERIC
-- This fixes the error: "invalid input syntax for type integer"

-- Fix track_weather table
ALTER TABLE track_weather 
    ALTER COLUMN wind_direction TYPE NUMERIC(5, 2) 
    USING CASE 
        WHEN wind_direction IS NULL THEN NULL 
        ELSE wind_direction::NUMERIC(5, 2) 
    END;

-- Fix track_weather_history table
ALTER TABLE track_weather_history 
    ALTER COLUMN wind_direction TYPE NUMERIC(5, 2) 
    USING CASE 
        WHEN wind_direction IS NULL THEN NULL 
        ELSE wind_direction::NUMERIC(5, 2) 
    END;

-- Fix race_weather_conditions table
ALTER TABLE race_weather_conditions 
    ALTER COLUMN wind_direction TYPE NUMERIC(5, 2) 
    USING CASE 
        WHEN wind_direction IS NULL THEN NULL 
        ELSE wind_direction::NUMERIC(5, 2) 
    END;

-- Fix pf_meetings table (if column exists)
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'pf_meetings' 
        AND column_name = 'current_wind_direction'
    ) THEN
        ALTER TABLE pf_meetings 
            ALTER COLUMN current_wind_direction TYPE NUMERIC(5, 2)
            USING CASE 
                WHEN current_wind_direction IS NULL THEN NULL 
                ELSE current_wind_direction::NUMERIC(5, 2) 
            END;
    END IF;
END $$;

-- Verify the fix
SELECT 
    table_name, 
    column_name, 
    data_type,
    numeric_precision,
    numeric_scale
FROM information_schema.columns 
WHERE table_name IN ('track_weather', 'track_weather_history', 'race_weather_conditions', 'pf_meetings')
AND column_name LIKE '%wind_direction%'
ORDER BY table_name;
