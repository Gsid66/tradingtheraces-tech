import { Client } from 'pg';
import { format, parseISO, isValid } from 'date-fns';
import { calculateValueScore } from '@/lib/trading-desk/valueCalculator';
import { getPuntingFormClient } from '@/lib/integrations/punting-form/client';
import { horseNamesMatch } from '@/lib/utils/horse-name-matcher';
import FilterableRaceTable from './FilterableRaceTable';

export const dynamic = 'force-dynamic';

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
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();

    const query = `
      SELECT 
        rcr.id,
        rcr.race_date::date as race_date,
        rcr.track as track_name,
        m.state,
        rcr.race_number,
        rcr.horse_name,
        rcr.rating,
        rcr.price,
        rcr.jockey,
        rcr.trainer,
        r.finishing_position,
        r.starting_price as actual_sp
      FROM race_cards_ratings rcr
      LEFT JOIN pf_meetings m ON rcr.race_date = m.meeting_date
        AND rcr.track = m.track_name
      LEFT JOIN pf_races ra ON ra.meeting_id = m.meeting_id 
        AND rcr.race_number = ra.race_number
      LEFT JOIN pf_results r ON r.race_id = ra.race_id
        AND LOWER(TRIM(rcr.horse_name)) = LOWER(TRIM(r.horse_name))
      WHERE rcr.race_date = $1
      ORDER BY rcr.track, rcr.race_number, rcr.rating DESC
    `;

    const result = await client.query(query, [date]);
    return result.rows;
  } catch (error) {
    console.error('Error fetching daily data:', error);
    return [];
  } finally {
    await client.end();
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

  // Enrich data with scratching info
  const dataWithScratchings = data.map(d => {
    const isScratched = scratchings.some(s => 
      horseNamesMatch(s.horseName, d.horse_name) &&
      s.raceNumber === d.race_number &&
      s.trackName.toLowerCase().includes(d.track_name.toLowerCase())
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
