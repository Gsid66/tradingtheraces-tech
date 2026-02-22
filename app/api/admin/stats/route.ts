import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/database/client';

export const dynamic = 'force-dynamic';

interface TableStats {
  tableName: string;
  displayName: string;
  recordCount: number;
  lastUpload?: string;
}

export async function GET() {
  try {
    // TODO: Add authentication middleware to ensure only admins can access this endpoint
    
    const db = getDatabase();
    
    // Define tables to query
    const tables = [
      { name: 'race_cards_ratings', display: 'TTR AU/NZ Ratings' },
      { name: 'ttr_uk_ire_ratings', display: 'TTR UK/Ireland Ratings' },
      { name: 'bf_results_au', display: 'Betfair Results - AU' },
    ];
    
    const stats: TableStats[] = [];
    
    for (const table of tables) {
      try {
        // Get record count
        const countResult = await db.query(
          `SELECT COUNT(*) as count FROM ${table.name}`
        );
        
        const recordCount = parseInt(countResult.rows[0]?.count || '0', 10);
        
        // Try to get the most recent upload date
        // Try updated_at first, then created_at
        let lastUpload: string | undefined;
        try {
          const dateResult = await db.query(
            `SELECT GREATEST(MAX(updated_at), MAX(created_at)) as last_upload FROM ${table.name}`
          );
          lastUpload = dateResult.rows[0]?.last_upload || undefined;
        } catch (err) {
          // If neither column exists, ignore
          console.log(`No created_at/updated_at column for ${table.name}`);
        }
        
        stats.push({
          tableName: table.name,
          displayName: table.display,
          recordCount,
          lastUpload,
        });
      } catch (error) {
        console.error(`Error querying ${table.name}:`, error);
        // Add entry with 0 count if table doesn't exist or query fails
        stats.push({
          tableName: table.name,
          displayName: table.display,
          recordCount: 0,
        });
      }
    }
    
    return NextResponse.json({
      success: true,
      stats,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error fetching admin stats:', error);
    
    return NextResponse.json(
      {
        success: false,
        message: `Failed to fetch statistics: ${message}`,
        stats: [],
      },
      { status: 500 }
    );
  }
}
