'use client';

import { useState } from 'react';
import { format, subDays } from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';
import Image from 'next/image';

interface AIAnalysisResponse {
  analysis: string;
  meetingDate: string;
  trackCount: number;
  raceCount: number;
  valueHorseCount: number;
  error?: string;
}

export default function AIRaceAnalysisPage() {
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [analysis, setAnalysis] = useState<AIAnalysisResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Get today's date in Sydney timezone
  const today = new Date();
  const sydneyToday = formatInTimeZone(today, 'Australia/Sydney', 'yyyy-MM-dd');
  
  // Generate last 14 days for date selector
  const availableDates: string[] = [];
  for (let i = 0; i < 14; i++) {
    const date = subDays(new Date(sydneyToday), i);
    const dateStr = format(date, 'yyyy-MM-dd');
    availableDates.push(dateStr);
  }

  const handleDateSelect = (date: string) => {
    setSelectedDate(date);
    setAnalysis(null);
    setError(null);
  };

  const generateAnalysis = async () => {
    if (!selectedDate) {
      setError('Please select a date first');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/trading-desk/ai-race-analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          date: selectedDate,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate analysis');
      }

      const data = await response.json();
      setAnalysis(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate analysis');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="flex items-center gap-4 mb-6 sm:mb-8">
        <Image 
          src="/images/sherlock-hooves.png"
          alt="Sherlock Hooves"
          width={64}
          height={64}
          className="rounded-full border-2 border-purple-400 shadow-lg"
        />
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">
            🕵️ Sherlock Hooves&apos; AI Race Analysis
          </h1>
          <p className="text-sm sm:text-base text-gray-600">
            Professional race-by-race insights and betting recommendations
          </p>
        </div>
      </div>

      {/* Date Selector Card */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Select Race Meeting Date</h2>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3 mb-6">
          {availableDates.map((date) => {
            const isSelected = selectedDate === date;
            
            return (
              <button
                key={date}
                onClick={() => handleDateSelect(date)}
                className={`
                  px-4 py-3 rounded-lg text-sm font-medium transition-all
                  ${isSelected 
                    ? 'bg-purple-600 text-white shadow-lg scale-105' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:shadow'
                  }
                `}
              >
                <div className="font-semibold">{format(new Date(date), 'MMM d')}</div>
                <div className="text-xs opacity-75">{format(new Date(date), 'EEE')}</div>
              </button>
            );
          })}
        </div>

        {selectedDate && (
          <div className="flex items-center gap-4">
            <div className="text-gray-600">
              Selected: <span className="font-semibold text-gray-800">
                {format(new Date(selectedDate), 'EEEE, MMMM d, yyyy')}
              </span>
            </div>
            <button
              onClick={generateAnalysis}
              disabled={isLoading}
              className="px-6 py-3 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Generating Analysis...</span>
                </>
              ) : (
                <>
                  <span>🤖</span>
                  <span>Generate AI Analysis</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border-2 border-red-200 rounded-lg p-6 mb-6">
          <div className="flex items-start gap-3">
            <span className="text-2xl">⚠️</span>
            <div>
              <h3 className="font-bold text-red-800 mb-1">Error</h3>
              <p className="text-red-600">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Analysis Display */}
      {analysis && (
        <div className="bg-purple-50 border-2 border-purple-300 rounded-lg p-6 animate-fadeIn">
          <div className="flex items-start gap-4 mb-4">
            <Image 
              src="/images/sherlock-hooves.png"
              alt="Sherlock Hooves"
              width={80}
              height={80}
              className="rounded-full border-3 border-purple-400 shadow-lg"
            />
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-purple-900 mb-2">
                Sherlock Hooves&apos; Professional Analysis
              </h2>
              <div className="flex flex-wrap gap-4 text-sm text-purple-700">
                <div>
                  <span className="font-semibold">Date:</span> {format(new Date(analysis.meetingDate), 'EEEE, MMMM d, yyyy')}
                </div>
                <div>
                  <span className="font-semibold">Tracks:</span> {analysis.trackCount}
                </div>
                <div>
                  <span className="font-semibold">Races:</span> {analysis.raceCount}
                </div>
                <div>
                  <span className="font-semibold">Value Opportunities:</span> {analysis.valueHorseCount}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-inner">
            <div className="prose prose-purple max-w-none">
              <div className="text-gray-800 leading-relaxed whitespace-pre-wrap">
                {analysis.analysis}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Info Card when no analysis */}
      {!analysis && !error && !isLoading && (
        <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6">
          <div className="flex items-start gap-3">
            <span className="text-2xl">💡</span>
            <div>
              <h3 className="font-bold text-blue-900 mb-2">About AI Race Analysis</h3>
              <div className="text-blue-800 space-y-2">
                <p>
                  Get comprehensive, professional race analysis from Sherlock Hooves, featuring:
                </p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Detailed race-by-race selections with full analysis</li>
                  <li>Specific betting recommendations (Win/Place/Each-Way)</li>
                  <li>Top-rated value opportunities with risk assessment</li>
                  <li>Strategic betting approach and bankroll management</li>
                  <li>Professional, data-driven insights</li>
                </ul>
                <p className="mt-3">
                  <strong>Select a date above and click &quot;Generate AI Analysis&quot; to begin.</strong>
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
