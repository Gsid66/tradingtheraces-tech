'use client';

interface Props {
  condition: string;
  railPosition?: string;
  weather?: string;
}

export default function TrackConditionBadge({ condition, railPosition, weather }: Props) {
  // Color coding based on condition
  const getConditionColor = (cond: string) => {
    const lower = cond.toLowerCase();
    if (lower.includes('heavy')) return 'bg-blue-600 text-white';
    if (lower.includes('soft')) return 'bg-blue-400 text-white';
    if (lower.includes('good')) return 'bg-green-500 text-white';
    if (lower.includes('firm')) return 'bg-yellow-500 text-white';
    if (lower.includes('synthetic')) return 'bg-purple-500 text-white';
    return 'bg-gray-500 text-white';
  };

  return (
    <div className="flex flex-wrap gap-2 items-center">
      <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getConditionColor(condition)}`}>
        {condition}
      </span>
      {railPosition && (
        <span className="px-2 py-1 bg-gray-200 text-gray-700 rounded text-xs">
          Rail: {railPosition}
        </span>
      )}
      {weather && (
        <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
          {weather}
        </span>
      )}
    </div>
  );
}
