import { Client } from 'pg';
import { format, parseISO, isValid } from 'date-fns';
import { calculateValueScore } from '@/lib/trading-desk/valueCalculator';
import { getPuntingFormClient, PFScratching, PFCondition } from '@/lib/integrations/punting-form/client';
import { getTTRRatingsClient } from '@/lib/integrations/ttr-ratings';
import { tracksMatch } from '@/lib/utils/scratchings-matcher';
import { horseNamesMatch } from '@/lib/utils/horse-name-matcher';
import FilterableRaceTable from './FilterableRaceTable';

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
  jockey: string;
  trainer: string;
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
          id: parseInt(`${meeting.meetingId.replace(/\D/g, '')}${rating.race_number}${rating.tab_number}`),
          race_date: date,
          track_name: meeting.track.name,
          state: meeting.track.state || null,
          race_number: rating.race_number,
          horse_name: rating.horse_name,
          rating: rating.rating,
          price: rating.price,
          jockey: '',
          trainer: '',
          finishing_position: null,
          actual_sp: null
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

export default async function RaceViewerPage({ params }: PageProps) {
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
  try {
    const pfClient = getPuntingFormClient();
    
    // Fetch scratchings from database endpoint (has horse names resolved)
    const [scratchingsResponseAU, scratchingsResponseNZ, conditionsAU, conditionsNZ] = await Promise.all([
      fetch('/api/scratchings?jurisdiction=0&hoursAgo=48').then(async r => {
        if (!r.ok) {
          console.error(`Error fetching AU scratchings: HTTP ${r.status}`);
          return { success: false, data: [] };
        }
        return r.json();
      }).catch(err => {
        console.error('Error fetching AU scratchings:', err);
        return { success: false, data: [] };
      }),
      fetch('/api/scratchings?jurisdiction=1&hoursAgo=48').then(async r => {
        if (!r.ok) {
          console.error(`Error fetching NZ scratchings: HTTP ${r.status}`);
          return { success: false, data: [] };
        }
        return r.json();
      }).catch(err => {
        console.error('Error fetching NZ scratchings:', err);
        return { success: false, data: [] };
      }),
      pfClient.getConditions(0),   // 0 = AU
      pfClient.getConditions(1)    // 1 = NZ
    ]);
    
    // Combine scratchings from both jurisdictions
    const scratchingsAU = scratchingsResponseAU.success ? scratchingsResponseAU.data : [];
    const scratchingsNZ = scratchingsResponseNZ.success ? scratchingsResponseNZ.data : [];
    scratchings = [...scratchingsAU, ...scratchingsNZ];
    
    conditions = [...(conditionsAU.payLoad || []), ...(conditionsNZ.payLoad || [])];
    
    console.log(`✅ Loaded ${scratchingsAU.length} AU scratchings + ${scratchingsNZ.length} NZ scratchings from database`);
  } catch (error: any) {
    console.warn('⚠️ Scratchings/conditions unavailable:', error.message);
  }

  // Enrich data with scratching info
  const dataWithScratchings = data.map(d => {
    const isScratched = scratchings.some(s => 
      horseNamesMatch(s.horseName, d.horse_name) &&
      s.raceNumber === d.race_number &&
      (!s.trackName || tracksMatch(s.trackName, d.track_name))
    );
    return {
      ...d,
      isScratched
    };
  });

  // Calculate value scores for all horses
  const dataWithValueScores = dataWithScratchings.map(d => ({
    ...d,
    valueScore: calculateValueScore(Number(d.rating), Number(d.price))
  }));

  // Calculate statistics
  const totalRaces = new Set(dataWithScratchings.map(d => `${d.track_name}-${d.race_number}`)).size;
  const totalHorses = dataWithScratchings.length;
  const scratchedCount = dataWithScratchings.filter(d => d.isScratched).length;
  const valueOpportunities = dataWithValueScores.filter(d => d.valueScore > 25).length;

  // Format date for display
  const formattedDate = format(parsedDate, 'EEEE, MMMM d, yyyy');

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">Race Viewer</h1>
        <p className="text-sm sm:text-base text-gray-600">{formattedDate}</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-600 mb-1">Total Races</div>
          <div className="text-2xl font-bold text-gray-800">{totalRaces}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-600 mb-1">Total Horses</div>
          <div className="text-2xl font-bold text-gray-800">{totalHorses}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-600 mb-1">Scratched Horses</div>
          <div className="text-2xl font-bold text-red-600">{scratchedCount}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-600 mb-1">Value Opportunities</div>
          <div className="text-2xl font-bold text-purple-600">{valueOpportunities}</div>
        </div>
      </div>

      {/* Scratchings Alert */}
      {scratchedCount > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-red-900 mb-2">⚠️ Scratchings Alert</h3>
          <p className="text-red-800 text-sm">
            {scratchedCount} horse{scratchedCount !== 1 ? 's' : ''} scratched. Scratched horses are marked in the table below.
          </p>
        </div>
      )}

      {/* Race Table with Filters */}
      {dataWithValueScores.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
          No race data available for this date
        </div>
      ) : (
        <FilterableRaceTable data={dataWithValueScores} />
      )}
    </div>
  );
}
