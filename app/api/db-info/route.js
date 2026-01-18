import { query } from '@/lib/db'

export async function GET() {
  try {
    // List all tables in your database
    const result = await query(`
      SELECT table_name, 
             (SELECT COUNT(*) FROM information_schema.columns 
              WHERE table_name = t.table_name) as column_count
      FROM information_schema.tables t
      WHERE table_schema = 'public'
      ORDER BY table_name
    `)
    
    return Response.json({ 
      success: true,
      database:  'Connected',
      tables: result.rows,
      table_count: result.rows.length
    })
  } catch (error) {
    return Response. json({ 
      success: false, 
      error: error. message 
    }, { status:  500 })
  }
}