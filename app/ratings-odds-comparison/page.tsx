import React from 'react';
import { RatingsOddsData } from './types';
import RatingsOddsTable from './RatingsOddsTable';
import { getPostgresAPIClient, TabRace, TabRunner } from '@/lib/integrations/postgres-api';
import { getTTRRatingsClient } from '@/lib/integrations/ttr-ratings';
import { getPuntingFormClient } from '@/lib/integrations/punting-form/client';
import { horseNamesMatch } from '@/lib/utils/horse-name-matcher';

export const dynamic = 'force-dynamic';

// Utility function to format date to YYYY-MM-DD
function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

// Get today's date
// NEW (FIXED):
function getToday(): string {
  return new Date().toLocaleDateString('en-CA', { 
    timeZone: 'Australia/Sydney' 
  }); // Returns YYYY-MM-DD directly
}

// Normalize track name by removing common suffixes and special characters
function normalizeTrackName(trackName: string): string {
  if (!trackName) return '';
  
  let normalized = trackName.toLowerCase().trim();
  
  // Remove common suffixes
  const suffixes = ['racecourse', 'gardens', 'hillside', 'park', 'racing'];
  for (const suffix of suffixes) {
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
  // Use minimum length threshold to avoid false positives
  return normalized1 === normalized2 || 
         (normalized1.length >= 5 && normalized2.includes(normalized1)) ||
         (normalized2.length >= 5 && normalized1.includes(normalized2));
}

// Fetch today's race cards from PFAI
async function fetchTodayRaceCards(): Promise<RatingsOddsData[]> {
  try {
    const pfClient = getPuntingFormClient();
    const ttrClient = getTTRRatingsClient();

    if (!pfClient) {
      console.error('❌ Punting Form client not available');
      return [];
    }

    if (!ttrClient) {
      console.warn('⚠️ TTR Ratings client not available');
      return [];
    }

    const today = getToday();
    console.log('🔍 Fetching today\'s meetings from Punting Form:', today);

    // Get today's meetings
    const meetingsResponse = await pfClient.getTodaysMeetings();
    const meetings = meetingsResponse.payLoad || [];
    
    console.log(`📊 Retrieved ${meetings.length} meetings for today`);

    if (meetings.length === 0) {
      console.warn('⚠️ No meetings found for today');
      return [];
    }

    // Fetch ratings for all meetings
    const allRatingsData: RatingsOddsData[] = [];

    for (const meeting of meetings) {
      console.log(`🔍 Fetching ratings for ${meeting.track.name}...`);
      
      const ttrResponse = await ttrClient.getRatingsForMeeting(meeting.meetingId);
      
      if (ttrResponse.success && ttrResponse.data && ttrResponse.data.length > 0) {
        // Transform PFAI data to RatingsOddsData format
        const meetingRatings = ttrResponse.data.map(rating => ({
          race_date: meeting.meetingDate,
          track: meeting.track.name,
          meeting_name: meeting.track.name,
          race_number: rating.race_number,
          race_name: '', // Not available in PFAI ratings
          saddle_cloth: rating.tab_number,
          horse_name: rating.horse_name,
          jockey: null, // Not available in PFAI ratings
          trainer: null, // Not available in PFAI ratings
          rating: rating.rating,
          price: rating.price,
          tab_fixed_win: null, // Will be merged later
          tab_fixed_place: null // Will be merged later
        }));

        allRatingsData.push(...meetingRatings);
        console.log(`✅ Added ${meetingRatings.length} ratings for ${meeting.track.name}`);
      } else {
        console.warn(`⚠️ No ratings found for ${meeting.track.name}`);
      }
    }

    console.log(`✅ Total ratings fetched: ${allRatingsData.length}`);
    return allRatingsData;
  } catch (error) {
    console.error('❌ Error fetching race cards from PFAI:', error);
    return [];
  }
}

// Merge TAB odds into race cards
async function mergeTABOdds(raceCards: RatingsOddsData[]): Promise<RatingsOddsData[]> {
  if (!raceCards || raceCards.length === 0) {
    return raceCards;
  }

  const pgClient = getPostgresAPIClient();
  
  if (!pgClient) {
    console.warn('⚠️ PostgreSQL API client not available - TAB odds will not be fetched');
    return raceCards;
  }

  try {
    const today = getToday();
    console.log('🔍 Fetching TAB odds for today:', today);

    const tabResponse = await pgClient.getRacesByDate(today).catch(err => {
      console.error(`Error fetching TAB data:`, err);
      return { success: false, data: [] };
    });

    if (!tabResponse.success || !Array.isArray(tabResponse.data)) {
      console.warn('⚠️ TAB data not available');
      return raceCards;
    }

    const allTabRaces = tabResponse.data;
    console.log(`📊 Fetched ${allTabRaces.length} TAB races for today`);

    // Merge TAB odds into race cards
    const mergedRaceCards = raceCards.map(card => {
      const cardDate = new Date(card.race_date).toISOString().split('T')[0];
      
      // Find matching TAB race
      const matchingTabRace = allTabRaces.find((tabRace: TabRace) => {
        const tabDate = new Date(tabRace.meeting_date).toISOString().split('T')[0];
        const dateMatch = tabDate === cardDate;
        
        const cardTrack = card.track || card.meeting_name || '';
        const tabTrack = tabRace.meeting_name ?? '';
        
        if (!cardTrack || !tabTrack) {
          return false;
        }
        
        const trackMatch = tracksMatch(cardTrack, tabTrack);
        const raceMatch = tabRace.race_number === card.race_number;
        
        return dateMatch && trackMatch && raceMatch;
      });

      if (matchingTabRace && matchingTabRace.runners) {
        const matchingRunner = matchingTabRace.runners.find((runner: TabRunner) => {
          return horseNamesMatch(runner.horse_name, card.horse_name);
        });

        if (matchingRunner) {
          return {
            ...card,
            tab_fixed_win: matchingRunner.tab_fixed_win_price,
            tab_fixed_place: matchingRunner.tab_fixed_place_price
          };
        }
      }

      return card;
    });

    const cardsWithTabWin = mergedRaceCards.filter(c => c.tab_fixed_win != null).length;
    const cardsWithTabPlace = mergedRaceCards.filter(c => c.tab_fixed_place != null).length;
    console.log(`✅ Merged TAB odds: ${cardsWithTabWin} with Win odds, ${cardsWithTabPlace} with Place odds out of ${raceCards.length} total cards`);

    return mergedRaceCards;
  } catch (error) {
    console.error('Error merging TAB odds:', error);
    return raceCards;
  }
}

export default async function RatingsOddsComparisonPage() {
  // Fetch today's race cards
  const raceCards = await fetchTodayRaceCards();
  
  // Merge TAB odds
  const dataWithOdds = await mergeTABOdds(raceCards);

  // Fetch scratchings and conditions
  let scratchings: any[] = [];
  let conditions: any[] = [];
  try {
    const pfClient = getPuntingFormClient();
    const [scratchingsRes, conditionsRes] = await Promise.all([
      pfClient.getScratchings(0), // 0 = AU
      pfClient.getConditions(0)
    ]);
    scratchings = scratchingsRes.payLoad || [];
    conditions = conditionsRes.payLoad || [];
  } catch (error: any) {
    console.warn('⚠️ Scratchings/conditions unavailable:', error.message);
  }

  // Filter out scratched horses from value calculations
  const dataWithoutScratched = dataWithOdds.filter(card => {
    const isScratched = scratchings.some(s => 
      horseNamesMatch(s.horseName, card.horse_name) &&
      s.raceNumber === card.race_number &&
      (!s.trackName || !card.track || tracksMatch(s.trackName, card.track))
    );
    return !isScratched;
  });

  const scratchedCount = dataWithOdds.length - dataWithoutScratched.length;

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-900 to-purple-700 text-white py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">TTR Ratings vs Fixed Odds</h1>
          <p className="text-purple-200 text-lg">
            Today&apos;s race cards with TTR ratings and TAB fixed odds comparison
          </p>
          <p className="text-purple-300 text-sm mt-2">
            Showing races for {new Date().toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Info Card */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-blue-900 mb-2">About This Page</h3>
          <p className="text-blue-800 text-sm">
            This page displays today's race cards with TTR ratings alongside TAB fixed odds. 
            Compare our TTR ratings with current market prices to identify potential value opportunities. For full instructions please view the video tutorial available to all VIP Members on the Discord Chat platform.
          </p>
        </div>

        {/* Scratchings Alert */}
        {scratchedCount > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-red-900 mb-2">⚠️ Scratchings Alert</h3>
            <p className="text-red-800 text-sm">
              {scratchedCount} horse{scratchedCount !== 1 ? 's' : ''} scratched today. Scratched horses have been excluded from the table below.
            </p>
          </div>
        )}

        {/* Data Table */}
        <RatingsOddsTable data={dataWithoutScratched} />
      </div>
    </div>
  );
}
