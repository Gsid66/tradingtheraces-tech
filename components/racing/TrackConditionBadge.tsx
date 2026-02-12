'use client';

import { formatDistanceToNow } from 'date-fns';

interface Props {
  condition: string;
  railPosition?: string;
  weather?: string;
  updatedAt?: string | Date;
  showTimestamp?: boolean;
}

export default function TrackConditionBadge({ 
  condition, 
  railPosition, 
  weather, 
  updatedAt,
  showTimestamp = false 
}: Props) {
  // Enhanced color coding based on condition
  // Fast (Firm 1-2): Green
  // Good (Good 3-4): Blue
  // Slow (Soft 5-7): Yellow/Orange
  // Heavy (Heavy 8-10): Red
  // Synthetic: Purple
  const getConditionColor = (cond: string) => {
    const lower = cond.toLowerCase();
    
    // Heavy conditions (Heavy 8-10)
    if (lower.includes('heavy')) {
      return 'bg-red-600 text-white';
    }
    
    // Soft conditions (Soft 5-7)
    if (lower.includes('soft')) {
      return 'bg-orange-500 text-white';
    }
    
    // Good conditions (Good 3-4)
    if (lower.includes('good')) {
      return 'bg-blue-500 text-white';
    }
    
    // Fast/Firm conditions (Firm 1-2)
    if (lower.includes('firm') || lower.includes('fast')) {
      return 'bg-green-600 text-white';
    }
    
    // Synthetic tracks
    if (lower.includes('synthetic')) {
      return 'bg-purple-600 text-white';
    }
    
    // Default
    return 'bg-gray-500 text-white';
  };

  // Get icon for condition
  const getConditionIcon = (cond: string) => {
    const lower = cond.toLowerCase();
    if (lower.includes('heavy')) return '🌧️';
    if (lower.includes('soft')) return '💧';
    if (lower.includes('good')) return '✓';
    if (lower.includes('firm') || lower.includes('fast')) return '⚡';
    if (lower.includes('synthetic')) return '🏗️';
    return '';
  };

  return (
    <div className="flex flex-wrap gap-2 items-center">
      <span className={`px-3 py-1.5 rounded-lg text-sm font-semibold ${getConditionColor(condition)} flex items-center gap-1.5`}>
        <span>{getConditionIcon(condition)}</span>
        <span>{condition}</span>
      </span>
      {railPosition && (
        <span className="px-2.5 py-1 bg-gray-200 text-gray-700 rounded-lg text-xs font-medium">
          🛤️ Rail: {railPosition}
        </span>
      )}
      {weather && (
        <span className="px-2.5 py-1 bg-blue-100 text-blue-700 rounded-lg text-xs font-medium">
          🌤️ {weather}
        </span>
      )}
      {showTimestamp && updatedAt && (
        <span className="px-2.5 py-1 bg-gray-100 text-gray-600 rounded-lg text-xs">
          Updated {formatDistanceToNow(new Date(updatedAt), { addSuffix: true })}
        </span>
      )}
    </div>
  );
}
