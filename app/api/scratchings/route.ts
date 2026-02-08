import { NextResponse } from 'next/server';
import { getPuntingFormClient } from '@/lib/integrations/punting-form/client';

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
    
    return NextResponse.json({
      success: true,
      data: scratchingsData
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
