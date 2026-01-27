'use client';

import React, { useState } from 'react';
import { RaceCardData, SortField, SortDirection } from './types';
import { FiArrowUp, FiArrowDown, FiDownload } from 'react-icons/fi';

interface RaceDataTableProps {
  data: RaceCardData[];
}

// Sort icon component
function SortIcon({ field, sortField, sortDirection }: { field: SortField; sortField: SortField | null; sortDirection: SortDirection }) {
  if (sortField !== field) return null;
  return sortDirection === 'asc' ? <FiArrowUp /> : <FiArrowDown />;
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
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  const formatPrice = (price: number | null | undefined) => {
    if (price === null || price === undefined) return '-';
    return `$${price.toFixed(2)}`;
  };

  const exportToCSV = () => {
    const headers = [
      'Date', 'Track', 'Race', 'Saddle', 'Horse', 'Jockey', 'Trainer', 
      'Rating', 'Price', 'TAB Win', 'TAB Place'
    ];
    
    const rows = sortedData.map(row => [
      formatDate(row.date),
      row.meeting_name,
      `Race ${row.race_number}`,
      row.saddle_number,
      row.horse_name,
      row.jockey,
      row.trainer,
      row.rating,
      row.price.toFixed(2),
      row.tab_fixed_win_price ? row.tab_fixed_win_price.toFixed(2) : '-',
      row.tab_fixed_place_price ? row.tab_fixed_place_price.toFixed(2) : '-'
    ]);

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
    // For simplicity, we'll create a CSV with .xlsx extension
    // In a production app, you'd use a library like xlsx or exceljs
    const headers = [
      'Date', 'Track', 'Race', 'Saddle', 'Horse', 'Jockey', 'Trainer', 
      'Rating', 'Price', 'TAB Win', 'TAB Place'
    ];
    
    const rows = sortedData.map(row => [
      formatDate(row.date),
      row.meeting_name,
      `Race ${row.race_number}`,
      row.saddle_number,
      row.horse_name,
      row.jockey,
      row.trainer,
      row.rating,
      row.price.toFixed(2),
      row.tab_fixed_win_price ? row.tab_fixed_win_price.toFixed(2) : '-',
      row.tab_fixed_place_price ? row.tab_fixed_place_price.toFixed(2) : '-'
    ]);

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
        <p className="text-gray-500 text-lg">No data found. Try adjusting your filters.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden border-2 border-purple-100">
      {/* Export Buttons */}
      <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex gap-3">
        <button
          onClick={exportToCSV}
          className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 transition-colors"
        >
          <FiDownload />
          Export CSV
        </button>
        <button
          onClick={exportToExcel}
          className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 transition-colors"
        >
          <FiDownload />
          Export Excel
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-purple-600 text-white sticky top-0">
            <tr>
              <th 
                className="px-4 py-3 text-left text-sm font-semibold cursor-pointer hover:bg-purple-700"
                onClick={() => handleSort('date')}
              >
                <div className="flex items-center gap-2">
                  Date <SortIcon field="date" sortField={sortField} sortDirection={sortDirection} />
                </div>
              </th>
              <th 
                className="px-4 py-3 text-left text-sm font-semibold cursor-pointer hover:bg-purple-700"
                onClick={() => handleSort('meeting_name')}
              >
                <div className="flex items-center gap-2">
                  Track <SortIcon field="meeting_name" sortField={sortField} sortDirection={sortDirection} />
                </div>
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
                Saddle
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold">
                Horse
              </th>
              <th 
                className="px-4 py-3 text-left text-sm font-semibold cursor-pointer hover:bg-purple-700"
                onClick={() => handleSort('jockey')}
              >
                <div className="flex items-center gap-2">
                  Jockey <SortIcon field="jockey" sortField={sortField} sortDirection={sortDirection} />
                </div>
              </th>
              <th 
                className="px-4 py-3 text-left text-sm font-semibold cursor-pointer hover:bg-purple-700"
                onClick={() => handleSort('trainer')}
              >
                <div className="flex items-center gap-2">
                  Trainer <SortIcon field="trainer" sortField={sortField} sortDirection={sortDirection} />
                </div>
              </th>
              <th 
                className="px-4 py-3 text-center text-sm font-semibold cursor-pointer hover:bg-purple-700"
                onClick={() => handleSort('rating')}
              >
                <div className="flex items-center gap-2">
                  Rating <SortIcon field="rating" sortField={sortField} sortDirection={sortDirection} />
                </div>
              </th>
              <th 
                className="px-4 py-3 text-center text-sm font-semibold cursor-pointer hover:bg-purple-700"
                onClick={() => handleSort('price')}
              >
                <div className="flex items-center gap-2">
                  Price <SortIcon field="price" sortField={sortField} sortDirection={sortDirection} />
                </div>
              </th>
              <th 
                className="px-4 py-3 text-center text-sm font-semibold cursor-pointer hover:bg-purple-700"
                onClick={() => handleSort('tab_fixed_win_price')}
              >
                <div className="flex items-center gap-2">
                  TAB Win <SortIcon field="tab_fixed_win_price" sortField={sortField} sortDirection={sortDirection} />
                </div>
              </th>
              <th 
                className="px-4 py-3 text-center text-sm font-semibold cursor-pointer hover:bg-purple-700"
                onClick={() => handleSort('tab_fixed_place_price')}
              >
                <div className="flex items-center gap-2">
                  TAB Place <SortIcon field="tab_fixed_place_price" sortField={sortField} sortDirection={sortDirection} />
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedData.map((row, index) => (
              <tr 
                key={index}
                className="border-b border-gray-200 hover:bg-purple-50 transition-colors"
                style={{ backgroundColor: index % 2 === 0 ? 'white' : '#fafafa' }}
              >
                <td className="px-4 py-3 text-sm text-gray-700">
                  {formatDate(row.date)}
                </td>
                <td className="px-4 py-3">
                  <span className="inline-block bg-blue-500 text-white px-3 py-1 rounded-full text-xs font-semibold">
                    {row.meeting_name}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-gray-700">
                  <div className="font-medium">Race {row.race_number}</div>
                  <div className="text-xs text-gray-500">{row.race_name}</div>
                </td>
                <td className="px-4 py-3 text-center text-sm font-semibold text-gray-800">
                  {row.saddle_number}
                </td>
                <td className="px-4 py-3 text-sm font-bold text-gray-900">
                  {row.horse_name}
                </td>
                <td className="px-4 py-3 text-sm text-gray-700">
                  {row.jockey}
                </td>
                <td className="px-4 py-3 text-sm text-gray-700">
                  {row.trainer}
                </td>
                <td className="px-4 py-3 text-center">
                  <span className="inline-block bg-cyan-500 text-white px-3 py-1 rounded-full text-xs font-bold">
                    {row.rating}
                  </span>
                </td>
                <td className="px-4 py-3 text-center">
                  <span className="inline-block bg-green-600 text-white px-3 py-1 rounded-full text-xs font-semibold">
                    {formatPrice(row.price)}
                  </span>
                </td>
                <td className="px-4 py-3 text-center">
                  {row.tab_fixed_win_price ? (
                    <span className="inline-block bg-green-600 text-white px-3 py-1 rounded-full text-xs font-semibold">
                      {formatPrice(row.tab_fixed_win_price)}
                    </span>
                  ) : (
                    <span className="text-gray-400">-</span>
                  )}
                </td>
                <td className="px-4 py-3 text-center">
                  {row.tab_fixed_place_price ? (
                    <span className="inline-block bg-green-600 text-white px-3 py-1 rounded-full text-xs font-semibold">
                      {formatPrice(row.tab_fixed_place_price)}
                    </span>
                  ) : (
                    <span className="text-gray-400">-</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
