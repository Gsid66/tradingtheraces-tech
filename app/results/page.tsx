import { Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { FiArrowLeft } from 'react-icons/fi';
import ResultsContent from './ResultsContent';

export const dynamic = 'force-dynamic';

// Helper to format date to YYYY-MM-DD
function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export default async function ResultsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  // Await searchParams
  const params = await searchParams;
  const dateParam = params.date as string | undefined;
  
  // Get yesterday's date or use the provided date
  let targetDate: Date;
  let targetDateStr: string;
  if (dateParam) {
    targetDate = new Date(dateParam);
    targetDateStr = dateParam;
  } else {
    targetDate = new Date();
    targetDate.setDate(targetDate.getDate() - 1);
    targetDateStr = formatDate(targetDate);
  }
  
  try {
    // Fetch results from our database API
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const apiUrl = `${baseUrl}/api/results?date=${targetDateStr}`;
    
    console.log(`Fetching results from: ${apiUrl}`);
    
    const response = await fetch(apiUrl, {
      cache: 'no-store',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`);
    }
    
    const data = await response.json();
    const meetingsWithResults = data.meetings || [];
    
    // Filter to AUS/NZ only (already filtered by database query, but keeping for safety)
    const ausNzMeetings = Array.isArray(meetingsWithResults) 
      ? meetingsWithResults
      : [];

    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header Section with Back Button */}
        <div className="bg-gradient-to-r from-purple-900 to-purple-700 text-white py-6 px-4 shadow-lg">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center gap-4 mb-4">
              <div className="bg-white rounded-lg p-1">
                <Image
                  src="/images/ttr-logo.png"
                  alt="TTR Logo"
                  width={32}
                  height={32}
                  className="w-8 h-8 object-contain"
                />
              </div>
              <Link 
                href="/" 
                className="inline-flex items-center gap-2 text-purple-200 hover:text-white transition-colors"
              >
                <FiArrowLeft size={20} />
                <span>Back to Home</span>
              </Link>
            </div>
            <h1 className="text-4xl font-bold mb-2">Race Results</h1>
            <p className="text-purple-200">Australian & New Zealand Racing Results</p>
          </div>
        </div>
        
        <Suspense fallback={
          <div className="flex items-center justify-center min-h-screen">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
              <p className="text-gray-500 font-medium">Loading results...</p>
            </div>
          </div>
        }>
          <ResultsContent meetings={ausNzMeetings} selectedDate={targetDate} />
        </Suspense>
      </div>
    );
  } catch (error) {
    console.error('Error fetching results:', error);
    
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header Section */}
        <div className="bg-gradient-to-r from-purple-900 to-purple-700 text-white py-6 px-4 shadow-lg">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center gap-4 mb-4">
              <div className="bg-white rounded-lg p-1">
                <Image
                  src="/images/ttr-logo.png"
                  alt="TTR Logo"
                  width={32}
                  height={32}
                  className="w-8 h-8 object-contain"
                />
              </div>
              <Link 
                href="/" 
                className="inline-flex items-center gap-2 text-purple-200 hover:text-white transition-colors"
              >
                <FiArrowLeft size={20} />
                <span>Back to Home</span>
              </Link>
            </div>
            <h1 className="text-4xl font-bold mb-2">Race Results</h1>
            <p className="text-purple-200">Australian & New Zealand Racing Results</p>
          </div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 py-24 text-center">
          <div className="inline-block p-8 bg-white rounded-3xl border border-red-200 shadow-lg">
            <div className="text-6xl mb-4">⚠️</div>
            <p className="text-2xl font-bold text-gray-800 mb-2">Unable to Load Results</p>
            <p className="text-gray-600">Please try again later</p>
          </div>
        </div>
      </div>
    );
  }
}
