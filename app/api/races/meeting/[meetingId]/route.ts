import { NextResponse } from 'next/server';
import { getPuntingFormClient } from '@/lib/integrations/punting-form/client';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ meetingId: string }> }
) {
  try {
    const { meetingId } = await params;
    const pfClient = getPuntingFormClient();
    const fieldsResponse = await pfClient.getAllRacesForMeeting(meetingId);
    
    return NextResponse.json({
      races: fieldsResponse.payLoad?.races || [],
      track: fieldsResponse.payLoad?.track,
      meetingId: meetingId
    });
  } catch (error: any) {
    console.error('Failed to fetch races:', error);
    return NextResponse.json(
      { error: 'Failed to fetch races', message: error.message },
      { status: 500 }
    );
  }
}
