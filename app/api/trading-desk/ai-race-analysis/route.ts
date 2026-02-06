import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { calculateValueScore } from '@/lib/trading-desk/valueCalculator';
import { getPuntingFormClient } from '@/lib/integrations/punting-form/client';
import { getTTRRatingsClient } from '@/lib/integrations/ttr-ratings/pfai-client';
import { horseNamesMatch } from '@/lib/utils/horse-name-matcher';

// Rate limiting map
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const MAX_REQUESTS_PER_MINUTE = 5; // Lower limit for comprehensive analysis

function cleanupRateLimitMap() {
  const now = Date.now();
  for (const [key, value] of rateLimitMap.entries()) {
    if (now > value.resetTime) {
      rateLimitMap.delete(key);
    }
  }
}

function checkRateLimit(ip: string): boolean {
  // Cleanup expired entries during rate limit check
  cleanupRateLimitMap();
  
  const now = Date.now();
  const userLimit = rateLimitMap.get(ip);

  if (!userLimit || now > userLimit.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + 60000 });
    return true;
  }

  if (userLimit.count >= MAX_REQUESTS_PER_MINUTE) {
    return false;
  }

  userLimit.count++;
  return true;
}

interface RaceData {
  track_name: string;
  state: string | null;
  race_number: number;
  horse_name: string;
  rating: number;
  price: number;
  jockey: string | null;
  trainer: string | null;
  valueScore: number;
  // New fields from Punting Form
  barrier?: number;
  weight?: number;
  age?: number;
  sex?: string;
  last_starts?: string;
}

async function getMeetingData(date: string): Promise<RaceData[]> {
  try {
    const pfClient = getPuntingFormClient();
    const ttrClient = getTTRRatingsClient();

    if (!pfClient || !ttrClient) {
      console.error('❌ API clients not available');
      throw new Error('API clients not configured');
    }

    console.log(`🔍 Fetching meeting data for ${date}`);

    // Get meetings for this date
    const meetingsResponse = await pfClient.getTodaysMeetings();
    const allMeetings = meetingsResponse.payLoad || [];
    
    // Filter meetings for the specific date (avoid timezone issues)
    const meetings = allMeetings.filter(m => {
      const meetingDate = m.meetingDate.split('T')[0];
      return meetingDate === date;
    });

    if (meetings.length === 0) {
      console.warn(`⚠️ No meetings found for ${date}`);
      return [];
    }

    console.log(`📊 Found ${meetings.length} meetings for ${date}`);

    // Fetch ratings and runner details for all meetings
    const allRatingsData: RaceData[] = [];

    for (const meeting of meetings) {
      console.log(`🔍 Fetching data for ${meeting.track.name}...`);
      
      // Get TTR ratings
      const ttrResponse = await ttrClient.getRatingsForMeeting(meeting.meetingId);
      
      if (!ttrResponse.success || !ttrResponse.data || ttrResponse.data.length === 0) {
        console.warn(`⚠️ No ratings found for ${meeting.track.name}`);
        continue;
      }

      // Get race details with runners from Punting Form
      try {
        const raceDetailsResponse = await pfClient.getAllRacesForMeeting(meeting.meetingId);
        const races = raceDetailsResponse.payLoad?.races || [];

        // Merge TTR ratings with Punting Form runner details
        for (const rating of ttrResponse.data) {
          const race = races.find(r => r.number === rating.race_number);
          
          if (race && race.runners) {
            const runner = race.runners.find(r => 
              horseNamesMatch(r.horseName, rating.horse_name)
            );

            allRatingsData.push({
              track_name: meeting.track.name,
              state: meeting.track.state || null,
              race_number: rating.race_number,
              horse_name: rating.horse_name,
              rating: rating.rating,
              price: rating.price,
              jockey: runner?.jockey?.fullName || null,
              trainer: runner?.trainer?.fullName || null,
              valueScore: calculateValueScore(rating.rating, rating.price),
              // Additional Punting Form data
              barrier: runner?.barrierNumber,
              weight: runner?.weight,
              // Note: age and sex not currently available in PFRunner type
              last_starts: runner?.lastFiveStarts ?? undefined
            });
          } else {
            // Fallback if runner details not found
            allRatingsData.push({
              track_name: meeting.track.name,
              state: meeting.track.state || null,
              race_number: rating.race_number,
              horse_name: rating.horse_name,
              rating: rating.rating,
              price: rating.price,
              jockey: null,
              trainer: null,
              valueScore: calculateValueScore(rating.rating, rating.price)
            });
          }
        }
      } catch (error) {
        console.warn(`⚠️ Error fetching race details for ${meeting.track.name}:`, error);
        
        // Fallback to ratings only
        for (const rating of ttrResponse.data) {
          allRatingsData.push({
            track_name: meeting.track.name,
            state: meeting.track.state || null,
            race_number: rating.race_number,
            horse_name: rating.horse_name,
            rating: rating.rating,
            price: rating.price,
            jockey: null,
            trainer: null,
            valueScore: calculateValueScore(rating.rating, rating.price)
          });
        }
      }
    }

    console.log(`✅ Total ratings fetched: ${allRatingsData.length}`);
    return allRatingsData;

  } catch (error) {
    console.error('❌ Error fetching meeting data:', error);
    throw error;
  }
}

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Maximum 5 requests per minute for meeting analysis.' },
        { status: 429 }
      );
    }

    const openaiApiKey = process.env.OPENAI_API_KEY;
    
    if (!openaiApiKey) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { date } = body;

    if (!date) {
      return NextResponse.json(
        { error: 'Missing required field: date' },
        { status: 400 }
      );
    }

    // Fetch meeting data
    const meetingData = await getMeetingData(date);

    if (meetingData.length === 0) {
      return NextResponse.json(
        { error: 'No race data available for this date' },
        { status: 404 }
      );
    }

    // Calculate meeting statistics
    const tracks = new Set(meetingData.map(d => d.track_name));
    const races = new Set(meetingData.map(d => `${d.track_name}-${d.race_number}`));
    const valueHorses = meetingData.filter(d => d.valueScore > 25);
    
    // Get top 10 value plays
    const topValuePlays = [...meetingData]
      .sort((a, b) => b.valueScore - a.valueScore)
      .slice(0, 10);

    // Group by track and race for race-by-race insights
    const raceGroups = new Map<string, RaceData[]>();
    meetingData.forEach(horse => {
      const key = `${horse.track_name}-R${horse.race_number}`;
      if (!raceGroups.has(key)) {
        raceGroups.set(key, []);
      }
      raceGroups.get(key)!.push(horse);
    });

    // Get top 5 races with most value
    const topRaces = Array.from(raceGroups.entries())
      .map(([key, horses]) => ({
        key,
        horses,
        valueCount: horses.filter(h => h.valueScore > 25).length,
        topHorse: horses[0]
      }))
      .sort((a, b) => b.valueCount - a.valueCount)
      .slice(0, 5);

    // Build comprehensive race-by-race prompt
    const prompt = `You are Sherlock Hooves, a professional horse racing analyst.

Analyze the ${date} race meeting and provide RACE-BY-RACE detailed analysis.

MEETING OVERVIEW:
- Total Tracks: ${tracks.size}
- Total Races: ${raceGroups.size}
- Total Horses: ${meetingData.length}
- Value Opportunities (Score > 25): ${valueHorses.length}

RACE-BY-RACE DATA:
${Array.from(raceGroups.entries()).map(([raceKey, horses]) => {
  const topHorse = horses[0];
  return `
