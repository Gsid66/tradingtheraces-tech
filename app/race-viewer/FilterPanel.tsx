'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function FilterPanel() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Calculate default dates (both default to today)
  const today = new Date();

  const formatDate = (date: Date) => date.toISOString().split('T')[0];

  // State for date filters only
  const [dateFrom, setDateFrom] = useState(searchParams.get('dateFrom') || formatDate(today));
  const [dateTo, setDateTo] = useState(searchParams.get('dateTo') || formatDate(today));

  // Sync state with URL searchParams when they change
  useEffect(() => {
    const currentToday = new Date();
    setDateFrom(searchParams.get('dateFrom') || formatDate(currentToday));
    setDateTo(searchParams.get('dateTo') || formatDate(currentToday));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const applyFilters = () => {
    const params = new URLSearchParams();
    
    if (dateFrom) params.set('dateFrom', dateFrom);
    if (dateTo) params.set('dateTo', dateTo);

    router.push(`/race-viewer?${params.toString()}`);
  };

  const clearFilters = () => {
    // Reset both dates to current today
    const currentToday = new Date();
    
    setDateFrom(formatDate(currentToday));
    setDateTo(formatDate(currentToday));
    router.push('/race-viewer');
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 mb-6 border-2 border-purple-100">
      <h2 className="text-2xl font-bold text-purple-900 mb-4">Filter Race Data</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        {/* Start Date */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Start Date
          </label>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
        </div>

        {/* End Date */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            End Date
          </label>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
        </div>
      </div>

      <div className="flex gap-3">
        <button
          onClick={applyFilters}
          className="flex-1 bg-purple-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-purple-700 transition-colors"
        >
          Apply Filters
        </button>
        <button
          onClick={clearFilters}
          className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-colors"
        >
          Clear
        </button>
      </div>
    </div>
  );
}
