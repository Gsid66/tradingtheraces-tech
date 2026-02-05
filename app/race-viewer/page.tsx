import React from 'react';
import { Client } from 'pg';
import { FilterParams, CombinedRaceData } from './types';
import StatisticsCards from './StatisticsCards';
import FilterPanel from './FilterPanel';
import DateRangeDisplay from './DateRangeDisplay';
import RaceDataTable from './RaceDataTable';
import { horseNamesMatch } from '@/lib/utils/horse-name-matcher';

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

    // Build WHERE clause dynamically for ratings query
    const ratingsConditions: string[] = [];
    const ratingsValues: any[] = [];
    let paramCount = 1;

    // Date filters (always applied)
    ratingsConditions.push(`rcr.race_date >= $${paramCount}::date`);
    ratingsValues.push(filters.dateFrom);
    paramCount++;
    
    ratingsConditions.push(`rcr.race_date <= $${paramCount}::date`);
    ratingsValues.push(filters.dateTo);
    paramCount++;

    // Search filters
    if (filters.horseName) {
      ratingsConditions.push(`LOWER(rcr.horse_name) LIKE LOWER($${paramCount})`);
      ratingsValues.push(`%${filters.horseName}%`);
      paramCount++;
    }
    if (filters.jockeyName) {
      ratingsConditions.push(`LOWER(rcr.jockey) LIKE LOWER($${paramCount})`);
      ratingsValues.push(`%${filters.jockeyName}%`);
      paramCount++;
    }
    if (filters.trainerName) {
      ratingsConditions.push(`LOWER(rcr.trainer) LIKE LOWER($${paramCount})`);
      ratingsValues.push(`%${filters.trainerName}%`);
      paramCount++;
    }
    if (filters.trackName) {
      ratingsConditions.push(`LOWER(rcr.track) LIKE LOWER($${paramCount})`);
      ratingsValues.push(`%${filters.trackName}%`);
      paramCount++;
    }
    if (filters.state) {
      ratingsConditions.push(`m.state = $${paramCount}`);
      ratingsValues.push(filters.state);
      paramCount++;
    }

    const ratingsWhereClause = `WHERE ${ratingsConditions.join(' AND ')}`;

    // Query 1: Get ratings data with race context
    const ratingsQuery = `
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
        m.state,
        m.country,
        ra.race_id
      FROM race_cards_ratings rcr
      LEFT JOIN pf_meetings m ON rcr.race_date = m.meeting_date
        AND rcr.track = m.track_name
      LEFT JOIN pf_races ra ON ra.meeting_id = m.meeting_id 
        AND rcr.race_number = ra.race_number
      ${ratingsWhereClause}
      ORDER BY rcr.race_date DESC, rcr.track, rcr.race_number, rcr.saddle_cloth
    `;

    const ratingsResult = await client.query(ratingsQuery, ratingsValues);
    const ratings = ratingsResult.rows;

    // Query 2: Get all results for the date range
    const resultsQuery = `
      SELECT 
        r.race_id,
        r.horse_name,
        r.finishing_position,
        r.starting_price,
        r.margin_to_winner,
        r.tab_number
      FROM pf_results r
      INNER JOIN pf_races ra ON r.race_id = ra.race_id
      INNER JOIN pf_meetings m ON ra.meeting_id = m.meeting_id
      WHERE m.meeting_date >= $1::date
        AND m.meeting_date <= $2::date
    `;

    const resultsResult = await client.query(resultsQuery, [filters.dateFrom, filters.dateTo]);
    const results = resultsResult.rows;

    // Match ratings with results using fuzzy matching
    const enrichedData = ratings.map((rating: any) => {
      let matchedResult = null;
      
      if (rating.race_id) {
        matchedResult = results.find((result: any) => 
          result.race_id === rating.race_id &&
          horseNamesMatch(rating.horse_name, result.horse_name)
        );
      }

      return {
        id: rating.id,
        race_date: rating.race_date,
        track_name: rating.track_name,
        race_name: rating.race_name,
        race_number: rating.race_number,
        saddle_cloth: rating.saddle_cloth,
        horse_name: rating.horse_name,
        jockey_name: rating.jockey_name,
        trainer_name: rating.trainer_name,
        rating: rating.rating,
        price: rating.price,
        finishing_position: matchedResult?.finishing_position || null,
        starting_price: matchedResult?.starting_price || null,
        margin_to_winner: matchedResult?.margin_to_winner || null,
        tab_number: matchedResult?.tab_number || null,
        state: rating.state,
        country: rating.country
      };
    });

    // Apply position filter if specified (after fuzzy matching)
    let filteredData = enrichedData;
    if (filters.position) {
      const positionFilter = parseInt(filters.position);
      filteredData = enrichedData.filter((d: any) => d.finishing_position === positionFilter);
    }

    const total = filteredData.length;

    console.log('🔍 Search results:', {
      filters,
      total,
      returned: filteredData.length,
      withResults: filteredData.filter((r: any) => r.finishing_position).length,
      sampleRow: filteredData[0]
    });

    return {
      data: filteredData,
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
