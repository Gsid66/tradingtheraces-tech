import { Client } from 'pg';
import { format, subDays } from 'date-fns';
import { calculateValueScore } from '@/lib/trading-desk/valueCalculator';

export const dynamic = 'force-dynamic';

interface RaceData {
  race_date: string;
  horse_name: string;
  track_name: string;
  race_number: number;
  rating: number;
  price: number;
  finishing_position: number | null;
  actual_sp: number | null;
}

interface PlaceStats {
  totalValuePlays: number;
  firstPlace: number;
  secondPlace: number;
  thirdPlace: number;
  placings: number; // 1st-3rd combined
  placeRate: number;
  totalStaked: number;
  estimatedReturns: number;
  estimatedPL: number;
  estimatedROI: number;
}

const STAKE_AMOUNT = 10;
const LOOKBACK_DAYS = 30;
const PLACE_DIVIDEND_MULTIPLIER = 0.25; // Estimated place return (odds / 4)

async function getPlaceData(): Promise<RaceData[]> {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();

    // Get last 30 days of data
    const thirtyDaysAgo = format(subDays(new Date(), LOOKBACK_DAYS), 'yyyy-MM-dd');

    const query = `
      SELECT 
        rcr.race_date::date as race_date,
        rcr.horse_name,
        rcr.track as track_name,
        rcr.race_number,
        rcr.rating,
        rcr.price,
        r.finishing_position,
        r.starting_price as actual_sp
      FROM race_cards_ratings rcr
      LEFT JOIN pf_meetings m ON rcr.race_date = m.meeting_date
        AND LOWER(TRIM(rcr.track)) = LOWER(TRIM(m.track_name))
      LEFT JOIN pf_races ra ON ra.meeting_id = m.meeting_id 
        AND rcr.race_number = ra.race_number
      LEFT JOIN pf_results r ON r.race_id = ra.race_id
        AND LOWER(TRIM(rcr.horse_name)) = LOWER(TRIM(r.horse_name))
      WHERE rcr.race_date >= $1
      ORDER BY rcr.race_date DESC
    `;

    const result = await client.query(query, [thirtyDaysAgo]);
    return result.rows;
  } catch (error) {
    console.error('Error fetching place data:', error);
    return [];
  } finally {
    await client.end();
  }
}

function calculatePlaceStats(horses: RaceData[]): PlaceStats {
  // Filter for value plays with results
  const valuePlays = horses.filter(horse => {
    if (horse.price <= 0 || !horse.rating || !horse.finishing_position) return false;
    const valueScore = calculateValueScore(horse.rating, horse.price);
    return valueScore > 25;
  });

  const totalValuePlays = valuePlays.length;
  const totalStaked = totalValuePlays * STAKE_AMOUNT;

  let firstPlace = 0;
  let secondPlace = 0;
  let thirdPlace = 0;
  let estimatedReturns = 0;

  valuePlays.forEach(horse => {
    const oddsToUse = horse.actual_sp && horse.actual_sp > 0 ? horse.actual_sp : horse.price;
    
    if (horse.finishing_position === 1) {
      firstPlace++;
      estimatedReturns += STAKE_AMOUNT * oddsToUse; // Full odds
    } else if (horse.finishing_position === 2) {
      secondPlace++;
      estimatedReturns += STAKE_AMOUNT * (oddsToUse * PLACE_DIVIDEND_MULTIPLIER); // Estimated place return
    } else if (horse.finishing_position === 3) {
      thirdPlace++;
      estimatedReturns += STAKE_AMOUNT * (oddsToUse * PLACE_DIVIDEND_MULTIPLIER); // Estimated place return
    }
  });

  const placings = firstPlace + secondPlace + thirdPlace;
  const placeRate = totalValuePlays > 0 ? (placings / totalValuePlays) * 100 : 0;
  const estimatedPL = estimatedReturns - totalStaked;
  const estimatedROI = totalStaked > 0 ? (estimatedPL / totalStaked) * 100 : 0;

  return {
    totalValuePlays,
    firstPlace,
    secondPlace,
    thirdPlace,
    placings,
    placeRate,
    totalStaked,
    estimatedReturns,
    estimatedPL,
    estimatedROI,
  };
}

