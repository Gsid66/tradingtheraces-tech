import { Client } from 'pg';
import { format } from 'date-fns';

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
  predicted_odds: number;
  jockey: string;
  trainer: string;
  finishing_position: number | null;
  actual_sp: number | null;
}

async function getDailyData(date: string): Promise<RaceData[]> {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
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
        rcr.predicted_odds,
        rcr.jockey,
        rcr.trainer,
        r.finishing_position,
        r.starting_price as actual_sp
      FROM race_cards_ratings rcr
      LEFT JOIN pf_meetings m ON rcr.race_date = m.meeting_date
        AND LOWER(TRIM(rcr.track)) = LOWER(TRIM(m.track_name))
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

export default async function DailyTradingDeskPage({ params }: PageProps) {
  const { date } = await params;
  const data = await getDailyData(date);

  // Calculate statistics
  const totalRaces = new Set(data.map(d => `${d.track_name}-${d.race_number}`)).size;
  const ratedHorses = data.length;
  const valueOpportunities = data.filter(d => d.actual_sp && d.predicted_odds && d.actual_sp > d.predicted_odds * 1.2).length;
  const winners = data.filter(d => d.finishing_position === 1);

  // Get top value plays (horses with best odds differential)
  const valuePlays = data
    .filter(d => d.actual_sp && d.predicted_odds)
    .map(d => ({
      ...d,
      oddsValue: ((d.actual_sp! - d.predicted_odds) / d.predicted_odds) * 100
    }))
    .sort((a, b) => b.oddsValue - a.oddsValue)
    .slice(0, 10);

  // Format date for display
  const formattedDate = format(new Date(date), 'EEEE, MMMM d, yyyy');

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">{formattedDate}</h1>
        <p className="text-gray-600">Race day analysis and ratings</p>
      </div>

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
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Track</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Race</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Horse</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rating</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Predicted</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actual SP</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Value</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Result</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {valuePlays.map((play) => (
                  <tr key={play.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{play.track_name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">R{play.race_number}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{play.horse_name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{play.rating.toFixed(1)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${play.predicted_odds.toFixed(2)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${play.actual_sp?.toFixed(2)}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                        +{play.oddsValue.toFixed(0)}%
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {play.finishing_position ? (
                        <span className={`font-medium ${play.finishing_position === 1 ? 'text-green-600' : 'text-gray-600'}`}>
                          {play.finishing_position === 1 ? '🏆 1st' : `${play.finishing_position}${getOrdinalSuffix(play.finishing_position)}`}
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* All Races */}
      <div>
        <h2 className="text-2xl font-bold text-gray-800 mb-4">All Races</h2>
        {data.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
            No race data available for this date
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Track</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Race</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Horse</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Jockey</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trainer</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rating</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Predicted</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actual SP</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Result</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.map((race) => (
                  <tr key={race.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{race.track_name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">R{race.race_number}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{race.horse_name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{race.jockey}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{race.trainer}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{race.rating.toFixed(1)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${race.predicted_odds.toFixed(2)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {race.actual_sp ? `$${race.actual_sp.toFixed(2)}` : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {race.finishing_position ? (
                        <span className={`font-medium ${race.finishing_position === 1 ? 'text-green-600' : 'text-gray-600'}`}>
                          {race.finishing_position === 1 ? '🏆 1st' : `${race.finishing_position}${getOrdinalSuffix(race.finishing_position)}`}
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function getOrdinalSuffix(num: number): string {
  const j = num % 10;
  const k = num % 100;
  if (j === 1 && k !== 11) return 'st';
  if (j === 2 && k !== 12) return 'nd';
  if (j === 3 && k !== 13) return 'rd';
  return 'th';
}
