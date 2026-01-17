import { query } from '@/lib/db'

export async function GET() {
  try {
    const result = await query('SELECT NOW() as current_time')
    return Response. json({ 
      success: true, 
      time: result.rows[0].current_time,
      message: 'Database connected!' 
    })
  } catch (error) {
    return Response. json({ 
      success: false, 
      error: error. message 
    }, { status:  500 })
  }
}