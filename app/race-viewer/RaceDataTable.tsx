'use client';

import React, { useState, useRef, useEffect } from 'react';
import { CombinedRaceData, SortField, SortDirection } from './types';
import { FiArrowUp, FiArrowDown, FiDownload } from 'react-icons/fi';

interface RaceDataTableProps {
  data: CombinedRaceData[];
}

// Sort icon component
function SortIcon({ field, sortField, sortDirection }: { field: SortField; sortField: SortField | null; sortDirection: SortDirection }) {
  if (sortField !== field) return null;
  return sortDirection === 'asc' ? <FiArrowUp /> : <FiArrowDown />;
}

// Position badge component
function PositionBadge({ position }: { position?: number }) {
  if (!position) return <span className="text-gray-400 text-sm">-</span>;

  const getPositionStyle = () => {
    switch (position) {
      case 1:
        return 'bg-yellow-400 text-yellow-900 border-2 border-yellow-600';
      case 2:
        return 'bg-gray-300 text-gray-900 border-2 border-gray-500';
      case 3:
        return 'bg-orange-400 text-orange-900 border-2 border-orange-600';
      default:
        return 'bg-gray-100 text-gray-700 border-2 border-gray-300';
    }
  };

  const getEmoji = () => {
    switch (position) {
      case 1: return '🥇';
      case 2: return '🥈';
      case 3: return '🥉';
      default: return '';
    }
  };

  return (
    <span className={`inline-flex items-center justify-center w-10 h-10 rounded-full text-sm font-bold ${getPositionStyle()}`}>
      {position <= 3 ? getEmoji() : position}
    </span>
  );
}

