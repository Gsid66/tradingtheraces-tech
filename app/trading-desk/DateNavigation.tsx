'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { useLoading } from '@/app/providers/LoadingProvider';

export default function DateNavigation() {
  const pathname = usePathname();
  const router = useRouter();
  const { setLoading } = useLoading();
  const [showCustomDate, setShowCustomDate] = useState(false);
  const [customDate, setCustomDate] = useState('');
  
  // Helper function to safely parse YYYY-MM-DD date strings as UTC
  const parseDateString = (dateStr: string): Date => {
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(Date.UTC(year, month - 1, day));
  };
  
  // Generate today's date in AEDT timezone (memoized)
  const today = useMemo(() => {
    return new Date().toLocaleDateString('en-CA', { 
      timeZone: 'Australia/Sydney' 
    });
  }, []);

  // Generate last 14 days dynamically (memoized)
  const dates = useMemo(() => {
    return Array.from({ length: 14 }, (_, i) => {
      // Create date from UTC to avoid timezone issues
      const [year, month, day] = today.split('-').map(Number);
      const date = new Date(Date.UTC(year, month - 1, day));
      date.setUTCDate(date.getUTCDate() - i);
      const resultYear = date.getUTCFullYear();
      const resultMonth = String(date.getUTCMonth() + 1).padStart(2, '0');
      const resultDay = String(date.getUTCDate()).padStart(2, '0');
      return `${resultYear}-${resultMonth}-${resultDay}`;
    });
  }, [today]);

  const handleCustomDateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (customDate) {
      setLoading(true);
      router.push(`/trading-desk/${customDate}`);
      setShowCustomDate(false);
      setCustomDate('');
    }
  };

  return (
    <nav className="space-y-2">
      {/* Today Quick Button */}
      <Link
        href={`/trading-desk/${today}`}
        onClick={() => setLoading(true)}
        className="block px-4 py-3 rounded-lg text-sm font-bold transition-colors bg-green-600 hover:bg-green-700 text-white text-center"
      >
        Today
        <div className="text-xs font-normal mt-1">
          {format(parseDateString(today), 'EEE, MMM d, yyyy')}
        </div>
      </Link>

      {/* Custom Date Toggle Button */}
      <button
        onClick={() => setShowCustomDate(!showCustomDate)}
        className="w-full px-4 py-2 rounded-lg text-sm font-medium transition-colors bg-gray-800 hover:bg-gray-700 text-gray-300"
      >
        {showCustomDate ? '− Hide Custom Date' : '+ Custom Date'}
      </button>

      {/* Custom Date Input Form */}
      {showCustomDate && (
        <form onSubmit={handleCustomDateSubmit} className="bg-gray-800 p-3 rounded-lg space-y-2">
          <label htmlFor="custom-date-input" className="sr-only">
            Choose date (YYYY-MM-DD)
          </label>
          <input
            id="custom-date-input"
            type="date"
            value={customDate}
            onChange={(e) => setCustomDate(e.target.value)}
            className="w-full px-3 py-2 rounded bg-gray-700 text-white text-sm border border-gray-600 focus:outline-none focus:border-purple-500"
          />
          <button
            type="submit"
            disabled={!customDate}
            className="w-full px-3 py-2 rounded-lg text-sm font-medium bg-purple-600 hover:bg-purple-700 text-white disabled:bg-gray-600 disabled:cursor-not-allowed"
          >
            Go to Date
          </button>
        </form>
      )}

      {/* Recent Dates Header */}
      <div className="pt-2">
        <h3 className="text-xs uppercase tracking-wider text-gray-500 font-semibold mb-2 px-2">
          Recent Dates
        </h3>
      </div>

      {/* Scrollable Recent Dates List */}
      <div className="max-h-96 overflow-y-auto space-y-1 pr-2">
        {dates.map((date) => {
          const formattedDate = format(parseDateString(date), 'EEE, MMM d');
          const isActive = pathname === `/trading-desk/${date}`;
          const isToday = date === today;
          
          return (
            <Link
              key={date}
              href={`/trading-desk/${date}`}
              onClick={() => setLoading(true)}
              className={`
                block px-4 py-3 rounded-lg text-sm font-medium transition-colors relative
                ${isActive 
                  ? 'bg-purple-600 text-white' 
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                }
              `}
            >
              {formattedDate}
              {isToday && (
                <span className="ml-2 text-xs bg-green-500 text-white px-2 py-0.5 rounded-full">
                  Today
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
