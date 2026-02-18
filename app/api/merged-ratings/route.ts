import { NextResponse } from 'next/server';
import { query } from '@/lib/database/client';
import { getPuntingFormClient, type PFScratchingRaw } from '@/lib/integrations/punting-form/client';
import { getTTRRatingsClient, type TTRRating } from '@/lib/integrations/ttr-ratings';
import { getPostgresAPIClient, type TabRace, type TabRunner } from '@/lib/integrations/postgres-api/client';
import { type PFMeeting } from '@/lib/integrations/punting-form/types';
import { formatInTimeZone } from 'date-fns-tz';
import { parse } from 'date-fns';

interface MergedRatingsData {
  date: string;
  track: string;
  raceNumber: number;
  raceName: string;
  saddleCloth: number;
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

async function fetchMergedRatingsForDate(date: string): Promise<MergedRatingsData[]> {
  try {
    const pfClient = getPuntingFormClient();
    const ttrClient = getTTRRatingsClient();
    const pgClient = getPostgresAPIClient();

    // Parse the date string to a Date object
    const dateObj = parse(date, 'yyyy-MM-dd', new Date());

    // Get meetings for the specified date
    const meetingsResponse = await pfClient.getMeetingsByDate(dateObj);
    const meetings = meetingsResponse.payLoad || [];

    // Filter to AU/NZ only
    const auNzMeetings = meetings.filter((m: PFMeeting) => 
      ['AUS', 'NZ'].includes(m.track.country)
    );

    console.log(`Found ${auNzMeetings.length} AU/NZ meetings for ${date}`);

    if (auNzMeetings.length === 0) {
      return [];
    }

    const allData: MergedRatingsData[] = [];

    // Get scratchings once
    const scratchingsResponse = await pfClient.getScratchings();
    const scratchings = scratchingsResponse.payLoad || [];

    // Process each meeting
    for (const meeting of auNzMeetings) {
      const meetingId = meeting.meetingId;
      const trackName = meeting.track.name;
      const country = meeting.track.country;

      if (!trackName) continue;

      try {
        // Get races for this meeting
        const racesResponse = await pfClient.getAllRacesForMeeting(meetingId);
        const races = Array.isArray(racesResponse.payLoad) ? racesResponse.payLoad : [];

        // Get TTR ratings for this meeting
        let ttrRatings: TTRRating[] = [];
        try {
          if (ttrClient) {
            const ttrResponse = await ttrClient.getRatingsForMeeting(meetingId);
            ttrRatings = ttrResponse.data || [];
          }
        } catch (err) {
          console.warn(`Could not fetch TTR ratings for ${trackName}:`, err);
        }

        // Get TAB odds (try to fetch)
        let tabRaces: TabRace[] = [];
        try {
          const location = country === 'NZ' ? 'NZ' : 'AU';
          if (pgClient) {
            const tabResponse = await pgClient.getRacesByDate(date, location);
            tabRaces = tabResponse.data || [];
          }
        } catch (err) {
          console.warn(`Could not fetch TAB odds for ${trackName}:`, err);
        }

        // Process each race
        for (const race of races) {
          const raceNumber = race.number;
          const raceName = race.name;
          const runners = race.runners || [];

          // Get RVO ratings from database
          let rvoRatings: RVORating[] = [];
          try {
            const rvoResult = await query(
              `SELECT * FROM ttr_au_nz_ratings 
               WHERE race_date = $1 AND (track = $2 OR track ILIKE $3) AND race_number = $4`,
              [date, trackName, `${trackName}%`, raceNumber]
            );
            rvoRatings = rvoResult.rows as RVORating[] || [];
          } catch (err) {
            console.warn(`Could not fetch RVO ratings for ${trackName} R${raceNumber}:`, err);
          }

          // Find matching TAB race
          const tabRace = tabRaces.find((tr: TabRace) => 
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
              saddleCloth: tabNo,
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
        console.error(`Error processing meeting ${trackName}:`, err);
      }
    }

    console.log(`Collected ${allData.length} total runners across all meetings`);
    return allData;
  } catch (error) {
    console.error('Error fetching merged ratings:', error);
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
  } catch (error: any) {
    console.error('💥 Error in merged ratings API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch merged ratings', message: error.message },
      { status: 500 }
    );
  }
}
