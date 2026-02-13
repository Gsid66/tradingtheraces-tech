import { NextResponse } from 'next/server'
import { getPuntingFormClient } from '@/lib/integrations/punting-form/client'
import { getStateFromTrackName, convertToAEDT } from '@/lib/utils/timezone-converter'

// Helper function to extract time from datetime string AND convert to AEDT
// The Punting Form API returns times in LOCAL TRACK TIME, not AEDT
function extractTimeAndConvertToAEDT(datetime: string, trackName: string): string {
  try {
    // Parse "1/29/2026 1:15:00 PM" - this is in LOCAL TRACK TIME
    const match = datetime.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{2}):(\d{2})\s+(AM|PM)/i);
    if (!match) {
      return datetime;
    }
    
    // Extract time components (seconds are not needed for display)
    const [, month, day, year, hours, minutes, , period] = match;
    const localTime = `${hours}:${minutes} ${period.toUpperCase()}`;
    
    // Create the race date
    const raceDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    
    // Get the track's state/timezone
    const trackState = getStateFromTrackName(trackName);
    
    // Convert from local track time to AEDT with race date context
    const aedtTime = convertToAEDT(localTime, trackState, raceDate);
    
    // Debug logging
    console.log(`🕐 Time conversion: ${trackName} | Original: ${datetime} | Track State: ${trackState} | Converted AEDT: ${aedtTime}`);
    
    return aedtTime;
  } catch (error) {
    console.error('Error converting time:', error);
    return datetime;
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const dateParam = searchParams.get('date') // YYYY-MM-DD format
    const trackName = searchParams.get('track')
    
    if (!dateParam || !trackName) {
      return NextResponse.json(
        { error: 'Date and track parameters required' },
        { status: 400 }
      )
    }
    
    console.log(`🏇 Fetching form guide: ${trackName} on ${dateParam}`)
    
    // Validate date format (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/
    if (!dateRegex.test(dateParam)) {
      return NextResponse.json(
        { error: 'Invalid date format. Expected YYYY-MM-DD' },
        { status: 400 }
      )
    }
    
    const pfClient = getPuntingFormClient()
    
    // Convert YYYY-MM-DD to Date object
    const [year, month, day] = dateParam.split('-').map(Number)
    const raceDate = new Date(year, month - 1, day)
    
    // Validate the date is valid
    if (isNaN(raceDate.getTime())) {
      return NextResponse.json(
        { error: 'Invalid date value' },
        { status: 400 }
      )
    }
    
    // Get meetings for the date
    const meetingsResponse = await pfClient.getMeetingsByDate(raceDate)
    
    if (!meetingsResponse.payLoad || meetingsResponse.payLoad.length === 0) {
      console.log(`⚠️ No meetings found for ${dateParam}`)
      return NextResponse.json(
        { error: 'No meetings found for this date', races: [] },
        { status: 404 }
      )
    }
    
    // Find the matching track (case-insensitive comparison with normalized whitespace)
    const normalizeTrackName = (name: string) => 
      name.toLowerCase().replace(/\s+/g, ' ').trim()
    
    const meeting = meetingsResponse.payLoad.find(
      (m) => m.track?.name && normalizeTrackName(m.track.name) === normalizeTrackName(trackName)
    )
    
    if (!meeting) {
      console.log(`⚠️ Track "${trackName}" not found in meetings`)
      return NextResponse.json(
        { error: 'Track not found', races: [] },
        { status: 404 }
      )
    }
    
    console.log(`✅ Found meeting: ${meeting.track.name} (ID: ${meeting.meetingId})`)
    
    // Get full race details for this meeting
    const raceDetailsResponse = await pfClient.getAllRacesForMeeting(meeting.meetingId)
    
    if (!raceDetailsResponse.payLoad) {
      console.log(`⚠️ No race details found for meeting ${meeting.meetingId}`)
      return NextResponse.json(
        { error: 'No race details found', races: [] },
        { status: 404 }
      )
    }
    
    const raceFields = raceDetailsResponse.payLoad
    
    // Validate response structure
    if (!raceFields.track?.name || !Array.isArray(raceFields.races)) {
      console.log(`⚠️ Invalid race details structure for meeting ${meeting.meetingId}`)
      return NextResponse.json(
        { error: 'Invalid race details structure', races: [] },
        { status: 500 }
      )
    }
    
    // Transform to match expected format
    const races = raceFields.races.map((race) => ({
      race_number: race.number,
      race_name: race.name || '',
      race_time: race.startTime ? extractTimeAndConvertToAEDT(race.startTime, raceFields.track.name) : '',
      distance: race.distance,
      runner_count: race.runners?.length || 0,
      runners: race.runners?.map((runner) => ({
        tab_number: runner.tabNumber,
        horse_name: runner.name || runner.horseName || 'Unknown',
        barrier: runner.barrierNumber,
        jockey_name: runner.jockey?.fullName,
        trainer_name: runner.trainer?.fullName,
        weight: runner.weight,
        form: runner.lastFiveStarts,
        tab_fixed_win: runner.fixedOdds
      })) || []
    }))
    
    console.log(`✅ Returning ${races.length} races for ${trackName}`)
    
    return NextResponse.json({
      success: true,
      track: raceFields.track.name,
      track_state: raceFields.track.state,  // Include state for timezone info
      races: races
    })
    
  } catch (error: any) {
    console.error('💥 Error in /api/races/form-guide:', error)
    return NextResponse.json(
      { error: 'Failed to fetch form guide', message: error.message },
      { status: 500 }
    )
  }
}