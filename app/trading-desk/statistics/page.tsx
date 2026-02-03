import { Client } from 'pg';
import { format, subDays } from 'date-fns';
import ValueDistributionChart from '@/components/trading-desk/ValueDistributionChart';
import WinRateTrendChart from '@/components/trading-desk/WinRateTrendChart';
import ROIChart from '@/components/trading-desk/ROIChart';
import RatingPriceScatter from '@/components/trading-desk/RatingPriceScatter';
import { calculateValueScore } from '@/lib/trading-desk/valueCalculator';
import { calculateReturn } from '@/lib/trading-desk/plCalculator';

export const dynamic = 'force-dynamic';

interface RaceData {
  race_date: string;
  horse_name: string;
  rating: number;
  price: number;
  finishing_position: number | null;
  actual_sp: number | null;
}

async function getStatisticsData(): Promise<RaceData[]> {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();

    // Get data from last 30 days
    const thirtyDaysAgo = format(subDays(new Date(), 30), 'yyyy-MM-dd');

    const query = `
      SELECT 
        rcr.race_date::date as race_date,
        rcr.horse_name,
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
    console.error('Error fetching statistics data:', error);
    return [];
  } finally {
    await client.end();
  }
}

export default async function StatisticsPage() {
  const data = await getStatisticsData();

  // Calculate value scores
  const dataWithValueScores = data.map(d => ({
    ...d,
    valueScore: calculateValueScore(Number(d.rating), Number(d.price))
  }));

  // Constants for performance
  const MAX_SCATTER_POINTS = 200; // Limit scatter plot points for performance

  // 1. Value Distribution Data
  const valueRanges = [
    { range: '0-10', min: 0, max: 10 },
    { range: '10-15', min: 10, max: 15 },
    { range: '15-20', min: 15, max: 20 },
    { range: '20-25', min: 20, max: 25 },
    { range: '25-30', min: 25, max: 30 },
    { range: '30+', min: 30, max: Infinity }
  ];

  const valueDistributionData = valueRanges.map(range => ({
    range: range.range,
    count: dataWithValueScores.filter(
      d => d.valueScore >= range.min && d.valueScore < range.max
    ).length
  }));

  // 2. Win Rate Trend Data (by date)
  const dateMap = new Map<string, { total: number; winners: number }>();
  
  dataWithValueScores
    .filter(d => d.valueScore > 25) // Only value plays
    .forEach(d => {
      const dateStr = format(new Date(d.race_date), 'MM/dd');
      const current = dateMap.get(dateStr) || { total: 0, winners: 0 };
      current.total++;
      if (d.finishing_position && d.finishing_position <= 3) {
        current.winners++;
      }
      dateMap.set(dateStr, current);
    });

  const winRateTrendData = Array.from(dateMap.entries())
    .map(([date, stats]) => ({
      date,
      winRate: stats.total > 0 ? (stats.winners / stats.total) * 100 : 0
    }))
    .sort((a, b) => {
      const [aMonth, aDay] = a.date.split('/').map(Number);
      const [bMonth, bDay] = b.date.split('/').map(Number);
      return aMonth !== bMonth ? aMonth - bMonth : aDay - bDay;
    });

  // 3. ROI Over Time (cumulative)
  const dateROIMap = new Map<string, { staked: number; returns: number }>();
  
  dataWithValueScores
    .filter(d => d.valueScore > 25)
    .forEach(d => {
      const dateStr = format(new Date(d.race_date), 'MM/dd');
      const current = dateROIMap.get(dateStr) || { staked: 0, returns: 0 };
      current.staked += 10; // $10 stake
      current.returns += calculateReturn(
        d.finishing_position,
        Number(d.price),
        d.actual_sp
      );
      dateROIMap.set(dateStr, current);
    });

  let cumulativeStaked = 0;
  let cumulativeReturns = 0;

  const roiData = Array.from(dateROIMap.entries())
    .sort((a, b) => {
      const [aMonth, aDay] = a[0].split('/').map(Number);
      const [bMonth, bDay] = b[0].split('/').map(Number);
      return aMonth !== bMonth ? aMonth - bMonth : aDay - bDay;
    })
    .map(([date, stats]) => {
      cumulativeStaked += stats.staked;
      cumulativeReturns += stats.returns;
      const roi = cumulativeStaked > 0 
        ? ((cumulativeReturns - cumulativeStaked) / cumulativeStaked) * 100 
        : 0;
      return {
        date,
        roi: Number(roi.toFixed(2))
      };
    });

  // 4. Rating vs Price Scatter Data
  const scatterData = dataWithValueScores
    .filter(d => d.rating > 0 && d.price > 0)
    .slice(0, MAX_SCATTER_POINTS) // Limit points for performance
    .map(d => ({
      rating: Number(d.rating),
      price: Number(d.price),
      valueScore: d.valueScore,
      horseName: d.horse_name
    }));

  return (
    <div className="p-4 sm:p-8">
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">Statistics & Analytics</h1>
        <p className="text-gray-600">Performance insights and data visualization</p>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ValueDistributionChart data={valueDistributionData} />
        <WinRateTrendChart data={winRateTrendData} />
        <ROIChart data={roiData} />
        <RatingPriceScatter data={scatterData} />
      </div>

      {/* Summary */}
      <div className="mt-8 bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Summary</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <div className="text-sm text-gray-600">Total Horses Analyzed</div>
            <div className="text-2xl font-bold text-gray-800">{data.length}</div>
          </div>
          <div>
            <div className="text-sm text-gray-600">Value Plays</div>
            <div className="text-2xl font-bold text-purple-600">
              {dataWithValueScores.filter(d => d.valueScore > 25).length}
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-600">Data Period</div>
            <div className="text-2xl font-bold text-gray-800">30 Days</div>
          </div>
          <div>
            <div className="text-sm text-gray-600">Current ROI</div>
            <div className={`text-2xl font-bold ${
              roiData.length > 0 && roiData[roiData.length - 1].roi >= 0 
                ? 'text-green-600' 
                : 'text-red-600'
            }`}>
              {roiData.length > 0 ? `${roiData[roiData.length - 1].roi}%` : '0%'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
