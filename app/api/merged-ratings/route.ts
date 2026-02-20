import { NextResponse } from 'next/server';
import { query } from '@/lib/database/client';
import { getPuntingFormClient, type PFScratchingRaw } from '@/lib/integrations/punting-form/client';
import { getTTRRatingsClient, type TTRRating } from '@/lib/integrations/ttr-ratings';
import { getPostgresAPIClient, type TabRace, type TabRunner } from '@/lib/integrations/postgres-api/client';
import { type PFMeeting } from '@/lib/integrations/punting-form/types';
import { formatInTimeZone } from 'date-fns-tz';
import { parse } from 'date-fns';
import { horseNamesMatch } from '@/lib/utils/horse-name-matcher';

export const dynamic = 'force-dynamic';

interface MergedRatingsData {
  date: string;
  track: string;
  raceNumber: number;
  raceName: string;
  saddleCloth: number | null;
  horseName: string;
  jockey: string;
  trainer: string;
  rvoRating: number | null;
  rvoPrice: number | null;
  ttrRating: number | null;
  ttrPrice: number | null;
  tabWin: number | null;
  tabPlace: number | null;
  isScratched: boolean;
  scratchingReason?: string;
  scratchingTime?: string;
  finishingPosition: number | null;
  startingPrice: number | null;
  marginToWinner: string | null;
}

interface RVORating {
  horse_name: string;
  rating: number;
  price: string | number;  // ✅ Accept both string and number
  saddle_cloth: number;
}

interface RaceResultRow {
  race_id: number;
  horse_name: string;
  finishing_position: number | null;
  starting_price: number | null;
  margin_to_winner: string | null;
  tab_number: number | null;
  race_number: number;
  track_name: string;
}

