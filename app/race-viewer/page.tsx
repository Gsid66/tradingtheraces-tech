import React from 'react';
import { FilterParams, ApiResponse, RaceCardData } from './types';
import StatisticsCards from './StatisticsCards';
import FilterPanel from './FilterPanel';
import RaceDataTable from './RaceDataTable';
import Pagination from './Pagination';
import { getPostgresAPIClient, TabRace, TabRunner } from '@/lib/integrations/postgres-api';

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
    if (filters.state) params.append('state', filters.state);
    if (filters.race_number) params.append('race_number', filters.race_number.toString());
    if (filters.horse_name) params.append('horse_name', filters.horse_name);
    if (filters.jockey) params.append('jockey', filters.jockey);
    if (filters.trainer) params.append('trainer', filters.trainer);
    if (filters.minRating) params.append('min_rating', filters.minRating.toString());
    if (filters.maxRating) params.append('max_rating', filters.maxRating.toString());

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

// Normalize track name by removing common suffixes and special characters
function normalizeTrackName(trackName: string): string {
  if (!trackName) return '';
  
  let normalized = trackName.toLowerCase().trim();
  
  // Remove common suffixes
  const suffixes = ['racecourse', 'gardens', 'hillside', 'park', 'racing'];
  for (const suffix of suffixes) {
    // Remove suffix with optional space before it
    normalized = normalized.replace(new RegExp(`\\s*${suffix}\\s*$`), '');
  }
  
  // Remove special characters and extra spaces
  normalized = normalized.replace(/[^a-z0-9\s]/g, ' ');
  normalized = normalized.replace(/\s+/g, ' ').trim();
  
  return normalized;
}

// Check if two track names match (handles variations like "sandown" vs "sandown hillside")
function tracksMatch(track1: string, track2: string): boolean {
  if (!track1 || !track2) return false;
  
  const normalized1 = normalizeTrackName(track1);
  const normalized2 = normalizeTrackName(track2);
  
  if (!normalized1 || !normalized2) return false;
  
  // Check if tracks are equal or one contains the other
  // Use minimum length threshold to avoid false positives like "vale" matching "waverley"
  return normalized1 === normalized2 || 
         (normalized1.length >= 5 && normalized2.includes(normalized1)) ||
         (normalized2.length >= 5 && normalized1.includes(normalized2));
}

async function mergeTABOdds(raceCards: RaceCardData[]): Promise<RaceCardData[]> {
  // If no race cards, return empty array
  if (!raceCards || raceCards.length === 0) {
    return raceCards;
  }

  const pgClient = getPostgresAPIClient();
  
  // If postgres API client is not available, return race cards without TAB odds
  if (!pgClient) {
    console.warn('⚠️ PostgreSQL API client not available - TAB odds will not be fetched');
    return raceCards;
  }

  try {
    // Extract unique dates from race cards
    const uniqueDates = [...new Set(raceCards.map(card => {
      const date = new Date(card.race_date);
      return date.toISOString().split('T')[0];
    }))];

    console.log('🔍 Fetching TAB odds for dates:', uniqueDates);

    // Fetch TAB data for all unique dates
    const tabDataPromises = uniqueDates.map(date => 
      pgClient.getRacesByDate(date).catch(err => {
        console.error(`Error fetching TAB data for ${date}:`, err);
        return { success: false, data: [] };
      })
    );

    const tabResponses = await Promise.all(tabDataPromises);

    // Flatten all TAB races into a single array
    const allTabRaces = tabResponses
      .filter(response => response.success && Array.isArray(response.data))
      .flatMap(response => response.data);

    console.log(`📊 Fetched ${allTabRaces.length} TAB races`);

    // Debug: Log first race card structure to understand field names
    if (raceCards.length > 0) {
      const sampleCard = raceCards[0];
      console.log('🔍 Sample race card fields:', {
        track: sampleCard.track,
        meeting_name: sampleCard.meeting_name,
        race_date: sampleCard.race_date,
        race_number: sampleCard.race_number,
        horse_name: sampleCard.horse_name
      });
    }

    // Merge TAB odds into race cards
    const mergedRaceCards = raceCards.map(card => {
      // Normalize race_date to YYYY-MM-DD for comparison
      const cardDate = new Date(card.race_date).toISOString().split('T')[0];
      
      // Find matching TAB race
      const matchingTabRace = allTabRaces.find((tabRace: TabRace) => {
        const tabDate = new Date(tabRace.meeting_date).toISOString().split('T')[0];
        const dateMatch = tabDate === cardDate;
        
        // Match on meeting name with intelligent track name matching
        // Handles variations like "sandown" vs "sandown hillside", "rosehill" vs "rosehill gardens"
        // Support both 'track' and 'meeting_name' fields with null checks
        const cardTrack = card.track || card.meeting_name || '';
        const tabTrack = tabRace.meeting_name ?? '';
        
        // Skip matching if card has no track information
        if (!cardTrack || !tabTrack) {
          return false;
        }
        
        // Use intelligent track matching that normalizes and handles suffixes
        const trackMatch = tracksMatch(cardTrack, tabTrack);
        
        const raceMatch = tabRace.race_number === card.race_number;
        
        // Debug log for failed matches (1% sample rate to avoid spam)
        if (!dateMatch || !trackMatch || !raceMatch) {
          if (Math.random() < 0.01) {
            console.log('❌ Match failed:', {
              cardTrack: cardTrack,
              tabTrack: tabTrack,
              cardDate,
              tabDate,
              cardRace: card.race_number,
              tabRace: tabRace.race_number,
              dateMatch,
              trackMatch,
              raceMatch
            });
          }
        }
        
        return dateMatch && trackMatch && raceMatch;
      });

      if (matchingTabRace && matchingTabRace.runners) {
        // Find matching runner in the TAB race
        const matchingRunner = matchingTabRace.runners.find((runner: TabRunner) => {
          // Skip runners without horse names
          if (!runner.horse_name || !card.horse_name) return false;
          return runner.horse_name.toLowerCase().trim() === card.horse_name.toLowerCase().trim();
        });

        if (matchingRunner) {
          return {
            ...card,
            tab_fixed_win: matchingRunner.tab_fixed_win_price,
            tab_fixed_place: matchingRunner.tab_fixed_place_price
          };
        }
      }

      // Return card without TAB odds if no match found
      return card;
    });

    // Log merge statistics
    const cardsWithTabWin = mergedRaceCards.filter(c => c.tab_fixed_win != null).length;
    const cardsWithTabPlace = mergedRaceCards.filter(c => c.tab_fixed_place != null).length;
    console.log(`✅ Merged TAB odds: ${cardsWithTabWin} with Win odds, ${cardsWithTabPlace} with Place odds out of ${raceCards.length} total cards`);

    return mergedRaceCards;
  } catch (error) {
    console.error('Error merging TAB odds:', error);
    return raceCards; // Return original race cards on error
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

  // Merge TAB odds into race cards
  const raceCardsWithTABOdds = await mergeTABOdds(result.data);
  
  // Update result with merged data
  const finalResult = {
    ...result,
    data: raceCardsWithTABOdds
  };

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
          totalRecords={finalResult.total}
          currentPage={finalResult.page}
          totalPages={finalResult.totalPages}
          recordsPerPage={finalResult.perPage}
        />

        {/* Filter Panel */}
        <FilterPanel />

        {/* Data Table */}
        <RaceDataTable data={finalResult.data} />

        {/* Pagination */}
        {finalResult.totalPages > 1 && (
          <Pagination 
            currentPage={finalResult.page} 
            totalPages={finalResult.totalPages} 
          />
        )}
      </div>
    </div>
  );
}
