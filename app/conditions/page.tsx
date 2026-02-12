'use client';

import { useEffect, useState } from 'react';
import TrackConditionBadge from '@/components/racing/TrackConditionBadge';

interface TrackCondition {
  id: number;
  meeting_id: string;
  track_name: string;
  track_condition: string;
  rail_position: string | null;
  weather: string | null;
  jurisdiction: number;
  updated_at: string;
  created_at: string;
}

export default function ConditionsPage() {
  const [conditions, setConditions] = useState<TrackCondition[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedJurisdiction, setSelectedJurisdiction] = useState<number | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const fetchConditions = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/conditions/db');
      if (!response.ok) {
        throw new Error('Failed to fetch conditions');
      }
      const data = await response.json();
      setConditions(data.conditions || []);
      setLastRefresh(new Date());
      setError(null);
    } catch (err: any) {
      setError(err.message);
      console.error('Error fetching conditions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConditions();

    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      fetchConditions();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const jurisdictionName = (jur: number) => {
    switch (jur) {
      case 0: return 'AU';
      case 1: return 'NZ';
      case 2: return 'International';
      default: return 'Unknown';
    }
  };

  const filteredConditions = selectedJurisdiction !== null
    ? conditions.filter(c => c.jurisdiction === selectedJurisdiction)
    : conditions;

  // Group by jurisdiction
  const groupedByJurisdiction = filteredConditions.reduce((acc, condition) => {
    const jur = condition.jurisdiction;
    if (!acc[jur]) {
      acc[jur] = [];
    }
    acc[jur].push(condition);
    return acc;
  }, {} as Record<number, TrackCondition[]>);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Track Conditions</h1>
        <p className="text-gray-600">
          Live track conditions updated every 15 minutes
        </p>
        <p className="text-sm text-gray-500 mt-1">
          Last refreshed: {lastRefresh.toLocaleTimeString()}
        </p>
      </div>

      {/* Filter Buttons */}
      <div className="mb-6 flex gap-2 flex-wrap">
        <button
          onClick={() => setSelectedJurisdiction(null)}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            selectedJurisdiction === null
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          All
        </button>
        <button
          onClick={() => setSelectedJurisdiction(0)}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            selectedJurisdiction === 0
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Australia
        </button>
        <button
          onClick={() => setSelectedJurisdiction(1)}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            selectedJurisdiction === 1
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          New Zealand
        </button>
        <button
          onClick={() => setSelectedJurisdiction(2)}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            selectedJurisdiction === 2
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          International
        </button>
        <button
          onClick={fetchConditions}
          className="ml-auto px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
        >
          🔄 Refresh
        </button>
      </div>

      {loading && conditions.length === 0 ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading track conditions...</p>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <p className="text-red-600 font-medium">Error: {error}</p>
          <button
            onClick={fetchConditions}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Try Again
          </button>
        </div>
      ) : filteredConditions.length === 0 ? (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
          <p className="text-gray-600">No track conditions available</p>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(groupedByJurisdiction)
            .sort(([a], [b]) => Number(a) - Number(b))
            .map(([jurisdiction, jurisdictionConditions]) => (
              <div key={jurisdiction} className="space-y-4">
                <h2 className="text-2xl font-bold text-gray-800 border-b pb-2">
                  {jurisdictionName(Number(jurisdiction))}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {jurisdictionConditions
                    .sort((a, b) => a.track_name.localeCompare(b.track_name))
                    .map((condition) => (
                      <div
                        key={condition.id}
                        className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow"
                      >
                        <h3 className="text-lg font-bold text-gray-800 mb-3">
                          {condition.track_name}
                        </h3>
                        <TrackConditionBadge
                          condition={condition.track_condition}
                          railPosition={condition.rail_position || undefined}
                          weather={condition.weather || undefined}
                          updatedAt={condition.updated_at}
                          showTimestamp={true}
                        />
                      </div>
                    ))}
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
