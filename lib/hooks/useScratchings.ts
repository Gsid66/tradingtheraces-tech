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
        } else {
          setError(data.error);
        }
      } catch (err: any) {
        setError(err.message);
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
