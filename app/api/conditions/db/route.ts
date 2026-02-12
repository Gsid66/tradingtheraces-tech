import { NextResponse } from 'next/server';
import { Client } from 'pg';

export const dynamic = 'force-dynamic';

export async function GET() {
  const dbClient = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 10000,
  });

  try {
    await dbClient.connect();

    const query = `
      SELECT 
        id,
        meeting_id,
        track_name,
        track_condition,
        rail_position,
        weather,
        jurisdiction,
        updated_at,
        created_at
      FROM pf_track_conditions
      ORDER BY track_name ASC
    `;

    const result = await dbClient.query(query);

    return NextResponse.json({
      success: true,
      conditions: result.rows
    });

  } catch (error: any) {
    console.error('Error fetching conditions from database:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch conditions',
        message: error.message 
      },
      { status: 500 }
    );
  } finally {
    await dbClient.end();
  }
}
