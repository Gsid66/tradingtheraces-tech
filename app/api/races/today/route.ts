import { NextResponse } from 'next/server'
import { getPuntingFormClient } from '@/lib/integrations/punting-form/client'

export async function GET() {
  try {
    console.log('📅 Fetching today\'s meetings from Punting Form API')
    
    const pfClient = getPuntingFormClient()
    const meetingsResponse = await pfClient.getTodaysMeetings()
    
    if (!meetingsResponse.payLoad || meetingsResponse.payLoad.length === 0) {
      return NextResponse.json(
        { error: 'No races available today' },
        { status: 404 }
      )
    }
    
    const meetings = meetingsResponse.payLoad
    
    // Format meetings into track list
    const tracks = meetings.map(meeting => ({
      track_name: meeting.track.name,
      track_state: meeting.track.state,
      race_count: meeting.races || 0,
      runner_count: 0, // Not available in meetings list endpoint
      meeting_id: meeting.meetingId
    }))
    
    // Get today's date in AEDT using reliable formatting
    const today = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Australia/Sydney',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).format(new Date())
    
    console.log(`✅ Found ${tracks.length} tracks for ${today}`)
    
    return NextResponse.json({
      success: true,
      date: today,
      track_count: tracks.length,
      tracks: tracks
    })
    
  } catch (error: any) {
    console.error('💥 Error fetching today\'s meetings:', error)
    return NextResponse.json(
      { error: 'Failed to fetch races', message: error.message },
      { status: 500 }
    )
  }
}