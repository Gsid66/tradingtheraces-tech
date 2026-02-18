'use client';

import { useState, useMemo } from 'react';
import ScratchingsBadge from '@/components/racing/ScratchingsBadge';

interface MergedRatingsData {
  date: string;
  track: string;
  raceNumber: number;
  raceName: string;
  saddleCloth: number | null;
  horseName: string;
  jockey: string;
  trainer: string;
  rvoRating: number | null;
  rvoPrice: number | null;
  ttrRating: number | null;
  ttrPrice: number | null;
  tabWin: number | null;
  tabPlace: number | null;
  isScratched: boolean;
  scratchingReason?: string;
  scratchingTime?: string;
}

type SortField = keyof MergedRatingsData;
type SortDirection = 'asc' | 'desc';

interface Props {
  data: MergedRatingsData[];
}

function SortIcon({ 
  field, 
  sortField, 
  sortDirection 
}: { 
  field: SortField; 
  sortField: SortField; 
  sortDirection: SortDirection;
}) {
  if (sortField !== field) return <span className="text-gray-400">↕️</span>;
  return sortDirection === 'asc' ? <span>↑</span> : <span>↓</span>;
}

export default function MergedRatingsTable({ data }: Props) {
  const [sortField, setSortField] = useState<SortField>('track');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [showScratched, setShowScratched] = useState(true);

  const sortedData = useMemo(() => {
    let filtered = [...data];
    
    if (!showScratched) {
      filtered = filtered.filter(row => !row.isScratched);
    }

    filtered.sort((a, b) => {
      const aVal = a[sortField];
      const bVal = b[sortField];

      if (aVal === null || aVal === undefined) return 1;
      if (bVal === null || bVal === undefined) return -1;

      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [data, sortField, sortDirection, showScratched]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const exportToCSV = () => {
    const nonScratchedData = data.filter(row => !row.isScratched);
    const headers = [
      'Date', 'Track', 'Race', 'Saddle Cloth', 'Horse Name', 'Jockey', 'Trainer',
      'RVO Rating', 'RVO Price', 'TTR Rating', 'TTR Price', 'TAB Win', 'TAB Place'
    ];
    
    const csvContent = [
      headers.join(','),
      ...nonScratchedData.map(row => [
        row.date,
        row.track,
        `R${row.raceNumber} - ${row.raceName}`,
        row.saddleCloth,
        `"${row.horseName}"`,
        `"${row.jockey}"`,
        `"${row.trainer}"`,
        row.rvoRating ?? '-',
        row.rvoPrice ?? '-',
        row.ttrRating ?? '-',
        row.ttrPrice ?? '-',
        row.tabWin ?? '-',
        row.tabPlace ?? '-'
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `merged-ratings-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const hasValue = (row: MergedRatingsData): boolean => {
    const threshold = 1.1;
    
    if (row.rvoPrice && row.tabWin && row.rvoPrice > row.tabWin * threshold) {
      return true;
    }
    
    if (row.ttrPrice && row.tabWin && row.ttrPrice > row.tabWin * threshold) {
      return true;
    }
    
    return false;
  };

  return (
    <div className="bg-white rounded-lg shadow-lg">
      <div className="p-4 border-b border-gray-200">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="text-sm text-gray-600">
              <strong>{sortedData.length}</strong> runners
              {!showScratched && ` (${data.filter(d => d.isScratched).length} scratched hidden)`}
            </div>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={showScratched}
                onChange={(e) => setShowScratched(e.target.checked)}
                className="rounded"
              />
              <span>Show scratched horses</span>
            </label>
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={exportToCSV}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
            >
              📥 Export CSV
            </button>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200 sticky top-0">
            <tr>
              <th className="px-3 py-3 text-left font-semibold text-gray-700 cursor-pointer hover:bg-gray-100" onClick={() => handleSort('date')}> 
                Date <SortIcon field="date" sortField={sortField} sortDirection={sortDirection} />
              </th>
              <th className="px-3 py-3 text-left font-semibold text-gray-700 cursor-pointer hover:bg-gray-100" onClick={() => handleSort('track')}> 
                Track <SortIcon field="track" sortField={sortField} sortDirection={sortDirection} />
              </th>
              <th className="px-3 py-3 text-left font-semibold text-gray-700 cursor-pointer hover:bg-gray-100" onClick={() => handleSort('raceNumber')}> 
                Race <SortIcon field="raceNumber" sortField={sortField} sortDirection={sortDirection} />
              </th>
              <th className="px-3 py-3 text-center font-semibold text-gray-700 cursor-pointer hover:bg-gray-100" onClick={() => handleSort('saddleCloth')}> 
                SC <SortIcon field="saddleCloth" sortField={sortField} sortDirection={sortDirection} />
              </th>
              <th className="px-3 py-3 text-left font-semibold text-gray-700 cursor-pointer hover:bg-gray-100" onClick={() => handleSort('horseName')}> 
                Horse <SortIcon field="horseName" sortField={sortField} sortDirection={sortDirection} />
              </th>
              <th className="px-3 py-3 text-left font-semibold text-gray-700">Jockey</th>
              <th className="px-3 py-3 text-left font-semibold text-gray-700">Trainer</th>
              <th className="px-3 py-3 text-center font-semibold text-blue-700 bg-blue-50 cursor-pointer hover:bg-blue-100" onClick={() => handleSort('rvoRating')}> 
                RVO Rating <SortIcon field="rvoRating" sortField={sortField} sortDirection={sortDirection} />
              </th>
              <th className="px-3 py-3 text-center font-semibold text-blue-700 bg-blue-50 cursor-pointer hover:bg-blue-100" onClick={() => handleSort('rvoPrice')}> 
                RVO Price <SortIcon field="rvoPrice" sortField={sortField} sortDirection={sortDirection} />
              </th>
              <th className="px-3 py-3 text-center font-semibold text-green-700 bg-green-50 cursor-pointer hover:bg-green-100" onClick={() => handleSort('ttrRating')}> 
                TTR Rating <SortIcon field="ttrRating" sortField={sortField} sortDirection={sortDirection} />
              </th>
              <th className="px-3 py-3 text-center font-semibold text-green-700 bg-green-50 cursor-pointer hover:bg-green-100" onClick={() => handleSort('ttrPrice')}> 
                TTR Price <SortIcon field="ttrPrice" sortField={sortField} sortDirection={sortDirection} />
              </th>
              <th className="px-3 py-3 text-center font-semibold text-orange-700 bg-orange-50 cursor-pointer hover:bg-orange-100" onClick={() => handleSort('tabWin')}> 
                TAB Win <SortIcon field="tabWin" sortField={sortField} sortDirection={sortDirection} />
              </th>
              <th className="px-3 py-3 text-center font-semibold text-orange-700 bg-orange-50 cursor-pointer hover:bg-orange-100" onClick={() => handleSort('tabPlace')}> 
                TAB Place <SortIcon field="tabPlace" sortField={sortField} sortDirection={sortDirection} />
              </th>
              <th className="px-3 py-3 text-center font-semibold text-gray-700">Value</th>
            </tr>
          </thead>
          <tbody>
            {sortedData.length === 0 ? (
              <tr>
                <td colSpan={14} className="px-3 py-8 text-center text-gray-500">
                  No data available for today
                </td>
              </tr>
            ) : (
              sortedData.map((row, idx) => (
                <tr 
                  key={idx} 
                  className={`border-b border-gray-100 hover:bg-gray-50 ${
                    row.isScratched ? 'bg-red-50' : ''
                  }`}
                >
                  <td className="px-3 py-2 text-gray-600 whitespace-nowrap">{row.date}</td>
                  <td className="px-3 py-2">
                    <span className="inline-block px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">
                      {row.track}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-gray-700">
                    <div className="font-medium">R{row.raceNumber}</div>
                    <div className="text-xs text-gray-500">{row.raceName}</div>
                  </td>
                  <td className="px-3 py-2 text-center">
                    <span className={`inline-block px-2 py-1 rounded text-xs font-bold ${
                      row.isScratched ? 'bg-gray-300 text-gray-500' : 'bg-purple-600 text-white'
                    }`}> 
                      {row.saddleCloth ?? '-'}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    <div className={`font-medium ${row.isScratched ? 'text-gray-400 line-through' : 'text-gray-900'}`}> 
                      {row.horseName}
                    </div>
                    {row.isScratched && (
                      <div className="mt-1">
                        <ScratchingsBadge 
                          isScratched={true} 
                          scratchingReason={row.scratchingReason}
                          scratchingTime={row.scratchingTime}
                        />
                      </div>
                    )}
                  </td>
                  <td className={`px-3 py-2 text-xs ${row.isScratched ? 'text-gray-400' : 'text-gray-600'}`}> 
                    {row.jockey || '-'}
                  </td>
                  <td className={`px-3 py-2 text-xs ${row.isScratched ? 'text-gray-400' : 'text-gray-600'}`}> 
                    {row.trainer || '-'}
                  </td>
                  <td className="px-3 py-2 text-center"> 
                    {row.rvoRating ? (
                      <span className={`inline-block px-2 py-1 rounded text-xs font-bold ${
                        row.isScratched ? 'bg-gray-300 text-gray-500' : 'bg-blue-500 text-white'
                      }`}> 
                        {row.rvoRating}
                      </span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-center"> 
                    {row.rvoPrice ? (
                      <span className={`inline-block px-2 py-1 rounded text-xs font-bold ${
                        row.isScratched ? 'bg-gray-300 text-gray-500' : 'bg-blue-600 text-white'
                      }`}> 
                        ${row.rvoPrice?.toFixed(2)}
                      </span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-center"> 
                    {row.ttrRating ? (
                      <span className={`inline-block px-2 py-1 rounded text-xs font-bold ${
                        row.isScratched ? 'bg-gray-300 text-gray-500' : 'bg-green-500 text-white'
                      }`}> 
                        {row.ttrRating}
                      </span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-center"> 
                    {row.ttrPrice ? (
                      <span className={`inline-block px-2 py-1 rounded text-xs font-bold ${
                        row.isScratched ? 'bg-gray-300 text-gray-500' : 'bg-green-600 text-white'
                      }`}> 
                        ${row.ttrPrice?.toFixed(2)}
                      </span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-center"> 
                    {row.tabWin ? (
                      <span className={`inline-block px-2 py-1 rounded text-xs font-bold ${
                        row.isScratched ? 'bg-gray-300 text-gray-500' : 'bg-orange-600 text-white'
                      }`}> 
                        ${row.tabWin?.toFixed(2)}
                      </span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-center"> 
                    {row.tabPlace ? (
                      <span className={`inline-block px-2 py-1 rounded text-xs font-bold ${
                        row.isScratched ? 'bg-gray-300 text-gray-500' : 'bg-orange-600 text-white'
                      }`}> 
                        ${row.tabPlace?.toFixed(2)}
                      </span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-center"> 
                    {!row.isScratched && hasValue(row) && (
                      <span className="inline-block px-2 py-1 bg-green-500 text-white rounded text-xs font-bold">
                        VALUE
                      </span>
                    )}
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