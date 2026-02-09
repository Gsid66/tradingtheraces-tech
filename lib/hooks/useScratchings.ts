import { useEffect, useState } from 'react';

export interface Scratching {
  meetingId: string;
  raceId: string;
  raceNumber: number;
  trackName: string;
  horseName: string;
  tabNumber: number;
  scratchingTime: string;
  reason?: string;
}

export function useScratchings(jurisdiction: 0 | 1 | 2 = 0) {
  const [scratchings, setScratchings] = useState<Scratching[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchScratchings() {
      try {
        const response = await fetch(`/api/scratchings?jurisdiction=${jurisdiction}`);
        const data = await response.json();
        
        if (data.success) {
          setScratchings(data.data);
          
          // ADD THIS DEBUG LOGGING
          if (process.env.NODE_ENV === 'development') {
            console.log(`✅ [useScratchings] Fetched ${data.data.length} scratchings from API`, {
              jurisdiction,
              sample: data.data[0] || 'No data'
            });
          }
        } else {
          setError(data.error);
          if (process.env.NODE_ENV === 'development') {
            console.error('❌ [useScratchings] API returned error:', data.error);
          }
        }
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'An error occurred';
        setError(errorMessage);
        if (process.env.NODE_ENV === 'development') {
          console.error('❌ [useScratchings] Fetch failed:', errorMessage);
        }
      } finally {
        setLoading(false);
      }
    }

    fetchScratchings();
    
    // Refresh every 2 minutes
    const interval = setInterval(fetchScratchings, 120000);
    return () => clearInterval(interval);
  }, [jurisdiction]);

  return { scratchings, loading, error };
}
