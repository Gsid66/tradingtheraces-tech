import { Client } from 'pg';
import { format, subDays } from 'date-fns';
import { calculateValueScore } from '@/lib/trading-desk/valueCalculator';
import ThresholdComparisonTable from './ThresholdComparisonTable';
import ThresholdChart from './ThresholdChart';

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

interface ThresholdResult {
  threshold: number;
  totalBets: number;
  winners: number;
  winRate: number;
  totalStaked: number;
  totalReturns: number;
  profitLoss: number;
  roi: number;
  avgValueScoreOfWinners: number;
  avgValueScoreAll: number;
  avgPrice: number;
}

const STAKE_AMOUNT = 10;
const THRESHOLDS = [15, 20, 25, 30, 35, 40, 45, 50];
const CURRENT_THRESHOLD = 25;

async function getHistoricalData(): Promise<RaceData[]> {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();

    // Get last 90 days of data
    const ninetyDaysAgo = format(subDays(new Date(), 90), 'yyyy-MM-dd');

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
        AND r.finishing_position IS NOT NULL
      ORDER BY rcr.race_date DESC
    `;

    const result = await client.query(query, [ninetyDaysAgo]);
    return result.rows;
  } catch (error) {
    console.error('Error fetching historical data:', error);
    return [];
  } finally {
    await client.end();
  }
}

function calculateThresholdPerformance(data: RaceData[], threshold: number): ThresholdResult {
  // Add value scores to all horses
  const dataWithScores = data.map(d => ({
    ...d,
    valueScore: calculateValueScore(d.rating, d.price)
  }));

  // Filter for horses above threshold
  const bets = dataWithScores.filter(d => d.valueScore > threshold);

  const totalBets = bets.length;
  const totalStaked = totalBets * STAKE_AMOUNT;

  let totalReturns = 0;
  let winners = 0;
  const winnerValueScores: number[] = [];
  const allValueScores: number[] = [];
  const allPrices: number[] = [];

  bets.forEach(bet => {
    const oddsToUse = bet.actual_sp && bet.actual_sp > 0 ? bet.actual_sp : bet.price;
    allValueScores.push(bet.valueScore);
    allPrices.push(bet.price);

    if (bet.finishing_position === 1) {
      winners++;
      totalReturns += STAKE_AMOUNT * oddsToUse;
      winnerValueScores.push(bet.valueScore);
    }
  });

  const winRate = totalBets > 0 ? (winners / totalBets) * 100 : 0;
  const profitLoss = totalReturns - totalStaked;
  const roi = totalStaked > 0 ? (profitLoss / totalStaked) * 100 : 0;
  const avgValueScoreOfWinners = winnerValueScores.length > 0 
    ? winnerValueScores.reduce((a, b) => a + b, 0) / winnerValueScores.length 
    : 0;
  const avgValueScoreAll = allValueScores.length > 0
    ? allValueScores.reduce((a, b) => a + b, 0) / allValueScores.length
    : 0;
  const avgPrice = allPrices.length > 0
    ? allPrices.reduce((a, b) => a + b, 0) / allPrices.length
    : 0;

  return {
    threshold,
    totalBets,
    winners,
    winRate,
    totalStaked,
    totalReturns,
    profitLoss,
    roi,
    avgValueScoreOfWinners,
    avgValueScoreAll,
    avgPrice,
  };
}

export default async function ThresholdAnalyzerPage() {
  const data = await getHistoricalData();

  // Calculate performance for each threshold
  const results = THRESHOLDS.map(threshold => 
    calculateThresholdPerformance(data, threshold)
  );

  // Find best threshold by ROI
  const bestByROI = results.reduce((best, current) => 
    current.roi > best.roi ? current : best
  );

  // Find best threshold by win rate
  const bestByWinRate = results.reduce((best, current) => 
    current.winRate > best.winRate ? current : best
  );

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">
          Value Threshold Analyzer
        </h1>
        <p className="text-sm sm:text-base text-gray-600">
          Analyze performance across different value score thresholds (Last 90 days)
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
          <div className="text-sm text-gray-600 mb-1">Current Threshold</div>
          <div className="text-3xl font-bold text-gray-800">{CURRENT_THRESHOLD}</div>
          <div className="text-xs text-gray-500 mt-1">
            Currently in use across the platform
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-500">
          <div className="text-sm text-gray-600 mb-1">Best ROI Threshold</div>
          <div className="text-3xl font-bold text-green-600">{bestByROI.threshold}</div>
          <div className="text-xs text-gray-500 mt-1">
            {bestByROI.roi >= 0 ? '+' : ''}{bestByROI.roi.toFixed(1)}% ROI
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-purple-500">
          <div className="text-sm text-gray-600 mb-1">Best Win Rate Threshold</div>
          <div className="text-3xl font-bold text-purple-600">{bestByWinRate.threshold}</div>
          <div className="text-xs text-gray-500 mt-1">
            {bestByWinRate.winRate.toFixed(1)}% win rate
          </div>
        </div>
      </div>

      {/* Key Insights */}
      <div className="mb-8 bg-blue-50 border-l-4 border-blue-400 p-4 rounded">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800 mb-2">Key Insights</h3>
            <ul className="text-sm text-blue-700 space-y-1 list-disc list-inside">
              <li>
                {bestByROI.threshold > CURRENT_THRESHOLD 
                  ? `Raising threshold to ${bestByROI.threshold} could improve ROI to ${bestByROI.roi.toFixed(1)}%`
                  : `Current threshold of ${CURRENT_THRESHOLD} is already optimal or close to optimal`
                }
              </li>
              <li>
                Higher thresholds = fewer bets but typically higher quality
              </li>
              <li>
                Consider volume vs quality trade-off based on your betting strategy
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Comparison Chart */}
      <div className="mb-8">
        <ThresholdChart results={results} />
      </div>

      {/* Detailed Comparison Table */}
      <div className="mb-8">
        <ThresholdComparisonTable results={results} currentThreshold={CURRENT_THRESHOLD} />
      </div>

      {/* Methodology */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Methodology</h2>
        <div className="text-sm text-gray-600 space-y-2">
          <p>
            <strong>Data Period:</strong> Last 90 days of completed races
          </p>
          <p>
            <strong>Value Score Formula:</strong> (Rating ÷ Price) × 10
          </p>
          <p>
            <strong>Betting Strategy:</strong> $10 stake on every horse above threshold
          </p>
          <p>
            <strong>Returns:</strong> Full odds for 1st place wins only
          </p>
          <p>
            <strong>ROI Calculation:</strong> (Total Returns - Total Staked) ÷ Total Staked × 100
          </p>
          <p>
            <strong>Win Rate:</strong> Percentage of bets that finished 1st
          </p>
        </div>
      </div>
    </div>
  );
}
