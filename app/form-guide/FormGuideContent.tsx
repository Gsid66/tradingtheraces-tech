'use client';

import { useState } from 'react';
import type { PFMeeting } from '@/lib/integrations/punting-form/client';

interface Props {
  meetings: PFMeeting[];
}

export default function FormGuideContent({ meetings }: Props) {
  const [selectedDay, setSelectedDay] = useState('today');
  const [selectedType, setSelectedType] = useState('horses');
  const [selectedRegion, setSelectedRegion] = useState('australia');

  // Debug: Log meetings data
  console.log('📊 Total meetings:', meetings.length);
  console.log('📋 Meetings data:', meetings.map(m => ({ 
    name: m.track.name, 
    races: m.races,
    meetingId: m.meetingId 
  })));

  const filteredMeetings = meetings.filter(meeting => {
    if (selectedRegion === 'australia') {
      return meeting.track.country === 'AUS' || meeting.track.country === 'NZ';
    }
    return meeting.track.country !== 'AUS' && meeting.track.country !== 'NZ';
  });

  console.log('✅ Filtered meetings:', filteredMeetings.length);

  const days = [
    { id: 'yesterday', label: 'Yesterday', icon: '◀' },
    { id: 'next-to-jump', label: 'Next Jump', icon: '⚡' },
    { id: 'today', label: 'Today', icon: '●' },
    { id: 'tomorrow', label: 'Tomorrow', icon: '▶' },
    { id: 'saturday', label: 'Saturday', icon: '📅' },
    { id: 'sunday', label: 'Sunday', icon: '📅' },
    { id: 'futures', label: 'Futures', icon: '🔮' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="fixed inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
          backgroundSize: '40px 40px'
        }}></div>
      </div>

      <div className="relative z-10">
        <div className="sticky top-0 z-20 backdrop-blur-xl bg-white/10 border-b border-white/20 shadow-2xl">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
              {days.map(({ id, label, icon }) => (
                <button
                  key={id}
                  onClick={() => setSelectedDay(id)}
                  className={`group flex-shrink-0 px-6 py-3 rounded-2xl font-bold text-sm whitespace-nowrap transition-all duration-300 transform hover:scale-105 ${
                    selectedDay === id
                      ? 'bg-gradient-to-r from-purple-500 via-pink-500 to-purple-500 text-white shadow-lg shadow-purple-500/50 scale-105'
                      : 'bg-white/10 text-white/70 hover:bg-white/20 hover:text-white'
                  }`}
                >
                  <span className="mr-2 text-lg">{icon}</span>
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex flex-wrap items-center justify-between gap-6 mb-8">
            <div className="flex gap-4">
              {[
                { id: 'horses', label: 'Horses', gradient: 'from-emerald-400 to-cyan-400', icon: '🏇' },
                { id: 'greyhounds', label: 'Greyhounds', gradient: 'from-orange-400 to-red-400', icon: '🐕' },
                { id: 'harness', label: 'Harness', gradient: 'from-blue-400 to-indigo-400', icon: '🏁' }
              ].map(({ id, label, gradient, icon }) => (
                <button
                  key={id}
                  onClick={() => setSelectedType(id)}
                  className={`group relative px-8 py-4 rounded-2xl font-bold text-sm transition-all duration-300 transform hover:scale-110 hover:-rotate-1 ${
                    selectedType === id
                      ? `bg-gradient-to-r ${gradient} text-white shadow-2xl`
                      : 'bg-white/10 text-white/60 hover:bg-white/20'
                  }`}
                >
                  {selectedType === id && (
                    <div className={`absolute inset-0 bg-gradient-to-r ${gradient} rounded-2xl blur-xl opacity-50 animate-pulse`}></div>
                  )}
                  <span className="relative flex items-center gap-2">
                    <span className="text-xl">{icon}</span>
                    {label}
                  </span>
                </button>
              ))}
            </div>

            <div className="flex gap-2 bg-white/10 p-2 rounded-2xl backdrop-blur-sm">
              {[
                { id: 'australia', label: 'Australia', flag: '🇦🇺' },
                { id: 'international', label: 'International', flag: '🌍' }
              ].map(({ id, label, flag }) => (
                <button
                  key={id}
                  onClick={() => setSelectedRegion(id)}
                  className={`px-6 py-3 rounded-xl font-bold text-sm transition-all duration-300 ${
                    selectedRegion === id
                      ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg'
                      : 'text-white/60 hover:text-white'
                  }`}
                >
                  <span className="mr-2">{flag}</span>
                  {label}
                </button>
              ))}
            </div>
          </div>

          {filteredMeetings.length === 0 ? (
            <div className="text-center py-24">
              <div className="inline-block p-8 bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20">
                <div className="text-6xl mb-4">🏇</div>
                <p className="text-2xl font-bold text-white mb-2">No Races Today</p>
                <p className="text-white/60">Check back later for {selectedRegion} racing</p>
              </div>
            </div>
          ) : (
            <div className="grid gap-6">
              {filteredMeetings.map((meeting, index) => (
                <MeetingCard key={meeting.meetingId} meeting={meeting} index={index} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function MeetingCard({ meeting, index }:  { meeting: PFMeeting; index: number }) {
  const trackSlug = meeting.track.name.toLowerCase().replace(/\s+/g, '-');
  const raceCount = meeting.races ?? 0;
  
  // Debug log
  console.log(`🏇 ${meeting.track.name}: races = ${meeting.races}, raceCount = ${raceCount}`);
  
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
                            {meeting.track.name}
                          </h3>
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              );
            }
