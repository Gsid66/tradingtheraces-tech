import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';
import {
  calculateTrackBias,
  calculateWindImpact,
  calculateWeatherImpactScore,
} from '@/lib/integrations/weather/weather-analysis';

// Create database pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 3,
  idleTimeoutMillis: 10000,
  connectionTimeoutMillis: 10000,
});

interface PredictionRequest {
  raceId: string;
  currentWeather?: {
    temperature: number;
    windSpeed: number;
    windGust?: number;
    windDirection: number;
    humidity?: number;
    precipitation: number;
    visibility?: number;
  };
}

/**
 * Weather Impact Prediction API
 * 
 * POST /api/analysis/weather/predict
 * Body: { raceId, currentWeather }
 * 
 * Returns expected time impact, track bias prediction, and recommendations
 */
export async function POST(request: NextRequest) {
  try {
    const body: PredictionRequest = await request.json();
    const { raceId, currentWeather } = body;

    if (!raceId) {
      return NextResponse.json(
        { error: 'raceId is required' },
        { status: 400 }
      );
    }

    const client = await pool.connect();
    try {
      // Get race details
      const raceQuery = `
        SELECT 
          r.race_id,
          r.track_name,
          r.race_number,
          r.race_distance,
          r.race_start_time
        FROM pf_races r
        WHERE r.race_id = $1
      `;

      const raceResult = await client.query(raceQuery, [raceId]);

      if (raceResult.rows.length === 0) {
        return NextResponse.json(
          { error: 'Race not found' },
          { status: 404 }
        );
      }

      const race = raceResult.rows[0];

      // Get historical average times for this track/distance
      const avgQuery = `
        SELECT 
          AVG(rr.winning_time) as avg_time,
          STDDEV(rr.winning_time) as std_dev,
          COUNT(*) as sample_size
        FROM race_results rr
        JOIN pf_races r ON rr.race_id = r.race_id
        WHERE LOWER(r.track_name) = $1
          AND r.race_distance = $2
          AND rr.winning_time IS NOT NULL
      `;

      const avgResult = await client.query(avgQuery, [
        race.track_name.toLowerCase(),
        race.race_distance,
      ]);

      const avgData = avgResult.rows[0];
      const avgTime = avgData.avg_time ? parseFloat(avgData.avg_time) : null;
      const sampleSize = parseInt(avgData.sample_size);

      if (!avgTime || sampleSize < 5) {
        return NextResponse.json({
          raceId,
          prediction: null,
          message: 'Insufficient historical data for prediction',
        });
      }

      // Use provided weather or fetch from database
      let weather = currentWeather;
      if (!weather) {
        const weatherQuery = `
          SELECT 
            temperature,
            wind_speed,
            wind_gust,
            wind_direction,
            humidity,
            precipitation_last_hour as precipitation,
            visibility
          FROM race_weather_conditions
          WHERE race_id = $1
        `;

        const weatherResult = await client.query(weatherQuery, [raceId]);

        if (weatherResult.rows.length === 0) {
          return NextResponse.json({
            raceId,
            prediction: null,
            message: 'No weather data available for this race',
          });
        }

        const w = weatherResult.rows[0];
        weather = {
          temperature: parseFloat(w.temperature),
          windSpeed: parseFloat(w.wind_speed),
          windGust: w.wind_gust ? parseFloat(w.wind_gust) : undefined,
          windDirection: parseInt(w.wind_direction),
          humidity: w.humidity ? parseInt(w.humidity) : undefined,
          precipitation: parseFloat(w.precipitation),
          visibility: w.visibility ? parseInt(w.visibility) : undefined,
        };
      }

      // Calculate predictions
      const trackBias = calculateTrackBias(weather.windDirection, weather.windSpeed);
      const windImpact = calculateWindImpact(
        weather.windSpeed,
        weather.windGust,
        weather.windDirection
      );
      const impactScore = calculateWeatherImpactScore({
        windSpeed: weather.windSpeed,
        windGust: weather.windGust,
        precipitation: weather.precipitation,
        temperature: weather.temperature,
        visibility: weather.visibility,
        humidity: weather.humidity,
      });

      // Calculate expected time impact
      let expectedTimeImpact = windImpact.expectedTimeImpactSeconds;

      // Adjust for precipitation
      if (weather.precipitation > 2) {
        expectedTimeImpact += weather.precipitation * 0.5;
      }

      // Adjust for extreme temperatures
      if (weather.temperature > 35) {
        expectedTimeImpact += (weather.temperature - 35) * 0.2;
      } else if (weather.temperature < 5) {
        expectedTimeImpact += (5 - weather.temperature) * 0.15;
      }

      // Generate recommendations
      const recommendations: string[] = [];

      if (impactScore.score >= 7) {
        recommendations.push('Severe weather conditions - expect significant race impact');
      }

      if (windImpact.category === 'strong' || windImpact.category === 'severe') {
        recommendations.push(`Strong ${windImpact.category} winds will affect performance`);
      }

      if (trackBias.direction !== 'neutral') {
        recommendations.push(
          `Track bias ${trackBias.direction.replace('favoring_', '')} - consider barrier positions`
        );
      }

      if (weather.precipitation > 2) {
        recommendations.push('Wet conditions - favor horses with soft/heavy track form');
      }

      if (weather.temperature > 32) {
        recommendations.push('Hot conditions - stamina will be tested');
      }

      if (recommendations.length === 0) {
        recommendations.push('Standard conditions - minimal weather impact expected');
      }

      // Calculate confidence based on sample size and weather severity
      const confidence = Math.min(
        1.0,
        (sampleSize / 50) * (1 - impactScore.score / 20)
      );

      return NextResponse.json({
        raceId,
        track: race.track_name,
        raceNumber: race.race_number,
        distance: race.race_distance,
        prediction: {
          expectedTimeImpact: parseFloat(expectedTimeImpact.toFixed(2)),
          averageTime: parseFloat(avgTime.toFixed(2)),
          predictedTime: parseFloat((avgTime + expectedTimeImpact).toFixed(2)),
          trackBias: trackBias.direction,
          windImpactCategory: windImpact.category,
          weatherImpactScore: impactScore.score,
          confidence: parseFloat(confidence.toFixed(2)),
          recommendations,
        },
        weather: {
          temperature: weather.temperature,
          windSpeed: weather.windSpeed,
          windDirection: weather.windDirection,
          humidity: weather.humidity,
          precipitation: weather.precipitation,
        },
        analysis: {
          trackBiasReasoning: trackBias.reasoning,
          windImpactDescription: windImpact.description,
          impactScoreSummary: impactScore.summary,
          sampleSize,
        },
        lastUpdated: new Date().toISOString(),
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Weather prediction error:', error);
    return NextResponse.json(
      { error: 'Failed to generate prediction' },
      { status: 500 }
    );
  }
}

/**
 * GET endpoint for quick prediction lookup by race ID
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const raceId = searchParams.get('raceId');

  if (!raceId) {
    return NextResponse.json(
      { error: 'raceId parameter required' },
      { status: 400 }
    );
  }

  // Use POST logic with race ID only
  return POST(
    new NextRequest(request.url, {
      method: 'POST',
      headers: request.headers,
      body: JSON.stringify({ raceId }),
    })
  );
}
