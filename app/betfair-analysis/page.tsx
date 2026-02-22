'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

interface QueryFilters {
  dateFrom: string;
  dateTo: string;
  tracks: string[];
  winBspMin: string;
  winBspMax: string;
  placeBspMin: string;
  placeBspMax: string;
  winnersOnly: boolean;
  placedOnly: boolean;
  distances: string[];
  classes: string[];
  speedCats: string[];
  rpMin: string;
  rpMax: string;
  earlySpeedMin: string;
  earlySpeedMax: string;
  lateSpeedMin: string;
  lateSpeedMax: string;
  groupBy: string;
}

interface RaceResult {
  date: string;
  track: string;
  race: number;
  horse: string;
  distance: string;
  class: string;
  win_bsp: string;
  place_bsp: string;
  win_result: number;
  place_result: number;
  rp: string;
  speed_cat: string;
  early_speed: string;
  late_speed: number;
  race_speed: string;
  value: string;
}

interface Statistics {
  totalRecords: number;
  winCount: number;
  winRate: string;
  placeCount: number;
  placeRate: string;
  avgWinBsp: string;
  avgPlaceBsp: string;
  winRoi: string;
}

interface GroupedStat {
  groupKey: string;
  total: number;
  wins: number;
  winPct: string;
  places: number;
  placePct: string;
  avgWinBsp: string;
  avgPlaceBsp: string;
  winRoi: string;
}

interface SavedQuery {
  name: string;
  filters: QueryFilters;
}

const DEFAULT_FILTERS: QueryFilters = {
  dateFrom: '',
  dateTo: '',
  tracks: [],
  winBspMin: '',
  winBspMax: '',
  placeBspMin: '',
  placeBspMax: '',
  winnersOnly: false,
  placedOnly: false,
  distances: [],
  classes: [],
  speedCats: [],
  rpMin: '',
  rpMax: '',
  earlySpeedMin: '',
  earlySpeedMax: '',
  lateSpeedMin: '',
  lateSpeedMax: '',
  groupBy: '',
};

const COMMON_DISTANCES = ['1000m', '1100m', '1200m', '1400m', '1600m', '1800m', '2000m', '2200m', '2400m', '2600m'];
const SPEED_CAT_OPTIONS = ['On-Pace', 'Midfield', 'Back-Marker', 'Leader', 'Off-Pace'];
const GROUP_BY_OPTIONS = [
  { value: '', label: 'No Grouping' },
  { value: 'track', label: 'Track' },
  { value: 'distance', label: 'Distance' },
  { value: 'class', label: 'Class' },
  { value: 'speed_cat', label: 'Speed Category' },
  { value: 'price_bracket', label: 'Price Bracket (BSP)' },
];

const RECORDS_PER_PAGE = 50;

