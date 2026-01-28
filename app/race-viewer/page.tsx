import React from 'react';
import { FilterParams, ApiResponse } from './types';
import StatisticsCards from './StatisticsCards';
import FilterPanel from './FilterPanel';
import DateRangeDisplay from './DateRangeDisplay';
import RaceDataTable from './RaceDataTable';

export const dynamic = 'force-dynamic';

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

// Utility function to format date to YYYY-MM-DD
function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

// Utility function to get today's date
function getToday(): string {
  return formatDate(new Date());
}

async function fetchRaceCards(filters: FilterParams): Promise<ApiResponse> {
  const raceCardsApiUrl = process.env.RACE_CARD_RATINGS_API_URL || 'https://race-cards-ratings.onrender.com';

  try {
    const todayFormatted = getToday();

    const params = new URLSearchParams();
    
    // Required date range - default to today
    params.append('start_date', filters.dateFrom || todayFormatted);
    params.append('end_date', filters.dateTo || todayFormatted);

    // No limit or offset - fetch ALL records
    // Note: This fetches all matching records without pagination.
    // For large datasets, consider the API's default limits or client-side virtualization.

    const url = `${raceCardsApiUrl}/api/races?${params.toString()}`;
    console.log('🔍 Fetching from race-cards-ratings API:', url);

    const response = await fetch(url, {
      cache: 'no-store',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error('API response not OK:', response.status, response.statusText);
      throw new Error(`API responded with status ${response.status}`);
    }

    const responseData = await response.json();

    // Extract data and total count
    const data = responseData.data || [];
    const total = responseData.pagination?.total || responseData.total || data.length;

    return {
      data: data,
      total: total
    };
  } catch (error) {
    console.error('Error fetching race cards:', error);
    return {
      data: [],
      total: 0
    };
  }
}

export default async function RaceViewerPage({ searchParams }: PageProps) {
  const params = await searchParams;
  
  // Get default date (today)
  const todayFormatted = getToday();

  // Extract filter params from URL (only dates)
  const filters: FilterParams = {
    dateFrom: typeof params.dateFrom === 'string' ? params.dateFrom : todayFormatted,
    dateTo: typeof params.dateTo === 'string' ? params.dateTo : todayFormatted,
  };

  const result = await fetchRaceCards(filters);

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-900 to-purple-700 text-white py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">TTR Race Cards Ratings</h1>
          <p className="text-purple-200 text-lg">
            View, filter, and export thoroughbred racing ratings data
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Statistics Cards */}
        <StatisticsCards
          totalRecords={result.total}
        />

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
