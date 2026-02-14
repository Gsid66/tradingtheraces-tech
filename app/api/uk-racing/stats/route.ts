import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/database/client';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const db = getDatabase();
    
    // Get overall stats
    const statsResult = await db.query(`
      SELECT * FROM uk_performance_stats
    `);
    
    // Get recent scraper activity
    const recentActivityResult = await db.query(`
      SELECT 
        scraper_type,
        COUNT(*) as total_runs,
        SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) as successful_runs,
        SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed_runs,
        SUM(records_imported) as total_records_imported,
        MAX(created_at) as last_run
      FROM scraper_logs
      GROUP BY scraper_type
    `);
    
    // Get top horses
    const topHorsesResult = await db.query(`
      SELECT 
        horse_name,
        total_runs,
        wins,
        win_percentage
      FROM uk_horse_performance
      WHERE total_runs >= 5
      ORDER BY win_percentage DESC, wins DESC
      LIMIT 10
    `);
    
    // Get top jockeys
    const topJockeysResult = await db.query(`
      SELECT 
        jockey_name,
        total_rides,
        wins,
        win_percentage
      FROM uk_jockey_performance
      WHERE total_rides >= 10
      ORDER BY win_percentage DESC, wins DESC
      LIMIT 10
    `);
    
    // Get top trainers
    const topTrainersResult = await db.query(`
      SELECT 
        trainer_name,
        total_runners,
        wins,
        win_percentage
      FROM uk_trainer_performance
      WHERE total_runners >= 10
      ORDER BY win_percentage DESC, wins DESC
      LIMIT 10
    `);
    
    // Get track distribution
    const trackDistResult = await db.query(`
      SELECT 
        t.name as track_name,
        t.country,
        COUNT(DISTINCT r.id) as total_races,
        COUNT(DISTINCT res.id) as total_results
      FROM uk_tracks t
      LEFT JOIN uk_races r ON t.id = r.track_id
      LEFT JOIN uk_results res ON r.id = res.race_id
      GROUP BY t.id, t.name, t.country
      ORDER BY total_races DESC
      LIMIT 20
    `);
    
    return NextResponse.json({
      success: true,
      stats: {
        overall: statsResult.rows[0] || {
          total_races: 0,
          total_horses: 0,
          total_jockeys: 0,
          total_trainers: 0,
          total_tracks: 0,
          earliest_race: null,
          latest_race: null,
        },
        scraper_activity: recentActivityResult.rows,
        top_horses: topHorsesResult.rows,
        top_jockeys: topJockeysResult.rows,
        top_trainers: topTrainersResult.rows,
        track_distribution: trackDistResult.rows,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error fetching stats:', error);
    
    return NextResponse.json(
      {
        success: false,
        message: `Failed to fetch stats: ${message}`,
        stats: null,
      },
      { status: 500 }
    );
  }
}
