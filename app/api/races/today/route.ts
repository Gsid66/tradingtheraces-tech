import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const apiUrl = process.env.RACING_DATA_API_URL
    
    console.log('🔍 Racing API URL:', apiUrl)
    
    if (!apiUrl) {
      return NextResponse.json(
        { error: 'RACING_DATA_API_URL not configured in . env.local' },
        { status:  500 }
      )
    }
    
    // Get today's date in AEDT (Australia/Sydney timezone)
    const today = new Date().toLocaleString('en-AU', {
      timeZone: 'Australia/Sydney',
      year:  'numeric',
      month:  '2-digit',
      day: '2-digit'
    }).split('/').reverse().join('-') // Convert DD/MM/YYYY to YYYY-MM-DD
    
    console.log('📅 Fetching races for date (AEDT):', today)
    
    // Fetch available dates from the API
    const datesResponse = await fetch(`${apiUrl}/api/dates`, {
      cache: 'no-store' // Always get fresh data
    })
    
    if (!datesResponse.ok) {
      console.error('❌ Failed to fetch dates.  Status:', datesResponse.status)
      return NextResponse.json(
        { error: 'Failed to fetch from racing API', status: datesResponse.status },
        { status: 500 }
      )
    }
    
    const dates = await datesResponse.json()
    console.log('✅ Received dates:', JSON.stringify(dates, null, 2))
    
    // Find today's date in the response
    const todayData = dates.find((d: any) => d.date === today) || dates[0]
    
    if (!todayData) {
      return NextResponse.json({ 
        error: 'No races available',
        date: today,
        availableDates: dates. map((d: any) => d.date)
      }, { status: 404 })
    }
    
    console.log('🏇 Returning today\'s races:', todayData)
    
    return NextResponse. json({
      success: true,
      date: todayData. date,
      track_count:  todayData.track_count,
      tracks: todayData. tracks
    })
    
  } catch (error:  any) {
    console.error('💥 Error in /api/races/today:', error)
    return NextResponse.json(
      { error: 'Failed to fetch races', message: error.message },
      { status: 500 }
    )
  }
}