import React from 'react';
import { RaceCardData, FilterParams, ApiResponse } from './types';
import StatisticsCards from './StatisticsCards';
import FilterPanel from './FilterPanel';
import RaceDataTable from './RaceDataTable';
import Pagination from './Pagination';

export const dynamic = 'force-dynamic';

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

async function fetchRaceCards(filters: FilterParams): Promise<ApiResponse> {
  const postgresApiUrl = process.env.POSTGRES_API_URL;
  
  if (!postgresApiUrl) {
    console.error('POSTGRES_API_URL environment variable is not set');
    return {
      data: [],
      total: 0,
      page: 1,
      perPage: 50,
      totalPages: 0
    };
  }

  try {
    const params = new URLSearchParams();
    
    if (filters.dateFrom) params.append('dateFrom', filters.dateFrom);
    if (filters.dateTo) params.append('dateTo', filters.dateTo);
    if (filters.meeting_name) params.append('meeting_name', filters.meeting_name);
    if (filters.state) params.append('state', filters.state);
    if (filters.horse_name) params.append('horse_name', filters.horse_name);
    if (filters.jockey) params.append('jockey', filters.jockey);
    if (filters.trainer) params.append('trainer', filters.trainer);
    if (filters.race_number) params.append('race_number', filters.race_number.toString());
    if (filters.minRating) params.append('minRating', filters.minRating.toString());
    if (filters.maxRating) params.append('maxRating', filters.maxRating.toString());
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.perPage) params.append('perPage', filters.perPage.toString());

    const url = `${postgresApiUrl}/api/race-cards?${params.toString()}`;
    console.log('Fetching from:', url);

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

    const data = await response.json();
    
    // Handle different possible response formats
    if (Array.isArray(data)) {
      // If API returns array directly
      const perPage = filters.perPage || 50;
      return {
        data: data,
        total: data.length,
        page: filters.page || 1,
        perPage: perPage,
        totalPages: Math.ceil(data.length / perPage)
      };
    } else if (data.data && Array.isArray(data.data)) {
      // If API returns object with data property
      return {
        data: data.data,
        total: data.total || data.data.length,
        page: data.page || filters.page || 1,
        perPage: data.perPage || filters.perPage || 50,
        totalPages: data.totalPages || Math.ceil((data.total || data.data.length) / (data.perPage || filters.perPage || 50))
      };
    } else {
      // Fallback
      return {
        data: [],
        total: 0,
        page: 1,
        perPage: 50,
        totalPages: 0
      };
    }
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
  
  // Calculate default dates
  const today = new Date();
  const thirtyDaysAgo = new Date(today);
  thirtyDaysAgo.setDate(today.getDate() - 30);
  
  const formatDate = (date: Date) => date.toISOString().split('T')[0];

  // Extract filter params from URL
  const filters: FilterParams = {
    dateFrom: typeof params.dateFrom === 'string' ? params.dateFrom : formatDate(thirtyDaysAgo),
    dateTo: typeof params.dateTo === 'string' ? params.dateTo : formatDate(today),
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
