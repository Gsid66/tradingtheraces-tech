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
          try {
            // Parse the datetime string from Punting Form API
            // Format: "1/29/2026 1:40:00 PM" (in track's local timezone)
            const dateTimeMatch = race.startTime.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{2}):(\d{2})\s+(AM|PM)/i);
            if (!dateTimeMatch) return;
            
            const [, month, day, year, hours, minutes, seconds, period] = dateTimeMatch;
            let hour = parseInt(hours);
            
            // Convert to 24-hour format
            if (period.toUpperCase() === 'PM' && hour !== 12) hour += 12;
            if (period.toUpperCase() === 'AM' && hour === 12) hour = 0;
            
            // Create a Date object in the track's local timezone
            // We need to create a date that represents the track local time, then get the equivalent AEDT time
            
            // First, create a Date with the time components (this will be in the user's browser timezone)
            const localDate = new Date(
              parseInt(year),
              parseInt(month) - 1,
              parseInt(day),
              hour,
              parseInt(minutes),
              parseInt(seconds)
            );
            
            // Get what this time would be in the track's timezone
            // We use Intl.DateTimeFormat to understand the offset between timezones
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
            
            const aedtFormatter = new Intl.DateTimeFormat('en-US', {
              timeZone: 'Australia/Sydney',
              year: 'numeric',
              month: '2-digit',
              day: '2-digit',
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
              hour12: false
            });
            
            // Get the offset between track timezone and AEDT at this point in time
            // by formatting a reference date in both timezones
            const refDate = new Date();
            const trackParts = trackFormatter.formatToParts(refDate);
            const aedtParts = aedtFormatter.formatToParts(refDate);
            
            const getTimeValue = (parts: Intl.DateTimeFormatPart[]) => {
              const hour = parts.find(p => p.type === 'hour')?.value || '0';
              const minute = parts.find(p => p.type === 'minute')?.value || '0';
              return parseInt(hour) * 60 + parseInt(minute);
            };
            
            const trackMinutes = getTimeValue(trackParts);
            const aedtMinutes = getTimeValue(aedtParts);
            const offsetMinutes = aedtMinutes - trackMinutes;
            
            // Apply the offset to convert track local time to AEDT
            const raceTimeAEDT = new Date(localDate.getTime() + offsetMinutes * 60 * 1000);
            
            // Now compare in AEDT
            if (raceTimeAEDT > currentTime) {
              if (!closestRace || raceTimeAEDT < closestRace.time) {
                closestRace = {
                  time: raceTimeAEDT,
                  track: meeting.track.name,
                  raceNumber: race.number
                };
              }
            }
          } catch (error) {
            console.error('Error parsing race time:', error);
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
