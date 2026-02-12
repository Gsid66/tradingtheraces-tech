import { config } from 'dotenv';
import { Client } from 'pg';
import { getPuntingFormClient, PFCondition } from '../lib/integrations/punting-form/client';

config({ path: '.env.local' });

async function syncConditions() {
  console.log('🔄 Starting track conditions sync...\n');

  const pfClient = getPuntingFormClient();
  const dbClient = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 10000,
  });

  try {
    await dbClient.connect();
    console.log('✅ Connected to database\n');

    let totalConditions = 0;
    let newConditions = 0;
    let updatedConditions = 0;

    // Fetch conditions for all jurisdictions: AU (0), NZ (1), International (2)
    for (const jurisdiction of [0, 1, 2]) {
      const jurisdictionName = jurisdiction === 0 ? 'AU' : jurisdiction === 1 ? 'NZ' : 'International';
      console.log(`📋 Fetching ${jurisdictionName} track conditions...`);

      try {
        const conditionsResponse = await pfClient.getConditions(jurisdiction);
        const conditions = conditionsResponse.payLoad || [];

        console.log(`✅ Found ${conditions.length} track conditions for ${jurisdictionName}`);
        totalConditions += conditions.length;

        // Process each condition
        for (const condition of conditions) {
          if (!condition.meetingId || !condition.trackName || !condition.trackCondition) {
            console.log(`⚠️  Skipping incomplete condition: ${JSON.stringify(condition)}`);
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
                console.log(`🔄 Updated: ${condition.trackName} - ${condition.trackCondition}`);
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
              console.log(`✨ Created: ${condition.trackName} - ${condition.trackCondition}`);
            }
          } catch (error) {
            console.error(`❌ Error processing condition for ${condition.trackName}:`, error);
          }
        }
      } catch (error) {
        console.error(`❌ Error fetching ${jurisdictionName} conditions:`, error);
      }
    }

    console.log('\n📊 Sync Summary:');
    console.log(`   Total conditions fetched: ${totalConditions}`);
    console.log(`   New conditions created: ${newConditions}`);
    console.log(`   Conditions updated: ${updatedConditions}`);
    console.log(`\n✅ Sync completed successfully at ${new Date().toISOString()}`);

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ Sync failed:', errorMessage);
    throw error;
  } finally {
    await dbClient.end();
    console.log('\n🔌 Database connection closed');
  }
}

syncConditions().catch(console.error);
