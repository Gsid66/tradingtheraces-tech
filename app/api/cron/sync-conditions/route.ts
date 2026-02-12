import { NextResponse } from 'next/server';
import { Client } from 'pg';
import { getPuntingFormClient } from '@/lib/integrations/punting-form/client';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  // Verify cron secret for security
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    console.error('❌ Unauthorized cron request');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  console.log('🔄 Starting track conditions sync via cron...');
  const startTime = Date.now();

  const pfClient = getPuntingFormClient();
  const dbClient = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 10000,
  });

  try {
    await dbClient.connect();
    console.log('✅ Connected to database');

    let totalConditions = 0;
    let newConditions = 0;
    let updatedConditions = 0;
    const errors: string[] = [];

    // Fetch conditions for all jurisdictions: AU (0), NZ (1), International (2)
    for (const jurisdiction of [0, 1, 2]) {
      const jurisdictionName = jurisdiction === 0 ? 'AU' : jurisdiction === 1 ? 'NZ' : 'International';
      
      try {
        const conditionsResponse = await pfClient.getConditions(jurisdiction);
        const conditions = conditionsResponse.payLoad || [];

        console.log(`✅ Found ${conditions.length} conditions for ${jurisdictionName}`);
        totalConditions += conditions.length;

        // Process each condition
        for (const condition of conditions) {
          if (!condition.meetingId || !condition.trackName || !condition.trackCondition) {
            continue;
          }

          try {
            // Check if condition already exists for this meeting
            const existingQuery = `
              SELECT id, track_condition, rail_position, weather, updated_at 
              FROM pf_track_conditions 
              WHERE meeting_id = $1
            `;
            const existingResult = await dbClient.query(existingQuery, [condition.meetingId]);

            if (existingResult.rows.length > 0) {
              // Update existing record
              const existing = existingResult.rows[0];
              const hasChanges = 
                existing.track_condition !== condition.trackCondition ||
                existing.rail_position !== (condition.railPosition || null) ||
                existing.weather !== (condition.weather || null);

              if (hasChanges) {
                const updateQuery = `
                  UPDATE pf_track_conditions 
                  SET 
                    track_condition = $1,
                    rail_position = $2,
                    weather = $3,
                    updated_at = NOW()
                  WHERE meeting_id = $4
                `;
                await dbClient.query(updateQuery, [
                  condition.trackCondition,
                  condition.railPosition || null,
                  condition.weather || null,
                  condition.meetingId
                ]);
                updatedConditions++;
              }
            } else {
              // Insert new record
              const insertQuery = `
                INSERT INTO pf_track_conditions (
                  meeting_id,
                  track_name,
                  track_condition,
                  rail_position,
                  weather,
                  jurisdiction,
                  created_at,
                  updated_at
                ) VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
              `;
              await dbClient.query(insertQuery, [
                condition.meetingId,
                condition.trackName,
                condition.trackCondition,
                condition.railPosition || null,
                condition.weather || null,
                jurisdiction
              ]);
              newConditions++;
            }
          } catch (error: any) {
            const errorMsg = `Error processing ${condition.trackName}: ${error.message}`;
            errors.push(errorMsg);
            console.error(errorMsg);
          }
        }
      } catch (error: any) {
        const errorMsg = `Error fetching ${jurisdictionName} conditions: ${error.message}`;
        errors.push(errorMsg);
        console.error(errorMsg);
      }
    }

    const duration = Date.now() - startTime;

    const result = {
      success: true,
      timestamp: new Date().toISOString(),
      duration: `${duration}ms`,
      summary: {
        totalConditions,
        newConditions,
        updatedConditions,
        errors: errors.length
      },
      errors: errors.length > 0 ? errors : undefined
    };

    console.log('✅ Sync completed:', result);

    return NextResponse.json(result);

  } catch (error: any) {
    console.error('❌ Sync failed:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Sync failed',
        message: error.message,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  } finally {
    await dbClient.end();
  }
}
