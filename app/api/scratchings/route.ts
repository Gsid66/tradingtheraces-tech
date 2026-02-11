import { NextResponse } from 'next/server';
import { getScratchingsFromDB } from '@/lib/data/scratchings';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const jurisdiction = parseInt(searchParams.get('jurisdiction') || '0');
    const hoursAgo = parseInt(searchParams.get('hoursAgo') || '48');
    
    const result = await getScratchingsFromDB(jurisdiction, hoursAgo);
    
    if (result.success) {
      return NextResponse.json(result);
    } else {
      return NextResponse.json(result, { status: 500 });
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ [Scratchings API] Unexpected error:', error);
    return NextResponse.json(
      {
        success: false,
        data: [],
        error: 'Internal server error',
        message: errorMessage
      },
      { status: 500 }
    );
  }
}
