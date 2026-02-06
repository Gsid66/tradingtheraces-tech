import { Client } from 'pg';
import { format, subDays, eachDayOfInterval } from 'date-fns';
import ValueDistributionChart from '@/components/trading-desk/ValueDistributionChart';
import WinRateTrendChart from '@/components/trading-desk/WinRateTrendChart';
import ROIChart from '@/components/trading-desk/ROIChart';
import RatingPriceScatter from '@/components/trading-desk/RatingPriceScatter';
import { calculateValueScore } from '@/lib/trading-desk/valueCalculator';
import { calculateReturn } from '@/lib/trading-desk/plCalculator';
import { horseNamesMatch } from '@/lib/utils/horse-name-matcher';
import { getPuntingFormClient } from '@/lib/integrations/punting-form/client';
import { getTTRRatingsClient } from '@/lib/integrations/ttr-ratings';

export const dynamic = 'force-dynamic';

const LOOKBACK_DAYS = 30;
const BATCH_SIZE = 5; // Process 5 dates at a time for historical data

interface RaceData {
  race_date: string;
  horse_name: string;
  rating: number;
  price: number;
  finishing_position: number | null;
  actual_sp: number | null;
}

async function getStatisticsData(): Promise<RaceData[]> {
  try {
    const pfClient = getPuntingFormClient();
    const ttrClient = getTTRRatingsClient();

    if (!pfClient || !ttrClient) {
      console.error('❌ API clients not available');
      return [];
    }

    // Get last LOOKBACK_DAYS of dates
    const today = new Date();
    const lookbackDate = subDays(today, LOOKBACK_DAYS);
    const dateRange = eachDayOfInterval({ start: lookbackDate, end: today });

    console.log(`🔍 Fetching historical data for last ${LOOKBACK_DAYS} days (${format(lookbackDate, 'yyyy-MM-dd')} to ${format(today, 'yyyy-MM-dd')})`);

    // Fetch all ratings data for the date range (in parallel for better performance)
    const allRatingsData: RaceData[] = [];

    // Fetch data for all dates in parallel (in batches to avoid overwhelming the API)
    for (let i = 0; i < dateRange.length; i += BATCH_SIZE) {
      const batch = dateRange.slice(i, i + BATCH_SIZE);
      
      const batchPromises = batch.map(async (date) => {
        const dateStr = format(date, 'yyyy-MM-dd');
        
        try {
          // Get meetings for this specific date
          const meetingsResponse = await pfClient.getMeetingsByDate(date);
          const meetings = meetingsResponse.payLoad || [];

          if (meetings.length === 0) {
            return []; // No meetings for this date
          }

          // Fetch ratings for all meetings in parallel
          const ratingsPromises = meetings.map(meeting => 
            ttrClient.getRatingsForMeeting(meeting.meetingId)
              .then(ttrResponse => ({ meeting, ttrResponse, dateStr }))
              .catch(error => {
                console.warn(`⚠️ Error fetching ratings for ${meeting.track.name}:`, error);
                return null;
              })
          );

          const ratingsResults = await Promise.all(ratingsPromises);
          
          const dateRatings: RaceData[] = [];
          for (const result of ratingsResults) {
            if (result && result.ttrResponse.success && result.ttrResponse.data && result.ttrResponse.data.length > 0) {
              const meetingRatings = result.ttrResponse.data.map(rating => ({
                race_date: dateStr,
                horse_name: rating.horse_name,
                rating: rating.rating,
                price: rating.price,
                finishing_position: null,
                actual_sp: null
              }));

              dateRatings.push(...meetingRatings);
            }
          }
          
          return dateRatings;
        } catch (error) {
          console.warn(`⚠️ Error fetching data for ${dateStr}:`, error);
          return [];
        }
      });

      const batchResults = await Promise.all(batchPromises);
      batchResults.forEach(results => allRatingsData.push(...results));
      
      console.log(`📊 Processed batch ${i / BATCH_SIZE + 1}, total ratings so far: ${allRatingsData.length}`);
    }

    console.log(`✅ Fetched ${allRatingsData.length} ratings from last ${LOOKBACK_DAYS} days`);

    // Now fetch results from database
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
          m.track_name,
          m.meeting_date
        FROM pf_results r
        INNER JOIN pf_races ra ON r.race_id = ra.race_id
        INNER JOIN pf_meetings m ON ra.meeting_id = m.meeting_id
        WHERE m.meeting_date >= $1
      `;

      const lookbackDateStr = format(lookbackDate, 'yyyy-MM-dd');
      const resultsResult = await client.query(resultsQuery, [lookbackDateStr]);
      const results = resultsResult.rows;

      console.log(`📊 Found ${results.length} results from last ${LOOKBACK_DAYS} days`);

      // Match ratings with results
      const enrichedData = allRatingsData.map((rating) => {
        const matchedResult = results.find((result: any) => 
          result.meeting_date === rating.race_date &&
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
    console.error('❌ Error fetching historical data:', error);
    return [];
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
