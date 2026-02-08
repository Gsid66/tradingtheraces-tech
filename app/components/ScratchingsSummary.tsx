'use client'

import { useScratchingsContext } from '@/app/providers/ScratchingsProvider';
import { Scratching } from '@/lib/hooks/useScratchings';

export function ScratchingsSummary() {
  const { scratchings, loading, error } = useScratchingsContext();

  if (loading) return null;
  if (error) {
    console.error('Scratchings error:', error);
    return null;
  }
  if (scratchings.length === 0) return null;

  // 🔍 DEBUG: Log scratching data structure
  console.log('🐛 Scratchings data in component:', scratchings.slice(0, 2));

  // Group by track (handle undefined trackName)
  const scratchingsByTrack = scratchings.reduce((acc, s) => {
    // Try multiple possible property names for track
    const scratchingRecord = s as unknown as Record<string, unknown>;
    const track = s.trackName || scratchingRecord.track || scratchingRecord.venueName || 'Unknown Track';
    const trackKey = String(track);
    if (!acc[trackKey]) {
      acc[trackKey] = [];
    }
    acc[trackKey].push(s);
    return acc;
  }, {} as Record<string, Scratching[]>);

  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xl">⚠️</span>
        <h3 className="text-red-900 font-semibold">
          {scratchings.length} Scratching{scratchings.length > 1 ? 's' : ''} Today
        </h3>
      </div>
      
      <div className="space-y-2 text-sm">
        {Object.entries(scratchingsByTrack).slice(0, 5).map(([track, trackScratchings]) => (
          <div key={track}>
            <div className="font-semibold text-red-900">{track}:</div>
            <div className="ml-4 space-y-1">
              {trackScratchings.map((s, i) => {
                // Try multiple possible property names
                const scratchingRecord = s as unknown as Record<string, unknown>;
                const horseName = String(s.horseName || scratchingRecord.runner || scratchingRecord.name || 'Unknown');
                const raceNum = String(s.raceNumber || scratchingRecord.raceNo || scratchingRecord.race || '?');
                const tabNum = String(s.tabNumber || scratchingRecord.number || scratchingRecord.barrierNumber || '?');
                const reason = String(s.reason || scratchingRecord.scratchingReason || '');

                return (
                  <div key={i} className="text-red-800">
                    • R{raceNum} - {horseName} (#{tabNum})
                    {reason && <span className="text-red-600"> - {reason}</span>}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
        
        {Object.keys(scratchingsByTrack).length > 5 && (
          <div className="text-red-700 font-medium mt-2">
            + {Object.keys(scratchingsByTrack).length - 5} more tracks
          </div>
        )}
      </div>
    </div>
  );
}
