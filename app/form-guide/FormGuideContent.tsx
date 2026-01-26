'use client';

import { useState, useEffect, useMemo } from 'react';
import type { PFMeeting, PFRace } from '@/lib/integrations/punting-form/client';

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

  // Format date in AEDT timezone
  const aedtDate = currentTime.toLocaleDateString('en-AU', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'Australia/Sydney'
  });

  // Format time in AEDT timezone
  const aedtTime = currentTime.toLocaleTimeString('en-AU', {
    hour: 'numeric',
    minute: '2-digit',
    timeZone: 'Australia/Sydney',
    hour12: true
  }) + ' AEDT';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="fixed inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
          backgroundSize: '40px 40px'
        }}></div>
      </div>

      <div className="relative z-10">
        {/* New Header Section */}
        <div className="sticky top-0 z-20 backdrop-blur-xl bg-white/10 border-b border-white/20 shadow-2xl">
          <div className="max-w-7xl mx-auto px-4 py-6">
            <h1 className="text-4xl font-black text-white mb-3">
              Today&apos;s Australian Horse Racing
            </h1>
            <div className="flex items-center gap-4 text-white/80 text-lg">
              <span>{aedtDate}</span>
              <span className="text-white/40">|</span>
              <span className="font-mono">{aedtTime}</span>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 py-8">
          {/* Next To Jump Section */}
          <div className="mb-8">
            <NextToJumpButton meetings={australianMeetings} currentTime={currentTime} />
          </div>

          {australianMeetings.length === 0 ? (
            <div className="text-center py-24">
              <div className="inline-block p-8 bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20">
                <div className="text-6xl mb-4">🏇</div>
                <p className="text-2xl font-bold text-white mb-2">No Races Today</p>
                <p className="text-white/60">Check back later for Australian racing</p>
              </div>
            </div>
          ) : (
            <div className="grid gap-6">
              {australianMeetings.map((meeting, index) => (
                <MeetingCard key={meeting.meetingId} meeting={meeting} index={index} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function NextToJumpButton({ meetings, currentTime }: { meetings: MeetingWithRaces[]; currentTime: Date }) {
  // Calculate next race and countdown
  const { countdown, nextRace } = useMemo(() => {
    // Find the next race across all meetings
    let closestRace: ClosestRace | null = null;
    
    meetings.forEach(meeting => {
      meeting.raceDetails?.forEach(race => {
        if (race.startTime) {
          const raceTime = new Date(race.startTime);
          if (raceTime > currentTime) {
            if (!closestRace || raceTime < closestRace.time) {
              closestRace = {
                time: raceTime,
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

// Helper function to format race time in AEDT
function formatRaceTime(startTime: string) {
  try {
    const date = new Date(startTime);
    return date.toLocaleTimeString('en-AU', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      timeZone: 'Australia/Sydney'
    });
  } catch {
    return '--:--';
  }
}

function MeetingCard({ meeting, index }: { meeting: MeetingWithRaces; index: number }) {
  const trackSlug = meeting.track.name.toLowerCase().replace(/\s+/g, '-');
  const races = meeting.raceDetails || [];
  const sortedRaces = [...races].sort((a, b) => a.number - b.number);
  const raceCount = races.length || meeting.races || 0;

  const gradients = [
    'from-purple-500/20 to-pink-500/20',
    'from-blue-500/20 to-cyan-500/20',
    'from-emerald-500/20 to-teal-500/20',
    'from-orange-500/20 to-red-500/20',
    'from-indigo-500/20 to-purple-500/20'
  ];

  const gradient = gradients[index % gradients.length];

  return (
    <div
      className={`group bg-gradient-to-br ${gradient} backdrop-blur-xl rounded-3xl border border-white/20 overflow-hidden hover:border-white/40 transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl`}
      style={{ animation: `fadeIn 0.5s ease-out ${index * 0.1}s backwards` }}
    >
      {/* Header Section */}
      <div className="relative p-6 bg-gradient-to-r from-white/10 to-transparent border-b border-white/10">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div className="flex-1">
            <a
              href={`/form-guide/${trackSlug}/1`}
              className="group/link inline-block"
            >
              <h3 className="text-3xl font-black text-white mb-2 group-hover/link:text-transparent group-hover/link:bg-clip-text group-hover/link:bg-gradient-to-r group-hover/link:from-purple-400 group-hover/link:to-pink-400 transition-all duration-300">
                {meeting.track.name} ({raceCount} {raceCount === 1 ? 'race' : 'races'})
              </h3>
            </a>
            <div className="flex flex-wrap gap-3 text-sm text-white/70">
              <span className="flex items-center gap-1">
                <span className="text-white/90 font-semibold">{meeting.track.state}</span>
              </span>
              {meeting.railPosition && (
                <span className="flex items-center gap-1">
                  <span className="text-white/50">•</span>
                  <span>Rail: {meeting.railPosition}</span>
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Race Pills Section */}
      <div className="p-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
          {sortedRaces.length > 0 ? (
            sortedRaces.map((race) => (
              <a
                key={race.raceId}
                href={`/form-guide/${trackSlug}/${race.number}`}
                className="flex flex-col items-center gap-2 p-4 bg-white/10 hover:bg-white/20 rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-lg group/race"
              >
                <span className="text-xl font-black text-white group-hover/race:text-transparent group-hover/race:bg-clip-text group-hover/race:bg-gradient-to-r group-hover/race:from-purple-400 group-hover/race:to-pink-400">
                  R{race.number}
                </span>
                <span className="text-xs text-white/70 font-medium">
                  {race.startTime ? formatRaceTime(race.startTime) : '--:--'}
                </span>
              </a>
            ))
          ) : (
            // Fallback if race details aren't loaded
            Array.from({ length: raceCount }, (_, i) => i + 1).map((raceNum) => (
              <a
                key={raceNum}
                href={`/form-guide/${trackSlug}/${raceNum}`}
                className="flex flex-col items-center gap-2 p-4 bg-white/10 hover:bg-white/20 rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-lg group/race"
              >
                <span className="text-xl font-black text-white group-hover/race:text-transparent group-hover/race:bg-clip-text group-hover/race:bg-gradient-to-r group-hover/race:from-purple-400 group-hover/race:to-pink-400">
                  R{raceNum}
                </span>
                <span className="text-xs text-white/50 font-medium">
                  --:--
                </span>
              </a>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
