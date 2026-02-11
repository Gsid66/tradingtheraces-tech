import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/database/client';
import {
  getWeatherEmoji,
  getWeatherDescription,
  degreesToCompass,
} from '@/lib/integrations/weather/met-norway-client';

export async function GET(
  request: Request,
  { params }: { params: { meetingId: string } }
) {
  try {
    const meetingId = params.meetingId;
    
    const db = getDatabase();
    
    // Get meeting details with weather
    const meetingResult = await db.query(
      `SELECT 
        meeting_id,
        track_name,
        meeting_date,
        current_temperature,
        current_wind_speed,
        current_wind_direction,
        current_weather_symbol,
        weather_updated_at
      FROM pf_meetings
      WHERE meeting_id = $1`,
      [meetingId]
    );

    if (meetingResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Meeting not found' },
        { status: 404 }
      );
    }

    const meeting = meetingResult.rows[0];
    const trackName = meeting.track_name.toLowerCase();

    // Prepare current weather data
    let current = null;
    if (meeting.weather_updated_at) {
      current = {
        temperature: parseFloat(meeting.current_temperature),
        windSpeed: parseFloat(meeting.current_wind_speed),
        windDirection: parseInt(meeting.current_wind_direction),
        windDirectionCompass: degreesToCompass(parseInt(meeting.current_wind_direction)),
        weatherSymbol: meeting.current_weather_symbol,
        weatherEmoji: getWeatherEmoji(meeting.current_weather_symbol),
        description: getWeatherDescription(meeting.current_weather_symbol),
        time: meeting.weather_updated_at,
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
      meetingId: meeting.meeting_id,
      trackName: meeting.track_name,
      meetingDate: meeting.meeting_date,
      current,
      hourly,
      lastUpdated: meeting.weather_updated_at,
      attribution: 'Weather data from MET Norway',
    });

  } catch (error: any) {
    console.error('Error fetching weather for meeting:', error);
    return NextResponse.json(
      { error: 'Failed to fetch weather', message: error.message },
      { status: 500 }
    );
  }
}
