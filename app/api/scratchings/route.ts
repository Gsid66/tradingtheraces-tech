import { NextResponse } from 'next/server';
import { getPuntingFormClient, PFScratching } from '@/lib/integrations/punting-form/client';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const jurisdiction = parseInt(searchParams.get('jurisdiction') || '0');
    
    const pfClient = getPuntingFormClient();
    const scratchingsResponse = await pfClient.getScratchings(jurisdiction);
    
    // 🔍 DEBUG: Log actual response structure
    console.log('📊 Scratchings API Response:', JSON.stringify(scratchingsResponse, null, 2));
    
    const scratchingsData = scratchingsResponse.payLoad || [];
    
    // 🔍 DEBUG: Log first scratching to see actual property names
    if (scratchingsData.length > 0) {
      console.log('📋 First scratching object:', JSON.stringify(scratchingsData[0], null, 2));
      console.log('📋 Property names:', Object.keys(scratchingsData[0]));
    }
    
    // Transform to ensure consistent property names
    // Handle both camelCase and PascalCase from the API
    const normalizedData = scratchingsData.map((item: PFScratching | Record<string, unknown>) => {
      const itemRecord = item as Record<string, unknown>;
      return {
        meetingId: String(itemRecord.meetingId || itemRecord.MeetingId || ''),
        raceId: String(itemRecord.raceId || itemRecord.RaceId || ''),
        raceNumber: Number(itemRecord.raceNumber || itemRecord.RaceNumber || 0),
        trackName: String(itemRecord.trackName || itemRecord.TrackName || itemRecord.track || itemRecord.Track || ''),
        horseName: String(itemRecord.horseName || itemRecord.HorseName || itemRecord.name || itemRecord.Name || ''),
        tabNumber: Number(itemRecord.tabNumber || itemRecord.TabNumber || itemRecord.number || itemRecord.Number || 0),
        scratchingTime: String(itemRecord.scratchingTime || itemRecord.ScratchingTime || ''),
        reason: itemRecord.reason ? String(itemRecord.reason) : (itemRecord.Reason ? String(itemRecord.Reason) : undefined),
      };
    });
    
    console.log('📋 Normalized first scratching:', normalizedData[0]);
    
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
