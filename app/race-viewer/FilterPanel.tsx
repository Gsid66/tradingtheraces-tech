'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function FilterPanel() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Calculate default dates
  const today = new Date();
  const oneYearAgo = new Date(today);
  oneYearAgo.setFullYear(today.getFullYear() - 1);

  const formatDate = (date: Date) => date.toISOString().split('T')[0];

  // State for all filters
  const [dateFrom, setDateFrom] = useState(searchParams.get('dateFrom') || formatDate(oneYearAgo));
  const [dateTo, setDateTo] = useState(searchParams.get('dateTo') || formatDate(today));
  const [track, setTrack] = useState(searchParams.get('meeting_name') || '');
  const [state, setState] = useState(searchParams.get('state') || '');
  const [raceNumber, setRaceNumber] = useState(searchParams.get('race_number') || '');
  const [horseName, setHorseName] = useState(searchParams.get('horse_name') || '');
  const [jockey, setJockey] = useState(searchParams.get('jockey') || '');
  const [trainer, setTrainer] = useState(searchParams.get('trainer') || '');
  const [minRating, setMinRating] = useState(searchParams.get('minRating') || '');
  const [maxRating, setMaxRating] = useState(searchParams.get('maxRating') || '');
  const [perPage, setPerPage] = useState(searchParams.get('perPage') || '50');

  // Sync state with URL searchParams when they change
  useEffect(() => {
    // Use the same default dates as defined at component level
    setDateFrom(searchParams.get('dateFrom') || formatDate(oneYearAgo));
    setDateTo(searchParams.get('dateTo') || formatDate(today));
    setTrack(searchParams.get('meeting_name') || '');
    setState(searchParams.get('state') || '');
    setRaceNumber(searchParams.get('race_number') || '');
    setHorseName(searchParams.get('horse_name') || '');
    setJockey(searchParams.get('jockey') || '');
    setTrainer(searchParams.get('trainer') || '');
    setMinRating(searchParams.get('minRating') || '');
    setMaxRating(searchParams.get('maxRating') || '');
    setPerPage(searchParams.get('perPage') || '50');
  }, [searchParams, today, oneYearAgo]);

  const states = ['All States', 'NSW', 'VIC', 'QLD', 'SA', 'WA', 'TAS', 'NT', 'ACT'];
  const perPageOptions = ['25', '50', '100', '200'];

  const applyFilters = () => {
    const params = new URLSearchParams();
    
    if (dateFrom) params.set('dateFrom', dateFrom);
    if (dateTo) params.set('dateTo', dateTo);
    if (track) params.set('meeting_name', track);
    if (state && state !== 'All States') params.set('state', state);
    if (raceNumber) params.set('race_number', raceNumber);
    if (horseName) params.set('horse_name', horseName);
    if (jockey) params.set('jockey', jockey);
    if (trainer) params.set('trainer', trainer);
    if (minRating) params.set('minRating', minRating);
    if (maxRating) params.set('maxRating', maxRating);
    params.set('perPage', perPage);
    params.set('page', '1'); // Reset to page 1 when filters change

    router.push(`/race-viewer?${params.toString()}`);
  };

  const clearFilters = () => {
    // Recalculate dates to ensure fresh values
    const currentToday = new Date();
    const currentOneYearAgo = new Date(currentToday);
    currentOneYearAgo.setFullYear(currentToday.getFullYear() - 1);
    
    setDateFrom(formatDate(currentOneYearAgo));
    setDateTo(formatDate(currentToday));
    setTrack('');
    setState('');
    setRaceNumber('');
    setHorseName('');
    setJockey('');
    setTrainer('');
    setMinRating('');
    setMaxRating('');
    setPerPage('50');
    router.push('/race-viewer');
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 mb-6 border-2 border-purple-100">
      <h2 className="text-2xl font-bold text-purple-900 mb-4">Filter Race Data</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-4">
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

        {/* Track */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Track
          </label>
          <input
            type="text"
            value={track}
            onChange={(e) => setTrack(e.target.value)}
            placeholder="All Tracks"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
        </div>

        {/* State */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            State
          </label>
          <select
            value={state}
            onChange={(e) => setState(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          >
            {states.map((s) => (
              <option key={s} value={s === 'All States' ? '' : s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        {/* Race Number */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Race Number
          </label>
          <input
            type="number"
            min="1"
            max="12"
            value={raceNumber}
            onChange={(e) => setRaceNumber(e.target.value)}
            placeholder="All Races"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
        </div>

        {/* Horse Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Horse Name
          </label>
          <input
            type="text"
            value={horseName}
            onChange={(e) => setHorseName(e.target.value)}
            placeholder="Search horse..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
        </div>

        {/* Jockey */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Jockey
          </label>
          <input
            type="text"
            value={jockey}
            onChange={(e) => setJockey(e.target.value)}
            placeholder="All Jockeys"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
        </div>

        {/* Trainer */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Trainer
          </label>
          <input
            type="text"
            value={trainer}
            onChange={(e) => setTrainer(e.target.value)}
            placeholder="Search trainer..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
        </div>

        {/* Min TTR Rating */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Min TTR Rating
          </label>
          <input
            type="number"
            min="0"
            max="100"
            value={minRating}
            onChange={(e) => setMinRating(e.target.value)}
            placeholder="0"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
        </div>

        {/* Max TTR Rating */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Max TTR Rating
          </label>
          <input
            type="number"
            min="0"
            max="100"
            value={maxRating}
            onChange={(e) => setMaxRating(e.target.value)}
            placeholder="100"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
        </div>

        {/* Records Per Page */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Records Per Page
          </label>
          <select
            value={perPage}
            onChange={(e) => setPerPage(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          >
            {perPageOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
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
