import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/database/client';
import { getTrackCoordinates } from '@/lib/data/track-coordinates';
import {
  getWeatherEmoji,
  getWeatherDescription,
  degreesToCompass,
} from '@/lib/integrations/weather/met-norway-client';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ trackName: string }> }
) {
  try {
    const { trackName: rawTrackName } = await params;
    const trackName = rawTrackName.toLowerCase();
    
    // Get track coordinates
    const coords = getTrackCoordinates(trackName);
    if (!coords) {
      return NextResponse.json(
        { error: 'Track not found' },
        { status: 404 }
      );
    }

    const db = getDatabase();
    
    // Get current weather from pf_meetings
    const meetingResult = await db.query(
      `SELECT 
        track_name,
        current_temperature as temperature,
        current_wind_speed as wind_speed,
        current_wind_direction as wind_direction,
        current_weather_symbol as weather_symbol,
        weather_updated_at
      FROM pf_meetings
      WHERE LOWER(track_name) = $1
        AND meeting_date::date = CURRENT_DATE
        AND weather_updated_at IS NOT NULL
      ORDER BY weather_updated_at DESC
      LIMIT 1`,
      [trackName]
    );

    let current = null;
    if (meetingResult.rows.length > 0) {
      const row = meetingResult.rows[0];
      current = {
        temperature: parseFloat(row.temperature),
        windSpeed: parseFloat(row.wind_speed),
        windDirection: parseInt(row.wind_direction),
        windDirectionCompass: degreesToCompass(parseInt(row.wind_direction)),
        weatherSymbol: row.weather_symbol,
        weatherEmoji: getWeatherEmoji(row.weather_symbol),
        description: getWeatherDescription(row.weather_symbol),
        time: row.weather_updated_at,
      };
    }

    // Get hourly forecast from track_weather
    const forecastResult = await db.query(
      `SELECT 
        forecast_time,
        temperature,
        wind_speed,
        wind_direction,
        weather_symbol,
        weather_description,
        precipitation
      FROM track_weather
      WHERE track_name = $1
        AND forecast_time >= NOW()
        AND forecast_time <= NOW() + INTERVAL '12 hours'
      ORDER BY forecast_time ASC`,
      [trackName]
    );

    const hourly = forecastResult.rows.map(row => ({
      time: row.forecast_time,
      temperature: parseFloat(row.temperature),
      windSpeed: parseFloat(row.wind_speed),
      windDirection: parseInt(row.wind_direction),
      windDirectionCompass: degreesToCompass(parseInt(row.wind_direction)),
      weatherSymbol: row.weather_symbol,
      weatherEmoji: getWeatherEmoji(row.weather_symbol),
      description: row.weather_description,
      precipitation: parseFloat(row.precipitation),
    }));

    return NextResponse.json({
      trackName: coords.displayName,
      location: {
        latitude: coords.latitude,
        longitude: coords.longitude,
        state: coords.state,
        country: coords.country,
        timezone: coords.timezone,
      },
      current,
      hourly,
      lastUpdated: current?.time || null,
      attribution: 'Weather data from MET Norway',
    });

  } catch (error: any) {
    console.error('Error fetching weather for track:', error);
    return NextResponse.json(
      { error: 'Failed to fetch weather', message: error.message },
      { status: 500 }
    );
  }
}
