'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function FilterPanel() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Calculate default dates (both default to today)
  const today = new Date();
  const formatDate = (date: Date) => date.toISOString().split('T')[0];

  // State for all filters
  const [dateFrom, setDateFrom] = useState(searchParams.get('dateFrom') || formatDate(today));
  const [dateTo, setDateTo] = useState(searchParams.get('dateTo') || formatDate(today));
  const [horseName, setHorseName] = useState(searchParams.get('horseName') || '');
  const [jockeyName, setJockeyName] = useState(searchParams.get('jockeyName') || '');
  const [trainerName, setTrainerName] = useState(searchParams.get('trainerName') || '');
  const [trackName, setTrackName] = useState(searchParams.get('trackName') || '');
  const [state, setState] = useState(searchParams.get('state') || '');
  const [position, setPosition] = useState(searchParams.get('position') || '');

  // Sync state with URL searchParams when they change
  useEffect(() => {
    setDateFrom(searchParams.get('dateFrom') || formatDate(today));
    setDateTo(searchParams.get('dateTo') || formatDate(today));
    setHorseName(searchParams.get('horseName') || '');
    setJockeyName(searchParams.get('jockeyName') || '');
    setTrainerName(searchParams.get('trainerName') || '');
    setTrackName(searchParams.get('trackName') || '');
    setState(searchParams.get('state') || '');
    setPosition(searchParams.get('position') || '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const applyFilters = () => {
    // Validate date range
    if (dateFrom && dateTo && dateFrom > dateTo) {
      alert('Start date cannot be after end date. Please adjust your date range.');
      return;
    }
    
    const params = new URLSearchParams();
    
    if (dateFrom) params.set('dateFrom', dateFrom);
    if (dateTo) params.set('dateTo', dateTo);
    if (horseName) params.set('horseName', horseName);
    if (jockeyName) params.set('jockeyName', jockeyName);
    if (trainerName) params.set('trainerName', trainerName);
    if (trackName) params.set('trackName', trackName);
    if (state) params.set('state', state);
    if (position) params.set('position', position);

    router.push(`/race-viewer?${params.toString()}`);
  };

  const clearFilters = () => {
    // Reset all filters
    const currentToday = new Date();
    
    setDateFrom(formatDate(currentToday));
    setDateTo(formatDate(currentToday));
    setHorseName('');
    setJockeyName('');
    setTrainerName('');
    setTrackName('');
    setState('');
    setPosition('');
    router.push('/race-viewer');
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 mb-6 border-2 border-purple-100">
      <h2 className="text-2xl font-bold text-purple-900 mb-4">🔍 Search Race Results</h2>
      
      {/* Date Range Section */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-3">📅 Date Range</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
      </div>

      {/* Search Fields Section */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-3">🔎 Search Filters</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Horse Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              🐴 Horse Name
            </label>
            <input
              type="text"
              value={horseName}
              onChange={(e) => setHorseName(e.target.value)}
              placeholder="e.g. Black Caviar"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          {/* Jockey Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              👤 Jockey Name
            </label>
            <input
              type="text"
              value={jockeyName}
              onChange={(e) => setJockeyName(e.target.value)}
              placeholder="e.g. James McDonald"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          {/* Trainer Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              👨‍🏫 Trainer Name
            </label>
            <input
              type="text"
              value={trainerName}
              onChange={(e) => setTrainerName(e.target.value)}
              placeholder="e.g. Chris Waller"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          {/* Track Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              🏇 Track Name
            </label>
            <input
              type="text"
              value={trackName}
              onChange={(e) => setTrackName(e.target.value)}
              placeholder="e.g. Flemington"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          {/* State */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              📍 State
            </label>
            <select
              value={state}
              onChange={(e) => setState(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="">All States</option>
              <option value="NSW">NSW</option>
              <option value="VIC">VIC</option>
              <option value="QLD">QLD</option>
              <option value="SA">SA</option>
              <option value="WA">WA</option>
              <option value="TAS">TAS</option>
              <option value="NT">NT</option>
              <option value="ACT">ACT</option>
            </select>
          </div>

          {/* Position */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              🏆 Finishing Position
            </label>
            <select
              value={position}
              onChange={(e) => setPosition(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="">All Positions</option>
              <option value="1">1st Place 🥇</option>
              <option value="2">2nd Place 🥈</option>
              <option value="3">3rd Place 🥉</option>
              <option value="4">4th Place</option>
              <option value="5">5th Place</option>
              <option value="6">6th Place</option>
              <option value="7">7th Place</option>
              <option value="8">8th Place</option>
              <option value="9">9th Place</option>
              <option value="10">10th Place</option>
            </select>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <button
          onClick={applyFilters}
          className="flex-1 bg-purple-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-purple-700 transition-colors shadow-md hover:shadow-lg"
        >
          🔍 Search Results
        </button>
        <button
          onClick={clearFilters}
          className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-colors"
        >
          ✖️ Clear All
        </button>
      </div>
    </div>
  );
}