async function fetchMergedRatingsForDate(date: string): Promise<MergedRatingsData[]> {
  try {
    console.log(`📅 Starting data fetch for date: ${date}`);
    
    const pfClient = getPuntingFormClient();
    const ttrClient = getTTRRatingsClient();
    const pgClient = getPostgresAPIClient();

    // Parse the date string to a Date object
    const dateObj = parse(date, 'yyyy-MM-dd', new Date());

    // Get meetings for the specified date
    const meetingsResponse = await pfClient.getMeetingsByDate(dateObj);
    
    // Validate meetings response
    if (!meetingsResponse || !meetingsResponse.payLoad) {
      console.error('❌ Invalid meetings response:', meetingsResponse);
      return [];
    }
    
    const meetings = meetingsResponse.payLoad || [];

    // Filter to AU/NZ only
    const auNzMeetings = meetings.filter((m: PFMeeting) => 
      ['AUS', 'NZ'].includes(m.track.country)
    );

    console.log(`✅ Found ${auNzMeetings.length} AU/NZ meetings for ${date}`);
    console.log(`📋 Meeting names: ${auNzMeetings.map(m => m.track.name).join(', ')}`);

    if (auNzMeetings.length === 0) {
      console.log('⚠️ No AU/NZ meetings found for this date');
      return [];
    }

    const allData: MergedRatingsData[] = [];

    // Get scratchings once
    const scratchingsResponse = await pfClient.getScratchings();
    const scratchings = scratchingsResponse.payLoad || [];

    // Fetch all TAB races for AU and NZ upfront
    let allTabRaces: TabRace[] = [];
    if (pgClient) {
      try {
        const [tabResponseAU, tabResponseNZ] = await Promise.all([
          pgClient.getRacesByDate(date, 'AU').catch((err: Error) => {
            console.error('❌ Error fetching AU TAB races:', err.message);
            return { data: [] as TabRace[] };
          }),
          pgClient.getRacesByDate(date, 'NZ').catch((err: Error) => {
            console.error('❌ Error fetching NZ TAB races:', err.message);
            return { data: [] as TabRace[] };
          })
        ]);
        allTabRaces = [
          ...(tabResponseAU.data || []),
          ...(tabResponseNZ.data || [])
        ];
        console.log(`✅ TAB races fetched: AU=${tabResponseAU.data?.length || 0}, NZ=${tabResponseNZ.data?.length || 0}, Total=${allTabRaces.length}`);
        console.log(`📊 TAB API Response Summary:`, {
          totalRaces: allTabRaces.length,
          auRaces: tabResponseAU.data?.length || 0,
          nzRaces: tabResponseNZ.data?.length || 0,
          sampleRace: allTabRaces[0] ? {
            meeting_name: allTabRaces[0].meeting_name,
            race_number: allTabRaces[0].race_number,
            runners_count: allTabRaces[0].runners?.length || 0,
            sampleRunner: allTabRaces[0].runners?.[0] || null
          } : 'NO RACES'
        });
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        console.error('❌ Error fetching TAB races:', errorMsg);
      }
    }

    // Process each meeting
    for (const meeting of auNzMeetings) {
      const meetingId = meeting.meetingId;
      const trackName = meeting.track.name;

      if (!trackName) continue;

      console.log(`\n🏇 Processing meeting: ${trackName} (ID: ${meetingId})`);

      try {
        // Get races for this meeting
        const racesResponse = await pfClient.getAllRacesForMeeting(meetingId);
        
        // Validate races response
        if (!racesResponse || !racesResponse.payLoad?.races) {
          console.error(`❌ Invalid races response for ${trackName}:`, racesResponse);
          continue;
        }
        
        const races = racesResponse.payLoad?.races || [];
        console.log(`  ├─ Found ${races.length} races for ${trackName}`);

        // Get TTR ratings for this meeting
        let ttrRatings: TTRRating[] = [];
        try {
          if (ttrClient) {
            const ttrResponse = await ttrClient.getRatingsForMeeting(meetingId);
            ttrRatings = ttrResponse.data || [];
            console.log(`  ├─ TTR ratings available: ${ttrRatings.length}`);
          }
        } catch (err) {
          const errorMsg = err instanceof Error ? err.message : String(err);
          console.error(`❌ Error fetching TTR ratings for ${trackName}:`, {
            error: errorMsg,
            meetingId,
            trackName
          });
        }

        // Process each race
        for (const race of races) {
          const raceNumber = race.number;
          const raceName = race.name;
          const runners = race.runners || [];

          console.log(`  │  ├─ Race ${raceNumber}: ${raceName}`);
          console.log(`  │  ├─ Runners: ${runners.length}`);

          // Get RVO ratings from database
          let rvoRatings: RVORating[] = [];
          try {
            const rvoResult = await query(
              `SELECT * FROM race_cards_ratings 
               WHERE race_date = $1 AND (track = $2 OR track ILIKE $3) AND race_number = $4`,
              [date, trackName, `${trackName}%`, raceNumber]
            );
            rvoRatings = rvoResult.rows as RVORating[] || [];

console.log(`🔍 RVO Query for ${trackName} R${raceNumber}:`, {
  trackName,
  raceNumber,
  date,
  rowsFound: rvoRatings.length,
  sampleRow: rvoRatings[0] || 'NO DATA',
  allColumnKeys: rvoRatings[0] ? Object.keys(rvoRatings[0]) : []
});

console.log(`  │  ├─ RVO ratings: ${rvoRatings.length}`);
          } catch (err) {
            const errorMsg = err instanceof Error ? err.message : String(err);
            console.error(`❌ Error fetching RVO ratings for ${trackName} R${raceNumber}:`, {
              error: errorMsg,
              trackName,
              raceNumber
            });
          }

          // Find matching TAB race - exact match first, then fuzzy
          const tabRace = allTabRaces.find((tr: TabRace) => 
            tr.meeting_name?.toLowerCase() === trackName.toLowerCase() &&
            tr.race_number === raceNumber
          ) || allTabRaces.find((tr: TabRace) => 
            (tr.meeting_name?.toLowerCase().includes(trackName.toLowerCase()) ||
             trackName.toLowerCase().includes(tr.meeting_name?.toLowerCase() || '')) &&
            tr.race_number === raceNumber
          );

          if (!tabRace && allTabRaces.length > 0) {
            console.log(`⚠️ No TAB race match for ${trackName} R${raceNumber}. Available meetings:`, 
              [...new Set(allTabRaces.map(tr => tr.meeting_name))].join(', '));
          }

          // Process each runner
          for (const runner of runners) {
            const horseName = runner.horseName || runner.name;
            const tabNo = runner.tabNumber || runner.tabNo;

            if (!horseName) continue;

            // Find scratching info
            const scratching = scratchings.find((s: PFScratchingRaw) => 
              s.runnerId === String(runner.runnerId) ||
              (s.track?.toLowerCase() === trackName.toLowerCase() && 
               s.raceNo === raceNumber &&
               s.tabNo === tabNo)
            );

            // Find RVO rating (fuzzy match by horse name)
            const rvoRating = rvoRatings.find((r: RVORating) => 
              r.horse_name.toLowerCase().trim() === horseName.toLowerCase().trim() ||
              r.saddle_cloth === tabNo
            );

            // Find TTR rating (match by race number and horse name)
            const ttrRating = ttrRatings.find((t: TTRRating) => 
              t.race_number === raceNumber &&
              (t.horse_name.toLowerCase().trim() === horseName.toLowerCase().trim() ||
               t.tab_number === tabNo)
            );

            // Find TAB odds
            const tabRunner = tabRace?.runners?.find((tr: TabRunner) => 
              tr.horse_name?.toLowerCase().trim() === horseName.toLowerCase().trim() ||
              tr.runner_number === tabNo
            );

            console.log(`🐴 TAB Horse Matching for ${horseName}:`, {
              trackName,
              raceNumber,
              horseName,
              tabNo,
              foundTabRace: !!tabRace,
              tabRaceInfo: tabRace ? {
                meeting: tabRace.meeting_name,
                race: tabRace.race_number,
                runners: tabRace.runners?.length || 0
              } : 'NO RACE',
              foundTabRunner: !!tabRunner,
              tabPrices: tabRunner ? {
                win: tabRunner.tab_fixed_win_price,
                place: tabRunner.tab_fixed_place_price,
                winType: typeof tabRunner.tab_fixed_win_price,
                placeType: typeof tabRunner.tab_fixed_place_price
              } : 'NO RUNNER'
            });

            allData.push({
              date,
              track: trackName,
              raceNumber,
              raceName,
              saddleCloth: tabNo ?? null,
              horseName,
              jockey: runner.jockey?.fullName || '',
              trainer: runner.trainer?.fullName || '',
              rvoRating: rvoRating?.rating || null,
              rvoPrice: rvoRating?.price ? parseFloat(String(rvoRating.price)) : null,
              ttrRating: ttrRating?.rating || null,
              ttrPrice: ttrRating?.price || null,
              tabWin: tabRunner?.tab_fixed_win_price ? parseFloat(String(tabRunner.tab_fixed_win_price)) : null,
              tabPlace: tabRunner?.tab_fixed_place_price ? parseFloat(String(tabRunner.tab_fixed_place_price)) : null,
              isScratched: !!scratching,
              scratchingReason: scratching?.reason,
              scratchingTime: scratching?.timeStamp,
              finishingPosition: null,
              startingPrice: null,
              marginToWinner: null,
            });
          }
        }
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        console.error(`❌ Error processing meeting ${trackName}:`, {
          error: errorMsg,
          meetingId,
          trackName
        });
      }
    }

    console.log(`\n✨ Data collection complete:`);
    console.log(`   Total meetings processed: ${auNzMeetings.length}`);
    console.log(`   Total runners collected: ${allData.length}`);
    console.log(`   Meetings: ${[...new Set(allData.map(d => d.track))].join(', ')}`);
    
    // After collecting all data, fetch race results from database
    console.log(`\n🏁 Fetching race results for ${date}...`);
    try {
      const resultsQuery = `
        SELECT 
          r.race_id,
          r.horse_name,
          r.finishing_position,
          r.starting_price,
          r.margin_to_winner,
          r.tab_number,
          ra.race_number,
          m.track_name
        FROM pf_results r
        INNER JOIN pf_races ra ON r.race_id = ra.race_id
        INNER JOIN pf_meetings m ON ra.meeting_id = m.meeting_id
        WHERE m.meeting_date = $1
          AND m.country IN ('AUS', 'NZ')
      `;
      
      const resultsResult = await query(resultsQuery, [date]);
      const results: RaceResultRow[] = resultsResult.rows;
      
      console.log(`✅ Found ${results.length} race results for ${date}`);
      
      // Match results with allData using fuzzy horse name matching
      const enrichedData = allData.map(runner => {
        const matchedResult = results.find((result: RaceResultRow) =>
          result.track_name?.toLowerCase() === runner.track.toLowerCase() &&
          result.race_number === runner.raceNumber &&
          horseNamesMatch(result.horse_name, runner.horseName)
        );
        
        return {
          ...runner,
          finishingPosition: matchedResult?.finishing_position || null,
          startingPrice: matchedResult?.starting_price || null,
          marginToWinner: matchedResult?.margin_to_winner || null
        };
      });
      
      console.log(`✅ Matched ${enrichedData.filter(d => d.finishingPosition).length} runners with results`);
      
      return enrichedData;
    } catch (err) {
      console.error('❌ Error fetching race results:', err);
      // Return data without results if query fails
      return allData;
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error('❌ Fatal error fetching merged ratings:', {
      error: errorMsg,
      date
    });
    return [];
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const dateParam = searchParams.get('date');

    // Default to Sydney timezone if no date provided
    const date = dateParam || formatInTimeZone(new Date(), 'Australia/Sydney', 'yyyy-MM-dd');

    console.log(`📅 Fetching merged ratings for date: ${date}`);

    const data = await fetchMergedRatingsForDate(date);

    return NextResponse.json({
      success: true,
      date,
      count: data.length,
      data
    });
  } catch (error: unknown) {
    console.error('💥 Error in merged ratings API:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to fetch merged ratings', message },
      { status: 500 }
    );
  }
}
