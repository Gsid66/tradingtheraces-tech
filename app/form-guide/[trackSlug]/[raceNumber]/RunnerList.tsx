'use client';

import { useState } from 'react';
import type { PFRunner } from '@/lib/integrations/punting-form/client';

const TBA_TEXT = 'TBA';

interface Props {
  runners:  PFRunner[];
}

export default function RunnerList({ runners }: Props) {
  return (
    <div className="bg-white rounded-b-lg shadow-sm">
      {/* Runner Rows */}
      <div className="divide-y">
        {runners.length === 0 ? (
          <div className="px-6 py-12 text-center text-gray-500">
            No runners available for this race
          </div>
        ) : (
          runners.map((runner, index) => (
            <RunnerRow key={runner.formId} runner={runner} position={index + 1} />
          ))
        )}
      </div>
    </div>
  );
}

function RunnerRow({ runner, position }: { runner: PFRunner; position: number }) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Calculate stats
  const totalStarts = runner.careerStarts || 0;
  const wins = runner.careerWins || 0;
  const seconds = runner.careerSeconds || 0;
  const thirds = runner.careerThirds || 0;
  const places = wins + seconds + thirds;
  
  const winPercent = totalStarts > 0 ? Math.round((wins / totalStarts) * 100) : 0;
  const placePercent = totalStarts > 0 ? Math.round((places / totalStarts) * 100) : 0;
  const avgPrize = runner.prizeMoney && totalStarts > 0 
    ? Math.round(runner.prizeMoney / totalStarts) 
    : 0;

  // Generate color based on tab number for visual variety
  const colors = [
    'from-red-400 to-red-600',
    'from-blue-400 to-blue-600',
    'from-green-400 to-green-600',
    'from-yellow-400 to-yellow-600',
    'from-purple-400 to-purple-600',
    'from-pink-400 to-pink-600',
    'from-indigo-400 to-indigo-600',
    'from-orange-400 to-orange-600',
  ];
  const colorClass = colors[(runner.tabNumber || position - 1) % colors.length];

  // Parse last 10 form positions for visual display
  const formPositions = (runner.last10 || runner.lastFiveStarts || '')
    .split('')
    .filter(char => char !== 'x' && char !== '-')
    .slice(0, 10);

  const getFormBadgeColor = (pos: string) => {
    if (pos === '1') return 'bg-yellow-400 text-yellow-900';
    if (pos === '2') return 'bg-gray-300 text-gray-900';
    if (pos === '3') return 'bg-orange-400 text-orange-900';
    if (pos === '0' || pos === 'F') return 'bg-red-200 text-red-900';
    return 'bg-gray-200 text-gray-700';
  };

  return (
    <div className="border-b hover:bg-gray-50 transition-colors">
      {/* Main Runner Card */}
      <div 
        className="px-6 py-4 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-start gap-4">
          {/* Silks Icon - Larger */}
          <div className={`w-14 h-14 rounded-full bg-gradient-to-br ${colorClass} flex items-center justify-center text-white font-bold text-lg flex-shrink-0 shadow-lg`}>
            {runner.tabNumber || position}
          </div>

          <div className="flex-1 min-w-0">
            {/* Horse Name with Badges */}
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <h3 className="font-bold text-gray-900 text-lg">
                {runner.name || runner.horseName}
              </h3>
              
              {runner.emergencyIndicator && (
                <span className="px-2 py-0.5 text-xs bg-orange-100 text-orange-800 rounded font-medium">
                  Emergency
                </span>
              )}
              
              {runner.gearChanges && (
                <span className="px-2 py-0.5 text-xs bg-blue-100 text-blue-800 rounded font-medium">
                  Gear Changes
                </span>
              )}
              
              <span className="px-2 py-0.5 text-xs bg-gray-200 text-gray-700 rounded font-medium">
                Barrier {runner.barrierNumber || runner.barrier}
              </span>
            </div>

            {/* Age, Sex, Color */}
            <div className="text-sm text-gray-600 mb-2">
              {runner.age && <span>{runner.age}yo </span>}
              {runner.sex && <span>{runner.sex} </span>}
              {runner.colour && <span>{runner.colour}</span>}
            </div>

            {/* Fixed Odds */}
            {runner.fixedOdds && (
              <div className="mb-2">
                <span className="px-3 py-1 bg-green-100 text-green-800 rounded font-bold text-sm">
                  ${runner.fixedOdds.toFixed(2)}
                </span>
              </div>
            )}

            {/* Jockey */}
            <div className="text-sm text-gray-700 mb-1">
              <span className="font-semibold">Jockey:</span>{' '}
              {runner.jockey?.fullName || TBA_TEXT}{' '}
              <span className="text-gray-600">
                ({runner.weight || runner.handicapWeight || 0}kg)
                {runner.jockey?.isApprentice && runner.jockey?.claim && (
                  <span className="text-blue-600"> (a{runner.jockey.claim})</span>
                )}
              </span>
            </div>

            {/* Trainer */}
            <div className="text-sm text-gray-700 mb-3">
              <span className="font-semibold">Trainer:</span>{' '}
              {runner.trainer?.fullName || TBA_TEXT}
            </div>

            {/* Visual Form Guide */}
            <div className="mb-3">
              <div className="text-xs text-gray-600 mb-1 font-medium">Last 10 Starts:</div>
              <div className="flex gap-1">
                {formPositions.length > 0 ? (
                  formPositions.map((pos, idx) => (
                    <span
                      key={idx}
                      className={`w-7 h-7 flex items-center justify-center rounded font-bold text-xs ${getFormBadgeColor(pos)}`}
                    >
                      {pos}
                    </span>
                  ))
                ) : (
                  <span className="text-sm text-gray-500">No form available</span>
                )}
              </div>
            </div>

            {/* Career Statistics Summary */}
            <div className="flex items-center gap-4 text-sm">
              <div>
                <span className="text-gray-600">Career:</span>{' '}
                <span className="font-semibold text-gray-900">
                  {totalStarts}: {wins}-{seconds}-{thirds}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Win:</span>{' '}
                <span className="font-semibold text-green-700">{winPercent}%</span>
              </div>
              <div>
                <span className="text-gray-600">Place:</span>{' '}
                <span className="font-semibold text-blue-700">{placePercent}%</span>
              </div>
            </div>

            {/* Expandable Toggle Indicator */}
            <div className="mt-3 text-sm text-green-700 font-medium flex items-center gap-1">
              <span>{isExpanded ? '▼' : '▶'}</span>
              <span>{isExpanded ? 'Hide details' : 'Horse Details'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Expanded Details Panel */}
      {isExpanded && (
        <div className="px-6 pb-6 bg-gray-50">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
            {/* Left Column */}
            <div className="space-y-4">
              {/* Horse Details Card */}
              <div className="bg-white rounded-lg shadow p-4 border">
                <h4 className="font-bold text-gray-900 mb-3 text-sm">Horse Details</h4>
                <div className="space-y-2 text-sm">
                  {runner.sire && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Sire:</span>
                      <span className="font-medium text-gray-900">{runner.sire}</span>
                    </div>
                  )}
                  {runner.dam && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Dam:</span>
                      <span className="font-medium text-gray-900">{runner.dam}</span>
                    </div>
                  )}
                  {runner.country && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Country:</span>
                      <span className="font-medium text-gray-900">{runner.country}</span>
                    </div>
                  )}
                  {runner.foalDate && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Foal Date:</span>
                      <span className="font-medium text-gray-900">{runner.foalDate}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Career Prize Money Card */}
              <div className="bg-white rounded-lg shadow p-4 border">
                <h4 className="font-bold text-gray-900 mb-3 text-sm">Career Prize Money</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Earnings:</span>
                    <span className="font-bold text-green-700 text-lg">
                      ${(runner.prizeMoney || 0).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Average per Start:</span>
                    <span className="font-medium text-gray-900">
                      ${avgPrize.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-4">
              {/* Career Statistics */}
              <div className="bg-white rounded-lg shadow p-4 border">
                <h4 className="font-bold text-gray-900 mb-3 text-sm">Career Statistics</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-yellow-50 rounded p-3 text-center border border-yellow-200">
                    <div className="text-2xl font-bold text-yellow-700">{wins}</div>
                    <div className="text-xs text-gray-600">Wins</div>
                  </div>
                  <div className="bg-gray-50 rounded p-3 text-center border border-gray-200">
                    <div className="text-2xl font-bold text-gray-700">{seconds}</div>
                    <div className="text-xs text-gray-600">Seconds</div>
                  </div>
                  <div className="bg-orange-50 rounded p-3 text-center border border-orange-200">
                    <div className="text-2xl font-bold text-orange-700">{thirds}</div>
                    <div className="text-xs text-gray-600">Thirds</div>
                  </div>
                  <div className="bg-blue-50 rounded p-3 text-center border border-blue-200">
                    <div className="text-2xl font-bold text-blue-700">{totalStarts}</div>
                    <div className="text-xs text-gray-600">Total Starts</div>
                  </div>
                </div>
              </div>

              {/* Info Tip */}
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <div className="flex gap-2">
                  <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  <div className="text-sm text-blue-900">
                    <div className="font-medium mb-1">More insights coming soon!</div>
                    <div className="text-blue-700">
                      Track conditions, speed maps, and advanced analytics will be available in future updates.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}