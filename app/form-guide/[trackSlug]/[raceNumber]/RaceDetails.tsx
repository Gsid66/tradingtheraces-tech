'use client';

import { useState, useEffect } from 'react';
import type { PFRace, PFMeeting } from '@/lib/integrations/punting-form/client';

interface Props {
  race: PFRace;
  meeting: PFMeeting;
}

export default function RaceDetails({ race, meeting }: Props) {
  const [timeUntilRace, setTimeUntilRace] = useState<string>('');

  // Calculate countdown to race start
  useEffect(() => {
    const calculateTimeUntil = () => {
      if (!race.startTime) {
        setTimeUntilRace('-');
        return;
      }

      try {
        const raceTime = new Date(race.startTime);
        const now = new Date();
        const diffMs = raceTime.getTime() - now.getTime();

        // If race has already started
        if (diffMs < 0) {
          const minutesAgo = Math.floor(Math.abs(diffMs) / 60000);
          setTimeUntilRace(`-${minutesAgo}m`);
          return;
        }

        // Calculate time remaining
        const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);

        // Format display
        if (days > 0) {
          setTimeUntilRace(`${days}d ${hours}h`);
        } else if (hours > 0) {
          setTimeUntilRace(`${hours}h ${minutes}m`);
        } else if (minutes > 0) {
          setTimeUntilRace(`${minutes}m ${seconds}s`);
        } else {
          setTimeUntilRace(`${seconds}s`);
        }
      } catch {
        setTimeUntilRace('-');
      }
    };

    // Calculate immediately
    calculateTimeUntil();

    // Update every second
    const interval = setInterval(calculateTimeUntil, 1000);

    return () => clearInterval(interval);
  }, [race.startTime]);

  // Format start time to AEDT
  const formatStartTime = (startTime: string) => {
    try {
      const date = new Date(startTime);
      if (isNaN(date.getTime())) {
        return '';
      }
      return date.toLocaleTimeString('en-AU', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
        timeZone: 'Australia/Sydney'
      });
    } catch {
      return '';
    }
  };

  const startTimeDisplay = race.startTime ? formatStartTime(race.startTime) : '';

  // Determine badge color based on time
  const getBadgeColor = () => {
    if (!race.startTime) return 'bg-gray-600';
    
    const raceTime = new Date(race.startTime);
    const now = new Date();
    const diffMs = raceTime.getTime() - now.getTime();
    
    if (diffMs < 0) return 'bg-gray-600'; // Past
    if (diffMs < 5 * 60 * 1000) return 'bg-red-600 animate-pulse'; // Less than 5 min
    if (diffMs < 15 * 60 * 1000) return 'bg-orange-600'; // Less than 15 min
    return 'bg-green-600'; // Future
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      {/* Race Title Row */}
      <div className="flex items-start justify-between mb-4 flex-wrap gap-4">
        <div className="flex items-start gap-4">
          {/* Countdown Badge */}
          <div className={`${getBadgeColor()} text-white px-3 py-1 rounded font-bold text-sm transition-colors`}>
            {timeUntilRace || '-'}
          </div>
          
          {/* Race Name */}
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              {race.name}{startTimeDisplay && ` - ${startTimeDisplay} AEDT`}
            </h2>
          </div>
        </div>
      </div>

      {/* Race Info Icons */}
      <div className="flex flex-wrap items-center gap-6 text-sm text-gray-700">
        {/* Date */}
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span>{new Date(meeting.meetingDate).toLocaleDateString('en-AU')}</span>
        </div>

        {/* Track Condition */}
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
          </svg>
          <span>{meeting.expectedCondition || 'Good 3'}</span>
        </div>

        {/* Distance */}
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
          <span>{race.distance}m</span>
        </div>

        {/* Weather */}
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
          <span>33°C</span>
        </div>

        {/* Class */}
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
          <span>{race.raceClass || 'Class 1, Set Weights'}</span>
        </div>

        {/* Prize Money */}
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>${(race.prizeMoney || 0).toLocaleString()}</span>
        </div>
      </div>

      {/* Race Description */}
      {race.description && (
        <p className="mt-4 text-sm text-gray-600">
          {race.description}
        </p>
      )}
    </div>
  );
}