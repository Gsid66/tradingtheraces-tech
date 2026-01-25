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

  const filteredMeetings = meetings.filter(meeting => {
    if (selectedRegion === 'australia') {
      return meeting.track.country === 'AUS' || meeting.track.country === 'NZ';
    }
    return meeting.track.country !== 'AUS' && meeting.track.country !== 'NZ';
  });

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

function MeetingCard({ meeting, index }: { meeting: PFMeeting; index: number }) {
  const trackSlug = meeting.track.name.toLowerCase().replace(/\s+/g, '-');
  const raceCount = meeting.races ?? 0;
  
  const gradients = [
    'from-purple-500/20 to-pink-500/20',
    'from-blue-500/20 to-cyan-500/20',
    'from-emerald-500/20 to-teal-500/20',
    'from-orange-500/20 to-red-500/20',
    'from-indigo-500/20 to-purple-500/20'
  ];
  
  const gradient = gradients[index % gradients.length];

  // Generate race numbers array
  const raceNumbers = raceCount > 0 ? Array.from({ length: raceCount }, (_, i) => i + 1) : [];

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
              <h3 className="text-3xl font-black text-white mb-3 group-hover/link:text-transparent group-hover/link:bg-clip-text group-hover/link:bg-gradient-to-r group-hover/link:from-purple-400 group-hover/link:to-pink-400 transition-all duration-300">
                {meeting.track.name}
              </h3>
            </a>
            
            {/* Metadata Badges */}
            <div className="flex flex-wrap items-center gap-3">
              {/* State Badge */}
              <span className="px-3 py-1.5 bg-white/20 backdrop-blur-sm rounded-full text-xs font-bold text-white/90">
                {meeting.track.state}
              </span>
              
              {/* Rail Position Badge */}
              {meeting.railPosition && (
                <span className="px-3 py-1.5 bg-white/20 backdrop-blur-sm rounded-full text-xs font-bold text-white/90">
                  Rail: {meeting.railPosition}
                </span>
              )}
              
              {/* Track Condition Badge */}
              {meeting.expectedCondition && (
                <span className="px-3 py-1.5 bg-white/20 backdrop-blur-sm rounded-full text-xs font-bold text-white/90">
                  {meeting.expectedCondition}
                </span>
              )}
            </div>
          </div>
          
          {/* Race Count Badge */}
          {raceCount > 0 && (
            <div className="flex flex-col items-center justify-center px-6 py-3 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20">
              <div className="text-4xl font-black text-white">{raceCount}</div>
              <div className="text-xs font-bold text-white/70 tracking-wider">RACES</div>
            </div>
          )}
        </div>
      </div>
      
      {/* Race Pills Section */}
      <div className="p-6">
        {raceNumbers.length > 0 ? (
          <>
            <div className="flex items-center gap-2 mb-4">
              <svg className="w-5 h-5 text-white/70" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-sm font-bold text-white/70 uppercase tracking-wide">Select Race</span>
            </div>
            
            <div className="flex flex-wrap gap-2">
              {raceNumbers.map((raceNum) => (
                <a
                  key={raceNum}
                  href={`/form-guide/${trackSlug}/${raceNum}`}
                  className="group/race relative px-5 py-3 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 hover:bg-white/30 hover:border-white/50 hover:scale-105 hover:shadow-lg transition-all duration-300"
                >
                  <span className="text-sm font-bold text-white group-hover/race:text-yellow-300 transition-colors duration-300 flex items-center gap-2">
                    R{raceNum}
                    <svg className="w-4 h-4 opacity-0 group-hover/race:opacity-100 transition-opacity duration-300" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                    </svg>
                  </span>
                </a>
              ))}
            </div>
          </>
        ) : (
          <div className="text-center py-8">
            <div className="inline-flex items-center gap-3 px-6 py-4 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10">
              <svg className="w-5 h-5 text-white/50" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
              </svg>
              <span className="text-sm font-medium text-white/60">Race information not available</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
