import { notFound } from 'next/navigation';
import Link from 'next/link';
import { FiArrowLeft } from 'react-icons/fi';
import { format } from 'date-fns';
import { getPuntingFormClient } from '@/lib/integrations/punting-form/client';
import { getPostgresAPIClient } from '@/lib/integrations/postgres-api';
import { getTTRRatingsClient } from '@/lib/integrations/ttr-ratings';
import { horseNamesMatch } from '@/lib/utils/horse-name-matcher';
import RaceTabs from './RaceTabs';
import RaceDetails from './RaceDetails';
import RunnerList from './RunnerList';

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{
    trackSlug: string;
    raceNumber: string;
  }>;
}

export default async function RacePage({ params }: Props) {
  const { trackSlug, raceNumber } = await params;
  const pfClient = getPuntingFormClient();
  
  // Get today's meetings to find the right one
  const meetingsResponse = await pfClient.getTodaysMeetings();
  const meetings = meetingsResponse.payLoad || [];
  
  // Find meeting by track slug
  const meeting = meetings.find(m => 
    m.track.name.toLowerCase().replace(/\s+/g, '-') === trackSlug
  );
  
  if (!meeting) {
    notFound();
  }

  // Get all races for this meeting
  const racesResponse = await pfClient.getAllRacesForMeeting(meeting.meetingId);
  const races = (racesResponse.payLoad?.races || []).sort((a, b) => a.number - b.number);
  
  // Find the specific race
  const raceNum = parseInt(raceNumber);
  const race = races.find(r => r.number === raceNum);
  
  if (!race) {
    notFound();
  }

  // Get runners
  const runners = race.runners || [];

  // Fetch TAB data (don't crash if it fails)
  let tabData: any = null;
  try {
    const pgClient = getPostgresAPIClient();
    
    if (pgClient) {
      const dateStr = format(new Date(meeting.meetingDate), 'yyyy-MM-dd');
      
      console.log('🔍 Fetching TAB data:', {
        date: dateStr,
        trackName: meeting.track.name,
        raceNumber: raceNum
      });
      
      const tabRacesResponse = await pgClient.getRacesByDate(dateStr);
      
      // Log the RAW response first
      console.log('📊 TAB API Raw Response:', tabRacesResponse);
      
      // Then log structured info
      console.log('📊 TAB API Response:', {
        success: tabRacesResponse.success,
        hasData: !!tabRacesResponse.data,
        isArray: Array.isArray(tabRacesResponse.data),
        count: Array.isArray(tabRacesResponse.data) ? tabRacesResponse.data.length : 0,
        races: Array.isArray(tabRacesResponse.data) ? tabRacesResponse.data.map((r: any) => ({
          meeting: r.meeting_name,
          raceNum: r.race_number,
          runnerCount: r.runners?.length || 0
        })) : 'NOT AN ARRAY'
      });
      
      // Find matching race
      if (tabRacesResponse.success && Array.isArray(tabRacesResponse.data)) {
        tabData = tabRacesResponse.data.find(
          (r: any) => {
            const meetingMatch = r.meeting_name?.toLowerCase().includes(meeting.track.name.toLowerCase());
            const raceMatch = r.race_number === raceNum;
            
            console.log('🔍 Checking race match:', {
              apiMeeting: r.meeting_name,
              targetMeeting: meeting.track.name,
              meetingMatch,
              apiRaceNum: r.race_number,
              targetRaceNum: raceNum,
              raceMatch,
              overallMatch: meetingMatch && raceMatch,
              hasRunners: !!r.runners,
              runnerCount: r.runners?.length || 0
            });
            
            return meetingMatch && raceMatch;
          }
        );
        
        console.log('✅ TAB Race Match Result:', {
          found: !!tabData,
          raceData: tabData ? {
            meeting: tabData.meeting_name,
            raceNumber: tabData.race_number,
            hasRunners: !!tabData.runners,
            runnerCount: tabData.runners?.length || 0,
            firstRunner: tabData.runners?.[0] || null
          } : null
        });
      }
    }
  } catch (error: any) {
    console.error('❌ TAB data fetch failed:', error.message);
  }

  // Fetch TTR data from PFAI (don't crash if it fails)
  let ttrData: any = null;
  try {
    const ttrClient = getTTRRatingsClient();
    
    if (ttrClient) {
      console.log('🔍 Fetching TTR data from PFAI:', {
        meetingId: meeting.meetingId,
        raceNumber: raceNum
      });
      
      const ttrResponse = await ttrClient.getRatingsForRace(
        meeting.meetingId,
        raceNum
      );
      
      if (ttrResponse.success && ttrResponse.data && ttrResponse.data.length > 0) {
        ttrData = ttrResponse.data;
        console.log(`✅ PFAI TTR data retrieved: ${ttrData.length} ratings`);
      } else {
        console.log('⚠️ No TTR data found for this race');
      }
    }
  } catch (error: any) {
    console.warn('⚠️ TTR data unavailable:', error.message);
    // Continue without TTR data
  }

  // Merge data into runners (match by horse name)
  const enrichedRunners = runners.map((runner: any) => {
    const runnerName = (runner.horseName || runner.name)?.toLowerCase();
    
    console.log('🐴 Matching runner:', {
      punting: runnerName,
      tabRunners: tabData?.runners?.map((tr: any) => tr.horse_name.toLowerCase()) || []
    });
    
    const tabRunner = tabData?.runners?.find(
      (tr: any) => horseNamesMatch(tr.horse_name, runner.horseName || runner.name)
    );
    
    const ttrRunner = ttrData?.find(
      (tr: any) => horseNamesMatch(tr.horse_name, runner.horseName || runner.name)
    );

    const enriched = {
      ...runner,
      tabFixedWinPrice: tabRunner?.tab_fixed_win_price || null,
      tabFixedPlacePrice: tabRunner?.tab_fixed_place_price || null,
      tabFixedWinTimestamp: tabRunner?.tab_fixed_win_timestamp || null,
      tabFixedPlaceTimestamp: tabRunner?.tab_fixed_place_timestamp || null,
      ttrRating: ttrRunner?.rating || null,
      ttrPrice: ttrRunner?.price || null,
    };
    
    console.log('✅ Enriched Runner:', {
      name: runnerName,
      hasTabData: !!tabRunner,
      tabWinPrice: enriched.tabFixedWinPrice,
      tabPlacePrice: enriched.tabFixedPlacePrice,
      hasTtrData: !!ttrRunner,
      ttrRating: enriched.ttrRating,
      ttrPrice: enriched.ttrPrice
    });
    
    return enriched;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with Back Button */}
      <div className="bg-gradient-to-r from-purple-900 to-purple-700 text-white py-4 px-4 shadow-lg">
        <div className="max-w-7xl mx-auto">
          <Link 
            href="/form-guide" 
            className="inline-flex items-center gap-2 text-purple-200 hover:text-white transition-colors"
          >
            <FiArrowLeft size={20} />
            <span>Back to All Meetings</span>
          </Link>
        </div>
      </div>
      
      {/* Breadcrumb */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Link href="/" className="hover:text-gray-900">Home</Link>
            <span>›</span>
            <Link href="/form-guide" className="hover:text-gray-900">Form Guide</Link>
            <span>›</span>
            <span className="text-gray-900 font-medium">{meeting.track.name}</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Track Header */}
        <div className="flex items-center gap-3 mb-6">
          <h1 className="text-3xl font-bold text-purple-600">{meeting.track.name}</h1>
          <span className="px-3 py-1 bg-gray-200 text-gray-700 text-sm font-medium rounded">
            {meeting.track.state}
          </span>
        </div>

        {/* Race Navigation Pills */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {races.map((r) => (
            <Link
              key={r.raceId}
              href={`/form-guide/${trackSlug}/${r.number}`}
              className={`flex-shrink-0 px-6 py-3 rounded-full font-medium transition-colors ${
                r.number === raceNum
                  ? 'bg-purple-600 text-white'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              R{r.number}
            </Link>
          ))}
        </div>

        {/* Race Details Component */}
        <RaceDetails race={race} meeting={meeting} />

        {/* Tabs */}
        <RaceTabs />

        {/* Sort & Filter */}
        <div className="bg-white px-6 py-4 flex gap-4 border-b">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">Sort:  </span>
            <select className="px-3 py-2 border rounded text-sm">
              <option>Runner Number</option>
              <option>Barrier</option>
              <option>Weight</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">Odds: </span>
            <select className="px-3 py-2 border rounded text-sm">
              <option>Best Odds</option>
              <option>Fixed Odds</option>
              <option>TAB Odds</option>
            </select>
          </div>
        </div>

        {/* Runner List */}
        <RunnerList runners={enrichedRunners} />
      </div>
    </div>
  );
}