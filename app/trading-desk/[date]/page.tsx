import { Client } from 'pg';
import { format, parseISO, isValid } from 'date-fns';
import { calculateValueScore, getValueBackgroundColor } from '@/lib/trading-desk/valueCalculator';
import { calculatePL } from '@/lib/trading-desk/plCalculator';
import { getOrdinalSuffix } from '@/lib/utils/formatting';
import { getPuntingFormClient, PFScratching, PFCondition } from '@/lib/integrations/punting-form/client';
import { getTTRRatingsClient } from '@/lib/integrations/ttr-ratings';
import { tracksMatch } from '@/lib/utils/scratchings-matcher';
import StatsCard from './StatsCard';
import { horseNamesMatch } from '@/lib/utils/horse-name-matcher';

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
    // Note: The Punting Form API's getTodaysMeetings() returns today's meetings.
    // For dates other than today, this will return an empty array after filtering,
    // which is expected behavior. The API doesn't currently support fetching meetings
    // for arbitrary dates, so we filter client-side.
    const meetingsResponse = await pfClient.getTodaysMeetings();
    const allMeetings = meetingsResponse.payLoad || [];
    
    // Filter meetings to match the requested date
    // Use string comparison to avoid timezone conversion issues
    const targetDate = date; // Already in YYYY-MM-DD format from URL
    const meetings = allMeetings.filter(m => {
      // Normalize meeting date to YYYY-MM-DD format
      const meetingDate = m.meetingDate.split('T')[0]; // Remove time component if present
      return meetingDate === targetDate;
    });
    
    console.log(`📊 Found ${meetings.length} meetings for ${targetDate}`);

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

  // Filter out scratched horses from data
  const dataWithoutScratched = data.filter(d => {
    const isScratched = scratchings.some(s => 
      horseNamesMatch(s.horseName, d.horse_name) &&
      s.raceNumber === d.race_number &&
      (!s.trackName || tracksMatch(s.trackName, d.track_name))
    );
    return !isScratched;
  });

  const scratchedCount = data.length - dataWithoutScratched.length;

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

      {/* Scratchings Alert */}
      {scratchedCount > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-red-900 mb-2">⚠️ Scratchings Alert</h3>
          <p className="text-red-800 text-sm">
            {scratchedCount} horse{scratchedCount !== 1 ? 's' : ''} scratched. Scratched horses have been excluded from value calculations.
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

      {/* Top Value Plays */}
      {valuePlays.length > 0 && (
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Top Value Plays</h2>
          <div className="bg-white rounded-lg shadow overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Track</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Race</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Horse</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rating</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Value Score</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actual SP</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Result</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {valuePlays.map((play) => {
                  const bgColor = getValueBackgroundColor(play.valueScore);
                  return (
                    <tr key={play.id} className={`hover:bg-gray-100 ${bgColor}`}>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{play.track_name}</td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">R{play.race_number}</td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">{play.horse_name}</td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{play.rating ? Number(play.rating).toFixed(1) : '-'}</td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{play.price ? `$${Number(play.price).toFixed(2)}` : '-'}</td>
                      <td className="px-4 py-2 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          play.valueScore > 25 ? 'bg-green-100 text-green-800' :
                          play.valueScore >= 15 ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {play.valueScore.toFixed(1)}
                        </span>
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{play.actual_sp ? `$${Number(play.actual_sp).toFixed(2)}` : '-'}</td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm">
                        {play.finishing_position ? (
                          <span className={`font-medium ${play.finishing_position === 1 ? 'text-green-600' : 'text-gray-600'}`}>
                            {play.finishing_position === 1 ? '🏆 1st' : `${play.finishing_position}${getOrdinalSuffix(play.finishing_position)}`}
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
}