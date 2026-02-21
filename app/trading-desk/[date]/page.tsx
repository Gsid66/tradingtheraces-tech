import { Client } from 'pg';
import { format, parseISO, isValid } from 'date-fns';
import { calculateValueScore } from '@/lib/trading-desk/valueCalculator';
import { calculatePL } from '@/lib/trading-desk/plCalculator';
import { getPuntingFormClient, PFScratching, PFCondition } from '@/lib/integrations/punting-form/client';
import { getTTRRatingsClient } from '@/lib/integrations/ttr-ratings';
import { tracksMatch } from '@/lib/utils/scratchings-matcher';
import { getScratchingsFromDB } from '@/lib/data/scratchings';
import StatsCard from './StatsCard';
import { horseNamesMatch } from '@/lib/utils/horse-name-matcher';
import DownloadableValuePlaysTable from './DownloadableValuePlaysTable';
import TopRatedHorses from './TopRatedHorses';
import Top4HorsesTable from './Top4HorsesTable';
import ValuePlaysNavigationBanner from './ValuePlaysNavigationBanner';

export const dynamic = 'force-dynamic';
export const revalidate = 300; // Revalidate every 5 minutes for early morning odds

interface PageProps {
  params: Promise<{ date: string }>;
}

interface RaceData {
  id: number;
  race_date: string;
  track_name: string;
  state: string | null;
  race_number: number;
  horse_name: string;
  rating: number;
  price: number;
  jockey: string | null;
  trainer: string | null;
  finishing_position: number | null;
  actual_sp: number | null;
}

async function getDailyData(date: string): Promise<RaceData[]> {
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

    console.log('🔍 Fetching meetings for date:', date);

    // Get meetings for the specified date
    const meetingsResponse = await pfClient.getMeetingsByDate(parseISO(date));
    const meetings = meetingsResponse.payLoad || [];
    
    console.log(`📊 Found ${meetings.length} meetings for ${date}`);

    if (meetings.length === 0) {
      console.warn('⚠️ No meetings found for date:', date);
      return [];
    }

    // Fetch ratings for all meetings concurrently
    const allRatingsData: RaceData[] = [];

    const ratingsPromises = meetings.map(meeting => 
      ttrClient.getRatingsForMeeting(meeting.meetingId)
        .then(ttrResponse => ({ meeting, ttrResponse }))
    );

    const ratingsResults = await Promise.all(ratingsPromises);

    for (const { meeting, ttrResponse } of ratingsResults) {
      if (ttrResponse.success && ttrResponse.data && ttrResponse.data.length > 0) {
        // Transform PFAI data to RaceData format
        const meetingRatings = ttrResponse.data.map(rating => ({
          id: parseInt(`${meeting.meetingId.replace(/\D/g, '')}${rating.race_number}${rating.tab_number}`), // Create unique composite ID
          race_date: date,
          track_name: meeting.track.name,
          state: meeting.track.state || null,
          race_number: rating.race_number,
          horse_name: rating.horse_name,
          rating: rating.rating,
          price: rating.price,
          jockey: null, // Not available in PFAI ratings
          trainer: null, // Not available in PFAI ratings
          finishing_position: null, // Will be matched later
          actual_sp: null // Will be matched later
        }));

        allRatingsData.push(...meetingRatings);
        console.log(`✅ Added ${meetingRatings.length} ratings for ${meeting.track.name}`);
      } else {
        console.warn(`⚠️ No ratings found for ${meeting.track.name}`);
      }
    }

    console.log(`✅ Total ratings fetched: ${allRatingsData.length}`);

    // Now fetch results from database to match with ratings
    const client = new Client({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    });

    try {
      await client.connect();

      const resultsQuery = `
        SELECT 
          r.race_id,
          r.horse_name,
          r.finishing_position,
          r.starting_price,
          ra.race_number,
          m.track_name
        FROM pf_results r
        INNER JOIN pf_races ra ON r.race_id = ra.race_id
        INNER JOIN pf_meetings m ON ra.meeting_id = m.meeting_id
        WHERE m.meeting_date = $1
      `;

      const resultsResult = await client.query(resultsQuery, [date]);
      const results = resultsResult.rows;

      console.log(`📊 Found ${results.length} results for ${date}`);

      // Match ratings with results using fuzzy matching
      const enrichedData = allRatingsData.map((rating) => {
        const matchedResult = results.find((result: any) => 
          result.race_number === rating.race_number &&
          result.track_name === rating.track_name &&
          horseNamesMatch(result.horse_name, rating.horse_name)
        );

        return {
          ...rating,
          finishing_position: matchedResult?.finishing_position || null,
          actual_sp: matchedResult?.starting_price || null
        };
      });

      return enrichedData;

    } finally {
      await client.end();
    }

  } catch (error) {
    console.error('❌ Error fetching daily data:', error);
    return [];
  }
}