export default async function PlacePerformancePage() {
  const data = await getPlaceData();
  const stats = calculatePlaceStats(data);

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">Place Performance</h1>
        <p className="text-sm sm:text-base text-gray-600">
          Track performance of value plays that finish 1st-3rd (Last {LOOKBACK_DAYS} days)
        </p>
      </div>

      {/* Important Note */}
      <div className="mb-6 bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-yellow-700">
              <strong>Note:</strong> Place dividends are not yet available. Returns for 2nd and 3rd place are estimated using odds ÷ 4. 
              Actual place dividends will be integrated in a future update.
            </p>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-600 mb-1">Total Value Plays</div>
          <div className="text-3xl font-bold text-gray-800">{stats.totalValuePlays}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-600 mb-1">Total Placings (1st-3rd)</div>
          <div className="text-3xl font-bold text-purple-600">{stats.placings}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-600 mb-1">Place Rate</div>
          <div className="text-3xl font-bold text-blue-600">{stats.placeRate.toFixed(1)}%</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-600 mb-1">Est. ROI</div>
          <div className={`text-3xl font-bold ${stats.estimatedROI >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {stats.estimatedROI >= 0 ? '+' : ''}{stats.estimatedROI.toFixed(1)}%
          </div>
        </div>
      </div>

      {/* Breakdown by Position */}
      <div className="mb-8">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Breakdown by Position</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-yellow-400">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-gray-600">1st Place</div>
              <span className="text-2xl">🥇</span>
            </div>
            <div className="text-2xl font-bold text-gray-800">{stats.firstPlace}</div>
            <div className="text-xs text-gray-500 mt-1">
              {stats.totalValuePlays > 0 ? ((stats.firstPlace / stats.totalValuePlays) * 100).toFixed(1) : 0}% of total
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-gray-400">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-gray-600">2nd Place</div>
              <span className="text-2xl">🥈</span>
            </div>
            <div className="text-2xl font-bold text-gray-800">{stats.secondPlace}</div>
            <div className="text-xs text-gray-500 mt-1">
              {stats.totalValuePlays > 0 ? ((stats.secondPlace / stats.totalValuePlays) * 100).toFixed(1) : 0}% of total
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-orange-400">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-gray-600">3rd Place</div>
              <span className="text-2xl">🥉</span>
            </div>
            <div className="text-2xl font-bold text-gray-800">{stats.thirdPlace}</div>
            <div className="text-xs text-gray-500 mt-1">
              {stats.totalValuePlays > 0 ? ((stats.thirdPlace / stats.totalValuePlays) * 100).toFixed(1) : 0}% of total
            </div>
          </div>
        </div>
      </div>

      {/* Financial Summary */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Financial Summary (Estimated)</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div>
            <div className="text-sm text-gray-600 mb-1">Total Staked</div>
            <div className="text-2xl font-bold text-gray-800">${stats.totalStaked.toFixed(2)}</div>
          </div>
          <div>
            <div className="text-sm text-gray-600 mb-1">Est. Returns</div>
            <div className="text-2xl font-bold text-blue-600">${stats.estimatedReturns.toFixed(2)}</div>
          </div>
          <div>
            <div className="text-sm text-gray-600 mb-1">Est. Profit/Loss</div>
            <div className={`text-2xl font-bold ${stats.estimatedPL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {stats.estimatedPL >= 0 ? '+' : ''}${stats.estimatedPL.toFixed(2)}
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-600 mb-1">Est. ROI</div>
            <div className={`text-2xl font-bold ${stats.estimatedROI >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {stats.estimatedROI >= 0 ? '+' : ''}{stats.estimatedROI.toFixed(1)}%
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
