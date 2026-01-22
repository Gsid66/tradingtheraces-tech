import { Suspense } from 'react';
import { getPuntingFormClient } from '@/lib/integrations/punting-form/client';
import FormGuideContent from './FormGuideContent';

export default async function FormGuidePage() {
  const pfClient = getPuntingFormClient();
  
  // Get today's meetings
  const meetingsResponse = await pfClient.getTodaysMeetings();
  const meetings = meetingsResponse.payLoad || [];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-gray-900">Form Guide</h1>
        </div>
      </div>

      <Suspense fallback={<div className="p-8 text-center">Loading...</div>}>
        <FormGuideContent meetings={meetings} />
      </Suspense>
    </div>
  );
}