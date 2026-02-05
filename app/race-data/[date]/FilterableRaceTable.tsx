'use client';

import { useState, useMemo } from 'react';
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

export default function FilterableRaceTable({ data }: Props) {
  // State for filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTrack, setSelectedTrack] = useState('');
  const [minValueScore, setMinValueScore] = useState('');
  const [sortField, setSortField] = useState<keyof RaceData>('valueScore');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  
  // State for column visibility
  const [visibleColumns, setVisibleColumns] = useState({
    jockey: true,
    trainer: true,
    valueScore: true,
    actualSP: true,
  });

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Get unique tracks for filter
  const tracks = useMemo(() => {
    const uniqueTracks = Array.from(new Set(data.map(d => d.track_name))).sort();
    return uniqueTracks;
  }, [data]);

  // Filter and sort data
  const filteredData = useMemo(() => {
    let filtered = data;

    // Apply search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(d => 
        d.horse_name.toLowerCase().includes(search) ||
        d.jockey.toLowerCase().includes(search) ||
        d.trainer.toLowerCase().includes(search) ||
        d.track_name.toLowerCase().includes(search)
      );
    }

    // Apply track filter
    if (selectedTrack) {
      filtered = filtered.filter(d => d.track_name === selectedTrack);
    }

    // Apply value score filter
    if (minValueScore) {
      const minValue = parseFloat(minValueScore);
      filtered = filtered.filter(d => d.valueScore >= minValue);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];
      
      // Handle null values
      if (aVal === null) aVal = -Infinity;
      if (bVal === null) bVal = -Infinity;
      
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortDirection === 'asc' 
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }
      
      return sortDirection === 'asc' 
        ? (aVal as number) - (bVal as number)
        : (bVal as number) - (aVal as number);
    });

    return filtered;
  }, [data, searchTerm, selectedTrack, minValueScore, sortField, sortDirection]);

  const toggleColumn = (column: keyof typeof visibleColumns) => {
    setVisibleColumns(prev => ({ ...prev, [column]: !prev[column] }));
  };

  const handleSort = (field: keyof RaceData) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  return (
    <div>
      {/* Filters Section */}
      <div className="bg-white rounded-lg shadow p-4 mb-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Search
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Horse, jockey, trainer..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          {/* Track Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Track
            </label>
            <select
              value={selectedTrack}
              onChange={(e) => setSelectedTrack(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="">All Tracks</option>
              {tracks.map(track => (
                <option key={track} value={track}>{track}</option>
              ))}
            </select>
          </div>

          {/* Min Value Score */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Min Value Score
            </label>
            <input
              type="number"
              value={minValueScore}
              onChange={(e) => setMinValueScore(e.target.value)}
              placeholder="e.g., 15"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          {/* Results Count */}
          <div className="flex items-end">
            <div className="text-sm text-gray-600">
              <span className="font-semibold text-lg text-purple-600">{filteredData.length}</span>
              <span className="ml-1">of {data.length} horses</span>
            </div>
          </div>
        </div>
      </div>

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
                <th 
                  className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('track_name')}
                >
                  Track {sortField === 'track_name' && (sortDirection === 'asc' ? '↑' : '↓')}
                </th>
                <th 
                  className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('race_number')}
                >
                  Race {sortField === 'race_number' && (sortDirection === 'asc' ? '↑' : '↓')}
                </th>
                <th 
                  className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('horse_name')}
                >
                  Horse {sortField === 'horse_name' && (sortDirection === 'asc' ? '↑' : '↓')}
                </th>
                {visibleColumns.jockey && (
                  <th 
                    className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('jockey')}
                  >
                    Jockey {sortField === 'jockey' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                )}
                {visibleColumns.trainer && (
                  <th 
                    className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('trainer')}
                  >
                    Trainer {sortField === 'trainer' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                )}
                <th 
                  className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('rating')}
                >
                  Rating {sortField === 'rating' && (sortDirection === 'asc' ? '↑' : '↓')}
                </th>
                <th 
                  className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('price')}
                >
                  Price {sortField === 'price' && (sortDirection === 'asc' ? '↑' : '↓')}
                </th>
                {visibleColumns.valueScore && (
                  <th 
                    className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('valueScore')}
                  >
                    Value Score {sortField === 'valueScore' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                )}
                {visibleColumns.actualSP && (
                  <th 
                    className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('actual_sp')}
                  >
                    Actual SP {sortField === 'actual_sp' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                )}
                <th 
                  className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('finishing_position')}
                >
                  Result {sortField === 'finishing_position' && (sortDirection === 'asc' ? '↑' : '↓')}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredData.map((race) => {
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
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-4">
        {filteredData.map((race) => {
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
            </div>
          );
        })}
      </div>

      {/* No results message */}
      {filteredData.length === 0 && (
        <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
          No horses match your filters
        </div>
      )}
    </div>
  );
}
