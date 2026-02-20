import AllResultsClient from './AllResultsClient';
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

async function fetchAvailableDates(): Promise<string[]> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://tradingtheraces.net';
    const response = await fetch(`${baseUrl}/api/merged-ratings/available-dates`, { cache: 'no-store' });
    if (!response.ok) return [];
    const result = await response.json();
    return result.dates || [];
  } catch (error) {
    console.error('Error fetching available dates:', error);
    return [];
  }
}

async function fetchMergedRatings(date: string): Promise<MergedRatingsData[]> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://tradingtheraces.net';
    const response = await fetch(`${baseUrl}/api/merged-ratings?date=${date}`, { cache: 'no-store' });
    if (!response.ok) return [];
    const result = await response.json();
    return result.data || [];
  } catch (error) {
    console.error(`Error fetching merged ratings for ${date}:`, error);
    return [];
  }
}

export default async function AllResultsPage() {
  const availableDates = await fetchAvailableDates();

  const defaultDate =
    availableDates.length > 0
      ? availableDates[0]
      : formatInTimeZone(new Date(), 'Australia/Sydney', 'yyyy-MM-dd');

  const data = await fetchMergedRatings(defaultDate);

  return (
    <AllResultsClient
      availableDates={availableDates}
      initialDate={defaultDate}
      initialData={data}
    />
  );
}