export default function RaceDataTable({ data }: RaceDataTableProps) {
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  
  // Refs for synchronized scrolling
  const topScrollRef = useRef<HTMLDivElement>(null);
  const tableScrollRef = useRef<HTMLDivElement>(null);

  // Sync scroll between top bar and table
  useEffect(() => {
    const topScroll = topScrollRef.current;
    const tableScroll = tableScrollRef.current;

    if (!topScroll || !tableScroll) return;

    const handleTopScroll = () => {
      if (tableScroll) {
        tableScroll.scrollLeft = topScroll.scrollLeft;
      }
    };

    const handleTableScroll = () => {
      if (topScroll) {
        topScroll.scrollLeft = tableScroll.scrollLeft;
      }
    };

    topScroll.addEventListener('scroll', handleTopScroll);
    tableScroll.addEventListener('scroll', handleTableScroll);

    return () => {
      topScroll.removeEventListener('scroll', handleTopScroll);
      tableScroll.removeEventListener('scroll', handleTableScroll);
    };
  }, []);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortedData = React.useMemo(() => {
    if (!sortField) return data;

    return [...data].sort((a, b) => {
      const aVal = a[sortField];
      const bVal = b[sortField];

      if (aVal === null || aVal === undefined) return 1;
      if (bVal === null || bVal === undefined) return -1;

      // Special handling for numeric fields
      if (sortField === 'price' || sortField === 'starting_price' || sortField === 'margin_to_winner' || sortField === 'rating') {
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
  }, [data, sortField, sortDirection]);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-AU', { 
      weekday: 'short',
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  const formatPrice = (value: any): string => {
    if (!value) return '-';
    if (typeof value === 'string') {
      const parsed = parseFloat(value);
      if (isNaN(parsed)) return '-';
      return `$${parsed.toFixed(2)}`;
    }
    if (typeof value !== 'number' || isNaN(value)) return '-';
    return `$${value.toFixed(2)}`;
  };

  const formatRating = (value: any): string => {
    if (value == null || typeof value !== 'number' || isNaN(value)) return '-';
    return value.toString();
  };

  const formatMargin = (value: any): string => {
    if (!value) return '-';
    const str = String(value).toUpperCase();
    
    if (['NECK', 'HEAD', 'NOSE', 'SHORT HEAD', 'LONG HEAD', 'SHORT NECK'].includes(str)) {
      return str;
    }
    
    const num = parseFloat(String(value));
    if (!isNaN(num)) {
      return `${num.toFixed(2)}L`;
    }
    
    return str;
  };

  const prepareExportData = () => {
    const headers = [
      'Date', 'Track', 'State', 'Race No', 'Race Name', 'Saddle', 
      'Horse', 'Jockey', 'Trainer', 'Rating', 'Price', 
      'Result', 'SP', 'Margin', 'Tab No'
    ];
    
    const rows = sortedData.map(row => [
      formatDate(row.race_date),
      row.track_name,
      row.state || '-',
      row.race_number,
      row.race_name,
      row.saddle_cloth,
      row.horse_name,
      row.jockey_name,
      row.trainer_name,
      formatRating(row.rating),
      formatPrice(row.price).replace('$', ''),
      row.finishing_position || '-',
      formatPrice(row.starting_price).replace('$', ''),
      formatMargin(row.margin_to_winner),
      row.tab_number || '-'
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
    a.download = `ttr-race-data-${new Date().toISOString().split('T')[0]}.csv`;
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
    a.download = `ttr-race-data-${new Date().toISOString().split('T')[0]}.xlsx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (data.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-12 text-center border-2 border-purple-100">
        <div className="text-6xl mb-4">🔍</div>
        <p className="text-gray-500 text-lg font-medium">No results found</p>
        <p className="text-gray-400 text-sm mt-2">Try adjusting your search filters or date range</p>
        <p className="text-gray-400 text-xs mt-1">Note: This database shows historical TTR ratings data</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden border-2 border-purple-100">
      {/* Export Buttons */}
      <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex justify-between items-center flex-wrap gap-4">
        <div className="text-sm text-gray-600">
          Showing <span className="font-bold text-purple-600">{sortedData.length}</span> records
          {sortedData.filter(r => r.finishing_position).length > 0 && (
            <span className="ml-2">
              • <span className="font-bold text-green-600">{sortedData.filter(r => r.finishing_position).length}</span> with results
            </span>
          )}
        </div>
        <div className="flex gap-3">
          <button
            onClick={exportToCSV}
            className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 transition-colors shadow-md hover:shadow-lg"
          >
            <FiDownload />
            Export CSV
          </button>
          <button
            onClick={exportToExcel}
            className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 transition-colors shadow-md hover:shadow-lg"
          >
            <FiDownload />
            Export Excel
          </button>
        </div>
      </div>

      {/* Top Scroll Bar */}
      <div 
        ref={topScrollRef}
        className="overflow-x-auto bg-purple-100 border-b border-purple-200"
        style={{ height: '20px' }}
      >
        <div style={{ width: '1600px', height: '1px' }}></div>
      </div>

      {/* Table */}
      <div ref={tableScrollRef} className="overflow-x-auto">
        <table className="w-full" style={{ minWidth: '1600px' }}>
          <thead className="bg-purple-600 text-white sticky top-0">
            <tr>
              <th 
                className="px-3 py-2 text-left text-xs font-semibold cursor-pointer hover:bg-purple-700 whitespace-nowrap"
                onClick={() => handleSort('race_date')}
              >
                <div className="flex items-center gap-1">
                  Date <SortIcon field="race_date" sortField={sortField} sortDirection={sortDirection} />
                </div>
              </th>
              <th 
                className="px-3 py-2 text-left text-xs font-semibold cursor-pointer hover:bg-purple-700 whitespace-nowrap"
                onClick={() => handleSort('track_name')}
              >
                <div className="flex items-center gap-1">
                  Track <SortIcon field="track_name" sortField={sortField} sortDirection={sortDirection} />
                </div>
              </th>
              <th className="px-3 py-2 text-center text-xs font-semibold whitespace-nowrap">
                State
              </th>
              <th 
                className="px-3 py-2 text-left text-xs font-semibold cursor-pointer hover:bg-purple-700 whitespace-nowrap"
                onClick={() => handleSort('race_number')}
              >
                <div className="flex items-center gap-1">
                  Race <SortIcon field="race_number" sortField={sortField} sortDirection={sortDirection} />
                </div>
              </th>
              <th className="px-3 py-2 text-center text-xs font-semibold whitespace-nowrap">
                Saddle
              </th>
              <th className="px-3 py-2 text-left text-xs font-semibold whitespace-nowrap">
                Horse
              </th>
              <th className="px-3 py-2 text-left text-xs font-semibold whitespace-nowrap">
                Jockey
              </th>
              <th className="px-3 py-2 text-left text-xs font-semibold whitespace-nowrap">
                Trainer
              </th>
              <th 
                className="px-3 py-2 text-center text-xs font-semibold cursor-pointer hover:bg-purple-700 whitespace-nowrap"
                onClick={() => handleSort('rating')}
              >
                <div className="flex items-center gap-1 justify-center">
                  Rating <SortIcon field="rating" sortField={sortField} sortDirection={sortDirection} />
                </div>
              </th>
              <th 
                className="px-3 py-2 text-center text-xs font-semibold cursor-pointer hover:bg-purple-700 whitespace-nowrap"
                onClick={() => handleSort('price')}
              >
                <div className="flex items-center gap-1 justify-center">
                  Price <SortIcon field="price" sortField={sortField} sortDirection={sortDirection} />
                </div>
              </th>
              <th 
                className="px-3 py-2 text-center text-xs font-semibold cursor-pointer hover:bg-purple-700 whitespace-nowrap"
                onClick={() => handleSort('finishing_position')}
              >
                <div className="flex items-center gap-1 justify-center">
                  Result <SortIcon field="finishing_position" sortField={sortField} sortDirection={sortDirection} />
                </div>
              </th>
              <th 
                className="px-3 py-2 text-center text-xs font-semibold cursor-pointer hover:bg-purple-700 whitespace-nowrap"
                onClick={() => handleSort('starting_price')}
              >
                <div className="flex items-center gap-1 justify-center">
                  SP <SortIcon field="starting_price" sortField={sortField} sortDirection={sortDirection} />
                </div>
              </th>
              <th className="px-3 py-2 text-center text-xs font-semibold whitespace-nowrap">
                Margin
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedData.map((row, index) => {
              const rowKey = `${row.id}-${index}`;
              const hasResult = row.finishing_position !== null && row.finishing_position !== undefined;
              
              return (
                <tr 
                  key={rowKey}
                  className={`border-b border-gray-200 hover:bg-purple-50 transition-colors ${hasResult ? 'bg-green-50' : ''}`}
                  style={{ backgroundColor: hasResult ? '#f0fdf4' : (index % 2 === 0 ? 'white' : '#fafafa') }}
                >
                  <td className="px-3 py-2 text-xs text-gray-700 whitespace-nowrap">
                    {formatDate(row.race_date)}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    <span className="inline-block bg-blue-500 text-white px-2 py-1 rounded-full text-xs font-semibold">
                      {row.track_name}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-center text-xs font-medium text-gray-700">
                    {row.state || '-'}
                  </td>
                  <td className="px-3 py-2 text-xs text-gray-700">
                    <div className="font-medium">R{row.race_number}</div>
                    <div className="text-xs text-gray-500 truncate max-w-[100px]">{row.race_name}</div>
                  </td>
                  <td className="px-3 py-2 text-center text-xs font-semibold text-gray-800">
                    {row.saddle_cloth}
                  </td>
                  <td className="px-3 py-2 text-xs font-bold text-gray-900 whitespace-nowrap">
                    {row.horse_name}
                  </td>
                  <td className="px-3 py-2 text-xs text-gray-700 whitespace-nowrap">
                    {row.jockey_name}
                  </td>
                  <td className="px-3 py-2 text-xs text-gray-700 whitespace-nowrap">
                    {row.trainer_name}
                  </td>
                  <td className="px-3 py-2 text-center">
                    <span className="inline-block bg-cyan-500 text-white px-2 py-1 rounded-full text-xs font-bold">
                      {formatRating(row.rating)}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-center">
                    <span className="inline-block bg-blue-600 text-white px-2 py-1 rounded-full text-xs font-semibold">
                      {formatPrice(row.price)}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-center">
                    <PositionBadge position={row.finishing_position} />
                  </td>
                  <td className="px-3 py-2 text-center">
                    {row.starting_price ? (
                      <span className="inline-block bg-green-600 text-white px-2 py-1 rounded-full text-xs font-semibold">
                        {formatPrice(row.starting_price)}
                      </span>
                    ) : (
                      <span className="text-gray-400 text-xs">-</span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-center text-xs text-gray-700">
                    {formatMargin(row.margin_to_winner)}
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