import { Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { FiArrowLeft } from 'react-icons/fi';
import { query } from '@/lib/database/client';
import ResultsContent from './ResultsContent';

export const dynamic = 'force-dynamic';

// Helper to format date to YYYY-MM-DD in AEDT timezone
function formatDate(date: Date): string {
  // Use Australia/Sydney timezone to get correct date
  const aedtDate = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Australia/Sydney',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(date);
  return aedtDate;
}

export default async function ResultsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  // Await searchParams
  const params = await searchParams;
  const dateParam = params.date as string | undefined;
  
  // Get yesterday's date in AEDT or use the provided date
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
    let ausNzMeetings: any[] = [];
    
    const queryText = `
      SELECT 
        m.meeting_id, m.track_name, m.state, m.country, m.rail_position,
        ra.race_id, ra.race_number, ra.race_name, ra.distance, ra.start_time,
        r.horse_name, r.finishing_position, r.tab_number, r.jockey_name,
        r.trainer_name, r.starting_price, r.margin_to_winner
      FROM pf_results r
      JOIN pf_races ra ON r.race_id = ra.race_id
      JOIN pf_meetings m ON ra.meeting_id = m.meeting_id
      WHERE m.meeting_date = $1 AND (m.country = 'AUS' OR m.country = 'NZ')
      ORDER BY m.track_name, ra.race_number, r.finishing_position
    `;
    
    const result = await query(queryText, [targetDateStr]);

console.log('📊 Query result:', {
  rowCount: result.rows.length,
  targetDate: targetDateStr,
  firstRow: result.rows[0]
});
    
    // Group results by meeting
    const meetingsMap = new Map();
    result.rows.forEach((row) => {
      if (!meetingsMap.has(row.meeting_id)) {
        meetingsMap.set(row.meeting_id, {
          meetingId: row.meeting_id,
          track: { name: row.track_name, state: row.state, country: row.country },
          railPosition: row.rail_position,
          races: []
        });
      }
      const meeting = meetingsMap.get(row.meeting_id);
      let race = meeting.races.find((r: any) => r.raceId === row.race_id);
      if (!race) {
        race = {
          raceId: row.race_id, number: row.race_number,
          name: row.race_name, distance: row.distance,
          startTime: row.start_time, results: []
        };
        meeting.races.push(race);
      }
      race.results.push({
        horseName: row.horse_name, finishingPosition: row.finishing_position,
        tabNumber: row.tab_number, jockeyName: row.jockey_name,
        trainerName: row.trainer_name, startingPrice: row.starting_price,
        marginToWinner: row.margin_to_winner
      });
    });
    
    ausNzMeetings = Array.from(meetingsMap.values());

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
