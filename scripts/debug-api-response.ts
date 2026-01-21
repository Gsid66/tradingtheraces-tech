import { config } from 'dotenv';
config({ path: '.env.local' });

import { getPuntingFormClient } from '../lib/integrations/punting-form/client';

async function debugAPIResponse() {
  console.log('🔍 Debugging Punting Form API response...\n');

  const pfClient = getPuntingFormClient();

  try {
    const meetingsResponse = await pfClient.getTodaysMeetings();
    const firstMeeting = meetingsResponse.payLoad[0];

    console.log('📍 First Meeting:', firstMeeting.track.name);
    console.log('Meeting ID:', firstMeeting.meetingId, '\n');

    const fieldsResponse = await pfClient.getAllRacesForMeeting(firstMeeting.meetingId);
    const firstRace = fieldsResponse.payLoad.races[0];

    console. log('🏁 First Race:', firstRace.name || `Race ${firstRace.number}`);
    console.log('Race ID:', firstRace.raceId);
    console.log('Runners count:', firstRace.runners?. length || 0, '\n');

    if (firstRace.runners && firstRace.runners.length > 0) {
      const firstRunner = firstRace.runners[0];
      
      console.log('🐴 First Runner - ALL FIELDS:\n');
      console.log(JSON.stringify(firstRunner, null, 2));
    }

  } catch (error:  any) {
    console.error('❌ Error:', error. message);
  }
}

debugAPIResponse();