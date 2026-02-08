import { NextResponse } from 'next/server';
import { getPuntingFormClient, PFScratching } from '@/lib/integrations/punting-form/client';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const jurisdiction = parseInt(searchParams.get('jurisdiction') || '0');
    
    const pfClient = getPuntingFormClient();
    const scratchingsResponse = await pfClient.getScratchings(jurisdiction);
    
    const scratchingsData = scratchingsResponse.payLoad || [];
    
    // Transform to ensure consistent property names
    // Handle both camelCase and PascalCase from the API
    const normalizedData = scratchingsData.map((item) => {
      const itemRecord = item as unknown as Record<string, unknown>;
      return {
        meetingId: String(itemRecord.meetingId || itemRecord.MeetingId || ''),
        raceId: String(itemRecord.raceId || itemRecord.RaceId || ''),
        raceNumber: Number(itemRecord.raceNumber || itemRecord.RaceNumber || 0),
        trackName: String(itemRecord.trackName || itemRecord.TrackName || itemRecord.track || itemRecord.Track || ''),
        horseName: String(itemRecord.horseName || itemRecord.HorseName || itemRecord.name || itemRecord.Name || ''),
        tabNumber: Number(itemRecord.tabNumber || itemRecord.TabNumber || itemRecord.number || itemRecord.Number || 0),
        scratchingTime: String(itemRecord.scratchingTime || itemRecord.ScratchingTime || ''),
        reason: (itemRecord.reason || itemRecord.Reason) ? String(itemRecord.reason || itemRecord.Reason) : undefined,
      };
    });
    
    return NextResponse.json({
      success: true,
      data: normalizedData
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ Error fetching scratchings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch scratchings', message: errorMessage },
      { status: 500 }
    );
  }
}
