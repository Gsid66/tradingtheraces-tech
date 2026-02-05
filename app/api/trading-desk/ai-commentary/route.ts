import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

// Rate limiting map (in production, use Redis or similar)
// Note: This is a simple in-memory implementation suitable for single-instance deployments.
// For serverless/multi-instance deployments, use Redis or a database-backed solution.
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const MAX_REQUESTS_PER_MINUTE = 10;

// Cleanup old entries periodically to prevent memory leaks
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of rateLimitMap.entries()) {
    if (now > value.resetTime) {
      rateLimitMap.delete(key);
    }
  }
}, 60000); // Clean up every minute

function checkRateLimit(ip: string): boolean {
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

export async function POST(request: NextRequest) {
  try {
    // Get client IP for rate limiting
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Maximum 10 requests per minute.' },
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
    const { raceId, horseName, rating, price, jockey, trainer } = body;

    // Validate required fields
    if (!horseName || !rating || !price) {
      return NextResponse.json(
        { error: 'Missing required fields: horseName, rating, price' },
        { status: 400 }
      );
    }

    // Calculate value score
    const valueScore = (rating / price) * 10;

    // Initialize OpenAI
    const openai = new OpenAI({
      apiKey: openaiApiKey,
    });

    // Create the prompt
    const prompt = `You are Sherlock Hooves, a professional racing analyst providing detailed horse assessments.

Analyze this horse and provide a comprehensive 5-6 sentence betting recommendation:

Horse: ${horseName}
Rating: ${rating}
Price: $${price.toFixed(2)}
Jockey: ${jockey || 'Unknown'}
Trainer: ${trainer || 'Unknown'}
Value Score: ${valueScore.toFixed(1)}

Include in your analysis:
1. Form assessment and recent performance
2. Value analysis (rating relative to price)
3. Competition level in this race
4. Jockey/trainer combination quality
5. Specific betting recommendation (Win/Place/Each-Way)
6. Confidence level and risk factors

Be professional, analytical, and specific. Provide actionable insights with data-backed reasoning.`;

    // Call OpenAI API
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are Sherlock Hooves, a professional horse racing analyst providing detailed, data-driven betting assessments.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      max_tokens: 350,
      temperature: 0.7,
    });

    const commentary = completion.choices[0]?.message?.content || 
      'Unable to generate commentary at this time.';

    return NextResponse.json({
      commentary,
      valueScore: valueScore.toFixed(1),
    });

  } catch (error) {
    console.error('Error generating AI commentary:', error);
    return NextResponse.json(
      { error: 'Failed to generate commentary' },
      { status: 500 }
    );
  }
}
