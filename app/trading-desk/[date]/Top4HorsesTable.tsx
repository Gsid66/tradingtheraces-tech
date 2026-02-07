'use client';

import { useEffect, useRef } from 'react';
import { getValueBackgroundColor } from '@/lib/trading-desk/valueCalculator';
import { getOrdinalSuffix } from '@/lib/utils/formatting';

interface Horse {
  id: number;
  track_name: string;
  race_number: number;
  horse_name: string;
  rating: number;
  price: number;
  valueScore: number;
  actual_sp: number | null;
  finishing_position: number | null;
}

interface Top4HorsesTableProps {
  horses: Horse[];
  date: string;
}

export default function Top4HorsesTable({ horses, date }: Top4HorsesTableProps) {
  const tableContainerRef = useRef<HTMLDivElement>(null);
  const topScrollRef = useRef<HTMLDivElement>(null);
  const bottomScrollRef = useRef<HTMLDivElement>(null);

  // Sync scrollbars
  useEffect(() => {
    const topScroll = topScrollRef.current;
    const bottomScroll = bottomScrollRef.current;

    if (!topScroll || !bottomScroll) return;

    const handleTopScroll = () => {
      if (bottomScroll) {
        bottomScroll.scrollLeft = topScroll.scrollLeft;
      }
    };

    const handleBottomScroll = () => {
      if (topScroll) {
        topScroll.scrollLeft = bottomScroll.scrollLeft;
      }
    };

    topScroll.addEventListener('scroll', handleTopScroll);
    bottomScroll.addEventListener('scroll', handleBottomScroll);

    // Set initial width for top scrollbar
    if (bottomScroll.scrollWidth && topScroll.firstElementChild) {
      (topScroll.firstElementChild as HTMLElement).style.width = `${bottomScroll.scrollWidth}px`;
    }

    return () => {
      topScroll.removeEventListener('scroll', handleTopScroll);
      bottomScroll.removeEventListener('scroll', handleBottomScroll);
    };
  }, [horses]);

  // Update top scrollbar width when window resizes
  useEffect(() => {
    const updateScrollbarWidth = () => {
      const topScroll = topScrollRef.current;
      const bottomScroll = bottomScrollRef.current;
      
      if (topScroll && bottomScroll && topScroll.firstElementChild) {
        (topScroll.firstElementChild as HTMLElement).style.width = `${bottomScroll.scrollWidth}px`;
      }
    };

    // Use ResizeObserver for more reliable width updates
    const bottomScroll = bottomScrollRef.current;
    if (!bottomScroll) return;

    const resizeObserver = new ResizeObserver(() => {
      updateScrollbarWidth();
    });

    resizeObserver.observe(bottomScroll);
    
    // Initial update
    updateScrollbarWidth();

    return () => {
      resizeObserver.disconnect();
    };
  }, [horses]);

  const downloadCSV = () => {
    // Prepare CSV headers
    const headers = ['Track', 'Race', 'Horse', 'Rating', 'Price', 'Value Score', 'Actual SP', 'Result'];
    
    // Prepare CSV rows
    const rows = horses.map(horse => [
      horse.track_name,
      `R${horse.race_number}`,
      horse.horse_name,
      horse.rating ? Number(horse.rating).toFixed(1) : '-',
      horse.price ? Number(horse.price).toFixed(2) : '-',
      horse.valueScore.toFixed(1),
      horse.actual_sp ? Number(horse.actual_sp).toFixed(2) : '-',
      horse.finishing_position ? 
        (horse.finishing_position === 1 ? '1st' : `${horse.finishing_position}${getOrdinalSuffix(horse.finishing_position)}`) 
        : '-'
    ]);

    // Create CSV content
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => {
        // Escape commas and quotes in cell values
        const cellStr = String(cell);
        if (cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n')) {
          return `"${cellStr.replace(/"/g, '""')}"`;
        }
        return cellStr;
      }).join(','))
    ].join('\n');

    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `top-4-horses-${date}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Group horses by race
  const raceGroups: { [key: string]: Horse[] } = {};
  horses.forEach(horse => {
    const raceKey = `${horse.track_name}-R${horse.race_number}`;
    if (!raceGroups[raceKey]) {
      raceGroups[raceKey] = [];
    }
    raceGroups[raceKey].push(horse);
  });

  // Sort race keys
  const sortedRaceKeys = Object.keys(raceGroups).sort();
  const totalRaces = sortedRaceKeys.length;

  return (
    <div ref={tableContainerRef}>
      {/* Header with race count and download button */}
      <div className="mb-4 flex justify-between items-center">
        <p className="text-sm text-gray-600">
          Showing top 4 horses for {totalRaces} race{totalRaces !== 1 ? 's' : ''}
        </p>
        <button
          onClick={downloadCSV}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg shadow transition-colors duration-200 flex items-center gap-2"
        >
          <svg 
            className="w-5 h-5" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24" 
            xmlns="http://www.w3.org/2000/svg"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" 
            />
          </svg>
          Download CSV
        </button>
      </div>

      {/* Top Scrollbar */}
      <div 
        ref={topScrollRef}
        className="overflow-x-auto mb-1"
        style={{ 
          overflowY: 'hidden',
          height: '20px'
        }}
      >
        <div style={{ height: '1px' }}></div>
      </div>

      {/* Table with Bottom Scrollbar */}
      <div className="bg-white rounded-lg shadow overflow-x-auto" ref={bottomScrollRef}>
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50 sticky top-0 z-10">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">Track</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">Race</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">Horse</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">Rating</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">Price</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">Value Score</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">Actual SP</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">Result</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sortedRaceKeys.map((raceKey, groupIndex) => {
              const raceHorses = raceGroups[raceKey];
              // Alternate background colors for race groups
              const isEvenGroup = groupIndex % 2 === 0;
              const groupBgClass = isEvenGroup ? 'bg-white' : 'bg-gray-50';
              
              return raceHorses.map((horse, horseIndex) => {
                const isLastInGroup = horseIndex === raceHorses.length - 1;
                const borderClass = isLastInGroup ? 'border-b-2 border-gray-300' : '';
                
                return (
                  <tr 
                    key={horse.id} 
                    className={`hover:bg-gray-100 ${groupBgClass} ${borderClass}`}
                  >
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{horse.track_name}</td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">R{horse.race_number}</td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">{horse.horse_name}</td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{horse.rating ? Number(horse.rating).toFixed(1) : '-'}</td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{horse.price ? `$${Number(horse.price).toFixed(2)}` : '-'}</td>
                    <td className="px-4 py-2 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        horse.valueScore > 25 ? 'bg-green-100 text-green-800' :
                        horse.valueScore >= 15 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {horse.valueScore.toFixed(1)}
                      </span>
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{horse.actual_sp ? `$${Number(horse.actual_sp).toFixed(2)}` : '-'}</td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm">
                      {horse.finishing_position ? (
                        <span className={`font-medium ${horse.finishing_position === 1 ? 'text-green-600' : 'text-gray-600'}`}>
                          {horse.finishing_position === 1 ? '🏆 1st' : `${horse.finishing_position}${getOrdinalSuffix(horse.finishing_position)}`}
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                  </tr>
                );
              });
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
