'use client';

import React from 'react';
import { format } from 'date-fns';

interface DateRangeDisplayProps {
  dateFrom: string;
  dateTo: string;
}

export default function DateRangeDisplay({ dateFrom, dateTo }: DateRangeDisplayProps) {
  // Format dates nicely (e.g., "January 28, 2026")
  const formatDisplayDate = (dateStr: string): string => {
    try {
      const date = new Date(dateStr);
      return format(date, 'MMMM d, yyyy');
    } catch (error) {
      return dateStr;
    }
  };

  const formattedStartDate = formatDisplayDate(dateFrom);
  const formattedEndDate = formatDisplayDate(dateTo);

  // Determine if dates are the same
  const isSameDate = dateFrom === dateTo;

  return (
    <div className="bg-purple-100 dark:bg-purple-900 p-4 rounded-lg mb-6 border-2 border-purple-200">
      <p className="text-center font-semibold text-purple-900 dark:text-purple-100">
        {isSameDate ? (
          <>Showing races for: {formattedStartDate}</>
        ) : (
          <>Showing races from: {formattedStartDate} to {formattedEndDate}</>
        )}
      </p>
    </div>
  );
}
