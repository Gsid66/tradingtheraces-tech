import MergedRatingsClient from './MergedRatingsClient';
import { query } from '@/lib/database/client';
import { getPuntingFormClient, type PFScratchingRaw } from '@/lib/integrations/punting-form/client';
import { getTTRRatingsClient, type TTRRating } from '@/lib/integrations/ttr-ratings';
import { getPostgresAPIClient, type TabRace, type TabRunner } from '@/lib/integrations/postgres-api/client';
import { type PFMeeting } from '@/lib/integrations/punting-form/types';
import { formatInTimeZone } from 'date-fns-tz';
import { parse } from 'date-fns';

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
}

interface RVORating {
  horse_name: string;
  rating: number;
  price: number;
  saddle_cloth: number;
}

async function fetchMergedRatings(date: string): Promise<MergedRatingsData[]> {
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
              `SELECT * FROM ttr_au_nz_ratings 
               WHERE race_date = $1 AND (track = $2 OR track ILIKE $3) AND race_number = $4`,
              [date, trackName, `${trackName}%`, raceNumber]
            );
            rvoRatings = rvoResult.rows as RVORating[] || [];
            console.log(`  │  ├─ RVO ratings: ${rvoRatings.length}`);
          } catch (err) {
            const errorMsg = err instanceof Error ? err.message : String(err);
            console.error(`❌ Error fetching RVO ratings for ${trackName} R${raceNumber}:`, {
              error: errorMsg,
              trackName,
              raceNumber
            });
          }

          // Find matching TAB race
          const tabRace = allTabRaces.find((tr: TabRace) => 
            tr.meeting_name?.toLowerCase().includes(trackName.toLowerCase()) &&
            tr.race_number === raceNumber
          );

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
              rvoPrice: rvoRating?.price || null,
              ttrRating: ttrRating?.rating || null,
              ttrPrice: ttrRating?.price || null,
              tabWin: tabRunner?.tab_fixed_win_price || null,
              tabPlace: tabRunner?.tab_fixed_place_price || null,
              isScratched: !!scratching,
              scratchingReason: scratching?.reason,
              scratchingTime: scratching?.timeStamp,
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
    
    return allData;
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error('❌ Fatal error fetching merged ratings:', {
      error: errorMsg,
      date
    });
    return [];
  }
}

export default async function MergedRatingsPage() {
  // Calculate Sydney date server-side
  const sydneyDate = formatInTimeZone(new Date(), 'Australia/Sydney', 'yyyy-MM-dd');
  console.log(`🚀 Server-side rendering for date: ${sydneyDate}`);
  
  const data = await fetchMergedRatings(sydneyDate);
  
  console.log(`📊 SSR Data summary:`, {
    date: sydneyDate,
    totalRunners: data.length,
    uniqueTracks: [...new Set(data.map(d => d.track))].length,
    uniqueRaces: [...new Set(data.map(d => `${d.track}-R${d.raceNumber}`))].length
  });

  return <MergedRatingsClient initialDate={sydneyDate} initialData={data} />;
}