export default function BetfairAnalysisPage() {
  const router = useRouter();
  const [filters, setFilters] = useState<QueryFilters>(DEFAULT_FILTERS);
  const [results, setResults] = useState<RaceResult[]>([]);
  const [statistics, setStatistics] = useState<Statistics | null>(null);
  const [groupedStats, setGroupedStats] = useState<GroupedStat[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [availableTracks, setAvailableTracks] = useState<string[]>([]);
  const [availableClasses, setAvailableClasses] = useState<string[]>([]);
  const [sortCol, setSortCol] = useState<keyof RaceResult>('date');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [savedQueries, setSavedQueries] = useState<SavedQuery[]>([]);
  const [saveQueryName, setSaveQueryName] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [activeView, setActiveView] = useState<'table' | 'pattern'>('table');

  // Load saved queries from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('betfair_analysis_saved_queries');
    if (stored) {
      try {
        setSavedQueries(JSON.parse(stored));
      } catch {
        // ignore
      }
    }
  }, []);

  // Fetch available tracks and classes for filter options
  const fetchFilterOptions = useCallback(async () => {
    try {
      const res = await fetch('/api/betfair-analysis/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ groupBy: 'track' }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.groupedStats) {
          setAvailableTracks(data.groupedStats.map((g: GroupedStat) => g.groupKey).sort());
        }
      }
    } catch {
      // ignore
    }

    try {
      const res = await fetch('/api/betfair-analysis/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ groupBy: 'class' }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.groupedStats) {
          setAvailableClasses(data.groupedStats.map((g: GroupedStat) => g.groupKey).filter((c: string) => c !== 'Unknown').sort());
        }
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    fetchFilterOptions();
  }, [fetchFilterOptions]);

  const runQuery = async () => {
    setLoading(true);
    setError('');
    setPage(1);

    try {
      const res = await fetch('/api/betfair-analysis/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(filters),
      });

      if (res.status === 401) {
        router.refresh();
        return;
      }

      const data = await res.json();

      if (data.success) {
        setResults(data.results);
        setStatistics(data.statistics);
        setGroupedStats(data.groupedStats);
        if (data.groupedStats) {
          setActiveView('pattern');
        } else {
          setActiveView('table');
        }
      } else {
        setError(data.message || 'Query failed');
      }
    } catch {
      setError('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const clearFilters = () => {
    setFilters(DEFAULT_FILTERS);
    setResults([]);
    setStatistics(null);
    setGroupedStats(null);
    setError('');
  };

  const handleLogout = async () => {
    await fetch('/api/betfair-analysis/logout', { method: 'POST' });
    router.refresh();
  };

  const exportCSV = () => {
    if (results.length === 0) return;
    const headers = ['Date', 'Track', 'Race', 'Horse', 'Distance', 'Class', 'Win BSP', 'Place BSP', 'Win Result', 'Place Result', 'RP', 'Speed Cat', 'Early Speed', 'Late Speed'];
    const rows = results.map((r) => [
      r.date, r.track, r.race, r.horse, r.distance, r.class,
      r.win_bsp, r.place_bsp, r.win_result, r.place_result,
      r.rp, r.speed_cat, r.early_speed, r.late_speed,
    ]);
    const csv = [headers, ...rows].map((row) => row.map(String).map((v) => `"${v.replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'betfair_analysis.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const saveQuery = () => {
    if (!saveQueryName.trim()) return;
    const newQuery: SavedQuery = { name: saveQueryName.trim(), filters: { ...filters } };
    const updated = [...savedQueries.filter((q) => q.name !== newQuery.name), newQuery];
    setSavedQueries(updated);
    localStorage.setItem('betfair_analysis_saved_queries', JSON.stringify(updated));
    setSaveQueryName('');
  };

  const loadQuery = (name: string) => {
    const q = savedQueries.find((q) => q.name === name);
    if (q) setFilters({ ...q.filters });
  };

  const deleteQuery = (name: string) => {
    const updated = savedQueries.filter((q) => q.name !== name);
    setSavedQueries(updated);
    localStorage.setItem('betfair_analysis_saved_queries', JSON.stringify(updated));
  };

  const toggleMultiSelect = (arr: string[], value: string): string[] =>
    arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value];

  const handleSort = (col: keyof RaceResult) => {
    if (sortCol === col) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortCol(col);
      setSortDir('asc');
    }
    setPage(1);
  };

  const sortedResults = [...results].sort((a, b) => {
    const av = a[sortCol] ?? '';
    const bv = b[sortCol] ?? '';
    const cmp = String(av).localeCompare(String(bv), undefined, { numeric: true });
    return sortDir === 'asc' ? cmp : -cmp;
  });

  const paginatedResults = sortedResults.slice((page - 1) * RECORDS_PER_PAGE, page * RECORDS_PER_PAGE);
  const totalPages = Math.ceil(sortedResults.length / RECORDS_PER_PAGE);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-800 to-indigo-800 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold">Betfair Analysis</h1>
              <p className="text-blue-200 mt-1 text-sm sm:text-base">Query &amp; analyse Australian racing results</p>
            </div>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-blue-900 text-white rounded-lg hover:bg-blue-950 transition-colors font-medium text-sm"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Filters Panel */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4">Filters</h2>

          {/* Basic Filters */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date From</label>
              <input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date To</label>
              <input
                type="date"
                value={filters.dateTo}
                onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Win BSP Min</label>
              <input
                type="number"
                step="0.1"
                value={filters.winBspMin}
                onChange={(e) => setFilters({ ...filters, winBspMin: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900"
                placeholder="e.g. 2.0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Win BSP Max</label>
              <input
                type="number"
                step="0.1"
                value={filters.winBspMax}
                onChange={(e) => setFilters({ ...filters, winBspMax: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900"
                placeholder="e.g. 5.0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Place BSP Min</label>
              <input
                type="number"
                step="0.1"
                value={filters.placeBspMin}
                onChange={(e) => setFilters({ ...filters, placeBspMin: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900"
                placeholder="e.g. 1.5"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Place BSP Max</label>
              <input
                type="number"
                step="0.1"
                value={filters.placeBspMax}
                onChange={(e) => setFilters({ ...filters, placeBspMax: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900"
                placeholder="e.g. 3.0"
              />
            </div>
            <div className="flex items-center gap-4 pt-5">
              <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.winnersOnly}
                  onChange={(e) => setFilters({ ...filters, winnersOnly: e.target.checked })}
                  className="w-4 h-4"
                />
                Winners Only
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.placedOnly}
                  onChange={(e) => setFilters({ ...filters, placedOnly: e.target.checked })}
                  className="w-4 h-4"
                />
                Placed Only
              </label>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Group By</label>
              <select
                value={filters.groupBy}
                onChange={(e) => setFilters({ ...filters, groupBy: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900"
              >
                {GROUP_BY_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Track Selection */}
          {availableTracks.length > 0 && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Tracks</label>
              <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto p-2 border border-gray-200 rounded-lg">
                {availableTracks.map((track) => (
                  <label key={track} className="flex items-center gap-1 text-xs cursor-pointer">
                    <input
                      type="checkbox"
                      checked={filters.tracks.includes(track)}
                      onChange={() => setFilters({ ...filters, tracks: toggleMultiSelect(filters.tracks, track) })}
                      className="w-3 h-3"
                    />
                    <span className="text-gray-700">{track}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Advanced Filters Toggle */}
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="text-blue-600 text-sm font-medium hover:underline mb-4"
          >
            {showAdvanced ? '▲ Hide Advanced Filters' : '▼ Show Advanced Filters'}
          </button>

          {showAdvanced && (
            <div className="border-t border-gray-200 pt-4 space-y-4">
              {/* Distance */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Distance</label>
                <div className="flex flex-wrap gap-2">
                  {COMMON_DISTANCES.map((d) => (
                    <label key={d} className="flex items-center gap-1 text-xs cursor-pointer">
                      <input
                        type="checkbox"
                        checked={filters.distances.includes(d)}
                        onChange={() => setFilters({ ...filters, distances: toggleMultiSelect(filters.distances, d) })}
                        className="w-3 h-3"
                      />
                      <span className="text-gray-700">{d}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Class */}
              {availableClasses.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Class</label>
                  <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto">
                    {availableClasses.map((c) => (
                      <label key={c} className="flex items-center gap-1 text-xs cursor-pointer">
                        <input
                          type="checkbox"
                          checked={filters.classes.includes(c)}
                          onChange={() => setFilters({ ...filters, classes: toggleMultiSelect(filters.classes, c) })}
                          className="w-3 h-3"
                        />
                        <span className="text-gray-700">{c}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Speed Category */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Speed Category</label>
                <div className="flex flex-wrap gap-2">
                  {SPEED_CAT_OPTIONS.map((s) => (
                    <label key={s} className="flex items-center gap-1 text-xs cursor-pointer">
                      <input
                        type="checkbox"
                        checked={filters.speedCats.includes(s)}
                        onChange={() => setFilters({ ...filters, speedCats: toggleMultiSelect(filters.speedCats, s) })}
                        className="w-3 h-3"
                      />
                      <span className="text-gray-700">{s}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* RP Range */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">RP Min</label>
                  <input
                    type="number"
                    step="0.01"
                    value={filters.rpMin}
                    onChange={(e) => setFilters({ ...filters, rpMin: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">RP Max</label>
                  <input
                    type="number"
                    step="0.01"
                    value={filters.rpMax}
                    onChange={(e) => setFilters({ ...filters, rpMax: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Early Speed Min</label>
                  <input
                    type="number"
                    step="0.001"
                    value={filters.earlySpeedMin}
                    onChange={(e) => setFilters({ ...filters, earlySpeedMin: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Early Speed Max</label>
                  <input
                    type="number"
                    step="0.001"
                    value={filters.earlySpeedMax}
                    onChange={(e) => setFilters({ ...filters, earlySpeedMax: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Late Speed Min</label>
                  <input
                    type="number"
                    value={filters.lateSpeedMin}
                    onChange={(e) => setFilters({ ...filters, lateSpeedMin: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Late Speed Max</label>
                  <input
                    type="number"
                    value={filters.lateSpeedMax}
                    onChange={(e) => setFilters({ ...filters, lateSpeedMax: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3 mt-4">
            <button
              onClick={runQuery}
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:bg-gray-400"
            >
              {loading ? 'Querying...' : '🔍 Run Query'}
            </button>
            <button
              onClick={clearFilters}
              className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
            >
              ✕ Clear Filters
            </button>
            {results.length > 0 && (
              <button
                onClick={exportCSV}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
              >
                ⬇ Export CSV
              </button>
            )}
          </div>

          {error && (
            <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}
        </div>

        {/* Saved Queries */}
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-sm font-bold text-gray-800 mb-3">Saved Queries</h3>
          <div className="flex flex-wrap gap-2 items-center">
            <input
              type="text"
              value={saveQueryName}
              onChange={(e) => setSaveQueryName(e.target.value)}
              placeholder="Query name..."
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 w-44"
            />
            <button
              onClick={saveQuery}
              disabled={!saveQueryName.trim()}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 disabled:bg-gray-300"
            >
              💾 Save Query
            </button>
            {savedQueries.map((q) => (
              <span key={q.name} className="flex items-center gap-1">
                <button
                  onClick={() => loadQuery(q.name)}
                  className="px-3 py-2 bg-blue-100 text-blue-700 rounded-lg text-sm hover:bg-blue-200"
                >
                  {q.name}
                </button>
                <button
                  onClick={() => deleteQuery(q.name)}
                  className="px-2 py-2 bg-red-100 text-red-600 rounded-lg text-sm hover:bg-red-200"
                  title="Delete query"
                >
                  ✕
                </button>
              </span>
            ))}
          </div>
        </div>

        {/* Statistics Panel */}
        {statistics && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-4">Statistics</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-blue-50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-blue-700">{statistics.totalRecords.toLocaleString()}</div>
                <div className="text-sm text-blue-600">Total Records</div>
              </div>
              <div className="bg-green-50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-green-700">{statistics.winCount}</div>
                <div className="text-sm text-green-600">Winners ({statistics.winRate}%)</div>
              </div>
              <div className="bg-cyan-50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-cyan-700">{statistics.placeCount}</div>
                <div className="text-sm text-cyan-600">Placed ({statistics.placeRate}%)</div>
              </div>
              <div className={`${parseFloat(statistics.winRoi) >= 0 ? 'bg-emerald-50' : 'bg-red-50'} rounded-lg p-4 text-center`}>
                <div className={`text-2xl font-bold ${parseFloat(statistics.winRoi) >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
                  ${statistics.winRoi}
                </div>
                <div className={`text-sm ${parseFloat(statistics.winRoi) >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>Win ROI ($1 bets)</div>
              </div>
              <div className="bg-purple-50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-purple-700">{statistics.avgWinBsp}</div>
                <div className="text-sm text-purple-600">Avg Win BSP</div>
              </div>
              <div className="bg-pink-50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-pink-700">{statistics.avgPlaceBsp}</div>
                <div className="text-sm text-pink-600">Avg Place BSP</div>
              </div>
            </div>
          </div>
        )}

        {/* View Toggle */}
        {results.length > 0 && (
          <div className="flex gap-2">
            <button
              onClick={() => setActiveView('table')}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${activeView === 'table' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'}`}
            >
              📋 Table View
            </button>
            {groupedStats && (
              <button
                onClick={() => setActiveView('pattern')}
                className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${activeView === 'pattern' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'}`}
              >
                📊 Pattern View
              </button>
            )}
          </div>
        )}

        {/* Pattern View */}
        {activeView === 'pattern' && groupedStats && groupedStats.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-4">
              Pattern Analysis — Grouped by {GROUP_BY_OPTIONS.find((o) => o.value === filters.groupBy)?.label || filters.groupBy}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {groupedStats.map((g) => (
                <div key={g.groupKey} className="border border-gray-200 rounded-lg p-4">
                  <h3 className="font-bold text-gray-800 mb-2 text-sm truncate">{g.groupKey}</h3>
                  <div className="space-y-1 text-xs text-gray-600">
                    <div className="flex justify-between"><span>Runners:</span><span className="font-semibold text-gray-800">{g.total}</span></div>
                    <div className="flex justify-between"><span>Wins:</span><span className="font-semibold text-green-700">{g.wins} ({g.winPct}%)</span></div>
                    <div className="flex justify-between"><span>Places:</span><span className="font-semibold text-blue-700">{g.places} ({g.placePct}%)</span></div>
                    <div className="flex justify-between"><span>Avg Win BSP:</span><span className="font-semibold">{g.avgWinBsp}</span></div>
                    <div className="flex justify-between"><span>Avg Place BSP:</span><span className="font-semibold">{g.avgPlaceBsp}</span></div>
                    <div className="flex justify-between">
                      <span>Win ROI:</span>
                      <span className={`font-semibold ${parseFloat(g.winRoi) >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>${g.winRoi}</span>
                    </div>
                  </div>
                  {/* Simple win % bar */}
                  <div className="mt-3 bg-gray-100 rounded-full h-2">
                    <div
                      className="bg-green-500 h-2 rounded-full"
                      style={{ width: `${Math.min(parseFloat(g.winPct), 100)}%` }}
                    />
                  </div>
                  <div className="text-xs text-gray-400 mt-1">{g.winPct}% win rate</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Table View */}
        {activeView === 'table' && results.length > 0 && (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-800">
                Results ({results.length.toLocaleString()} records{results.length >= 5000 ? ' — limit reached' : ''})
              </h2>
              <div className="text-sm text-gray-500">
                Page {page} of {totalPages}
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    {(
                      [
                        ['date', 'Date'],
                        ['track', 'Track'],
                        ['race', 'Race'],
                        ['horse', 'Horse'],
                        ['distance', 'Dist'],
                        ['class', 'Class'],
                        ['win_bsp', 'Win BSP'],
                        ['place_bsp', 'Place BSP'],
                        ['win_result', 'Win'],
                        ['place_result', 'Place'],
                        ['rp', 'RP'],
                        ['speed_cat', 'Speed Cat'],
                        ['early_speed', 'Early Spd'],
                        ['late_speed', 'Late Spd'],
                      ] as [keyof RaceResult, string][]
                    ).map(([col, label]) => (
                      <th
                        key={col}
                        onClick={() => handleSort(col)}
                        className="px-3 py-2 text-left text-xs font-semibold text-gray-600 cursor-pointer hover:bg-gray-100 whitespace-nowrap"
                      >
                        {label} {sortCol === col ? (sortDir === 'asc' ? '▲' : '▼') : ''}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {paginatedResults.map((row, i) => (
                    <tr key={i} className={`hover:bg-gray-50 ${row.win_result === 1 ? 'bg-green-50' : row.place_result === 1 ? 'bg-blue-50' : ''}`}>
                      <td className="px-3 py-2 whitespace-nowrap text-gray-600">{String(row.date).split('T')[0]}</td>
                      <td className="px-3 py-2 whitespace-nowrap font-medium text-gray-800">{row.track}</td>
                      <td className="px-3 py-2 text-gray-600">{row.race}</td>
                      <td className="px-3 py-2 whitespace-nowrap text-gray-800">{row.horse}</td>
                      <td className="px-3 py-2 whitespace-nowrap text-gray-600">{row.distance}</td>
                      <td className="px-3 py-2 whitespace-nowrap text-gray-600">{row.class}</td>
                      <td className="px-3 py-2 text-gray-800">{row.win_bsp}</td>
                      <td className="px-3 py-2 text-gray-800">{row.place_bsp}</td>
                      <td className="px-3 py-2">
                        {row.win_result === 1 ? (
                          <span className="px-2 py-0.5 bg-green-100 text-green-800 rounded-full text-xs font-medium">WON</span>
                        ) : (
                          <span className="px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full text-xs">—</span>
                        )}
                      </td>
                      <td className="px-3 py-2">
                        {row.place_result === 1 ? (
                          <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">PLACED</span>
                        ) : (
                          <span className="px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full text-xs">—</span>
                        )}
                      </td>
                      <td className="px-3 py-2 text-gray-600">{row.rp}</td>
                      <td className="px-3 py-2 whitespace-nowrap text-gray-600">{row.speed_cat}</td>
                      <td className="px-3 py-2 text-gray-600">{row.early_speed}</td>
                      <td className="px-3 py-2 text-gray-600">{row.late_speed}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="p-4 border-t border-gray-200 flex items-center justify-between">
                <button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50 text-sm"
                >
                  ← Prev
                </button>
                <span className="text-sm text-gray-600">Page {page} of {totalPages}</span>
                <button
                  onClick={() => setPage(Math.min(totalPages, page + 1))}
                  disabled={page === totalPages}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50 text-sm"
                >
                  Next →
                </button>
              </div>
            )}
          </div>
        )}

        {results.length === 0 && statistics && (
          <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
            No records found matching the selected filters.
          </div>
        )}
      </div>
    </div>
  );
}
