'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { format, subDays } from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';

export default function DateNavigation() {
  const pathname = usePathname();
  
  // Get today's date in Sydney timezone
  const today = new Date();
  const sydneyToday = formatInTimeZone(today, 'Australia/Sydney', 'yyyy-MM-dd');
  
  // Generate last 14 days
  const dates: string[] = [];
  for (let i = 0; i < 14; i++) {
    const date = subDays(new Date(sydneyToday), i);
    const dateStr = format(date, 'yyyy-MM-dd');
    dates.push(dateStr);
  }

  return (
    <nav className="space-y-1">
      {dates.map((date) => {
        const formattedDate = format(new Date(date), 'EEE, MMM d');
        const isActive = pathname === `/trading-desk/${date}`;
        
        return (
          <Link
            key={date}
            href={`/trading-desk/${date}`}
            className={`
              block px-4 py-3 rounded-lg text-sm font-medium transition-colors
              ${isActive 
                ? 'bg-purple-600 text-white' 
                : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              }
            `}
          >
            {formattedDate}
          </Link>
        );
      })}
    </nav>
  );
}
