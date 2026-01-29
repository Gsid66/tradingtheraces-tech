'use client';

import { useState } from 'react';
import ResultsMeetingCard from './ResultsMeetingCard';

interface Props {
  meetings: any[];
  selectedDate: Date;
}

export default function ResultsContent({ meetings, selectedDate }: Props) {
  // Calculate offset from selectedDate
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const selected = new Date(selectedDate);
  selected.setHours(0, 0, 0, 0);
  const initialOffset = Math.round((today.getTime() - selected.getTime()) / (1000 * 60 * 60 * 24));
  
  const [selectedDateOffset, setSelectedDateOffset] = useState(initialOffset || 1);

  // Calculate the actual date based on offset
  const displayDate = new Date();
  displayDate.setDate(displayDate.getDate() - selectedDateOffset);

  // Format date for display
  const formatDate = (date: Date) => {
    const options: Intl.DateTimeFormatOptions = { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    return date.toLocaleDateString('en-AU', options);
  };

  const handleDateChange = (offset: number) => {
    setSelectedDateOffset(offset);
    // Reload page with new date
    const newDate = new Date();
    newDate.setDate(newDate.getDate() - offset);
    window.location.href = `/results?date=${newDate.toISOString().split('T')[0]}`;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Date Selector */}
      <div className="mb-6 flex items-center justify-between flex-wrap gap-4">
        <div className="text-lg font-semibold text-gray-700">
          {formatDate(displayDate)}
        </div>
        <div className="flex gap-2">
          <label htmlFor="date-selector" className="sr-only">Select date</label>
          <select
            id="date-selector"
            value={selectedDateOffset}
            onChange={(e) => handleDateChange(Number(e.target.value))}
            className="px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-700 font-medium hover:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value={1}>Yesterday</option>
            <option value={2}>2 days ago</option>
            <option value={3}>3 days ago</option>
            <option value={4}>4 days ago</option>
            <option value={5}>5 days ago</option>
            <option value={6}>6 days ago</option>
            <option value={7}>7 days ago</option>
          </select>
        </div>
      </div>

      {/* Results Display */}
      {meetings.length === 0 ? (
        <div className="text-center py-24">
          <div className="inline-block p-8 bg-gray-100 rounded-3xl border border-gray-200 shadow-lg">
            <div className="text-6xl mb-4">🏇</div>
            <p className="text-2xl font-bold text-gray-800 mb-2">No Results Available</p>
            <p className="text-gray-600">No race results found for this date</p>
          </div>
        </div>
      ) : (
        <div className="grid gap-6">
          {meetings.map((meeting: any, index: number) => (
            <ResultsMeetingCard key={meeting.meetingId || index} meeting={meeting} />
          ))}
        </div>
      )}
    </div>
  );
}
