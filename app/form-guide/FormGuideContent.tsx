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

  // Filter meetings by region
  const filteredMeetings = meetings.filter(meeting => {
    if (selectedRegion === 'australia') {
      return meeting.track.country === 'AUS' || meeting.track.country === 'NZ';
    }
    return meeting.track.country !== 'AUS' && meeting. track.country !== 'NZ';
  });

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Day Navigation */}
      <div className="flex gap-4 mb-6 border-b overflow-x-auto">
        {['yesterday', 'next-to-jump', 'today', 'tomorrow', 'saturday', 'sunday', 'futures'].map((day) => (
          <button
            key={day}
            onClick={() => setSelectedDay(day)}
            className={`px-4 py-3 text-sm font-medium capitalize whitespace-nowrap transition-colors ${
              selectedDay === day
                ? 'border-b-2 border-green-600 text-gray-900'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {day. replace('-', ' ')}
          </button>
        ))}
      </div>

      {/* Type and Region Filters */}
      <div className="flex gap-4 mb-6 flex-wrap">
        {/* Race Type */}
        <div className="flex gap-2">
          {['horses', 'greyhounds', 'harness']. map((type) => (
            <button
              key={type}
              onClick={() => setSelectedType(type)}
              className={`px-6 py-2 rounded-full text-sm font-medium capitalize transition-colors ${
                selectedType === type
                  ? 'bg-green-700 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {type}
            </button>
          ))}
        </div>

        {/* Region Filter */}
        <div className="flex gap-2 ml-auto">
          {['australia', 'international']. map((region) => (
            <button
              key={region}
              onClick={() => setSelectedRegion(region)}
              className={`px-6 py-2 rounded-full text-sm font-medium capitalize transition-colors ${
                selectedRegion === region
                  ? 'bg-green-700 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {region}
            </button>
          ))}
        </div>
      </div>

      {/* Meetings List */}
      {filteredMeetings.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          No meetings available for {selectedRegion}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredMeetings.map((meeting) => (
            <MeetingCard key={meeting.meetingId} meeting={meeting} />
          ))}
        </div>
      )}
    </div>
  );
}

function MeetingCard({ meeting }:  { meeting: PFMeeting }) {
  // Create URL-friendly slug from track name
  const trackSlug = meeting.track.name.toLowerCase().replace(/\s+/g, '-');

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-bold text-gray-900">{meeting.track.name}</h3>
          <p className="text-sm text-gray-600">
            {meeting.track.state} · {meeting.track.surface}
          </p>
        </div>
      </div>

      {/* Race Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {[1, 2, 3, 4, 5, 6, 7, 8]. map((raceNum) => (
          <a
            key={raceNum}
            href={`/form-guide/${trackSlug}/${raceNum}`}
            className="flex-shrink-0 px-4 py-2 text-sm font-medium border rounded hover:bg-gray-50 transition-colors"
          >
            Race {raceNum}
          </a>
        ))}
      </div>
    </div>
  );
}