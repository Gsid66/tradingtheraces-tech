import { Suspense } from 'react';
import { getPuntingFormClient } from '@/lib/integrations/punting-form/client';
import FormGuideContent from './FormGuideContent';

export const dynamic = 'force-dynamic';

export default async function FormGuidePage() {
  const pfClient = getPuntingFormClient();
  
  // Get today's meetings
  const meetingsResponse = await pfClient.getTodaysMeetings();
  const meetings = meetingsResponse.payLoad || [];

  return (
    <div className="min-h-screen bg-gray-50">
      <Suspense fallback={
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
            <p className="text-gray-500 font-medium">Loading meetings...</p>
          </div>
        </div>
      }>
        <FormGuideContent meetings={meetings} />
      </Suspense>
    </div>
  );
}