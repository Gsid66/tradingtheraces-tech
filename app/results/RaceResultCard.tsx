'use client';

import { useState } from 'react';
import RunnerResultRow from './RunnerResultRow';

interface Props {
  race: any;
  trackState: string;
}

export default function RaceResultCard({ race, trackState }: Props) {
  const [showAllRunners, setShowAllRunners] = useState(false);
  
  const runners = race.runners || [];
  
  // Sort runners by finishing position
  const sortedRunners = [...runners]
    .filter((r: any) => r.finishingPosition > 0)
    .sort((a, b) => a.finishingPosition - b.finishingPosition);
  
  const topThree = sortedRunners.slice(0, 3);
  const remainingRunners = sortedRunners.slice(3);

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      {/* Race Header */}
      <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Race {race.number || 'N/A'} - {race.name || 'Unknown Race'}
            </h3>
            <div className="text-sm text-gray-600 mt-1">
              {race.distance ? `${race.distance}m` : 'Distance N/A'}
              {race.raceClass && ` • ${race.raceClass}`}
            </div>
          </div>
        </div>
      </div>

      {/* Top 3 Finishers */}
      <div className="p-4 space-y-2">
        {topThree.length > 0 ? (
          <>
            {topThree.map((runner: any, index: number) => (
              <RunnerResultRow 
                key={runner.formId || index} 
                runner={runner} 
                position={index + 1}
              />
            ))}
          </>
        ) : (
          <div className="text-center py-4 text-gray-500">
            No results available for this race
          </div>
        )}

        {/* Show All Runners Button */}
        {remainingRunners.length > 0 && (
          <div className="pt-2">
            <button
              onClick={() => setShowAllRunners(!showAllRunners)}
              className="w-full px-4 py-2 text-sm font-medium text-purple-600 hover:text-purple-700 hover:bg-purple-50 rounded-lg transition-colors border border-purple-200"
            >
              {showAllRunners ? 'Hide Other Runners' : `Show All Runners (${remainingRunners.length} more)`}
            </button>
          </div>
        )}

        {/* Remaining Runners */}
        {showAllRunners && remainingRunners.length > 0 && (
          <div className="mt-2 space-y-2 pt-2 border-t border-gray-200">
            {remainingRunners.map((runner: any, index: number) => (
              <RunnerResultRow 
                key={runner.formId || index} 
                runner={runner} 
                position={index + 4}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
