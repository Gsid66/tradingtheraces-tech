import MergedRatingsTable from './MergedRatingsTable';
import { query } from '@/lib/database/client';
import { getPuntingFormClient } from '@/lib/integrations/punting-form/client';
import { getTTRRatingsClient } from '@/lib/integrations/ttr-ratings';
import { getPostgresAPIClient } from '@/lib/integrations/postgres-api/client';
import { format } from 'date-fns';

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

async function fetchMergedRatings(): Promise<MergedRatingsData[]> {
  try {
    const today = format(new Date(), 'yyyy-MM-dd');
    const pfClient = getPuntingFormClient();
    const ttrClient = getTTRRatingsClient();
    const pgClient = getPostgresAPIClient();

    // Get today's meetings
    const meetingsResponse = await pfClient.getMeetingsByDate(today);
    const meetings = meetingsResponse.payLoad || [];

    // Filter to AU/NZ only
    const auNzMeetings = meetings.filter((m: any) => 
      ['AUS', 'NZ'].includes(m.country || m.track?.country)
    );

    console.log(`Found ${auNzMeetings.length} AU/NZ meetings for ${today}`);

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
      const trackName = meeting.name || meeting.track?.name;
      const country = meeting.country || meeting.track?.country;

      if (!trackName) continue;

      try {
        // Get races for this meeting
        const racesResponse = await pfClient.getAllRacesForMeeting(meetingId);
        const races = racesResponse.payLoad || [];

        // Get TTR ratings for this meeting
        let ttrRatings: any[] = [];
        try {
          const ttrResponse = await ttrClient.getRatingsForMeeting(meetingId);
          ttrRatings = ttrResponse.data || [];
        } catch (err) {
          console.warn(`Could not fetch TTR ratings for ${trackName}:`, err);
        }

        // Get TAB odds (try to fetch)
        let tabRaces: any[] = [];
        try {
          const location = country === 'NZ' ? 'NZ' : 'AU';
          const tabResponse = await pgClient.getRacesByDate(today, location as any);
          tabRaces = tabResponse.data || [];
        } catch (err) {
          console.warn(`Could not fetch TAB odds for ${trackName}:`, err);
        }

        // Process each race
        for (const race of races) {
          const raceNumber = race.number;
          const raceName = race.name;
          const runners = race.runners || [];

          // Get RVO ratings from database
          let rvoRatings: any[] = [];
          try {
            const rvoResult = await query(
              `SELECT * FROM ttr_au_nz_ratings 
               WHERE race_date = $1 AND track ILIKE $2 AND race_number = $3`,
              [today, `%${trackName}%`, raceNumber]
            );
            rvoRatings = rvoResult.rows || [];
          } catch (err) {
            console.warn(`Could not fetch RVO ratings for ${trackName} R${raceNumber}:`, err);
          }

          // Find matching TAB race
          const tabRace = tabRaces.find((tr: any) => 
            tr.meeting_name?.toLowerCase().includes(trackName.toLowerCase()) &&
            tr.race_number === raceNumber
          );

          // Process each runner
          for (const runner of runners) {
            const horseName = runner.horseName || runner.name;
            const tabNo = runner.tabNumber || runner.tabNo;

            if (!horseName) continue;

            // Find scratching info
            const scratching = scratchings.find((s: any) => 
              s.formId === runner.formId ||
              (s.horseName?.toLowerCase() === horseName.toLowerCase() && 
               s.raceNumber === raceNumber)
            );

            // Find RVO rating (fuzzy match by horse name)
            const rvoRating = rvoRatings.find((r: any) => 
              r.horse_name.toLowerCase().trim() === horseName.toLowerCase().trim() ||
              r.saddle_cloth === tabNo
            );

            // Find TTR rating (match by race number and horse name)
            const ttrRating = ttrRatings.find((t: any) => 
              t.race_number === raceNumber &&
              (t.horse_name.toLowerCase().trim() === horseName.toLowerCase().trim() ||
               t.tab_number === tabNo)
            );

            // Find TAB odds
            const tabRunner = tabRace?.runners?.find((tr: any) => 
              tr.horse_name?.toLowerCase().trim() === horseName.toLowerCase().trim() ||
              tr.runner_number === tabNo
            );

            allData.push({
              date: today,
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
              scratchingTime: scratching?.scratchedTime,
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

export default async function MergedRatingsPage() {
  const data = await fetchMergedRatings();

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 via-purple-700 to-indigo-700 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-2">Merged Ratings - RVO + TTR Analysis</h1>
              <p className="text-purple-100 text-lg">
                Australia & New Zealand races with combined ratings
              </p>
              <p className="text-purple-200 text-sm mt-1">
                {new Date().toLocaleDateString('en-AU', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <MergedRatingsTable data={data} />
      </div>
    </div>
  );
}
