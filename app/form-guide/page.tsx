import { Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { FiArrowLeft } from 'react-icons/fi';
import { getPuntingFormClient } from '@/lib/integrations/punting-form/client';
import FormGuideContent from './FormGuideContent';

export const dynamic = 'force-dynamic';

export default async function FormGuidePage() {
  const pfClient = getPuntingFormClient();
  
  // Get today's meetings
  const meetingsResponse = await pfClient.getTodaysMeetings();
  const meetings = meetingsResponse.payLoad || [];

  // Deduplicate meetings by meetingId
  const uniqueMeetings = meetings.filter((meeting, index, self) =>
    index === self.findIndex((m) => m.meetingId === meeting.meetingId)
  );

  // Fetch race details for each meeting to get start times
  const meetingsWithRaces = await Promise.all(
    uniqueMeetings.map(async (meeting) => {
      try {
        const racesResponse = await pfClient.getAllRacesForMeeting(meeting.meetingId);
        return {
          ...meeting,
          raceDetails: racesResponse.payLoad?.races || []
        };
      } catch (error) {
        console.error(`Error fetching races for ${meeting.track.name}:`, error);
        return {
          ...meeting,
          raceDetails: []
        };
      }
    })
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Section with Back Button */}
      <div className="bg-gradient-to-r from-purple-900 to-purple-700 text-white py-6 px-4 shadow-lg">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-4 mb-4">
            <div className="bg-white rounded-lg p-1">
              <Image
                src="/images/ttr-logo.png"
                alt="TTR Logo"
                width={32}
                height={32}
                className="w-8 h-8 object-contain"
              />
            </div>
            <Link 
              href="/" 
              className="inline-flex items-center gap-2 text-purple-200 hover:text-white transition-colors"
            >
              <FiArrowLeft size={20} />
              <span>Back to Home</span>
            </Link>
          </div>
          <h1 className="text-4xl font-bold mb-2">Today&apos;s Racing - Form Guide</h1>
          <p className="text-purple-200">Live Australian Horse Racing</p>
        </div>
      </div>
      
      <Suspense fallback={
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
            <p className="text-gray-500 font-medium">Loading meetings...</p>
          </div>
        </div>
      }>
        <FormGuideContent meetings={meetingsWithRaces} />
      </Suspense>
    </div>
  );
}