import React from 'react';
import { FilterParams, ApiResponse } from './types';
import StatisticsCards from './StatisticsCards';
import FilterPanel from './FilterPanel';
import RaceDataTable from './RaceDataTable';
import Pagination from './Pagination';

export const dynamic = 'force-dynamic';

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

// Utility function to format date to YYYY-MM-DD
function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

// Utility function to get default date range
function getDefaultDateRange() {
  const today = new Date();
  
  return {
    today,
    todayFormatted: formatDate(today),
  };
}

async function fetchRaceCards(filters: FilterParams): Promise<ApiResponse> {
  const raceCardsApiUrl = process.env.RACE_CARD_RATINGS_API_URL || 'https://race-cards-ratings.onrender.com';

  try {
    const { todayFormatted } = getDefaultDateRange();

    const params = new URLSearchParams();
    
    // Required date range
    params.append('start_date', filters.dateFrom || todayFormatted);
    params.append('end_date', filters.dateTo || todayFormatted);

    // Optional filters
    if (filters.meeting_name) params.append('track', filters.meeting_name);
    if (filters.race_number) params.append('race_number', filters.race_number.toString());
    if (filters.horse_name) params.append('horse', filters.horse_name);
    if (filters.jockey) params.append('jockey', filters.jockey);
    if (filters.trainer) params.append('trainer', filters.trainer);

    // Pagination
    const limit = filters.perPage || 50;
    const offset = ((filters.page || 1) - 1) * limit;
    params.append('limit', limit.toString());
    params.append('offset', offset.toString());

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

    // Extract total from pagination object if available, otherwise use data.total
    const total = responseData.pagination?.total || responseData.total || 0;

    return {
      data: responseData.data || [],
      total: total,
      page: filters.page || 1,
      perPage: filters.perPage || 50,
      totalPages: Math.ceil(total / (filters.perPage || 50))
    };
  } catch (error) {
    console.error('Error fetching race cards:', error);
    return {
      data: [],
      total: 0,
      page: 1,
      perPage: 50,
      totalPages: 0
    };
  }
}

export default async function RaceViewerPage({ searchParams }: PageProps) {
  const params = await searchParams;
  
  // Get default dates using utility function
  const { todayFormatted } = getDefaultDateRange();

  // Extract filter params from URL
  const filters: FilterParams = {
    dateFrom: typeof params.dateFrom === 'string' ? params.dateFrom : todayFormatted,
    dateTo: typeof params.dateTo === 'string' ? params.dateTo : todayFormatted,
    meeting_name: typeof params.meeting_name === 'string' ? params.meeting_name : undefined,
    state: typeof params.state === 'string' ? params.state : undefined,
    race_number: typeof params.race_number === 'string' ? parseInt(params.race_number) : undefined,
    horse_name: typeof params.horse_name === 'string' ? params.horse_name : undefined,
    jockey: typeof params.jockey === 'string' ? params.jockey : undefined,
    trainer: typeof params.trainer === 'string' ? params.trainer : undefined,
    minRating: typeof params.minRating === 'string' ? parseInt(params.minRating) : undefined,
    maxRating: typeof params.maxRating === 'string' ? parseInt(params.maxRating) : undefined,
    page: typeof params.page === 'string' ? parseInt(params.page) : 1,
    perPage: typeof params.perPage === 'string' ? parseInt(params.perPage) : 50,
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
          currentPage={result.page}
          totalPages={result.totalPages}
          recordsPerPage={result.perPage}
        />

        {/* Filter Panel */}
        <FilterPanel />

        {/* Data Table */}
        <RaceDataTable data={result.data} />

        {/* Pagination */}
        {result.totalPages > 1 && (
          <Pagination 
            currentPage={result.page} 
            totalPages={result.totalPages} 
          />
        )}
      </div>
    </div>
  );
}
