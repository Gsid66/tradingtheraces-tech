'use client';

import { useState } from 'react';
import MergedRatingsTable from './MergedRatingsTable';
import { formatInTimeZone } from 'date-fns-tz';
import { parse } from 'date-fns';

interface MergedRatingsData {
  date: string;
  track: string;
  raceNumber: number;
  raceName: string;
  saddleCloth: number;
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

interface Props {
  initialDate: string;
  initialData: MergedRatingsData[];
}

export default function MergedRatingsClient({ initialDate, initialData }: Props) {
  const [selectedDate, setSelectedDate] = useState(initialDate);
  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Debug: Log initial data on component mount (helps track data flow issues)
  console.log('🎨 MergedRatingsClient mounted with data:', {
    date: initialDate,
    totalRunners: initialData.length,
    uniqueTracks: [...new Set(initialData.map(d => d.track))].length,
    uniqueRaces: [...new Set(initialData.map(d => `${d.track}-R${d.raceNumber}`))].length
  });

  const handleDateChange = async (newDate: string) => {
    if (newDate === selectedDate) return;

    console.log(`📅 Fetching data for date: ${newDate}`);
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/merged-ratings?date=${newDate}`);
      console.log(`📡 API Response status: ${response.status}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch data: ${response.statusText}`);
      }

      const result = await response.json();
      console.log(`📦 API Response:`, {
        success: result.success,
        count: result.count,
        date: result.date,
        dataLength: result.data?.length
      });

      if (result.success) {
        console.log(`✅ Setting data with ${result.data.length} runners`);
        setData(result.data);
        setSelectedDate(newDate);
      } else {
        setError(result.error || 'Failed to fetch data');
        console.error('❌ API returned failure:', result.error);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error fetching merged ratings';
      setError(errorMessage);
      console.error('❌ Error fetching merged ratings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTodayClick = () => {
    const todaySydney = formatInTimeZone(new Date(), 'Australia/Sydney', 'yyyy-MM-dd');
    handleDateChange(todaySydney);
  };

  // Format the selected date for display
  const dateObj = parse(selectedDate, 'yyyy-MM-dd', new Date());
  const formattedDate = dateObj.toLocaleDateString('en-AU', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 via-purple-700 to-indigo-700 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-4xl font-bold mb-2">Merged Ratings - RVO + TTR Analysis</h1>
              <p className="text-purple-100 text-lg">
                Australia & New Zealand races with combined ratings
              </p>
              <p className="text-purple-200 text-sm mt-1">
                {formattedDate}
              </p>
            </div>

            {/* Date Selector */}
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => handleDateChange(e.target.value)}
                disabled={loading}
                className="px-4 py-2 rounded-lg text-gray-900 font-medium focus:outline-none focus:ring-2 focus:ring-white disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <button
                onClick={handleTodayClick}
                disabled={loading}
                className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed backdrop-blur-sm"
              >
                Today (AEDT)
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
            <p className="font-medium">Error loading data</p>
            <p className="text-sm mt-1">{error}</p>
          </div>
        )}
        
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="flex flex-col items-center gap-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
              <p className="text-gray-600 text-lg">Loading data...</p>
            </div>
          </div>
        ) : data.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-6 py-4 rounded-lg">
              <p className="font-medium text-lg mb-2">No races found for this date</p>
              <p className="text-sm">Try selecting a different date to view available races.</p>
            </div>
          </div>
        ) : (
          <MergedRatingsTable data={data} />
        )}
      </div>
    </div>
  );
}
