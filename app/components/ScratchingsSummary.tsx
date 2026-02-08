'use client'

import { useScratchingsContext } from '@/app/providers/ScratchingsProvider';

export function ScratchingsSummary() {
  const { scratchings, loading, error } = useScratchingsContext();

  if (loading) return null;
  if (error) {
    console.error('Error loading scratchings:', error);
    return null;
  }
  if (scratchings.length === 0) return null;

  // Group scratchings by track
  const scratchingsByTrack = scratchings.reduce((acc, s) => {
    if (!acc[s.trackName]) {
      acc[s.trackName] = [];
    }
    acc[s.trackName].push(s);
    return acc;
  }, {} as Record<string, typeof scratchings>);

  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-2xl">⚠️</span>
        <h3 className="text-red-900 font-semibold text-lg">
          {scratchings.length} Scratching{scratchings.length > 1 ? 's' : ''} Today
        </h3>
      </div>
      
      <div className="space-y-2">
        {Object.entries(scratchingsByTrack).slice(0, 5).map(([track, trackScratchings]) => (
          <div key={track} className="text-sm">
            <span className="font-semibold text-red-900">{track}:</span>
            <div className="ml-4 mt-1 space-y-1">
              {trackScratchings.map((s, i) => (
                <div key={i} className="text-red-800">
                  • R{s.raceNumber} - {s.horseName} (#{s.tabNumber})
                  {s.reason && <span className="text-red-600 ml-1">- {s.reason}</span>}
                </div>
              ))}
            </div>
          </div>
        ))}
        
        {Object.keys(scratchingsByTrack).length > 5 && (
          <div className="text-red-700 font-medium text-sm mt-2">
            + {Object.keys(scratchingsByTrack).length - 5} more tracks with scratchings
          </div>
        )}
      </div>
    </div>
  );
}
