'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { FiX } from 'react-icons/fi';

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

  const removeFilter = (filterName: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete(filterName);
    
    // Update state
    switch (filterName) {
      case 'horseName':
        setHorseName('');
        break;
      case 'jockeyName':
        setJockeyName('');
        break;
      case 'trainerName':
        setTrainerName('');
        break;
      case 'trackName':
        setTrackName('');
        break;
      case 'state':
        setState('');
        break;
      case 'position':
        setPosition('');
        break;
    }
    
    router.push(`/race-viewer?${params.toString()}`);
  };

  // Get active filters (excluding dates)
  const activeFilters = [];
  if (horseName) activeFilters.push({ name: 'horseName', label: 'Horse', value: horseName });
  if (jockeyName) activeFilters.push({ name: 'jockeyName', label: 'Jockey', value: jockeyName });
  if (trainerName) activeFilters.push({ name: 'trainerName', label: 'Trainer', value: trainerName });
  if (trackName) activeFilters.push({ name: 'trackName', label: 'Track', value: trackName });
  if (state) activeFilters.push({ name: 'state', label: 'State', value: state });
  if (position) activeFilters.push({ name: 'position', label: 'Position', value: getPositionLabel(position) });

  function getPositionLabel(pos: string): string {
    const positions: { [key: string]: string } = {
      '1': '1st 🥇',
      '2': '2nd 🥈',
      '3': '3rd 🥉',
      '4': '4th',
      '5': '5th',
      '6': '6th',
      '7': '7th',
      '8': '8th',
      '9': '9th',
      '10': '10th',
    };
    return positions[pos] || pos;
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 mb-6 border-2 border-purple-100">
      <h2 className="text-2xl font-bold text-purple-900 mb-4">🔍 Search Race Results</h2>
      
      {/* Active Filters Display */}
      {activeFilters.length > 0 && (
        <div className="mb-6 p-4 bg-purple-50 rounded-lg border border-purple-200">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-purple-900">Active Filters:</h3>
            <button
              onClick={() => {
                setHorseName('');
                setJockeyName('');
                setTrainerName('');
                setTrackName('');
                setState('');
                setPosition('');
                const params = new URLSearchParams();
                params.set('dateFrom', dateFrom);
                params.set('dateTo', dateTo);
                router.push(`/race-viewer?${params.toString()}`);
              }}
              className="text-xs text-purple-600 hover:text-purple-800 font-medium"
            >
              Clear All Filters
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {activeFilters.map((filter) => (
              <div
                key={filter.name}
                className="inline-flex items-center gap-2 bg-white border-2 border-purple-300 rounded-full px-3 py-1.5 text-sm"
              >
                <span className="font-semibold text-purple-700">{filter.label}:</span>
                <span className="text-gray-700">{filter.value}</span>
                <button
                  onClick={() => removeFilter(filter.name)}
                  className="ml-1 text-purple-600 hover:text-purple-800 hover:bg-purple-100 rounded-full p-0.5"
                  title={`Remove ${filter.label} filter`}
                >
                  <FiX size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

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
            {horseName && (
              <div className="mt-1 text-xs text-purple-600 font-medium">
                Searching: "{horseName}"
              </div>
            )}
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
            {jockeyName && (
              <div className="mt-1 text-xs text-purple-600 font-medium">
                Searching: "{jockeyName}"
              </div>
            )}
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
            {trainerName && (
              <div className="mt-1 text-xs text-purple-600 font-medium">
                Searching: "{trainerName}"
              </div>
            )}
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
            {trackName && (
              <div className="mt-1 text-xs text-purple-600 font-medium">
                Searching: "{trackName}"
              </div>
            )}
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
            {state && (
              <div className="mt-1 text-xs text-purple-600 font-medium">
                Selected: {state}
              </div>
            )}
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
            {position && (
              <div className="mt-1 text-xs text-purple-600 font-medium">
                Selected: {getPositionLabel(position)}
              </div>
            )}
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
