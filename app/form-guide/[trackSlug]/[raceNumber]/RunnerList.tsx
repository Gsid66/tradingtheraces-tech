'use client';

import type { PFRunner } from '@/lib/integrations/punting-form/client';

interface Props {
  runners:  PFRunner[];
}

export default function RunnerList({ runners }: Props) {
  return (
    <div className="bg-white rounded-b-lg shadow-sm">
      {/* Table Header */}
      <div className="grid grid-cols-12 gap-4 px-6 py-3 bg-gray-50 border-b text-sm font-medium text-gray-700">
        <div className="col-span-4">Runner Details</div>
        <div className="col-span-2">Last 10</div>
        <div className="col-span-1">Career</div>
        <div className="col-span-1 text-right">Win %</div>
        <div className="col-span-1 text-right">Place %</div>
        <div className="col-span-3 text-right">Avg Prize $</div>
      </div>

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

  return (
    <div className="grid grid-cols-12 gap-4 px-6 py-4 hover:bg-gray-50 transition-colors">
      {/* Runner Details */}
      <div className="col-span-4 flex items-start gap-3">
        {/* Silks Icon */}
        <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${colorClass} flex items-center justify-center text-white font-bold flex-shrink-0 shadow-md`}>
          {runner.tabNumber || position}
        </div>

        <div className="flex-1 min-w-0">
          {/* Horse Name + Barrier */}
          <div className="flex items-center gap-2 mb-1">
            <span className="font-bold text-gray-900 text-base">
              {position}. {runner.name || runner.horseName}
            </span>
            <span className="text-sm text-gray-600 font-medium">
              ({runner.barrierNumber || runner.barrier})
            </span>
          </div>

          {/* Jockey */}
          <div className="text-sm text-gray-700">
            <span className="font-semibold">J:</span>{' '}
            {runner. jockey?. fullName || 'TBA'}{' '}
            <span className="text-gray-600">
              ({runner.weight || runner.handicapWeight}kg)
              {runner.jockey?.isApprentice && runner.jockey?.claim && (
                <span className="text-blue-600"> (a{runner.jockey.claim})</span>
              )}
            </span>
          </div>

          {/* Trainer */}
          <div className="text-sm text-gray-700">
            <span className="font-semibold">T:</span>{' '}
            {runner.trainer?. fullName || 'TBA'}
          </div>
        </div>
      </div>

      {/* Last 10 Form */}
      <div className="col-span-2 flex items-center">
        <span className="font-mono text-sm text-gray-900 font-medium">
          {runner.last10 || runner.lastFiveStarts || '-'}
        </span>
      </div>

      {/* Career */}
      <div className="col-span-1 flex items-center">
        <span className="text-sm text-gray-900">
          {totalStarts} {wins}-{seconds}-{thirds}
        </span>
      </div>

      {/* Win % */}
      <div className="col-span-1 flex items-center justify-end">
        <span className="text-sm font-medium text-gray-900">{winPercent}%</span>
      </div>

      {/* Place % */}
      <div className="col-span-1 flex items-center justify-end">
        <span className="text-sm font-medium text-gray-900">{placePercent}%</span>
      </div>

      {/* Avg Prize */}
      <div className="col-span-3 flex items-center justify-end">
        <span className="text-sm font-medium text-gray-900">
          ${avgPrize. toLocaleString()}
        </span>
      </div>
    </div>
  );
}