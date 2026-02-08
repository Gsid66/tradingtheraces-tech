import { NextResponse } from 'next/server';
import { getPuntingFormClient, PFScratching } from '@/lib/integrations/punting-form/client';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const jurisdiction = parseInt(searchParams.get('jurisdiction') || '0');
    
    console.log(`🔍 [Scratchings API] Fetching for jurisdiction: ${jurisdiction}`);
    
    const pfClient = getPuntingFormClient();
    const scratchingsResponse = await pfClient.getScratchings(jurisdiction);
    
    console.log(`📊 [Scratchings API] Raw response:`, {
      hasPayload: !!scratchingsResponse.payLoad,
      payloadLength: scratchingsResponse.payLoad?.length || 0,
      sampleData: scratchingsResponse.payLoad?.[0] || null
    });
    
    const scratchingsData = scratchingsResponse.payLoad || [];
    
    // Transform to ensure consistent property names
    const normalizedData = scratchingsData.map((item) => {
      const itemRecord = item as unknown as Record<string, unknown>;
      const normalized = {
        meetingId: String(itemRecord.meetingId || itemRecord.MeetingId || ''),
        raceId: String(itemRecord.raceId || itemRecord.RaceId || ''),
        raceNumber: Number(itemRecord.raceNumber || itemRecord.RaceNumber || 0),
        trackName: String(itemRecord.trackName || itemRecord.TrackName || itemRecord.track || itemRecord.Track || ''),
        horseName: String(itemRecord.horseName || itemRecord.HorseName || itemRecord.name || itemRecord.Name || ''),
        tabNumber: Number(itemRecord.tabNumber || itemRecord.TabNumber || itemRecord.number || itemRecord.Number || 0),
        scratchingTime: String(itemRecord.scratchingTime || itemRecord.ScratchingTime || ''),
        reason: (itemRecord.reason || itemRecord.Reason) ? String(itemRecord.reason || itemRecord.Reason) : undefined,
      };
      
      console.log(`✅ [Scratchings API] Normalized:`, {
        track: normalized.trackName,
        horse: normalized.horseName,
        race: normalized.raceNumber,
        time: normalized.scratchingTime
      });
      
      return normalized;
    });
    
    console.log(`✅ [Scratchings API] Returning ${normalizedData.length} scratchings`);
    
    return NextResponse.json({
      success: true,
      data: normalizedData,
      meta: {
        count: normalizedData.length,
        jurisdiction,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ [Scratchings API] Error fetching scratchings:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch scratchings', 
        message: errorMessage,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}
