'use client';

import type { PFRunner } from '@/lib/integrations/punting-form/client';

// Extended runner interface with TAB and TTR data
interface EnrichedRunner extends PFRunner {
  tabFixedWinPrice?: number | string | null;
  tabFixedPlacePrice?: number | string | null;
  tabFixedWinTimestamp?: string | null;
  tabFixedPlaceTimestamp?: string | null;
  ttrRating?: number | string | null;
  ttrPrice?: number | string | null;
  isScratched?: boolean;
  scratchingReason?: string;
}

interface Props {
  runners: EnrichedRunner[];
}

export default function RatingsOddsView({ runners }: Props) {
  // Helper functions to format data
  const formatPrice = (price: number | string | null | undefined): string => {
    if (price === null || price === undefined) return '-';
    const numPrice = typeof price === 'string' ? parseFloat(price) : price;
    return isNaN(numPrice) ? '-' : `$${numPrice.toFixed(2)}`;
  };

  const formatRating = (rating: number | string | null | undefined): string => {
    if (rating === null || rating === undefined) return '-';
    const numRating = typeof rating === 'string' ? parseInt(rating, 10) : rating;
    return isNaN(numRating) ? '-' : numRating.toString();
  };

  const formatTime = (timestamp: string | null) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-AU', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      timeZone: 'Australia/Sydney',
    });
  };

  // Sort runners by tabNumber
  const sortedRunners = runners
    .slice()
    .sort((a, b) => (a.tabNumber ?? a.tabNo ?? 999) - (b.tabNumber ?? b.tabNo ?? 999));

  // Filter out scratched horses for value calculations
  const activeRunners = sortedRunners.filter(r => !r.isScratched);

  // Calculate value plays (where TAB odds are better than TTR price suggests)
  const valueRunners = activeRunners.filter(r => {
    const tabWin = typeof r.tabFixedWinPrice === 'string' ? parseFloat(r.tabFixedWinPrice) : r.tabFixedWinPrice;
    const ttrPrice = typeof r.ttrPrice === 'string' ? parseFloat(r.ttrPrice) : r.ttrPrice;
    return tabWin && ttrPrice && tabWin > ttrPrice * 1.2; // 20% better value
  });

  return (
    <div className="bg-white rounded-b-lg shadow-sm">
      {/* Info Banner */}
      <div className="bg-purple-50 border-b border-purple-200 px-6 py-4">
        <h3 className="font-semibold text-purple-900 mb-1">Ratings vs Fixed Odds</h3>
        <p className="text-sm text-purple-800">
          Compare TTR ratings with TAB fixed odds to identify potential value opportunities.
          {valueRunners.length > 0 && (
            <span className="ml-2 font-semibold text-green-700">
              {valueRunners.length} potential value play{valueRunners.length !== 1 ? 's' : ''} identified!
            </span>
          )}
        </p>
      </div>

      {/* Table View */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                No.
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Horse
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Jockey
              </th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-purple-700 uppercase tracking-wider">
                TAB Win
              </th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-purple-700 uppercase tracking-wider">
                TAB Place
              </th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-green-700 uppercase tracking-wider">
                TTR Rating
              </th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-green-700 uppercase tracking-wider">
                TTR Price
              </th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Value
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {sortedRunners.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-6 py-8 text-center text-gray-500">
                  No runners available for this race
                </td>
              </tr>
            ) : (
              sortedRunners.map((runner) => {
                const tabWin = typeof runner.tabFixedWinPrice === 'string' ? parseFloat(runner.tabFixedWinPrice) : runner.tabFixedWinPrice;
                const ttrPrice = typeof runner.ttrPrice === 'string' ? parseFloat(runner.ttrPrice) : runner.ttrPrice;
                const isValue = tabWin && ttrPrice && tabWin > ttrPrice * 1.2;
                
                return (
                  <tr 
                    key={runner.formId} 
                    className={`hover:bg-gray-50 ${runner.isScratched ? 'opacity-50 bg-red-50' : ''} ${isValue ? 'bg-green-50' : ''}`}
                  >
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center text-white font-bold">
                          {runner.tabNumber ?? runner.tabNo}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="font-semibold text-gray-900">
                        {runner.name || runner.horseName}
                      </div>
                      {runner.isScratched && (
                        <span className="text-xs text-red-600 font-medium">SCRATCHED</span>
                      )}
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-700">
                      {runner.jockey?.fullName || 'TBA'}
                    </td>
                    <td className="px-4 py-4 text-center">
                      <div className="font-bold text-purple-600">
                        {formatPrice(runner.tabFixedWinPrice)}
                      </div>
                      {runner.tabFixedWinTimestamp && (
                        <div className="text-xs text-gray-400">
                          {formatTime(runner.tabFixedWinTimestamp)}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-4 text-center">
                      <div className="font-bold text-purple-600">
                        {formatPrice(runner.tabFixedPlacePrice)}
                      </div>
                      {runner.tabFixedPlaceTimestamp && (
                        <div className="text-xs text-gray-400">
                          {formatTime(runner.tabFixedPlaceTimestamp)}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-4 text-center">
                      <div className="font-bold text-green-600 text-lg">
                        {formatRating(runner.ttrRating)}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <div className="font-bold text-green-600">
                        {formatPrice(runner.ttrPrice)}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-center">
                      {isValue ? (
                        <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded">
                          VALUE
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Missing Data Warning */}
      {sortedRunners.length > 0 && (
        <div className="px-6 py-4 bg-gray-50 border-t">
          <div className="text-sm text-gray-600">
            <strong>Note:</strong> TAB Fixed Odds are fetched from an external API.
            If odds show as &quot;-&quot;, the data may not be available yet or the API connection needs to be configured.
          </div>
        </div>
      )}
    </div>
  );
}