${raceKey} (${topHorse.track_name}${topHorse.state ? `, ${topHorse.state}` : ''})
- Runners: ${horses.length}
- Top Selection: ${topHorse.horse_name} (Rating: ${topHorse.rating.toFixed(1)}, Price: $${topHorse.price.toFixed(2)}, Value: ${topHorse.valueScore.toFixed(1)})
- Value Plays: ${horses.filter(h => h.valueScore > 25).length}
${horses.slice(0, 5).map(h => {
  let details = `  • ${h.horse_name}: Rating ${h.rating.toFixed(1)}, $${h.price.toFixed(2)}`;
  if (h.barrier) details += `, Barrier ${h.barrier}`;
  if (h.jockey) details += `, ${h.jockey}`;
  if (h.weight) details += `, ${h.weight}kg`;
  if (h.last_starts) details += `, Form: ${h.last_starts}`;
  return details;
}).join('\n')}
`;
}).join('\n')}

TOP 10 VALUE PLAYS:
${topValuePlays.map((h, i) => {
  let line = `${i + 1}. ${h.track_name} R${h.race_number} - ${h.horse_name}
   - Rating: ${h.rating.toFixed(1)} | Price: $${h.price.toFixed(2)} | Value Score: ${h.valueScore.toFixed(1)}`;
  if (h.jockey) line += `\n   - Jockey: ${h.jockey}`;
  if (h.trainer) line += `\n   - Trainer: ${h.trainer}`;
  if (h.barrier) line += `\n   - Barrier: ${h.barrier}`;
  if (h.weight) line += `\n   - Weight: ${h.weight}kg`;
  if (h.last_starts) line += `\n   - Form: ${h.last_starts}`;
  return line;
}).join('\n\n')}

REQUIRED ANALYSIS STRUCTURE:

For EACH race (or at least the top 10-15 races with most value/significance), provide:

**[TRACK NAME] - RACE [NUMBER]**

1. RACE ANALYSIS (2-3 sentences)
   - Race dynamics and key factors
   - Track conditions considerations if relevant
   
2. TOP SELECTIONS
   - **WIN:** Horse name, barrier, rating, price, brief reason (1-2 sentences)
   - **PLACE:** 1-2 horses with brief reasoning
   - **VALUE PLAY:** If value score > 25, highlight with reasoning

3. BETTING STRATEGY
   - Recommended bet types (win/place/exotic)
   - Confidence level (High/Medium/Low)

After covering all races:

**MEETING SUMMARY**
- Best bets of the day (top 3-5 races)
- Multi-bet opportunities if applicable
- Overall bankroll allocation strategy

TONE: Professional, analytical, specific. Use data points from the race information provided. Be detailed and actionable.`;

    // Initialize OpenAI
    const openai = new OpenAI({
      apiKey: openaiApiKey,
    });

    // Call OpenAI API - increased max_tokens for race-by-race analysis
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are Sherlock Hooves, a professional horse racing analyst providing comprehensive, data-driven race-by-race analysis with detailed selections for each race.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      max_tokens: 4000,
      temperature: 0.7,
    });

    const analysis = completion.choices[0]?.message?.content || 
      'Unable to generate analysis at this time.';

    return NextResponse.json({
      analysis,
      meetingDate: date,
      trackCount: tracks.size,
      raceCount: races.size,
      valueHorseCount: valueHorses.length,
    });

  } catch (error) {
    console.error('Error generating AI meeting analysis:', error);
    return NextResponse.json(
      { error: 'Failed to generate analysis' },
      { status: 500 }
    );
  }
}
