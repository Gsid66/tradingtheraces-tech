'use client';

import { useEffect, useRef } from 'react';
import { getValueBackgroundColor } from '@/lib/trading-desk/valueCalculator';
import { getOrdinalSuffix } from '@/lib/utils/formatting';

interface ValuePlay {
  id: number;
  track_name: string;
  race_number: number;
  horse_name: string;
  rating: number;
  price: number;
  valueScore: number;
  jockey: string | null;
  trainer: string | null;
  actual_sp: number | null;
  finishing_position: number | null;
}

interface DownloadableValuePlaysTableProps {
  valuePlays: ValuePlay[];
  date: string;
}

export default function DownloadableValuePlaysTable({ valuePlays, date }: DownloadableValuePlaysTableProps) {
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
  }, [valuePlays]);

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
  }, [valuePlays]);

  const downloadCSV = () => {
    // Prepare CSV headers
    const headers = ['Track', 'Race', 'Horse', 'Rating', 'Price', 'Value Score', 'Jockey', 'Trainer', 'Actual SP', 'Result'];
    
    // Prepare CSV rows
    const rows = valuePlays.map(play => [
      play.track_name,
      `R${play.race_number}`,
      play.horse_name,
      play.rating ? Number(play.rating).toFixed(1) : '-',
      play.price ? Number(play.price).toFixed(2) : '-',
      play.valueScore.toFixed(1),
      play.jockey || '-',
      play.trainer || '-',
      play.actual_sp ? Number(play.actual_sp).toFixed(2) : '-',
      play.finishing_position ? 
        (play.finishing_position === 1 ? '1st' : `${play.finishing_position}${getOrdinalSuffix(play.finishing_position)}`) 
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
    link.setAttribute('download', `trading-desk-${date}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div ref={tableContainerRef}>
      {/* Download Button */}
      <div className="mb-4 flex justify-end">
        <button
          onClick={downloadCSV}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg shadow transition-colors duration-200 flex items-center gap-2 min-h-[44px]"
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

      {/* Mobile Card View (< 768px) */}
      <div className="md:hidden space-y-3">
        {valuePlays.map((play) => {
          const bgColor = getValueBackgroundColor(play.valueScore);
          return (
            <div key={play.id} className={`rounded-lg shadow p-4 ${bgColor || 'bg-white'}`}>
              <div className="flex justify-between items-start mb-2">
                <div>
                  <span className="font-semibold text-gray-900">{play.horse_name}</span>
                  <div className="text-xs text-gray-500">{play.track_name} · R{play.race_number}</div>
                </div>
                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                  play.valueScore > 25 ? 'bg-green-100 text-green-800' :
                  play.valueScore >= 15 ? 'bg-yellow-100 text-yellow-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  VS: {play.valueScore.toFixed(1)}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-xs text-gray-700">
                <div><span className="text-gray-500">Rating:</span> {play.rating ? Number(play.rating).toFixed(1) : '-'}</div>
                <div><span className="text-gray-500">Price:</span> {play.price ? `$${Number(play.price).toFixed(2)}` : '-'}</div>
                <div><span className="text-gray-500">SP:</span> {play.actual_sp ? `$${Number(play.actual_sp).toFixed(2)}` : '-'}</div>
                <div className="col-span-3"><span className="text-gray-500">Jockey:</span> {play.jockey || '-'}</div>
                <div className="col-span-3"><span className="text-gray-500">Trainer:</span> {play.trainer || '-'}</div>
                {play.finishing_position && (
                  <div className="col-span-3">
                    <span className={`font-medium ${play.finishing_position === 1 ? 'text-green-600' : 'text-gray-600'}`}>
                      {play.finishing_position === 1 ? '🏆 1st' : `${play.finishing_position}${getOrdinalSuffix(play.finishing_position)}`}
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Desktop Table View (>= 768px) */}
      <div className="hidden md:block">
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
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">Jockey</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">Trainer</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">Actual SP</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">Result</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {valuePlays.map((play) => {
                const bgColor = getValueBackgroundColor(play.valueScore);
                return (
                  <tr key={play.id} className={`hover:bg-gray-100 ${bgColor}`}>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{play.track_name}</td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">R{play.race_number}</td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">{play.horse_name}</td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{play.rating ? Number(play.rating).toFixed(1) : '-'}</td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{play.price ? `$${Number(play.price).toFixed(2)}` : '-'}</td>
                    <td className="px-4 py-2 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        play.valueScore > 25 ? 'bg-green-100 text-green-800' :
                        play.valueScore >= 15 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {play.valueScore.toFixed(1)}
                      </span>
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{play.jockey || '-'}</td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{play.trainer || '-'}</td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{play.actual_sp ? `$${Number(play.actual_sp).toFixed(2)}` : '-'}</td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm">
                      {play.finishing_position ? (
                        <span className={`font-medium ${play.finishing_position === 1 ? 'text-green-600' : 'text-gray-600'}`}>
                          {play.finishing_position === 1 ? '🏆 1st' : `${play.finishing_position}${getOrdinalSuffix(play.finishing_position)}`}
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
    </div>
  );
}
