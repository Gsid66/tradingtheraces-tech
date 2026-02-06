import { NextResponse } from 'next/server';
import { getPuntingFormClient } from '@/lib/integrations/punting-form/client';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const jurisdiction = parseInt(searchParams.get('jurisdiction') || '0');
    
    const pfClient = getPuntingFormClient();
    const conditionsResponse = await pfClient.getConditions(jurisdiction);
    
    return NextResponse.json({
      success: true,
      data: conditionsResponse.payLoad || []
    });
  } catch (error: any) {
    console.error('Error fetching conditions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch conditions', message: error.message },
      { status: 500 }
    );
  }
}