export default async function DailyTradingDeskPage({ params }: PageProps) {
  const { date } = await params;
  
  // Validate date format
  const parsedDate = parseISO(date);
  if (!isValid(parsedDate)) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <h2 className="text-xl font-bold text-red-800 mb-2">Invalid Date</h2>
          <p className="text-red-600">The date &quot;{date}&quot; is not valid. Please select a valid date.</p>
        </div>
      </div>
    );
  }

  const data = await getDailyData(date);

  // Fetch scratchings from database (has complete horse names) and conditions from API
  let scratchings: PFScratching[] = [];
  let conditions: PFCondition[] = [];
  
  console.log('\n🔍 === FETCHING SCRATCHINGS FOR TRADING DESK ===');
  
  try {
    const pfClient = getPuntingFormClient();
    
    const [scratchingsResponseAU, scratchingsResponseNZ, conditionsAU, conditionsNZ] = await Promise.all([
      getScratchingsFromDB(0, 48)
        .then(data => {
          console.log(`✅ [Scratchings] Fetched ${data.data?.length || 0} AU scratchings`);
          return data;
        }),
      getScratchingsFromDB(1, 48)
        .then(data => {
          console.log(`✅ [Scratchings] Fetched ${data.data?.length || 0} NZ scratchings`);
          return data;
        }),
      pfClient.getConditions(0).catch(() => ({ payLoad: [] })),
      pfClient.getConditions(1).catch(() => ({ payLoad: [] }))
    ]);
    
    const scratchingsAU = scratchingsResponseAU.success ? scratchingsResponseAU.data : [];
    const scratchingsNZ = scratchingsResponseNZ.success ? scratchingsResponseNZ.data : [];
    scratchings = [...scratchingsAU, ...scratchingsNZ];
    
    conditions = [...(conditionsAU.payLoad || []), ...(conditionsNZ.payLoad || [])];
    
    console.log(`📊 [Trading Desk] Loaded ${scratchings.length} total scratchings (AU: ${scratchingsAU.length}, NZ: ${scratchingsNZ.length})`);
  } catch (error: any) {
    console.error('❌ [Scratchings] CRITICAL ERROR:', error);
    console.error('Stack:', error.stack);
  }

  // Mark horses with scratching info instead of filtering them out
  const dataWithScratchingInfo = data.map(d => {
    const isScratched = scratchings.some(s => 
      horseNamesMatch(s.horseName, d.horse_name) &&
      s.raceNumber === d.race_number &&
      (!s.trackName || tracksMatch(s.trackName, d.track_name))
    );
    
    const scratchingDetails = scratchings.find(s => 
      horseNamesMatch(s.horseName, d.horse_name) &&
      s.raceNumber === d.race_number &&
      (!s.trackName || tracksMatch(s.trackName, d.track_name))
    );
    
    return {
      ...d,
      isScratched,
      scratchingReason: scratchingDetails?.reason,
      scratchingTime: scratchingDetails?.scratchingTime
    };
  });

  // Filter out scratched horses only for value calculations
  const dataWithoutScratched = dataWithScratchingInfo.filter(d => !d.isScratched);

  const scratchedCount = dataWithScratchingInfo.filter(d => d.isScratched).length;

  // Calculate value scores for all horses (excluding scratched)
  const dataWithValueScores = dataWithoutScratched.map(d => ({
    ...d,
    valueScore: calculateValueScore(Number(d.rating), Number(d.price))
  }));

  // Calculate statistics
  const totalRaces = new Set(dataWithoutScratched.map(d => `${d.track_name}-${d.race_number}`)).size;
  const ratedHorses = dataWithoutScratched.length;
  
  // Update value opportunities to use new value score
  const valueOpportunities = dataWithValueScores.filter(d => d.valueScore > 25).length;
  const winners = dataWithoutScratched.filter(d => d.finishing_position === 1);

  // Get top value plays (horses with best value score)
  const valuePlays = dataWithValueScores
    .filter(d => d.valueScore > 0)
    .sort((a, b) => b.valueScore - a.valueScore)
    .slice(0, 10);

  // Get top 4 rated horses (sorted by rating, descending)
  const topRatedHorses = dataWithValueScores
    .filter(d => d.rating > 0)
    .sort((a, b) => b.rating - a.rating)
    .slice(0, 4);

  // Get top 4 rated horses per race
  // Group by track and race number
  const raceGroups: { [key: string]: typeof dataWithValueScores } = {};
  dataWithValueScores.forEach(horse => {
    const raceKey = `${horse.track_name}-${horse.race_number}`;
    if (!raceGroups[raceKey]) {
      raceGroups[raceKey] = [];
    }
    raceGroups[raceKey].push(horse);
  });

  // For each race, get top 4 by rating and add scratching info
  const top4PerRace = Object.values(raceGroups)
  .flatMap((raceHorses) => {
    const top4ByRating = [...raceHorses]
      .sort((a, b) => b.rating - a.rating)
      .slice(0, 4);

    const safePrice = (p: unknown) => {
      const n = typeof p === 'number' ? p : Number(p);
      // Treat missing/invalid/zero/negative as "very large" so it sorts last
      return Number.isFinite(n) && n > 0 ? n : Number.POSITIVE_INFINITY;
    };

    // Display order: smallest to largest price (within the top 4 rated)
    return top4ByRating.sort((a, b) => safePrice(a.price) - safePrice(b.price));
  })
    .map(horse => {
      // Add scratching info from dataWithScratchingInfo
      const scratchingInfo = dataWithScratchingInfo.find(d => 
        d.horse_name === horse.horse_name && 
        d.track_name === horse.track_name && 
        d.race_number === horse.race_number
      );
      return {
        ...horse,
        isScratched: scratchingInfo?.isScratched || false,
        scratchingReason: scratchingInfo?.scratchingReason,
        scratchingTime: scratchingInfo?.scratchingTime
      };
    })
    .sort((a, b) => {
      // Sort by track name, then race number
      if (a.track_name !== b.track_name) {
        return a.track_name.localeCompare(b.track_name);
      }
      return a.race_number - b.race_number;
    });

  // Calculate P&L stats from only the top 10 value plays displayed in the table
  const plData = calculatePL(valuePlays.map(d => ({
    rating: Number(d.rating),
    price: Number(d.price),
    actual_sp: d.actual_sp,
    finishing_position: d.finishing_position
  })));

  // Format date for display
  const formattedDate = format(parsedDate, 'EEEE, MMMM d, yyyy');

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">{formattedDate}</h1>
        <p className="text-sm sm:text-base text-gray-600">Race day analysis and ratings</p>
      </div>

      {/* Value Plays Navigation Banner */}
      <ValuePlaysNavigationBanner count={valuePlays.length} />

      {/* Scratchings Alert */}
      {scratchedCount > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-red-900 mb-2">⚠️ Scratchings Alert</h3>
          <p className="text-red-800 text-sm">
            {scratchedCount} horse{scratchedCount !== 1 ? 's' : ''} scratched. Scratched horses are shown in tables below with visual indicators but excluded from value calculations.
          </p>
        </div>
      )}

      {/* P&L Statistics Dashboard */}
      <StatsCard plData={plData} />

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-600 mb-1">Total Races</div>
          <div className="text-3xl font-bold text-gray-800">{totalRaces}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-600 mb-1">Rated Horses</div>
          <div className="text-3xl font-bold text-gray-800">{ratedHorses}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-600 mb-1">Value Opportunities</div>
          <div className="text-3xl font-bold text-purple-600">{valueOpportunities}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-600 mb-1">Winners Found</div>
          <div className="text-3xl font-bold text-green-600">{winners.length}</div>
        </div>
      </div>

      {/* Top 4 Rated Horses */}
      {topRatedHorses.length > 0 && (
        <TopRatedHorses horses={topRatedHorses} />
      )}

      {/* Top 4 Rated Horses Per Race */}
      {top4PerRace.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4">Top 4 Rated Horses Per Race</h2>
          <Top4HorsesTable horses={top4PerRace} date={date} />
        </div>
      )}

      {/* Top Value Plays */}
      {valuePlays.length > 0 && (
        <div className="mb-8" id="top-value-plays" tabIndex={-1}>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4">Top Value Plays</h2>
          <DownloadableValuePlaysTable valuePlays={valuePlays} date={date} />
        </div>
      )}

    </div>
  );
}