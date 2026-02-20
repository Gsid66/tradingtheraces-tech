'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import MergedRatingsTable from '../MergedRatingsTable';
import { parse } from 'date-fns';

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
  finishingPosition: number | null;
  startingPrice: number | null;
  marginToWinner: string | null;
}

interface Props {
  availableDates: string[];
  initialDate: string;
  initialData: MergedRatingsData[];
}

export default function AllResultsClient({ availableDates, initialDate, initialData }: Props) {
  const [selectedDate, setSelectedDate] = useState(initialDate);
  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDateChange = async (newDate: string) => {
    if (newDate === selectedDate) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/merged-ratings?date=${newDate}`);

      if (!response.ok) {
        throw new Error(`Failed to fetch data: ${response.statusText}`);
      }

      const result = await response.json();

      if (result.success) {
        setData(result.data);
        setSelectedDate(newDate);
      } else {
        setError(result.error || 'Failed to fetch data');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error fetching merged ratings');
    } finally {
      setLoading(false);
    }
  };

  const formattedDate = useMemo(() => {
    if (!selectedDate) return '';
    return parse(selectedDate, 'yyyy-MM-dd', new Date()).toLocaleDateString('en-AU', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }, [selectedDate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 via-purple-700 to-indigo-700 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="mb-2">
                <Link
                  href="/merged-ratings"
                  className="text-purple-200 hover:text-white text-sm transition-colors"
                >
                  ← Back to Merged Ratings
                </Link>
              </div>
              <h1 className="text-4xl font-bold mb-2">All Merged Ratings Results</h1>
              <p className="text-purple-100 text-lg">
                Historical results by date — Australia &amp; New Zealand
              </p>
              {formattedDate && (
                <p className="text-purple-200 text-sm mt-1">{formattedDate}</p>
              )}
            </div>

            {/* Date Selector */}
            <div className="flex flex-col sm:flex-row gap-2">
              {availableDates.length > 0 ? (
                <select
                  value={selectedDate}
                  onChange={(e) => handleDateChange(e.target.value)}
                  disabled={loading}
                  className="px-4 py-2 rounded-lg text-gray-900 font-medium focus:outline-none focus:ring-2 focus:ring-white disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {availableDates.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => handleDateChange(e.target.value)}
                  disabled={loading}
                  className="px-4 py-2 rounded-lg text-gray-900 font-medium focus:outline-none focus:ring-2 focus:ring-white disabled:opacity-50 disabled:cursor-not-allowed"
                />
              )}
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
              <p className="text-sm">Select a different date from the dropdown to view available races.</p>
            </div>
          </div>
        ) : (
          <MergedRatingsTable data={data} />
        )}
      </div>
    </div>
  );
}
