import React from 'react';
import { Client } from 'pg';
import { FilterParams, CombinedRaceData } from './types';
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

async function searchRaceData(filters: FilterParams): Promise<{ data: CombinedRaceData[], total: number }> {
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

    // Date filters (always applied)
    conditions.push(`rcr.race_date >= $${paramCount}::date`);
    values.push(filters.dateFrom);
    paramCount++;
    
    conditions.push(`rcr.race_date <= $${paramCount}::date`);
    values.push(filters.dateTo);
    paramCount++;

    // Search filters
    if (filters.horseName) {
      conditions.push(`LOWER(rcr.horse_name) LIKE LOWER($${paramCount})`);
      values.push(`%${filters.horseName}%`);
      paramCount++;
    }
    if (filters.jockeyName) {
      conditions.push(`LOWER(rcr.jockey) LIKE LOWER($${paramCount})`);
      values.push(`%${filters.jockeyName}%`);
      paramCount++;
    }
    if (filters.trainerName) {
      conditions.push(`LOWER(rcr.trainer) LIKE LOWER($${paramCount})`);
      values.push(`%${filters.trainerName}%`);
      paramCount++;
    }
    if (filters.trackName) {
      conditions.push(`LOWER(rcr.track) LIKE LOWER($${paramCount})`);
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

    const whereClause = `WHERE ${conditions.join(' AND ')}`;

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total
      FROM race_cards_ratings rcr
      LEFT JOIN pf_results r ON LOWER(TRIM(rcr.horse_name)) = LOWER(TRIM(r.horse_name))
      LEFT JOIN pf_races ra ON r.race_id = ra.race_id 
        AND rcr.race_number = ra.race_number
      LEFT JOIN pf_meetings m ON ra.meeting_id = m.meeting_id
        AND rcr.race_date = m.meeting_date
        AND LOWER(TRIM(rcr.track)) = LOWER(TRIM(m.track_name))
      ${whereClause}
    `;

    const countResult = await client.query(countQuery, values);
    const total = parseInt(countResult.rows[0].total);

    // Get ALL data (no pagination)
    const dataQuery = `
      SELECT 
        rcr.id,
        rcr.race_date::date as race_date,
        rcr.track as track_name,
        rcr.race_name,
        rcr.race_number,
        rcr.saddle_cloth,
        rcr.horse_name,
        rcr.jockey as jockey_name,
        rcr.trainer as trainer_name,
        rcr.rating::integer as rating,
        rcr.price::numeric(10,2) as price,
        r.finishing_position,
        r.starting_price,
        r.margin_to_winner,
        r.tab_number,
        m.state,
        m.country
      FROM race_cards_ratings rcr
      LEFT JOIN pf_results r ON LOWER(TRIM(rcr.horse_name)) = LOWER(TRIM(r.horse_name))
      LEFT JOIN pf_races ra ON r.race_id = ra.race_id 
        AND rcr.race_number = ra.race_number
      LEFT JOIN pf_meetings m ON ra.meeting_id = m.meeting_id
        AND rcr.race_date = m.meeting_date
        AND LOWER(TRIM(rcr.track)) = LOWER(TRIM(m.track_name))
      ${whereClause}
      ORDER BY rcr.race_date DESC, rcr.track, rcr.race_number, rcr.saddle_cloth
    `;

    const dataResult = await client.query(dataQuery, values);

    console.log('🔍 Search results:', {
      filters,
      total,
      returned: dataResult.rows.length,
      withResults: dataResult.rows.filter((r: any) => r.finishing_position).length,
      sampleRow: dataResult.rows[0]
    });

    return {
      data: dataResult.rows,
      total: total
    };

  } catch (error) {
    console.error('❌ Error searching race data:', error);
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

  // Add optional search filters
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

  const result = await searchRaceData(filters);

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-900 to-purple-700 text-white py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">🏇 TTR Race Database</h1>
          <p className="text-purple-200 text-lg">
            47,000+ Records • TTR Ratings • Prices • Results
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
