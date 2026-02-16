import Link from 'next/link';
import { FiArrowRight, FiDownload, FiUpload } from 'react-icons/fi';
import { Client } from 'pg';
import { format } from 'date-fns';

export const dynamic = 'force-dynamic';
export const revalidate = 300;

interface RaceDate {
  date: string;
  count: number;
}

async function getLatestRaceDate(): Promise<string | null> {
  if (!process.env.DATABASE_URL) {
    return null;
  }

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    const query = `
      SELECT race_date::text as date
      FROM ttr_au_nz_ratings
      ORDER BY race_date DESC
      LIMIT 1
    `;
    const result = await client.query(query);
    return result.rows[0]?.date || null;
  } catch (error) {
    console.error('❌ Error fetching latest date:', error);
    return null;
  } finally {
    await client.end();
  }
}

async function getAvailableDates(): Promise<RaceDate[]> {
  if (!process.env.DATABASE_URL) {
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
        race_date::text as date,
        COUNT(*) as count
      FROM ttr_au_nz_ratings
      GROUP BY race_date
      ORDER BY race_date DESC
      LIMIT 10
    `;
    const result = await client.query(query);
    return result.rows;
  } catch (error) {
    console.error('❌ Error fetching available dates:', error);
    return [];
  } finally {
    await client.end();
  }
}

export default async function TTRAUNZLandingPage() {
  const latestDate = await getLatestRaceDate();
  const availableDates = await getAvailableDates();
  const hasData = availableDates.length > 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="bg-gradient-to-r from-amber-600 to-green-700 text-white py-8 px-4 shadow-xl">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold mb-2">TTR AU/NZ Ratings</h1>
              <p className="text-amber-100 text-lg">Australia & New Zealand Racing</p>
            </div>
            <div className="flex gap-3">
              {latestDate && (
                <Link
                  href={`/api/ttr-au-nz-ratings/download?date=${latestDate}`}
                  className="inline-flex items-center gap-2 bg-white text-amber-700 px-6 py-3 rounded-lg font-semibold hover:bg-amber-50 transition-all shadow-lg hover:shadow-xl"
                >
                  <FiDownload size={20} />
                  <span>Download Latest</span>
                </Link>
              )}
              <Link
                href="/ttr-au-nz-ratings/upload"
                className="inline-flex items-center gap-2 bg-green-700 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-800 transition-all shadow-lg hover:shadow-xl"
              >
                <FiUpload size={20} />
                <span>Upload</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {!hasData ? (
          // No Data State
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <div className="text-6xl mb-6">🏇</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">No Ratings Data Yet</h2>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              Upload your first AU/NZ ratings file to get started with comprehensive race analysis for Australian and New Zealand tracks.
            </p>
            <Link
              href="/ttr-au-nz-ratings/upload"
              className="inline-flex items-center gap-2 bg-amber-600 text-white px-8 py-4 rounded-lg font-semibold hover:bg-amber-700 transition-all shadow-lg hover:shadow-xl text-lg"
            >
              <FiUpload size={24} />
              <span>Upload Your First File</span>
            </Link>
          </div>
        ) : (
          <>
            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
              <div className="bg-white rounded-xl shadow-lg p-6 border-t-4 border-amber-600">
                <div className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-2">
                  Available Dates
                </div>
                <div className="text-4xl font-bold text-amber-600">{availableDates.length}</div>
              </div>
              <div className="bg-white rounded-xl shadow-lg p-6 border-t-4 border-green-600">
                <div className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-2">
                  Latest Date
                </div>
                <div className="text-2xl font-bold text-green-600">
                  {latestDate ? format(new Date(latestDate), 'MMM d, yyyy') : 'N/A'}
                </div>
              </div>
              <div className="bg-white rounded-xl shadow-lg p-6 border-t-4 border-blue-600">
                <div className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-2">
                  Status
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-2xl font-bold text-green-600">Active</span>
                </div>
              </div>
            </div>

            {/* Available Race Dates */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">Available Race Dates</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {availableDates.map((dateInfo) => {
                  const dateObj = new Date(dateInfo.date);
                  const formattedDate = format(dateObj, 'EEEE, MMMM d, yyyy');
                  const shortDate = format(dateObj, 'MMM d');

                  return (
                    <Link
                      key={dateInfo.date}
                      href={`/ttr-au-nz-ratings/${dateInfo.date}`}
                      className="bg-gradient-to-br from-amber-500 to-green-600 hover:from-amber-600 hover:to-green-700 rounded-2xl shadow-xl overflow-hidden transform transition-all duration-300 hover:scale-105 hover:shadow-2xl"
                    >
                      <div className="p-8">
                        {/* Date Header */}
                        <div className="flex items-start justify-between mb-6">
                          <div>
                            <h3 className="text-3xl font-bold text-white mb-2">{formattedDate}</h3>
                            <p className="text-white/80 text-lg">AU/NZ Racing</p>
                          </div>
                          <div className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-lg">
                            <div className="text-white/80 text-xs font-semibold uppercase tracking-wide">
                              {shortDate}
                            </div>
                          </div>
                        </div>

                        {/* Horse Count & CTA */}
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-white/80 text-sm font-semibold uppercase tracking-wide mb-1">
                              Total Horses
                            </div>
                            <div className="text-4xl font-bold text-white">{dateInfo.count}</div>
                          </div>
                          <div className="bg-white text-gray-900 rounded-full p-4 shadow-lg">
                            <FiArrowRight size={24} />
                          </div>
                        </div>

                        {/* Info Badge */}
                        <div className="mt-6 bg-white/20 backdrop-blur-sm rounded-lg p-4 border border-white/30">
                          <div className="flex items-center gap-3">
                            <div className="text-3xl flex-shrink-0">🏇</div>
                            <div className="text-white text-sm">
                              <span className="font-bold">View Ratings:</span> Comprehensive ratings for all tracks
                            </div>
                          </div>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* Footer Info */}
            <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-amber-600">
              <div className="flex items-start gap-4">
                <div className="text-5xl flex-shrink-0">🌏</div>
                <div>
                  <h3 className="text-lg font-bold text-gray-800 mb-2">
                    About AU/NZ Ratings
                  </h3>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    TTR AU/NZ Ratings provide comprehensive racing analysis for Australian and New Zealand tracks. 
                    Upload CSV files containing race data to access detailed ratings organized by track and race number.
                  </p>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}