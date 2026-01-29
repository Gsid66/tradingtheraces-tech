'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import type { PFMeeting, PFRace } from '@/lib/integrations/punting-form/client';
import { convertToAEDT } from '@/lib/utils/timezone-converter';

interface MeetingWithRaces extends PFMeeting {
  raceDetails?: PFRace[];
}

interface Props {
  meetings: MeetingWithRaces[];
}

type ClosestRace = { time: Date; track: string; raceNumber: number };

export default function FormGuideContent({ meetings }: Props) {
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update clock every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Filter to only Australian meetings (AUS and NZ)
  const australianMeetings = meetings.filter(meeting => 
    meeting.track.country === 'AUS' || meeting.track.country === 'NZ'
  );

  return (
    <>
      {/* Next To Jump Section */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <NextToJumpButton meetings={australianMeetings} currentTime={currentTime} />
        </div>

        {australianMeetings.length === 0 ? (
          <div className="text-center py-24">
            <div className="inline-block p-8 bg-gray-100 rounded-3xl border border-gray-200 shadow-lg">
              <div className="text-6xl mb-4">🏇</div>
              <p className="text-2xl font-bold text-gray-800 mb-2">No Races Today</p>
              <p className="text-gray-600">Check back later for Australian racing</p>
            </div>
          </div>
        ) : (
          <div className="grid gap-6">
            {australianMeetings.map((meeting) => (
              <MeetingCard key={meeting.meetingId} meeting={meeting} />
            ))}
          </div>
        )}
      </div>
    </>
  );
}

// Timezone mappings for Australian states (using IANA timezone identifiers)
const STATE_TIMEZONES: Record<string, string> = {
  'NSW': 'Australia/Sydney',
  'VIC': 'Australia/Melbourne',
  'ACT': 'Australia/Sydney',
  'TAS': 'Australia/Hobart',
  'QLD': 'Australia/Brisbane',
  'SA': 'Australia/Adelaide',
  'NT': 'Australia/Darwin',
  'WA': 'Australia/Perth',
  'NZ': 'Pacific/Auckland',
};

// Helper function to convert a datetime string in track local time to a Date object in AEDT
function parseTrackTimeToAEDT(startTime: string, trackTimezone: string): Date | null {
  try {
    // Parse the datetime string: "1/29/2026 1:40:00 PM"
    const match = startTime.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{2}):(\d{2})\s+(AM|PM)/i);
    if (!match) return null;
    
    const [, month, day, year, hours, minutes, seconds, period] = match;
    let hour = parseInt(hours);
    
    // Convert to 24-hour format
    if (period.toUpperCase() === 'PM' && hour !== 12) hour += 12;
    if (period.toUpperCase() === 'AM' && hour === 12) hour = 0;
    
    // Create an ISO-like string for the track local time
    const paddedMonth = month.padStart(2, '0');
    const paddedDay = day.padStart(2, '0');
    
    // Now we need to interpret the parsed time as if it's in the track's timezone
    // and get the equivalent UTC timestamp
    
    // Strategy: Create two dates at the same moment in time
    // 1. A reference date to understand the offset
    // 2. Calculate how to adjust our parsed date
    
    // Use a known reference point - use the parsed date components
    const referenceDate = new Date(`${year}-${paddedMonth}-${paddedDay}T12:00:00Z`);
    
    // Format this reference in both timezones to get the offset
    const trackFormatter = new Intl.DateTimeFormat('en-US', {
      timeZone: trackTimezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
    
    const utcFormatter = new Intl.DateTimeFormat('en-US', {
      timeZone: 'UTC',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
    
    const trackParts = trackFormatter.formatToParts(referenceDate);
    const utcParts = utcFormatter.formatToParts(referenceDate);
    
    const parseTimeFromParts = (parts: Intl.DateTimeFormatPart[]) => {
      const year = parseInt(parts.find(p => p.type === 'year')?.value || '0');
      const month = parseInt(parts.find(p => p.type === 'month')?.value || '0');
      const day = parseInt(parts.find(p => p.type === 'day')?.value || '0');
      const hour = parseInt(parts.find(p => p.type === 'hour')?.value || '0');
      const minute = parseInt(parts.find(p => p.type === 'minute')?.value || '0');
      const second = parseInt(parts.find(p => p.type === 'second')?.value || '0');
      return Date.UTC(year, month - 1, day, hour, minute, second);
    };
    
    const trackMs = parseTimeFromParts(trackParts);
    const utcMs = parseTimeFromParts(utcParts);
    
    // The offset is the difference between UTC and track time
    const offsetMs = utcMs - trackMs;
    
    // Now create the race time by treating our parsed components as track local time
    const raceLocalMs = Date.UTC(
      parseInt(year),
      parseInt(month) - 1,
      parseInt(day),
      hour,
      parseInt(minutes),
      parseInt(seconds)
    );
    
    // Adjust by the offset to get the actual UTC time
    const raceUtcMs = raceLocalMs + offsetMs;
    
    // Create the Date object (which will be in UTC internally)
    return new Date(raceUtcMs);
  } catch (error) {
    console.error('Error parsing race time:', error);
    return null;
  }
}

function NextToJumpButton({ meetings, currentTime }: { meetings: MeetingWithRaces[]; currentTime: Date }) {
  // Calculate next race and countdown
  const { countdown, nextRace } = useMemo(() => {
    // Find the next race across all meetings
    let closestRace: ClosestRace | null = null;
    
    meetings.forEach(meeting => {
      const trackState = meeting.track.state;
      const trackTimezone = STATE_TIMEZONES[trackState] || 'Australia/Sydney';
      
      meeting.raceDetails?.forEach(race => {
        if (race.startTime) {
          const raceTimeUTC = parseTrackTimeToAEDT(race.startTime, trackTimezone);
          
          if (raceTimeUTC && raceTimeUTC > currentTime) {
            if (!closestRace || raceTimeUTC < closestRace.time) {
              closestRace = {
                time: raceTimeUTC,
                track: meeting.track.name,
                raceNumber: race.number
              };
            }
          }
        }
      });
    });

    if (closestRace) {
      const raceData = closestRace as ClosestRace;
      const { track, raceNumber, time } = raceData;
      const nextRaceInfo = { track, raceNumber };
      
      // Calculate time difference
      const diff = time.getTime() - currentTime.getTime();
      const totalSeconds = Math.floor(diff / 1000);
      
      if (totalSeconds > 0) {
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;
        
        let countdownText;
        if (hours > 0) {
          countdownText = `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        } else {
          countdownText = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        }
        
        return { countdown: countdownText, nextRace: nextRaceInfo };
      } else {
        return { countdown: 'Starting now', nextRace: nextRaceInfo };
      }
    } else {
      return { countdown: '--:--', nextRace: null };
    }
  }, [meetings, currentTime]);

  return (
    <div className="flex justify-center">
      <div className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-purple-500 via-pink-500 to-purple-500 text-white rounded-2xl shadow-lg shadow-purple-500/50">
        <span className="text-2xl">⚡</span>
        <div>
          <div className="text-sm font-medium opacity-90">Next To Jump</div>
          <div className="text-lg font-bold font-mono">
            {countdown} remaining
            {nextRace && (
              <span className="text-sm ml-2 opacity-75">
                ({nextRace.track} R{nextRace.raceNumber})
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper function to format race time and convert to AEDT
function formatRaceTime(startTime: string, state: string) {
  try {
    const date = new Date(startTime);
    
    // Extract time in 12-hour format (this is in the track's local timezone)
    const localTimeStr = date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
    
    // Convert to AEDT
    const aedtTime = convertToAEDT(localTimeStr, state);
    
    return `${aedtTime} AEDT`;
  } catch {
    return '--:--';
  }
}

function MeetingCard({ meeting }: { meeting: MeetingWithRaces }) {
  const trackSlug = meeting.track.name.toLowerCase().replace(/\s+/g, '-');
  const races = meeting.raceDetails || [];
  const sortedRaces = [...races].sort((a, b) => a.number - b.number);
  const raceCount = races.length || meeting.races || 0;

  return (
    <div className="mb-8 bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Header Section */}
      <div className="p-4 md:p-6 bg-gradient-to-r from-purple-600 to-purple-700 text-white">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div className="flex-1">
            <Link
              href={`/form-guide/${trackSlug}/1`}
              className="group/link inline-block"
            >
              <h2 className="text-xl md:text-2xl font-bold mb-2 group-hover/link:text-purple-200 transition-colors">
                {meeting.track.name} ({raceCount} {raceCount === 1 ? 'race' : 'races'})
              </h2>
            </Link>
            <div className="flex flex-wrap gap-3 text-sm">
              <span className="flex items-center gap-1">
                <span className="font-semibold">{meeting.track.state}</span>
              </span>
              {meeting.railPosition && (
                <span className="flex items-center gap-1">
                  <span className="opacity-50">•</span>
                  <span>Rail: {meeting.railPosition}</span>
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Race Cards Grid - Responsive */}
      <div className="p-4 md:p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {sortedRaces.length > 0 ? (
            sortedRaces.map((race) => (
              <Link
                key={race.raceId}
                href={`/form-guide/${trackSlug}/${race.number}`}
              >
                <div className="border rounded-lg p-4 hover:bg-purple-50 hover:border-purple-500 transition-all cursor-pointer">
                  <div className="text-lg font-bold text-purple-600 mb-1">
                    Race {race.number}
                  </div>
                  <div className="text-sm text-gray-600">
                    {race.startTime ? formatRaceTime(race.startTime, meeting.track.state) : '--:--'}
                  </div>
                </div>
              </Link>
            ))
          ) : (
            // Fallback if race details aren't loaded
            Array.from({ length: raceCount }, (_, i) => i + 1).map((raceNum) => (
              <Link
                key={raceNum}
                href={`/form-guide/${trackSlug}/${raceNum}`}
              >
                <div className="border rounded-lg p-4 hover:bg-purple-50 hover:border-purple-500 transition-all cursor-pointer">
                  <div className="text-lg font-bold text-purple-600 mb-1">
                    Race {raceNum}
                  </div>
                  <div className="text-sm text-gray-600">
                    --:--
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
