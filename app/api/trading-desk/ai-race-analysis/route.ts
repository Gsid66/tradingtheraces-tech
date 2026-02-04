import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { Client } from 'pg';
import { calculateValueScore } from '@/lib/trading-desk/valueCalculator';

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
  jockey: string;
  trainer: string;
  valueScore: number;
}

async function getMeetingData(date: string): Promise<RaceData[]> {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();

    const query = `
      SELECT 
        rcr.track as track_name,
        m.state,
        rcr.race_number,
        rcr.horse_name,
        rcr.rating,
        rcr.price,
        rcr.jockey,
        rcr.trainer
      FROM race_cards_ratings rcr
      LEFT JOIN pf_meetings m ON rcr.race_date = m.meeting_date
        AND LOWER(TRIM(rcr.track)) = LOWER(TRIM(m.track_name))
      WHERE rcr.race_date = $1
        AND rcr.rating IS NOT NULL
        AND rcr.price IS NOT NULL
      ORDER BY rcr.track, rcr.race_number, rcr.rating DESC
    `;

    const result = await client.query(query, [date]);
    
    // Calculate value scores
    return result.rows.map(row => ({
      ...row,
      rating: Number(row.rating),
      price: Number(row.price),
      valueScore: calculateValueScore(Number(row.rating), Number(row.price))
    }));
  } catch (error) {
    console.error('Error fetching meeting data:', error);
    throw error;
  } finally {
    await client.end();
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

    // Build comprehensive prompt
    const prompt = `You are Sherlock Hooves, an expert horse racing analyst. Generate a comprehensive meeting-level analysis for ${date}.

MEETING OVERVIEW:
- Total Tracks: ${tracks.size}
- Total Races: ${races.size}
- Total Horses: ${meetingData.length}
- Value Opportunities (Score > 25): ${valueHorses.length}

TOP 10 VALUE PLAYS:
${topValuePlays.map((h, i) => `${i + 1}. ${h.horse_name} (${h.track_name} R${h.race_number}) - Rating: ${h.rating.toFixed(1)}, Price: $${h.price.toFixed(2)}, Value: ${h.valueScore.toFixed(1)}`).join('\n')}

TOP 5 RACES BY VALUE:
${topRaces.map((r, i) => `${i + 1}. ${r.key} - ${r.valueCount} value horses, Top: ${r.topHorse.horse_name} (${r.topHorse.valueScore.toFixed(1)})`).join('\n')}

Generate a comprehensive analysis with the following sections:

1. MEETING OVERVIEW (2-3 sentences)
   - Overall quality and value assessment
   - Key themes or patterns across the meeting

2. TOP VALUE PLAYS (3-4 sentences)
   - Highlight the standout horses with best value
   - Mention specific horses, tracks, and why they stand out
   - Include rating and price context

3. RACE-BY-RACE INSIGHTS (4-5 sentences)
   - Focus on the races with most value opportunities
   - Mention specific race numbers and tracks
   - Strategic recommendations

4. BETTING STRATEGY (2-3 sentences)
   - Overall approach for the day
   - Risk management considerations
   - Final recommendations

Keep your tone witty and British. Be specific with horse names, tracks, and numbers. Make it actionable and insightful.`;

    // Initialize OpenAI
    const openai = new OpenAI({
      apiKey: openaiApiKey,
    });

    // Call OpenAI API
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are Sherlock Hooves, a witty British horse racing expert providing comprehensive meeting-level analysis.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      max_tokens: 1500,
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
