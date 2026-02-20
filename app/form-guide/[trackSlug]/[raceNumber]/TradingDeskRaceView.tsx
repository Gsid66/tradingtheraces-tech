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
  scratchingTime?: string;
}

interface Props {
  runners: EnrichedRunner[];
}

const parseNumber = (value: number | string | null | undefined): number | null => {
  if (value === null || value === undefined) return null;
  const n = typeof value === 'string' ? parseFloat(value) : value;
  return isNaN(n) ? null : n;
};

const formatRating = (rating: number | string | null | undefined): string => {
  if (rating === null || rating === undefined) return '-';
  const numRating = typeof rating === 'string' ? parseInt(rating, 10) : rating;
  return isNaN(numRating) ? '-' : numRating.toString();
};

const formatPrice = (price: number | string | null | undefined): string => {
  if (price === null || price === undefined) return '-';
  const numPrice = typeof price === 'string' ? parseFloat(price) : price;
  return isNaN(numPrice) ? '-' : `$${numPrice.toFixed(2)}`;
};

export default function TradingDeskRaceView({ runners }: Props) {
  // Filter out scratched runners for top-4 selection
  const activeRunners = runners.filter(r => !r.isScratched);

  // Select top 4 by ttrRating descending; missing/invalid ratings sort to bottom
  const top4 = [...activeRunners]
    .sort((a, b) => {
      const rA = parseNumber(a.ttrRating);
      const rB = parseNumber(b.ttrRating);
      if (rA === null && rB === null) return 0;
      if (rA === null) return 1;
      if (rB === null) return -1;
      return rB - rA;
    })
    .slice(0, 4);

  // Sort top 4 by ttrPrice ascending; missing/invalid/<=0 prices sort to bottom
  const displayRunners = [...top4].sort((a, b) => {
    const pA = parseNumber(a.ttrPrice);
    const pB = parseNumber(b.ttrPrice);
    const validA = pA !== null && pA > 0;
    const validB = pB !== null && pB > 0;
    if (!validA && !validB) return 0;
    if (!validA) return 1;
    if (!validB) return -1;
    return pA! - pB!;
  });

  return (
    <div className="bg-white rounded-b-lg shadow-sm">
      {/* Info Banner */}
      <div className="bg-green-50 border-b border-green-200 px-6 py-4">
        <h3 className="font-semibold text-green-900 mb-1">Trading Desk — Top 4 Selections</h3>
        <p className="text-sm text-green-800">
          The top 4 runners ranked by TTR Rating, displayed in order of TTR Price (best value first).
        </p>
      </div>

      {/* Table */}
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
              <th className="px-4 py-3 text-center text-xs font-semibold text-green-700 uppercase tracking-wider">
                TTR Rating
              </th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-green-700 uppercase tracking-wider">
                TTR Price
              </th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {displayRunners.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                  No runner data available for this race
                </td>
              </tr>
            ) : (
              displayRunners.map((runner) => (
                <tr key={runner.formId} className="hover:bg-gray-50">
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold bg-green-600">
                      {runner.tabNumber ?? runner.tabNo}
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="font-semibold text-gray-900">
                      {runner.name || runner.horseName}
                    </div>
                  </td>
                  <td className="px-4 py-4 text-center">
                    <div className="font-bold text-lg text-green-600">
                      {formatRating(runner.ttrRating)}
                    </div>
                  </td>
                  <td className="px-4 py-4 text-center">
                    <div className="font-bold text-green-600">
                      {formatPrice(runner.ttrPrice)}
                    </div>
                  </td>
                  <td className="px-4 py-4 text-center">
                    <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded">
                      Active
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
