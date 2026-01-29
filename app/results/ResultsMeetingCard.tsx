'use client';

import RaceResultCard from './RaceResultCard';

interface Props {
  meeting: any;
}

export default function ResultsMeetingCard({ meeting }: Props) {
  const track = meeting.track || {};
  const raceResults = meeting.raceResults || [];
  
  // Sort races by race number
  const sortedRaces = [...raceResults].sort((a, b) => 
    (a.number || 0) - (b.number || 0)
  );

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Meeting Header */}
      <div className="p-4 md:p-6 bg-gradient-to-r from-purple-600 to-purple-700 text-white">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div className="flex-1">
            <h2 className="text-xl md:text-2xl font-bold mb-2">
              {track.name || 'Unknown Track'} ({sortedRaces.length} {sortedRaces.length === 1 ? 'race' : 'races'})
            </h2>
            <div className="flex flex-wrap gap-3 text-sm">
              <span className="flex items-center gap-1">
                <span className="font-semibold">{track.state || 'N/A'}</span>
              </span>
              {meeting.railPosition && (
                <>
                  <span className="opacity-50">•</span>
                  <span>Rail: {meeting.railPosition}</span>
                </>
              )}
              {meeting.expectedCondition && (
                <>
                  <span className="opacity-50">•</span>
                  <span>Track: {meeting.expectedCondition}</span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Race Results */}
      <div className="p-4 md:p-6 space-y-4">
        {sortedRaces.length > 0 ? (
          sortedRaces.map((race: any, index: number) => (
            <RaceResultCard 
              key={race.raceId || index} 
              race={race}
              trackState={track.state}
            />
          ))
        ) : (
          <div className="text-center py-8 text-gray-500">
            <p>No race results available</p>
          </div>
        )}
      </div>
    </div>
  );
}
