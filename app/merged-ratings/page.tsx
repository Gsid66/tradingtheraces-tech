import MergedRatingsClient from './MergedRatingsClient';
import { formatInTimeZone } from 'date-fns-tz';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const runtime = 'nodejs';

interface MergedRatingsData {
  date: string;
  track: string;
  raceNumber: number;
  raceName: string;
  saddleCloth: number | null;
  horseName: string;
  jockey: string;
  trainer: string;
  rvoRating: number | null;
  rvoPrice: number | null;
  ttrRating: number | null;
  ttrPrice: number | null;
  tabWin: number | null;
  tabPlace: number | null;
  isScratched: boolean;
  scratchingReason?: string;
  scratchingTime?: string;
  finishingPosition: number | null;
  startingPrice: number | null;
  marginToWinner: string | null;
}

async function fetchMergedRatings(date: string): Promise<MergedRatingsData[]> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://tradingtheraces.net';
    const url = `${baseUrl}/api/merged-ratings?date=${date}`;
    
    console.log(`📞 Calling API: ${url}`);
    const response = await fetch(url, { cache: 'no-store' });
    
    if (!response.ok) {
      console.error(`❌ API error: ${response.status}`);
      return [];
    }
    
    const result = await response.json();
    console.log(`✅ API returned ${result.count} runners`);
    
    return result.data || [];
  } catch (error) {
    console.error('❌ Error calling API:', error);
    return [];
  }
}

export default async function MergedRatingsPage() {
  // Calculate Sydney date server-side
  const sydneyDate = formatInTimeZone(new Date(), 'Australia/Sydney', 'yyyy-MM-dd');
  console.log(`🚀 Server-side rendering for date: ${sydneyDate}`);
  
  const data = await fetchMergedRatings(sydneyDate);
  
  console.log(`📊 SSR Data summary:`, {
    date: sydneyDate,
    totalRunners: data.length,
    uniqueTracks: [...new Set(data.map(d => d.track))].length,
    uniqueRaces: [...new Set(data.map(d => `${d.track}-R${d.raceNumber}`))].length
  });

  return <MergedRatingsClient initialDate={sydneyDate} initialData={data} />;
}