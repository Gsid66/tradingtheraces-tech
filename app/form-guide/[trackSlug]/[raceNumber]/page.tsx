import { notFound } from 'next/navigation';
import { getPuntingFormClient } from '@/lib/integrations/punting-form/client';
import RaceTabs from './RaceTabs';
import RaceDetails from './RaceDetails';
import RunnerList from './RunnerList';

export const dynamic = 'force-dynamic';

interface Props {
  params: {
    trackSlug: string;
    raceNumber: string;
  };
}

export default async function RacePage({ params }: Props) {
  const pfClient = getPuntingFormClient();
  
  // Get today's meetings to find the right one
  const meetingsResponse = await pfClient.getTodaysMeetings();
  const meetings = meetingsResponse.payLoad || [];
  
  // Find meeting by track slug
  const meeting = meetings.find(m => 
    m.track.name. toLowerCase().replace(/\s+/g, '-') === params.trackSlug
  );
  
  if (!meeting) {
    notFound();
  }

  // Get all races for this meeting
  const racesResponse = await pfClient.getAllRacesForMeeting(meeting.meetingId);
  const races = racesResponse.payLoad?. races || [];
  
  // Find the specific race
  const raceNum = parseInt(params.raceNumber);
  const race = races.find(r => r.number === raceNum);
  
  if (!race) {
    notFound();
  }

  // Get runners
  const runners = race.runners || [];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumb */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <a href="/" className="hover:text-gray-900">Home</a>
            <span>›</span>
            <a href="/form-guide" className="hover: text-gray-900">Form Guide</a>
            <span>›</span>
            <span className="text-gray-900 font-medium">{meeting.track.name}</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Track Header */}
        <div className="flex items-center gap-3 mb-6">
          <h1 className="text-3xl font-bold text-green-700">{meeting.track.name}</h1>
          <span className="px-3 py-1 bg-gray-200 text-gray-700 text-sm font-medium rounded">
            {meeting.track.state}
          </span>
        </div>

        {/* Race Navigation Pills */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {races.map((r) => (
            <a
              key={r.raceId}
              href={`/form-guide/${params.trackSlug}/${r. number}`}
              className={`flex-shrink-0 px-6 py-3 rounded-full font-medium transition-colors ${
                r.number === raceNum
                  ?  'bg-green-700 text-white'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              R{r.number}
            </a>
          ))}
        </div>

        {/* Race Details Component */}
        <RaceDetails race={race} meeting={meeting} />

        {/* Tabs */}
        <RaceTabs />

        {/* Sort & Filter */}
        <div className="bg-white px-6 py-4 flex gap-4 border-b">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">Sort:  </span>
            <select className="px-3 py-2 border rounded text-sm">
              <option>Runner Number</option>
              <option>Barrier</option>
              <option>Weight</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">Odds: </span>
            <select className="px-3 py-2 border rounded text-sm">
              <option>Best Odds</option>
              <option>Fixed Odds</option>
              <option>TAB Odds</option>
            </select>
          </div>
        </div>

        {/* Runner List */}
        <RunnerList runners={runners} />
      </div>
    </div>
  );
}