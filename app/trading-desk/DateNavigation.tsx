'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { format } from 'date-fns';

export default function DateNavigation() {
  const pathname = usePathname();
  const router = useRouter();
  const [showCustomDate, setShowCustomDate] = useState(false);
  const [customDate, setCustomDate] = useState('');
  
  // Generate today's date in AEDT timezone
  const today = new Date().toLocaleDateString('en-CA', { 
    timeZone: 'Australia/Sydney' 
  });

  // Generate last 14 days dynamically
  const dates = Array.from({ length: 14 }, (_, i) => {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    return date.toLocaleDateString('en-CA');
  });

  const handleCustomDateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (customDate) {
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
        className="block px-4 py-3 rounded-lg text-sm font-bold transition-colors bg-green-600 hover:bg-green-700 text-white text-center"
      >
        Today
        <div className="text-xs font-normal mt-1">
          {format(new Date(today), 'EEE, MMM d, yyyy')}
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
          <input
            type="date"
            value={customDate}
            onChange={(e) => setCustomDate(e.target.value)}
            className="w-full px-3 py-2 rounded bg-gray-700 text-white text-sm border border-gray-600 focus:outline-none focus:border-purple-500"
            placeholder="YYYY-MM-DD"
          />
          <button
            type="submit"
            className="w-full px-3 py-2 rounded-lg text-sm font-medium bg-purple-600 hover:bg-purple-700 text-white"
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
          const formattedDate = format(new Date(date), 'EEE, MMM d');
          const isActive = pathname === `/trading-desk/${date}`;
          const isToday = date === today;
          
          return (
            <Link
              key={date}
              href={`/trading-desk/${date}`}
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
