'use client';

import React, { useState } from 'react';
import { RatingsOddsData } from './types';
import { FiArrowUp, FiArrowDown, FiDownload } from 'react-icons/fi';
import ScratchingsBadge from '@/components/racing/ScratchingsBadge';

interface RatingsOddsTableProps {
  data: RatingsOddsData[];
}

type SortField = keyof RatingsOddsData;
type SortDirection = 'asc' | 'desc';

// Sort icon component
function SortIcon({ field, sortField, sortDirection }: { field: SortField; sortField: SortField | null; sortDirection: SortDirection }) {
  if (sortField !== field) return null;
  return sortDirection === 'asc' ? <FiArrowUp /> : <FiArrowDown />;
}

export default function RatingsOddsTable({ data }: RatingsOddsTableProps) {
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [showScratched, setShowScratched] = useState<boolean>(true);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortedData = React.useMemo(() => {
    // Filter data based on showScratched toggle
    const filteredData = showScratched ? data : data.filter(d => !d.isScratched);
    
    if (!sortField) {
      // Sort scratched horses to bottom when no sort is applied
      return [...filteredData].sort((a, b) => {
        if (a.isScratched === b.isScratched) return 0;
        return a.isScratched ? 1 : -1;
      });
    }

    return [...filteredData].sort((a, b) => {
      const aVal = a[sortField];
      const bVal = b[sortField];

      if (aVal === null || aVal === undefined) return 1;
      if (bVal === null || bVal === undefined) return -1;

      // Special handling for price field which can be string or number
      if (sortField === 'price') {
        const aNum = typeof aVal === 'string' ? parseFloat(aVal) : aVal;
        const bNum = typeof bVal === 'string' ? parseFloat(bVal) : bVal;
        
        if (isNaN(aNum as number)) return 1;
        if (isNaN(bNum as number)) return -1;
        
        return sortDirection === 'asc' ? (aNum as number) - (bNum as number) : (bNum as number) - (aNum as number);
      }

      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortDirection === 'asc' 
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }

      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
      }

      return 0;
    });
  }, [data, sortField, sortDirection, showScratched]);

  const scratchedCount = React.useMemo(() => {
    return data.filter(d => d.isScratched).length;
  }, [data]);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  const formatPrice = (value: any): string => {
    if (typeof value === 'string') {
      const parsed = parseFloat(value);
      if (isNaN(parsed)) {
        return '-';
      }
      return `$${parsed.toFixed(2)}`;
    }
    if (value == null || typeof value !== 'number' || isNaN(value)) {
      return '-';
    }
    return `$${value.toFixed(2)}`;
  };

  const formatRating = (value: any): string => {
    if (value == null || typeof value !== 'number' || isNaN(value)) {
      return '-';
    }
    return value.toString();
  };

  const prepareExportData = () => {
    const headers = [
      'Date', 'Track', 'Race', 'Horse', 'Jockey', 'Trainer', 
      'TTR Rating', 'TTR Price', 'TAB Win', 'TAB Place'
    ];
    
    // ALWAYS exclude scratched horses from exports
    const dataForExport = data.filter(d => !d.isScratched);
    
    const rows = dataForExport.map(row => [
      formatDate(row.race_date),
      row.track || row.meeting_name || '-',
      `Race ${row.race_number}`,
      row.horse_name,
      row.jockey || '-',
      row.trainer || '-',
      formatRating(row.rating),
      formatPrice(row.price).replace('$', ''),
      row.tab_fixed_win ? formatPrice(row.tab_fixed_win).replace('$', '') : '-',
      row.tab_fixed_place ? formatPrice(row.tab_fixed_place).replace('$', '') : '-'
    ]);

    return { headers, rows };
  };

  const exportToCSV = () => {
    const { headers, rows } = prepareExportData();

    const csv = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ttr-ratings-odds-comparison-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const exportToExcel = () => {
    const { headers, rows } = prepareExportData();

    const csv = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');
    
    const blob = new Blob([csv], { type: 'application/vnd.ms-excel' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ttr-ratings-odds-comparison-${new Date().toISOString().split('T')[0]}.xlsx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (data.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-12 text-center border-2 border-purple-100">
        <p className="text-gray-500 text-lg">No data available for today.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden border-2 border-purple-100">
      {/* Export Buttons and Filter */}
      <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex gap-3 flex-wrap items-center">
        <button
          onClick={exportToCSV}
          title="Export to CSV (excludes scratched horses)"
          className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 transition-colors"
        >
          <FiDownload />
          Export CSV
        </button>
        <button
          onClick={exportToExcel}
          title="Export to Excel (excludes scratched horses)"
          className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 transition-colors"
        >
          <FiDownload />
          Export Excel
        </button>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={showScratched}
            onChange={(e) => setShowScratched(e.target.checked)}
            className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
          />
          <span className="text-sm text-gray-700">Show scratched horses</span>
        </label>
        <div className="ml-auto text-sm text-gray-600 flex items-center">
          <strong className="mr-2">{sortedData.length}</strong> records found
        </div>
        {scratchedCount > 0 && (
          <p className="text-xs text-gray-500 italic w-full">
            ℹ️ Exports exclude scratched horses. Toggle above only affects table display.
          </p>
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-purple-600 text-white sticky top-0">
            <tr>
              <th 
                className="px-4 py-3 text-left text-sm font-semibold cursor-pointer hover:bg-purple-700"
                onClick={() => handleSort('race_date')}
                aria-sort={sortField === 'race_date' ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none'}
              >
                <div className="flex items-center gap-2">
                  Date <SortIcon field="race_date" sortField={sortField} sortDirection={sortDirection} />
                </div>
              </th>
              <th 
                className="px-4 py-3 text-left text-sm font-semibold cursor-pointer hover:bg-purple-700"
                onClick={() => handleSort('track')}
                aria-sort={sortField === 'track' ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none'}
              >
                <div className="flex items-center gap-2">
                  Track <SortIcon field="track" sortField={sortField} sortDirection={sortDirection} />
                </div>
              </th>
              <th 
                className="px-4 py-3 text-left text-sm font-semibold cursor-pointer hover:bg-purple-700"
                onClick={() => handleSort('race_number')}
                aria-sort={sortField === 'race_number' ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none'}
              >
                <div className="flex items-center gap-2">
                  Race <SortIcon field="race_number" sortField={sortField} sortDirection={sortDirection} />
                </div>
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold">
                Horse
              </th>
              <th 
                className="px-4 py-3 text-left text-sm font-semibold cursor-pointer hover:bg-purple-700"
                onClick={() => handleSort('jockey')}
                aria-sort={sortField === 'jockey' ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none'}
              >
                <div className="flex items-center gap-2">
                  Jockey <SortIcon field="jockey" sortField={sortField} sortDirection={sortDirection} />
                </div>
              </th>
              <th 
                className="px-4 py-3 text-left text-sm font-semibold cursor-pointer hover:bg-purple-700"
                onClick={() => handleSort('trainer')}
                aria-sort={sortField === 'trainer' ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none'}
              >
                <div className="flex items-center gap-2">
                  Trainer <SortIcon field="trainer" sortField={sortField} sortDirection={sortDirection} />
                </div>
              </th>
              <th 
                className="px-4 py-3 text-center text-sm font-semibold cursor-pointer hover:bg-purple-700"
                onClick={() => handleSort('rating')}
                aria-sort={sortField === 'rating' ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none'}
              >
                <div className="flex items-center gap-2 justify-center">
                  TTR Rating <SortIcon field="rating" sortField={sortField} sortDirection={sortDirection} />
                </div>
              </th>
              <th 
                className="px-4 py-3 text-center text-sm font-semibold cursor-pointer hover:bg-purple-700"
                onClick={() => handleSort('price')}
                aria-sort={sortField === 'price' ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none'}
              >
                <div className="flex items-center gap-2 justify-center">
                  TTR Price <SortIcon field="price" sortField={sortField} sortDirection={sortDirection} />
                </div>
              </th>
              <th 
                className="px-4 py-3 text-center text-sm font-semibold cursor-pointer hover:bg-purple-700"
                onClick={() => handleSort('tab_fixed_win')}
                aria-sort={sortField === 'tab_fixed_win' ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none'}
              >
                <div className="flex items-center gap-2 justify-center">
                  TAB Win <SortIcon field="tab_fixed_win" sortField={sortField} sortDirection={sortDirection} />
                </div>
              </th>
              <th 
                className="px-4 py-3 text-center text-sm font-semibold cursor-pointer hover:bg-purple-700"
                onClick={() => handleSort('tab_fixed_place')}
                aria-sort={sortField === 'tab_fixed_place' ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none'}
              >
                <div className="flex items-center gap-2 justify-center">
                  TAB Place <SortIcon field="tab_fixed_place" sortField={sortField} sortDirection={sortDirection} />
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedData.map((row, index) => {
              const rowKey = `${row.race_date}-${row.track || row.meeting_name}-${row.race_number}-${row.saddle_cloth}`;
              const isScratched = row.isScratched;
              const baseRowClass = !isScratched && index % 2 === 0 ? 'white' : !isScratched ? '#fafafa' : '';
              return (
                <tr 
                  key={rowKey}
                  className={`border-b border-gray-200 hover:bg-purple-50 transition-colors ${isScratched ? 'bg-red-50' : ''}`}
                  style={!isScratched ? { backgroundColor: baseRowClass } : undefined}
                >
                  <td className="px-4 py-3 text-sm text-gray-700">
                    {formatDate(row.race_date)}
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-block bg-blue-500 text-white px-3 py-1 rounded-full text-xs font-semibold">
                      {row.track || row.meeting_name || '-'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    <div className="font-medium">Race {row.race_number}</div>
                    <div className="text-xs text-gray-500">{row.race_name}</div>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <div className={row.isScratched ? 'line-through text-gray-500 font-bold' : 'font-bold text-gray-900'}>
                      {row.horse_name}
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
                  <td className={`px-4 py-3 text-sm ${row.isScratched ? 'text-gray-400 line-through' : 'text-gray-700'}`}>
                    {row.jockey || '-'}
                  </td>
                  <td className={`px-4 py-3 text-sm ${row.isScratched ? 'text-gray-400 line-through' : 'text-gray-700'}`}>
                    {row.trainer || '-'}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${row.isScratched ? 'bg-gray-300 text-gray-500 line-through' : 'bg-cyan-500 text-white'}`}>
                      {formatRating(row.rating)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${row.isScratched ? 'bg-gray-300 text-gray-500 line-through' : 'bg-green-600 text-white'}`}>
                      {formatPrice(row.price)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    {row.tab_fixed_win ? (
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${row.isScratched ? 'bg-gray-300 text-gray-500 line-through' : 'bg-orange-600 text-white'}`}>
                        {formatPrice(row.tab_fixed_win)}
                      </span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {row.tab_fixed_place ? (
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${row.isScratched ? 'bg-gray-300 text-gray-500 line-through' : 'bg-orange-600 text-white'}`}>
                        {formatPrice(row.tab_fixed_place)}
                      </span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
