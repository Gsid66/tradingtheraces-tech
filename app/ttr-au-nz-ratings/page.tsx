import { Client } from 'pg';
import { format, parseISO } from 'date-fns';
import Link from 'next/link';

export const dynamic = 'force-dynamic';
export const revalidate = 300; // Revalidate every 5 minutes

interface RaceDate {
  date: string;
  count: number;
}

async function getAvailableDates(): Promise<RaceDate[]> {
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
        race_date::text as date,
        COUNT(*) as count
      FROM ttr_au_nz_ratings
      GROUP BY race_date
      ORDER BY race_date DESC
      LIMIT 30
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

export default async function TTRAUNZRatingsIndexPage() {
  const availableDates = await getAvailableDates();

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            TTR AU/NZ Ratings
          </h1>
          <p className="text-gray-600">
            Australia & New Zealand racing ratings data
          </p>
        </div>

        {/* Action Buttons */}
        <div className="mb-8 flex flex-wrap gap-4">
          <Link
            href="/ttr-au-nz-ratings/upload"
            className="inline-flex items-center px-6 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors font-semibold"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            Upload New Ratings
          </Link>
          <Link
            href="/"
            className="inline-flex items-center px-6 py-3 bg-white text-gray-700 rounded-md hover:bg-gray-50 border border-gray-300 transition-colors font-semibold"
          >
            ← Back to Home
          </Link>
        </div>

        {/* Available Dates */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-800">Available Race Dates</h2>
            <p className="text-sm text-gray-600 mt-1">Select a date to view ratings</p>
          </div>

          {availableDates.length === 0 ? (
            <div className="p-8 text-center">
              <div className="text-gray-400 mb-4">
                <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Ratings Data</h3>
              <p className="text-gray-600 mb-4">
                No ratings have been uploaded yet.
              </p>
              <Link
                href="/ttr-au-nz-ratings/upload"
                className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
              >
                Upload Your First File
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {availableDates.map((dateInfo) => {
                const date = parseISO(dateInfo.date);
                const formattedDate = format(date, 'EEEE, MMMM d, yyyy');
                const shortDate = format(date, 'MMM d, yyyy');

                return (
                  <Link
                    key={dateInfo.date}
                    href={`/ttr-au-nz-ratings/${dateInfo.date}`}
                    className="block px-6 py-4 hover:bg-green-50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {formattedDate}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {dateInfo.count} horse{dateInfo.count !== 1 ? 's' : ''} with ratings
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                          {dateInfo.count}
                        </span>
                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Info Card */}
        <div className="mt-8 bg-green-50 border border-green-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-green-900 mb-2">About AU/NZ Ratings</h3>
          <p className="text-sm text-green-800">
            This system stores and displays TTR racing ratings for Australian and New Zealand tracks. 
            Upload CSV files containing race data to view ratings organized by track and race.
          </p>
        </div>
      </div>
    </div>
  );
}
