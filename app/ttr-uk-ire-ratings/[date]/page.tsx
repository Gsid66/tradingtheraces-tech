import Link from 'next/link';
import { FiArrowLeft } from 'react-icons/fi';
import { Client } from 'pg';
import { format, parseISO, isValid } from 'date-fns';

export const dynamic = 'force-dynamic';
export const revalidate = 300; // Revalidate every 5 minutes

interface PageProps {
  params: Promise<{ date: string }>;
}

interface TTRRatingData {
  id: number;
  race_date: string;
  track_name: string;
  race_name: string;
  race_number: number;
  saddle_cloth: number | null;
  horse_name: string;
  jockey_name: string | null;
  trainer_name: string | null;
  rating: number | null;
  price: number | null;
}

interface RaceGroup {
  track_name: string;
  race_number: number;
  race_name: string;
  horses: TTRRatingData[];
}

async function getRatingsForDate(date: string): Promise<TTRRatingData[]> {
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL not configured');
    return [];
  }

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();

    const query = `
      SELECT 
        id, race_date, track_name, race_name, race_number,
        saddle_cloth, horse_name, jockey_name, trainer_name,
        rating, price
      FROM ttr_uk_ire_ratings
      WHERE race_date = $1
      ORDER BY track_name, race_number, rating DESC NULLS LAST
    `;

    const result = await client.query(query, [date]);
    return result.rows;
  } catch (error) {
    console.error('❌ Error fetching TTR ratings:', error);
    return [];
  } finally {
    await client.end();
  }
}

function groupRatings(ratings: TTRRatingData[]): RaceGroup[] {
  const groups: { [key: string]: RaceGroup } = {};

  ratings.forEach(rating => {
    const key = `${rating.track_name}-${rating.race_number}`;
    
    if (!groups[key]) {
      groups[key] = {
        track_name: rating.track_name,
        race_number: rating.race_number,
        race_name: rating.race_name,
        horses: []
      };
    }
    
    groups[key].horses.push(rating);
  });

  // Sort groups by track name, then race number
  return Object.values(groups).sort((a, b) => {
    if (a.track_name !== b.track_name) {
      return a.track_name.localeCompare(b.track_name);
    }
    return a.race_number - b.race_number;
  });
}

// Helper functions for safe number formatting
function formatPrice(price: number | string | null | undefined): string {
  if (price === null || price === undefined || price === '') {
    return '-';
  }
  const numPrice = typeof price === 'string' ? parseFloat(price) : price;
  if (typeof numPrice !== 'number' || isNaN(numPrice)) {
    return '-';
  }
  return numPrice.toFixed(2);
}

function formatRating(rating: number | string | null | undefined): string {
  if (rating === null || rating === undefined || rating === '') {
    return '-';
  }
  const numRating = typeof rating === 'string' ? parseFloat(rating) : rating;
  if (typeof numRating !== 'number' || isNaN(numRating)) {
    return '-';
  }
  return numRating.toFixed(2);
}

export default async function TTRRatingsPage({ params }: PageProps) {
  const { date } = await params;
  
  // Validate date format
  const parsedDate = parseISO(date);
  if (!isValid(parsedDate)) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <h2 className="text-xl font-bold text-red-800 mb-2">Invalid Date</h2>
          <p className="text-red-600">The date &quot;{date}&quot; is not valid. Please use format YYYY-MM-DD.</p>
        </div>
      </div>
    );
  }

  const ratings = await getRatingsForDate(date);
  const raceGroups = groupRatings(ratings);

  // Calculate statistics
  const totalRaces = raceGroups.length;
  const totalHorses = ratings.length;
  const ratingsWithValue = ratings.filter(r => r.rating !== null);
  const avgRating = ratingsWithValue.length > 0
    ? ratingsWithValue.reduce((sum, r) => sum + (typeof r.rating === 'string' ? parseFloat(r.rating) : r.rating || 0), 0) / ratingsWithValue.length
    : 0;

  // Format date for display
  const formattedDate = format(parsedDate, 'EEEE, MMMM d, yyyy');

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Back Button */}
        <Link
          href="/ttr-uk-ire-ratings"
          className="inline-flex items-center gap-2 text-red-600 hover:text-blue-600 transition-colors mb-4"
        >
          <FiArrowLeft size={20} />
          <span>Back to UK/IRE Ratings</span>
        </Link>

        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">
            TTR UK/Ireland Ratings
          </h1>
          <p className="text-sm sm:text-base text-gray-600">{formattedDate}</p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-600 mb-1">Total Races</div>
            <div className="text-3xl font-bold text-red-600">{totalRaces}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-600 mb-1">Total Horses</div>
            <div className="text-3xl font-bold text-blue-600">{totalHorses}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-600 mb-1">Average Rating</div>
            <div className="text-3xl font-bold text-red-600">
              {avgRating > 0 ? avgRating.toFixed(2) : 'N/A'}
            </div>
          </div>
        </div>

        {/* No Data Message */}
        {ratings.length === 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
            <h3 className="text-lg font-semibold text-yellow-900 mb-2">No Ratings Found</h3>
            <p className="text-yellow-800">
              No ratings data is available for {formattedDate}.
            </p>
          </div>
        )}

        {/* Race Groups */}
        {raceGroups.map((group, index) => (
          <div key={index} className="bg-white rounded-lg shadow mb-6 overflow-hidden">
            {/* Race Header */}
            <div className="bg-purple-900 text-white px-6 py-4">
              <h2 className="text-xl font-bold">
                {group.track_name} - Race {group.race_number}
              </h2>
              <p className="text-purple-200 text-sm mt-1">{group.race_name}</p>
            </div>

            {/* Horses Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Cloth
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Horse
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Jockey
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Trainer
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Rating
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Price
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {group.horses.map((horse) => (
                    <tr key={horse.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {horse.saddle_cloth !== null ? (
                          <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-purple-100 text-purple-800 font-semibold">
                            {horse.saddle_cloth}
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">
                        {horse.horse_name}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {horse.jockey_name || '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {horse.trainer_name || '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-right font-semibold text-purple-600">
                        {formatRating(horse.rating)}
                      </td>
                      <td className="px-4 py-3 text-sm text-right font-semibold text-gray-900">
                        {formatPrice(horse.price)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
