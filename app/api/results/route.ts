import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/database/client';

// Type definitions
interface RunnerResult {
  resultId: number;
  horseName: string;
  finishingPosition: number;
  position: number;
  tabNumber: number;
  barrierNumber: number;
  finishingTime: number | null;
  marginToWinner: number | null;
  margin: number | null;
  marginToNext: number | null;
  jockeyName: string;
  jockey: string;
  trainerName: string;
  trainer: string;
  startingPrice: number | null;
  price: number | null;
  prizeMoneyWon: number | null;
  prizeMoney: number | null;
}

interface RaceResult {
  raceId: string;
  number: number;
  name: string;
  raceClass: string | null;
  distance: number;
  startTime: Date;
  runners: RunnerResult[];
}

interface MeetingResult {
  meetingId: string;
  track: {
    name: string;
    state: string;
    country: string;
  };
  railPosition: string | null;
  expectedCondition: string | null;
  raceResults: RaceResult[];
}

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

// Validate date format YYYY-MM-DD
function isValidDate(dateStr: string): boolean {
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(dateStr)) return false;
  
  const date = new Date(dateStr);
  return !isNaN(date.getTime());
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const dateParam = searchParams.get('date');
  
  // Determine target date (default to yesterday in AEDT)
  let targetDate: string;
  if (dateParam) {
    if (!isValidDate(dateParam)) {
      return NextResponse.json(
        { success: false, error: 'Invalid date format. Use YYYY-MM-DD' },
        { status: 400 }
      );
    }
    targetDate = dateParam;
  } else {
    // Get yesterday's date in AEDT timezone
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    targetDate = formatDate(yesterday);
  }

  try {
    console.log(`📅 Fetching results for ${targetDate} from database`);

    // Query to get results with meeting and race details
    // Filter for AUS/NZ countries only
    const queryText = `
      SELECT 
        m.meeting_id,
        m.track_name,
        m.state,
        m.country,
        m.meeting_date,
        m.rail_position,
        m.expected_condition,
        r.race_id,
        r.race_number,
        r.race_name,
        r.race_class,
        r.distance,
        r.start_time,
        res.id as result_id,
        res.horse_name,
        res.finishing_position,
        res.tab_number,
        res.barrier_number,
        res.finishing_time,
        res.margin_to_winner,
        res.margin_to_next,
        res.jockey_name,
        res.trainer_name,
        res.starting_price,
        res.prize_money_won
      FROM pf_results res
      JOIN pf_races r ON res.race_id = r.race_id
      JOIN pf_meetings m ON r.meeting_id = m.meeting_id
      WHERE m.meeting_date = $1
        AND m.country IN ('AUS', 'NZ')
        AND res.finishing_position > 0
        AND res.finishing_position <= 3
      ORDER BY m.track_name, r.race_number, res.finishing_position
    `;

    const result = await query(queryText, [targetDate]);

    if (result.rows.length === 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'No results found for this date',
          date: targetDate
        },
        { status: 404 }
      );
    }

    // Group results by meeting and race
    const meetingsMap = new Map<string, MeetingResult>();

    for (const row of result.rows) {
      const meetingId = row.meeting_id;
      
      if (!meetingsMap.has(meetingId)) {
        meetingsMap.set(meetingId, {
          meetingId: meetingId,
          track: {
            name: row.track_name,
            state: row.state,
            country: row.country,
          },
          railPosition: row.rail_position,
          expectedCondition: row.expected_condition,
          raceResults: []
        });
      }

      const meeting = meetingsMap.get(meetingId)!;
      
      // Find or create race in this meeting
      let race = meeting.raceResults.find((r: RaceResult) => r.raceId === row.race_id);
      if (!race) {
        race = {
          raceId: row.race_id,
          number: row.race_number,
          name: row.race_name,
          raceClass: row.race_class,
          distance: row.distance,
          startTime: row.start_time,
          runners: []
        };
        meeting.raceResults.push(race);
      }

      // Add runner result to race
      race.runners.push({
        resultId: row.result_id,
        horseName: row.horse_name,
        finishingPosition: row.finishing_position,
        position: row.finishing_position, // Alias for compatibility
        tabNumber: row.tab_number,
        barrierNumber: row.barrier_number,
        finishingTime: row.finishing_time,
        marginToWinner: row.margin_to_winner,
        margin: row.margin_to_winner, // Alias for compatibility
        marginToNext: row.margin_to_next,
        jockeyName: row.jockey_name,
        jockey: row.jockey_name, // Alias for compatibility
        trainerName: row.trainer_name,
        trainer: row.trainer_name, // Alias for compatibility
        startingPrice: row.starting_price,
        price: row.starting_price, // Alias for compatibility
        prizeMoneyWon: row.prize_money_won,
        prizeMoney: row.prize_money_won // Alias for compatibility
      });
    }

    const meetings = Array.from(meetingsMap.values());

    console.log(`✅ Found ${meetings.length} meetings with results for ${targetDate}`);

    return NextResponse.json({
      success: true,
      date: targetDate,
      meetings: meetings
    });

  } catch (error) {
    console.error('💥 Error fetching results from database:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Database error'
      },
      { status: 500 }
    );
  }
}
