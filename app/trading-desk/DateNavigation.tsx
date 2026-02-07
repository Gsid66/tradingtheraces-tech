'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { format } from 'date-fns';

export default function DateNavigation() {
  const pathname = usePathname();
  
  // Hardcoded dates with actual data
  const dates = ['2026-02-06', '2026-02-07'];

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
