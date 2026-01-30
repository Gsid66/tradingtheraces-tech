'use client';

import React, { useState } from 'react';
import { RaceResultData, SortField, SortDirection } from './types';
import { FiArrowUp, FiArrowDown, FiDownload } from 'react-icons/fi';

interface RaceDataTableProps {
  data: RaceResultData[];
}

// Sort icon component
function SortIcon({ field, sortField, sortDirection }: { field: SortField; sortField: SortField | null; sortDirection: SortDirection }) {
  if (sortField !== field) return null;
  return sortDirection === 'asc' ? <FiArrowUp /> : <FiArrowDown />;
}

// Position badge component
function PositionBadge({ position }: { position: number }) {
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

      // Special handling for price and margin fields
      if (sortField === 'starting_price' || sortField === 'margin_to_winner') {
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
    if (typeof value === 'string') {
      const parsed = parseFloat(value);
      if (isNaN(parsed)) return '-';
      return `$${parsed.toFixed(2)}`;
    }
    if (value == null || typeof value !== 'number' || isNaN(value)) return '-';
    return `$${value.toFixed(2)}`;
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
      'Date', 'Track', 'State', 'Race No', 'Race Name', 'Distance', 
      'Position', 'Tab No', 'Horse', 'Jockey', 'Trainer', 'SP', 'Margin'
    ];
    
    const rows = sortedData.map(row => [
      formatDate(row.meeting_date),
      row.track_name,
      row.state,
      row.race_number,
      row.race_name,
      `${row.distance}m`,
      row.finishing_position,
      row.tab_number,
      row.horse_name,
      row.jockey_name,
      row.trainer_name,
      formatPrice(row.starting_price).replace('$', ''),
      formatMargin(row.margin_to_winner)
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
    a.download = `ttr-results-${new Date().toISOString().split('T')[0]}.csv`;
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
    a.download = `ttr-results-${new Date().toISOString().split('T')[0]}.xlsx`;
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
        <p className="text-gray-400 text-sm mt-2">Try adjusting your search filters</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden border-2 border-purple-100">
      {/* Export Buttons */}
      <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex justify-between items-center">
        <div className="text-sm text-gray-600">
          Showing <span className="font-bold text-purple-600">{sortedData.length}</span> results
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

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-purple-600 text-white sticky top-0">
            <tr>
              <th 
                className="px-4 py-3 text-left text-sm font-semibold cursor-pointer hover:bg-purple-700"
                onClick={() => handleSort('meeting_date')}
              >
                <div className="flex items-center gap-2">
                  Date <SortIcon field="meeting_date" sortField={sortField} sortDirection={sortDirection} />
                </div>
              </th>
              <th 
                className="px-4 py-3 text-left text-sm font-semibold cursor-pointer hover:bg-purple-700"
                onClick={() => handleSort('track_name')}
              >
                <div className="flex items-center gap-2">
                  Track <SortIcon field="track_name" sortField={sortField} sortDirection={sortDirection} />
                </div>
              </th>
              <th className="px-4 py-3 text-center text-sm font-semibold">
                State
              </th>
              <th 
                className="px-4 py-3 text-left text-sm font-semibold cursor-pointer hover:bg-purple-700"
                onClick={() => handleSort('race_number')}
              >
                <div className="flex items-center gap-2">
                  Race <SortIcon field="race_number" sortField={sortField} sortDirection={sortDirection} />
                </div>
              </th>
              <th className="px-4 py-3 text-center text-sm font-semibold">
                Pos
              </th>
              <th className="px-4 py-3 text-center text-sm font-semibold">
                Tab
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold">
                Horse
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold">
                Jockey
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold">
                Trainer
              </th>
              <th 
                className="px-4 py-3 text-center text-sm font-semibold cursor-pointer hover:bg-purple-700"
                onClick={() => handleSort('starting_price')}
              >
                <div className="flex items-center gap-2">
                  SP <SortIcon field="starting_price" sortField={sortField} sortDirection={sortDirection} />
                </div>
              </th>
              <th className="px-4 py-3 text-center text-sm font-semibold">
                Margin
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedData.map((row, index) => {
              const rowKey = `${row.result_id}-${index}`;
              return (
                <tr 
                  key={rowKey}
                  className="border-b border-gray-200 hover:bg-purple-50 transition-colors"
                  style={{ backgroundColor: index % 2 === 0 ? 'white' : '#fafafa' }}
                >
                  <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">
                    {formatDate(row.meeting_date)}
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-block bg-blue-500 text-white px-3 py-1 rounded-full text-xs font-semibold">
                      {row.track_name}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center text-sm font-medium text-gray-700">
                    {row.state}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    <div className="font-medium">R{row.race_number}</div>
                    <div className="text-xs text-gray-500">{row.distance}m</div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <PositionBadge position={row.finishing_position} />
                  </td>
                  <td className="px-4 py-3 text-center text-sm font-semibold text-gray-800">
                    {row.tab_number}
                  </td>
                  <td className="px-4 py-3 text-sm font-bold text-gray-900">
                    {row.horse_name}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    {row.jockey_name}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    {row.trainer_name}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="inline-block bg-green-600 text-white px-3 py-1 rounded-full text-xs font-semibold">
                      {formatPrice(row.starting_price)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center text-sm text-gray-700">
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
