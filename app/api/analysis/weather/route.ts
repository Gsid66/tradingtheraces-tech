import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';

// Create database pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 3,
  idleTimeoutMillis: 10000,
  connectionTimeoutMillis: 10000,
});

/**
 * Weather Analysis API
 * 
 * GET /api/analysis/weather?type=track-performance&track={name}&metric={metric}
 * GET /api/analysis/weather?type=jockey-stats&jockeyId={id}&condition={condition}
 * GET /api/analysis/weather?type=optimal-conditions&track={name}
 * GET /api/analysis/weather?type=historical&track={name}&days={number}
 * GET /api/analysis/weather?type=correlations&track={name}
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type');
  const track = searchParams.get('track');

  try {
    switch (type) {
      case 'track-performance':
        return await getTrackPerformance(searchParams);
      case 'jockey-stats':
        return await getJockeyStats(searchParams);
      case 'optimal-conditions':
        return await getOptimalConditions(track);
      case 'historical':
        return await getHistoricalData(searchParams);
      case 'correlations':
        return await getCorrelations(track);
      default:
        return NextResponse.json(
          { error: 'Invalid analysis type. Use: track-performance, jockey-stats, optimal-conditions, historical, or correlations' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Weather analysis error:', error);
    return NextResponse.json(
      { error: 'Failed to perform analysis' },
      { status: 500 }
    );
  }
}

async function getTrackPerformance(searchParams: URLSearchParams) {
  const track = searchParams.get('track');
  const metric = searchParams.get('metric') || 'wind';

  if (!track) {
    return NextResponse.json({ error: 'Track parameter required' }, { status: 400 });
  }

  let query = '';
  const params: any[] = [];
  let paramIndex = 1;

  // Build query based on metric
  switch (metric.toLowerCase()) {
    case 'wind':
      query = `
        SELECT 
          CASE 
            WHEN rwc.wind_speed * 3.6 < 15 THEN 'Light (<15 km/h)'
            WHEN rwc.wind_speed * 3.6 < 30 THEN 'Moderate (15-30 km/h)'
            WHEN rwc.wind_speed * 3.6 < 45 THEN 'Strong (30-45 km/h)'
            ELSE 'Severe (>45 km/h)'
          END as range,
          AVG(rr.winning_time) as avg_time,
          AVG(rr.winning_margin) as avg_win_margin,
          COUNT(*) as race_count,
          STDDEV(rr.winning_time) as std_dev
        FROM race_weather_conditions rwc
        JOIN race_results rr ON rwc.race_id = rr.race_id
        WHERE LOWER(rwc.track_name) = $1
          AND rr.winning_time IS NOT NULL
        GROUP BY range
        ORDER BY 
          CASE range
            WHEN 'Light (<15 km/h)' THEN 1
            WHEN 'Moderate (15-30 km/h)' THEN 2
            WHEN 'Strong (30-45 km/h)' THEN 3
            ELSE 4
          END
      `;
      params.push(track.toLowerCase());
      break;

    case 'temperature':
    case 'temp':
      query = `
        SELECT 
          CASE 
            WHEN rwc.temperature < 10 THEN 'Cold (<10°C)'
            WHEN rwc.temperature < 20 THEN 'Cool (10-20°C)'
            WHEN rwc.temperature < 30 THEN 'Warm (20-30°C)'
            ELSE 'Hot (>30°C)'
          END as range,
          AVG(rr.winning_time) as avg_time,
          AVG(rr.winning_margin) as avg_win_margin,
          COUNT(*) as race_count,
          STDDEV(rr.winning_time) as std_dev
        FROM race_weather_conditions rwc
        JOIN race_results rr ON rwc.race_id = rr.race_id
        WHERE LOWER(rwc.track_name) = $1
          AND rr.winning_time IS NOT NULL
        GROUP BY range
        ORDER BY 
          CASE range
            WHEN 'Cold (<10°C)' THEN 1
            WHEN 'Cool (10-20°C)' THEN 2
            WHEN 'Warm (20-30°C)' THEN 3
            ELSE 4
          END
      `;
      params.push(track.toLowerCase());
      break;

    case 'humidity':
      query = `
        SELECT 
          CASE 
            WHEN rwc.humidity < 40 THEN 'Low (<40%)'
            WHEN rwc.humidity < 60 THEN 'Moderate (40-60%)'
            WHEN rwc.humidity < 80 THEN 'High (60-80%)'
            ELSE 'Very High (>80%)'
          END as range,
          AVG(rr.winning_time) as avg_time,
          AVG(rr.winning_margin) as avg_win_margin,
          COUNT(*) as race_count,
          STDDEV(rr.winning_time) as std_dev
        FROM race_weather_conditions rwc
        JOIN race_results rr ON rwc.race_id = rr.race_id
        WHERE LOWER(rwc.track_name) = $1
          AND rr.winning_time IS NOT NULL
          AND rwc.humidity IS NOT NULL
        GROUP BY range
        ORDER BY 
          CASE range
            WHEN 'Low (<40%)' THEN 1
            WHEN 'Moderate (40-60%)' THEN 2
            WHEN 'High (60-80%)' THEN 3
            ELSE 4
          END
      `;
      params.push(track.toLowerCase());
      break;

    default:
      return NextResponse.json({ error: 'Invalid metric. Use: wind, temperature, or humidity' }, { status: 400 });
  }

  const client = await pool.connect();
  try {
    const result = await client.query(query, params);

    // Calculate insights
    const categories = result.rows.map(row => ({
      range: row.range,
      avgTime: parseFloat(row.avg_time),
      avgWinMargin: parseFloat(row.avg_win_margin),
      raceCount: parseInt(row.race_count),
      stdDev: parseFloat(row.std_dev) || 0,
    }));

    const totalRaces = categories.reduce((sum, cat) => sum + cat.raceCount, 0);
    const times = categories.map(c => c.avgTime).filter(t => !isNaN(t));
    const maxTime = Math.max(...times);
    const minTime = Math.min(...times);
    const timeDiff = maxTime - minTime;

    const insights: string[] = [];
    insights.push(`${totalRaces} races analyzed for ${track}`);
    insights.push(`Time variation: ${timeDiff.toFixed(2)}s across ${metric} conditions`);

    if (timeDiff > 1) {
      insights.push(`Significant ${metric} impact detected (${timeDiff.toFixed(1)}s variation)`);
    } else {
      insights.push(`Minimal ${metric} impact on race times`);
    }

    // Calculate simple correlation score
    const correlationScore = timeDiff / 10; // Simplified estimate

    return NextResponse.json({
      track,
      metric,
      analysis: {
        sampleSize: totalRaces,
        correlationScore: Math.min(1, Math.abs(correlationScore)),
        categories,
        insights,
      },
      lastUpdated: new Date().toISOString(),
    });
  } finally {
    client.release();
  }
}

async function getJockeyStats(searchParams: URLSearchParams) {
  const jockeyId = searchParams.get('jockeyId');
  const condition = searchParams.get('condition');

  if (!jockeyId || !condition) {
    return NextResponse.json(
      { error: 'Both jockeyId and condition parameters required' },
      { status: 400 }
    );
  }

  let weatherFilter = '';
  switch (condition.toLowerCase()) {
    case 'rain':
      weatherFilter = "rwc.weather_condition ILIKE '%rain%'";
      break;
    case 'wind':
      weatherFilter = 'rwc.wind_speed * 3.6 > 30';
      break;
    case 'hot':
      weatherFilter = 'rwc.temperature > 30';
      break;
    case 'cold':
      weatherFilter = 'rwc.temperature < 10';
      break;
    default:
      weatherFilter = `rwc.weather_condition ILIKE '%${condition}%'`;
  }

  const query = `
    SELECT 
      COUNT(*) FILTER (WHERE rr.winner_name ILIKE $1) as wins,
      COUNT(*) as rides,
      AVG(rr.winning_time) FILTER (WHERE rr.winner_name ILIKE $1) as avg_win_time,
      AVG(rr.winning_margin) FILTER (WHERE rr.winner_name ILIKE $1) as avg_win_margin
    FROM race_weather_conditions rwc
    JOIN race_results rr ON rwc.race_id = rr.race_id
    WHERE ${weatherFilter}
      AND (rr.winner_name ILIKE $1 
           OR rr.second_place ILIKE $1 
           OR rr.third_place ILIKE $1)
  `;

  const client = await pool.connect();
  try {
    const result = await client.query(query, [`%${jockeyId}%`]);

    if (result.rows.length === 0 || result.rows[0].rides === '0') {
      return NextResponse.json({
        jockeyId,
        condition,
        stats: null,
        message: 'No data available for this jockey in these conditions',
      });
    }

    const data = result.rows[0];
    const winRate = (parseInt(data.wins) / parseInt(data.rides)) * 100;

    return NextResponse.json({
      jockeyId,
      condition,
      stats: {
        rides: parseInt(data.rides),
        wins: parseInt(data.wins),
        winRate: parseFloat(winRate.toFixed(2)),
        avgWinTime: data.avg_win_time ? parseFloat(data.avg_win_time) : null,
        avgWinMargin: data.avg_win_margin ? parseFloat(data.avg_win_margin) : null,
      },
      lastUpdated: new Date().toISOString(),
    });
  } finally {
    client.release();
  }
}

async function getOptimalConditions(track: string | null) {
  if (!track) {
    return NextResponse.json({ error: 'Track parameter required' }, { status: 400 });
  }

  const query = `
    SELECT 
      AVG(rwc.temperature) as optimal_temp,
      AVG(rwc.wind_speed * 3.6) as optimal_wind_kmh,
      AVG(rwc.humidity) as optimal_humidity,
      COUNT(*) as sample_size
    FROM race_weather_conditions rwc
    JOIN race_results rr ON rwc.race_id = rr.race_id
    WHERE LOWER(rwc.track_name) = $1
      AND rr.winning_time IS NOT NULL
      AND rr.winning_time = (
        SELECT MIN(winning_time) 
        FROM race_results rr2
        JOIN race_weather_conditions rwc2 ON rr2.race_id = rwc2.race_id
        WHERE LOWER(rwc2.track_name) = $1
      )
  `;

  const client = await pool.connect();
  try {
    const result = await client.query(query, [track.toLowerCase()]);

    if (result.rows.length === 0) {
      return NextResponse.json({
        track,
        optimalConditions: null,
        message: 'Insufficient data to determine optimal conditions',
      });
    }

    const data = result.rows[0];

    return NextResponse.json({
      track,
      optimalConditions: {
        temperature: parseFloat(data.optimal_temp).toFixed(1),
        windSpeed: parseFloat(data.optimal_wind_kmh).toFixed(1),
        humidity: data.optimal_humidity ? parseFloat(data.optimal_humidity).toFixed(0) : null,
        sampleSize: parseInt(data.sample_size),
      },
      lastUpdated: new Date().toISOString(),
    });
  } finally {
    client.release();
  }
}

async function getHistoricalData(searchParams: URLSearchParams) {
  const track = searchParams.get('track');
  const days = parseInt(searchParams.get('days') || '30');

  if (!track) {
    return NextResponse.json({ error: 'Track parameter required' }, { status: 400 });
  }

  const query = `
    SELECT 
      DATE(observation_time) as date,
      AVG(temperature) as avg_temp,
      MAX(temperature) as max_temp,
      MIN(temperature) as min_temp,
      AVG(wind_speed * 3.6) as avg_wind_kmh,
      MAX(wind_speed * 3.6) as max_wind_kmh,
      SUM(precipitation) as total_precipitation,
      AVG(humidity) as avg_humidity
    FROM track_weather_history
    WHERE LOWER(track_name) = $1
      AND observation_time >= NOW() - INTERVAL '${days} days'
    GROUP BY DATE(observation_time)
    ORDER BY date DESC
  `;

  const client = await pool.connect();
  try {
    const result = await client.query(query, [track.toLowerCase()]);

    return NextResponse.json({
      track,
      days,
      historicalData: result.rows.map(row => ({
        date: row.date,
        avgTemp: parseFloat(row.avg_temp),
        maxTemp: parseFloat(row.max_temp),
        minTemp: parseFloat(row.min_temp),
        avgWindKmh: parseFloat(row.avg_wind_kmh),
        maxWindKmh: parseFloat(row.max_wind_kmh),
        totalPrecipitation: parseFloat(row.total_precipitation),
        avgHumidity: row.avg_humidity ? parseFloat(row.avg_humidity) : null,
      })),
      lastUpdated: new Date().toISOString(),
    });
  } finally {
    client.release();
  }
}

async function getCorrelations(track: string | null) {
  if (!track) {
    return NextResponse.json({ error: 'Track parameter required' }, { status: 400 });
  }

  // This is a simplified correlation calculation
  // For production, consider using a more sophisticated statistical library
  const query = `
    SELECT 
      CORR(rwc.wind_speed, rr.winning_time) as wind_time_corr,
      CORR(rwc.temperature, rr.winning_time) as temp_time_corr,
      CORR(rwc.humidity, rr.winning_time) as humidity_time_corr,
      CORR(rwc.wind_speed, rr.winning_margin) as wind_margin_corr,
      CORR(rwc.temperature, rr.winning_margin) as temp_margin_corr,
      COUNT(*) as sample_size
    FROM race_weather_conditions rwc
    JOIN race_results rr ON rwc.race_id = rr.race_id
    WHERE LOWER(rwc.track_name) = $1
      AND rr.winning_time IS NOT NULL
      AND rr.winning_margin IS NOT NULL
  `;

  const client = await pool.connect();
  try {
    const result = await client.query(query, [track.toLowerCase()]);

    if (result.rows.length === 0 || result.rows[0].sample_size === '0') {
      return NextResponse.json({
        track,
        correlations: null,
        message: 'Insufficient data for correlation analysis',
      });
    }

    const data = result.rows[0];

    return NextResponse.json({
      track,
      correlations: {
        windVsTime: data.wind_time_corr ? parseFloat(data.wind_time_corr) : null,
        temperatureVsTime: data.temp_time_corr ? parseFloat(data.temp_time_corr) : null,
        humidityVsTime: data.humidity_time_corr ? parseFloat(data.humidity_time_corr) : null,
        windVsMargin: data.wind_margin_corr ? parseFloat(data.wind_margin_corr) : null,
        temperatureVsMargin: data.temp_margin_corr ? parseFloat(data.temp_margin_corr) : null,
        sampleSize: parseInt(data.sample_size),
      },
      lastUpdated: new Date().toISOString(),
    });
  } finally {
    client.release();
  }
}
