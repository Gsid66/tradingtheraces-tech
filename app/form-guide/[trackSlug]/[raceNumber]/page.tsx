import { notFound } from 'next/navigation';
import Link from 'next/link';
import { FiArrowLeft } from 'react-icons/fi';
import { format } from 'date-fns';
import { getPuntingFormClient, PFScratching, PFCondition } from '@/lib/integrations/punting-form/client';
import { getPostgresAPIClient } from '@/lib/integrations/postgres-api';
import { getTTRRatingsClient } from '@/lib/integrations/ttr-ratings';
import { horseNamesMatch } from '@/lib/utils/horse-name-matcher';
import { getScratchingInfo } from '@/lib/utils/scratchings-matcher';
import TrackConditionBadge from '@/components/racing/TrackConditionBadge';
import RaceDetails from './RaceDetails';
import RaceContent from './RaceContent';

export const dynamic = 'force-dynamic';
export const revalidate = 300; // Revalidate every 5 minutes for early morning odds

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

  // Fetch scratchings from database (has complete horse names) and conditions from API
  let scratchings: PFScratching[] = [];
  let conditions: PFCondition[] = [];
  try {
    // Fetch scratchings from database endpoint (has horse names resolved)
    const [scratchingsResponseAU, scratchingsResponseNZ, conditionsAU, conditionsNZ] = await Promise.all([
      fetch('/api/scratchings?jurisdiction=0&hoursAgo=48').then(async r => {
        if (!r.ok) {
          console.error(`Error fetching AU scratchings: HTTP ${r.status}`);
          return { success: false, data: [] };
        }
        return r.json();
      }).catch(err => {
        console.error('Error fetching AU scratchings:', err);
        return { success: false, data: [] };
      }),
      fetch('/api/scratchings?jurisdiction=1&hoursAgo=48').then(async r => {
        if (!r.ok) {
          console.error(`Error fetching NZ scratchings: HTTP ${r.status}`);
          return { success: false, data: [] };
        }
        return r.json();
      }).catch(err => {
        console.error('Error fetching NZ scratchings:', err);
        return { success: false, data: [] };
      }),
      pfClient.getConditions(0),   // 0 = AU
      pfClient.getConditions(1)    // 1 = NZ
    ]);
    
    // Combine scratchings from both jurisdictions
    const scratchingsAU = scratchingsResponseAU.success ? scratchingsResponseAU.data : [];
    const scratchingsNZ = scratchingsResponseNZ.success ? scratchingsResponseNZ.data : [];
    scratchings = [...scratchingsAU, ...scratchingsNZ];
    
    conditions = [...(conditionsAU.payLoad || []), ...(conditionsNZ.payLoad || [])];
    
    console.log(`✅ Loaded ${scratchingsAU.length} AU scratchings + ${scratchingsNZ.length} NZ scratchings from database`);
  } catch (error: any) {
    console.warn('⚠️ Scratchings/conditions unavailable:', error.message);
  }

  // Get track condition for this meeting
  const trackCondition = conditions.find(c => c.meetingId === meeting.meetingId);

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
      
      console.log('\n🔍 === FETCHING TAB DATA FOR FORM GUIDE ===');
      console.log('📋 TAB data request:', {
        date: dateStr,
        trackName: meeting.track.name,
        raceNumber: raceNum
      });
      
      // Fetch TAB data for both AU and NZ races
      const [tabRacesResponseAU, tabRacesResponseNZ] = await Promise.all([
        pgClient.getRacesByDate(dateStr, 'AU').catch(err => {
          console.error(`\n❌ AU TAB FETCH ERROR:`, {
            message: err.message,
            url: err.url
          });
          return { success: false, data: [] };
        }),
        pgClient.getRacesByDate(dateStr, 'NZ').catch(err => {
          console.error(`\n❌ NZ TAB FETCH ERROR:`, {
            message: err.message,
            url: err.url
          });
          return { success: false, data: [] };
        })
      ]);
      
      // Combine both AU and NZ races
      const allTabRaces = [
        ...(tabRacesResponseAU.success && Array.isArray(tabRacesResponseAU.data) ? tabRacesResponseAU.data : []),
        ...(tabRacesResponseNZ.success && Array.isArray(tabRacesResponseNZ.data) ? tabRacesResponseNZ.data : [])
      ];
      
      const auCount = tabRacesResponseAU.success && Array.isArray(tabRacesResponseAU.data) ? tabRacesResponseAU.data.length : 0;
      const nzCount = tabRacesResponseNZ.success && Array.isArray(tabRacesResponseNZ.data) ? tabRacesResponseNZ.data.length : 0;
      
      console.log('\n📊 TAB ODDS FETCH SUMMARY:');
      console.log(`   AU: ${auCount} races`);
      console.log(`   NZ: ${nzCount} races`);
      console.log(`   Total: ${auCount + nzCount} races`);
      
      if (auCount === 0) {
        console.warn('⚠️ WARNING: No AU races returned!');
      }
      if (nzCount === 0) {
        console.warn('⚠️ WARNING: No NZ races returned!');
      }
      
      // Find matching race from combined AU and NZ data
      if (allTabRaces.length > 0) {
        tabData = allTabRaces.find(
          (r: any) => {
            // Improved track matching: normalize both names before comparison
            const normalizeForMatch = (s: string) => {
              if (!s) return '';
              return s.toLowerCase().replace(/\s*(hillside|lakeside|park|gardens|racecourse)\s*$/, '').trim();
            };
            const apiTrack = normalizeForMatch(r.meeting_name);
            const targetTrack = normalizeForMatch(meeting.track.name);
            const meetingMatch = apiTrack && targetTrack && (
              apiTrack === targetTrack || 
              apiTrack.includes(targetTrack) || 
              targetTrack.includes(apiTrack)
            );
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

    // Check if horse is scratched
    const scratchingInfo = getScratchingInfo(
      scratchings,
      meeting.meetingId,
      raceNum,
      runner.horseName || runner.name,
      meeting.track.name,
      runner.tabNumber  // Pass TAB number for most reliable matching
    );

    console.log(`🔍 [Form Guide] Scratching check:`, {
      horse: runner.horseName || runner.name,
      tabNumber: runner.tabNumber,
      meetingId: meeting.meetingId,
      raceNumber: raceNum,
      totalScratchings: scratchings.length,
      matchFound: !!scratchingInfo,
      scratchingData: scratchingInfo || 'No match'
    });

    const enriched = {
      ...runner,
      tabFixedWinPrice: tabRunner?.tab_fixed_win_price || null,
      tabFixedPlacePrice: tabRunner?.tab_fixed_place_price || null,
      tabFixedWinTimestamp: tabRunner?.tab_fixed_win_timestamp || null,
      tabFixedPlaceTimestamp: tabRunner?.tab_fixed_place_timestamp || null,
      ttrRating: ttrRunner?.rating || null,
      ttrPrice: ttrRunner?.price || null,
      isScratched: !!scratchingInfo,
      scratchingReason: scratchingInfo?.reason,
      scratchingTime: scratchingInfo?.scratchingTime,
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

        {/* Track Condition */}
        {trackCondition && (
          <div className="mb-6">
            <TrackConditionBadge 
              condition={trackCondition.trackCondition}
              railPosition={trackCondition.railPosition}
              weather={trackCondition.weather}
            />
          </div>
        )}

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

        {/* Race Content with Tabs */}
        <RaceContent runners={enrichedRunners} />
      </div>
    </div>
  );
}