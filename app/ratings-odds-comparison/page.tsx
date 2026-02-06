import React from 'react';
import { RatingsOddsData } from './types';
import RatingsOddsTable from './RatingsOddsTable';
import { getPostgresAPIClient, TabRace, TabRunner } from '@/lib/integrations/postgres-api';
import { getTTRRatingsClient } from '@/lib/integrations/ttr-ratings';
import { getPuntingFormClient, PFScratching, PFCondition } from '@/lib/integrations/punting-form/client';
import { horseNamesMatch } from '@/lib/utils/horse-name-matcher';

export const dynamic = 'force-dynamic';
export const revalidate = 300; // Revalidate every 5 minutes for early morning odds

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
  
  // Remove common suffixes (expanded list)
  const suffixes = ['racecourse', 'gardens', 'hillside', 'park', 'racing', 'acton', 'synthetic', 'poly', 'course', 'track'];
  for (const suffix of suffixes) {
    normalized = normalized.replace(new RegExp(`\\s*${suffix}\\s*$`, 'i'), '');
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
  
  // Exact match
  if (normalized1 === normalized2) return true;
  
  // Contains match (min 4 chars to avoid false positives)
  if (normalized1.length >= 4 && normalized2.includes(normalized1)) return true;
  if (normalized2.length >= 4 && normalized1.includes(normalized2)) return true;
  
  // Check if one starts with the other
  if (normalized1.startsWith(normalized2) || normalized2.startsWith(normalized1)) return true;
  
  return false;
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

    // Fetch TAB odds for both AU and NZ races separately
    const [tabResponseAU, tabResponseNZ] = await Promise.all([
      pgClient.getRacesByDate(today, 'AU').catch(err => {
        console.error(`Error fetching AU TAB data:`, err);
        return { success: false, data: [] };
      }),
      pgClient.getRacesByDate(today, 'NZ').catch(err => {
        console.error(`Error fetching NZ TAB data:`, err);
        return { success: false, data: [] };
      })
    ]);

    // Combine both AU and NZ races
    const allTabRaces = [
      ...(tabResponseAU.success && Array.isArray(tabResponseAU.data) ? tabResponseAU.data : []),
      ...(tabResponseNZ.success && Array.isArray(tabResponseNZ.data) ? tabResponseNZ.data : [])
    ];

    const auCount = tabResponseAU.success && Array.isArray(tabResponseAU.data) ? tabResponseAU.data.length : 0;
    const nzCount = tabResponseNZ.success && Array.isArray(tabResponseNZ.data) ? tabResponseNZ.data.length : 0;
    console.log(`📊 Fetched ${allTabRaces.length} TAB races for today (AU: ${auCount}, NZ: ${nzCount})`);

    // Check if we have any TAB data
    if (allTabRaces.length === 0) {
      console.warn('⚠️ No TAB data available for either AU or NZ');
      return raceCards;
    }

    // Debug: Log sample data from both sources
    if (raceCards.length > 0) {
      console.log('🔍 DEBUG: Race card sample:', {
        track: raceCards[0]?.track,
        meeting_name: raceCards[0]?.meeting_name,
        race_date: raceCards[0]?.race_date,
        race_number: raceCards[0]?.race_number,
        horse_name: raceCards[0]?.horse_name
      });
    }

    if (allTabRaces.length > 0) {
      console.log('🔍 DEBUG: TAB race sample:', {
        meeting_name: allTabRaces[0]?.meeting_name,
        meeting_date: allTabRaces[0]?.meeting_date,
        race_number: allTabRaces[0]?.race_number,
        runners: allTabRaces[0]?.runners?.length,
        sample_runner: allTabRaces[0]?.runners?.[0]?.horse_name
      });
    }

    // Merge TAB odds into race cards
    const mergedRaceCards = raceCards.map(card => {
      // Normalize both dates to YYYY-MM-DD format
      const cardDate = card.race_date.split('T')[0];
      
      // Find matching TAB race
      const matchingTabRace = allTabRaces.find((tabRace: TabRace) => {
        const tabDate = tabRace.meeting_date.split('T')[0]; // Normalize TAB date
        const dateMatch = tabDate === cardDate;
        
        const cardTrack = card.track || card.meeting_name || '';
        const tabTrack = tabRace.meeting_name ?? '';
        
        if (!cardTrack || !tabTrack) {
          return false;
        }
        
        const trackMatch = tracksMatch(cardTrack, tabTrack);
        const raceMatch = tabRace.race_number === card.race_number;
        
        // Debug logging for failed matches
        if (!dateMatch) {
          console.log(`❌ Date mismatch: card=${cardDate}, tab=${tabDate}`);
        }
        if (dateMatch && !trackMatch) {
          console.log(`❌ Track mismatch: "${cardTrack}" (${normalizeTrackName(cardTrack)}) vs "${tabTrack}" (${normalizeTrackName(tabTrack)})`);
        }
        
        return dateMatch && trackMatch && raceMatch;
      });

      if (matchingTabRace && matchingTabRace.runners) {
        console.log(`🔍 Looking for horse: "${card.horse_name}" at ${card.track || card.meeting_name} R${card.race_number} in ${matchingTabRace.runners.length} runners`);
        console.log(`   Available horses: ${matchingTabRace.runners.map((r: TabRunner) => r.horse_name).join(', ')}`);
        
        const matchingRunner = matchingTabRace.runners.find((runner: TabRunner) => {
          const matches = horseNamesMatch(runner.horse_name, card.horse_name);
          if (!matches) {
            console.log(`   ❌ No match: "${runner.horse_name}" vs "${card.horse_name}"`);
          }
          return matches;
        });

        if (matchingRunner) {
          console.log(`   ✅ Matched: ${card.horse_name} -> Win: $${matchingRunner.tab_fixed_win_price}, Place: $${matchingRunner.tab_fixed_place_price}`);
          return {
            ...card,
            tab_fixed_win: matchingRunner.tab_fixed_win_price,
            tab_fixed_place: matchingRunner.tab_fixed_place_price
          };
        } else {
          console.log(`   ❌ No runner match found for: ${card.horse_name}`);
        }
      } else if (!matchingTabRace) {
        const cardTrack = card.track || card.meeting_name || '';
        console.log(`🔍 No TAB race found for: ${cardTrack} R${card.race_number} (${cardDate})`);
        console.log(`   Available TAB races: ${allTabRaces.map((r: TabRace) => `${r.meeting_name} R${r.race_number} (${r.meeting_date.split('T')[0]})`).join(', ')}`);
      }

      return card;
    });

    // Summary statistics
    const cardsWithTabWin = mergedRaceCards.filter(c => c.tab_fixed_win != null).length;
    const cardsWithTabPlace = mergedRaceCards.filter(c => c.tab_fixed_place != null).length;
    const cardsWithoutTab = mergedRaceCards.filter(c => c.tab_fixed_win == null).length;

    console.log(`\n📊 TAB MERGE SUMMARY:`);
    console.log(`   Total race cards: ${raceCards.length}`);
    console.log(`   Total TAB races: ${allTabRaces.length}`);
    console.log(`   ✅ Matched with Win odds: ${cardsWithTabWin}`);
    console.log(`   ✅ Matched with Place odds: ${cardsWithTabPlace}`);
    console.log(`   ❌ No TAB data: ${cardsWithoutTab}`);

    // Show sample of unmatched cards
    if (cardsWithoutTab > 0) {
      const unmatchedSamples = mergedRaceCards
        .filter(c => c.tab_fixed_win == null)
        .slice(0, 3);
      console.log(`\n❌ Sample unmatched cards:`);
      unmatchedSamples.forEach(c => {
        console.log(`   - ${c.track || c.meeting_name} R${c.race_number} ${c.horse_name} (${c.race_date})`);
      });
    }

    // Show sample of matched cards
    if (cardsWithTabWin > 0) {
      const matchedSamples = mergedRaceCards
        .filter(c => c.tab_fixed_win != null)
        .slice(0, 3);
      console.log(`\n✅ Sample matched cards:`);
      matchedSamples.forEach(c => {
        console.log(`   - ${c.track || c.meeting_name} R${c.race_number} ${c.horse_name}: Win=$${c.tab_fixed_win}, Place=$${c.tab_fixed_place}`);
      });
    }

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

  // Fetch scratchings and conditions for both AU and NZ
  let scratchings: PFScratching[] = [];
  let conditions: PFCondition[] = [];
  try {
    const pfClient = getPuntingFormClient();
    const [scratchingsAU, scratchingsNZ, conditionsAU, conditionsNZ] = await Promise.all([
      pfClient.getScratchings(0), // 0 = AU
      pfClient.getScratchings(1), // 1 = NZ
      pfClient.getConditions(0),   // 0 = AU
      pfClient.getConditions(1)    // 1 = NZ
    ]);
    scratchings = [...(scratchingsAU.payLoad || []), ...(scratchingsNZ.payLoad || [])];
    conditions = [...(conditionsAU.payLoad || []), ...(conditionsNZ.payLoad || [])];
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
