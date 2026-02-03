'use client';

import { useState } from 'react';
import AICommentary from './AICommentary';
import { getValueBackgroundColor } from '@/lib/trading-desk/valueCalculator';
import { getOrdinalSuffix } from '@/lib/utils/formatting';

interface RaceData {
  id: number;
  race_date: string;
  track_name: string;
  state: string | null;
  race_number: number;
  horse_name: string;
  rating: number;
  price: number;
  jockey: string;
  trainer: string;
  finishing_position: number | null;
  actual_sp: number | null;
  valueScore: number;
}

interface Props {
  data: RaceData[];
}

export default function RaceTable({ data }: Props) {
  const [visibleColumns, setVisibleColumns] = useState({
    jockey: true,
    trainer: true,
    valueScore: true,
    actualSP: true,
    ai: true,
  });

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const toggleColumn = (column: keyof typeof visibleColumns) => {
    setVisibleColumns(prev => ({ ...prev, [column]: !prev[column] }));
  };

  return (
    <>
      {/* Column Toggle Button */}
      <div className="mb-4 flex justify-end">
        <div className="relative">
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="px-4 py-2 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 transition-colors flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
            Columns
          </button>

          {isDropdownOpen && (
            <>
              {/* Backdrop */}
              <div 
                className="fixed inset-0 z-10" 
                onClick={() => setIsDropdownOpen(false)}
              />
              
              {/* Dropdown */}
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 z-20">
                <div className="p-2">
                  <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase">
                    Toggle Columns
                  </div>
                  {[
                    { key: 'jockey' as const, label: 'Jockey' },
                    { key: 'trainer' as const, label: 'Trainer' },
                    { key: 'valueScore' as const, label: 'Value Score' },
                    { key: 'actualSP' as const, label: 'Actual SP' },
                    { key: 'ai' as const, label: 'AI Commentary' },
                  ].map(({ key, label }) => (
                    <label
                      key={key}
                      className="flex items-center px-3 py-2 hover:bg-gray-100 rounded cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={visibleColumns[key]}
                        onChange={() => toggleColumn(key)}
                        className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">{label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto max-h-[70vh] overflow-y-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50 sticky top-0 z-10 shadow-sm">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Track</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Race</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Horse</th>
                {visibleColumns.jockey && (
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Jockey</th>
                )}
                {visibleColumns.trainer && (
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trainer</th>
                )}
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rating</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                {visibleColumns.valueScore && (
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Value Score</th>
                )}
                {visibleColumns.actualSP && (
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actual SP</th>
                )}
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Result</th>
                {visibleColumns.ai && (
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">AI</th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data.map((race) => {
                const bgColor = getValueBackgroundColor(race.valueScore);
                return (
                  <tr key={race.id} className={`hover:bg-gray-100 ${bgColor}`}>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{race.track_name}</td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">R{race.race_number}</td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">{race.horse_name}</td>
                    {visibleColumns.jockey && (
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{race.jockey}</td>
                    )}
                    {visibleColumns.trainer && (
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{race.trainer}</td>
                    )}
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{race.rating ? Number(race.rating).toFixed(1) : '-'}</td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{race.price ? `$${Number(race.price).toFixed(2)}` : '-'}</td>
                    {visibleColumns.valueScore && (
                      <td className="px-4 py-2 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          race.valueScore > 25 ? 'bg-green-100 text-green-800' :
                          race.valueScore >= 15 ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {race.valueScore.toFixed(1)}
                        </span>
                      </td>
                    )}
                    {visibleColumns.actualSP && (
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                        {race.actual_sp ? `$${Number(race.actual_sp).toFixed(2)}` : '-'}
                      </td>
                    )}
                    <td className="px-4 py-2 whitespace-nowrap text-sm">
                      {race.finishing_position ? (
                        <span className={`font-medium ${race.finishing_position === 1 ? 'text-green-600' : 'text-gray-600'}`}>
                          {race.finishing_position === 1 ? '🏆 1st' : `${race.finishing_position}${getOrdinalSuffix(race.finishing_position)}`}
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    {visibleColumns.ai && (
                      <td className="px-4 py-2 whitespace-nowrap text-sm">
                        <AICommentary
                          raceId={race.id}
                          horseName={race.horse_name}
                          rating={Number(race.rating)}
                          price={Number(race.price)}
                          jockey={race.jockey}
                          trainer={race.trainer}
                        />
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Card View - unchanged */}
      <div className="md:hidden space-y-4">
        {data.map((race) => {
          const bgColor = getValueBackgroundColor(race.valueScore);
          return (
            <div
              key={race.id}
              className={`bg-white rounded-lg shadow p-4 ${bgColor}`}
            >
              <div className="flex justify-between items-start mb-3">
                <div>
                  <div className="font-bold text-lg text-gray-900">
                    {race.horse_name}
                  </div>
                  <div className="text-sm text-gray-600">
                    {race.track_name} - R{race.race_number}
                  </div>
                </div>
                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                  race.valueScore > 25 ? 'bg-green-100 text-green-800' :
                  race.valueScore >= 15 ? 'bg-yellow-100 text-yellow-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {race.valueScore.toFixed(1)}
                </span>
              </div>
              
              <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                <div>
                  <span className="text-gray-600">Rating:</span>
                  <span className="ml-1 font-medium">{race.rating ? Number(race.rating).toFixed(1) : '-'}</span>
                </div>
                <div>
                  <span className="text-gray-600">Price:</span>
                  <span className="ml-1 font-medium">{race.price ? `$${Number(race.price).toFixed(2)}` : '-'}</span>
                </div>
                <div>
                  <span className="text-gray-600">Actual SP:</span>
                  <span className="ml-1 font-medium">{race.actual_sp ? `$${Number(race.actual_sp).toFixed(2)}` : '-'}</span>
                </div>
                <div>
                  <span className="text-gray-600">Result:</span>
                  <span className="ml-1 font-medium">
                    {race.finishing_position ? (
                      <span className={race.finishing_position === 1 ? 'text-green-600' : 'text-gray-600'}>
                        {race.finishing_position === 1 ? '🏆 1st' : `${race.finishing_position}${getOrdinalSuffix(race.finishing_position)}`}
                      </span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </span>
                </div>
              </div>

              <details className="text-sm">
                <summary className="cursor-pointer text-purple-600 font-medium">
                  View Details
                </summary>
                <div className="mt-2 space-y-1 text-gray-600">
                  <div><span className="font-medium">Jockey:</span> {race.jockey}</div>
                  <div><span className="font-medium">Trainer:</span> {race.trainer}</div>
                </div>
              </details>

              <div className="mt-3">
                <AICommentary
                  raceId={race.id}
                  horseName={race.horse_name}
                  rating={Number(race.rating)}
                  price={Number(race.price)}
                  jockey={race.jockey}
                  trainer={race.trainer}
                />
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
