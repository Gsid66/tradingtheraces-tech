import React from 'react';
import { Client } from 'pg';
import { FilterParams, ApiResponse } from './types';
import StatisticsCards from './StatisticsCards';
import FilterPanel from './FilterPanel';
import DateRangeDisplay from './DateRangeDisplay';
import RaceDataTable from './RaceDataTable';

export const dynamic = 'force-dynamic';

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

// Utility function to get today's date
function getToday(): string {
  return new Date().toLocaleDateString('en-CA', { 
    timeZone: 'Australia/Sydney' 
  });
}

async function searchRaceResults(filters: FilterParams): Promise<ApiResponse> {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();

    // Build WHERE clause dynamically
    const conditions: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    // Date filters
    if (filters.dateFrom) {
      conditions.push(`m.meeting_date >= $${paramCount}`);
      values.push(filters.dateFrom);
      paramCount++;
    }
    if (filters.dateTo) {
      conditions.push(`m.meeting_date <= $${paramCount}`);
      values.push(filters.dateTo);
      paramCount++;
    }

    // Search filters
    if (filters.horseName) {
      conditions.push(`LOWER(r.horse_name) LIKE LOWER($${paramCount})`);
      values.push(`%${filters.horseName}%`);
      paramCount++;
    }
    if (filters.jockeyName) {
      conditions.push(`LOWER(r.jockey_name) LIKE LOWER($${paramCount})`);
      values.push(`%${filters.jockeyName}%`);
      paramCount++;
    }
    if (filters.trainerName) {
      conditions.push(`LOWER(r.trainer_name) LIKE LOWER($${paramCount})`);
      values.push(`%${filters.trainerName}%`);
      paramCount++;
    }
    if (filters.trackName) {
      conditions.push(`LOWER(m.track_name) LIKE LOWER($${paramCount})`);
      values.push(`%${filters.trackName}%`);
      paramCount++;
    }
    if (filters.state) {
      conditions.push(`m.state = $${paramCount}`);
      values.push(filters.state);
      paramCount++;
    }
    if (filters.position) {
      conditions.push(`r.finishing_position = $${paramCount}`);
      values.push(parseInt(filters.position));
      paramCount++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total
      FROM pf_results r
      JOIN pf_races ra ON r.race_id = ra.race_id
      JOIN pf_meetings m ON ra.meeting_id = m.meeting_id
      ${whereClause}
    `;

    const countResult = await client.query(countQuery, values);
    const total = parseInt(countResult.rows[0].total);

    // Get paginated data
    const limit = filters.limit || 50;
    const offset = filters.offset || 0;

    const dataQuery = `
  SELECT 
    m.meeting_date,
    m.track_name,
    m.state,
    m.country,
    ra.race_number,
    ra.race_name,
    ra.distance,
    ra.start_time,
    r.horse_name,
    r.finishing_position,
    r.tab_number,
    r.jockey_name,
    r.trainer_name,
    r.starting_price,
    r.margin_to_winner,
    r.race_id
  FROM pf_results r
  JOIN pf_races ra ON r.race_id = ra.race_id
  JOIN pf_meetings m ON ra.meeting_id = m.meeting_id
  ${whereClause}
  ORDER BY m.meeting_date DESC, m.track_name, ra.race_number, r.finishing_position
  LIMIT $${paramCount} OFFSET $${paramCount + 1}
`;

    const dataResult = await client.query(dataQuery, [...values, limit, offset]);

    console.log('🔍 Search results:', {
      filters,
      total,
      returned: dataResult.rows.length
    });

    return {
      data: dataResult.rows,
      total: total
    };

  } catch (error) {
    console.error('❌ Error searching race results:', error);
    return {
      data: [],
      total: 0
    };
  } finally {
    await client.end();
  }
}

export default async function RaceViewerPage({ searchParams }: PageProps) {
  const params = await searchParams;
  
  const todayFormatted = getToday();

  // Extract all filter params from URL
  const filters: FilterParams = {
    dateFrom: typeof params.dateFrom === 'string' ? params.dateFrom : todayFormatted,
    dateTo: typeof params.dateTo === 'string' ? params.dateTo : todayFormatted,
  };

  // Add optional search filters only if they exist
  if (typeof params.horseName === 'string' && params.horseName) {
    filters.horseName = params.horseName;
  }
  if (typeof params.jockeyName === 'string' && params.jockeyName) {
    filters.jockeyName = params.jockeyName;
  }
  if (typeof params.trainerName === 'string' && params.trainerName) {
    filters.trainerName = params.trainerName;
  }
  if (typeof params.trackName === 'string' && params.trackName) {
    filters.trackName = params.trackName;
  }
  if (typeof params.state === 'string' && params.state) {
    filters.state = params.state;
  }
  if (typeof params.position === 'string' && params.position) {
    filters.position = params.position;
  }
  if (typeof params.limit === 'string') {
    filters.limit = parseInt(params.limit);
  }
  if (typeof params.offset === 'string') {
    filters.offset = parseInt(params.offset);
  }

  const result = await searchRaceResults(filters);

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-900 to-purple-700 text-white py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Race Results Database</h1>
          <p className="text-purple-200 text-lg">
            Search and explore historical race results
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Statistics Cards */}
        <StatisticsCards totalRecords={result.total} />

        {/* Filter Panel */}
        <FilterPanel />

        {/* Date Range Display */}
        <DateRangeDisplay 
          dateFrom={filters.dateFrom || todayFormatted} 
          dateTo={filters.dateTo || todayFormatted} 
        />

        {/* Data Table */}
        <RaceDataTable data={result.data} />
      </div>
    </div>
  );
}
