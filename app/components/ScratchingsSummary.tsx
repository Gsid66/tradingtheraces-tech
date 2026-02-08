'use client'

import { useScratchingsContext } from '@/app/providers/ScratchingsProvider';

export function ScratchingsSummary() {
  const { scratchings, loading, error } = useScratchingsContext();

  if (loading) return null;
  if (error) return null;
  if (scratchings.length === 0) return null;

  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
      <h3 className="text-red-900 font-semibold mb-2">
        ⚠️ {scratchings.length} Scratching{scratchings.length > 1 ? 's' : ''} Today
      </h3>
      <div className="space-y-1 text-sm">
        {scratchings.slice(0, 5).map((s, i) => (
          <div key={i} className="text-red-800">
            • {s.trackName} R{s.raceNumber} - {s.horseName}
            {s.reason && ` (${s.reason})`}
          </div>
        ))}
        {scratchings.length > 5 && (
          <div className="text-red-600 font-medium">
            + {scratchings.length - 5} more
          </div>
        )}
      </div>
    </div>
  );
}
