import { config } from 'dotenv';
config({ path: '.env.local' });

import { getPuntingFormClient } from '../lib/integrations/punting-form/client';

async function checkSilksData() {
  const pfClient = getPuntingFormClient();
  
  try {
    console.log('🔍 Checking for silks data in API...\n');
    
    const meetingsResponse = await pfClient.getTodaysMeetings();
    const meetings = meetingsResponse.payLoad || [];
    
    if (meetings.length === 0) {
      console.log('⚠️  No meetings found\n');
      return;
    }

    const meeting = meetings[0];
    console.log(`📍 Checking meeting: ${meeting.track.name}\n`);

    const racesResponse = await pfClient.getAllRacesForMeeting(meeting. meetingId);
    const races = racesResponse.payLoad?. races || [];
    
    if (races.length === 0) {
      console.log('⚠️  No races found\n');
      return;
    }

    const race = races[0];
    const runners = race.runners || [];
    
    if (runners.length === 0) {
      console.log('⚠️  No runners found\n');
      return;
    }

    console.log(`🏇 Sample runner data (first runner):\n`);
    console.log(JSON.stringify(runners[0], null, 2));
    
    // Check for silks-related fields
    const runnerKeys = Object.keys(runners[0]);
    const silksFields = runnerKeys.filter(key => 
      key.toLowerCase().includes('silk') || 
      key.toLowerCase().includes('color') || 
      key.toLowerCase().includes('colour')
    );
    
    console.log('\n🎨 Silks/Color related fields found:');
    if (silksFields.length > 0) {
      console.log(silksFields);
    } else {
      console.log('❌ No silks data found in API response');
    }

  } catch (error:  any) {
    console.error('❌ Error:', error. message);
  }
}

checkSilksData();