import { config } from 'dotenv';
config({ path: '.env.local' });

import { getPuntingFormClient } from '../lib/integrations/punting-form/client';

async function debugResults() {
  console.log('🔍 Testing results endpoints.. .\n');

  const pfClient = getPuntingFormClient();

  try {
    // Get yesterday's meetings
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    console.log(`📅 Getting meetings for yesterday.. .\n`);
    
    const meetingsResponse = await pfClient.getMeetingsByDate(yesterday);
    
    if (meetingsResponse.payLoad && meetingsResponse.payLoad.length > 0) {
      const firstMeeting = meetingsResponse. payLoad[0];
      console.log(`📍 Found meeting: ${firstMeeting.track.name}`);
      console.log(`   Meeting ID: ${firstMeeting.meetingId}\n`);

      // Now try to get results using the meeting ID
      console.log('🔍 Fetching results for this meeting...\n');
      
      const resultsResponse = await pfClient.getMeetingResults(firstMeeting.meetingId);
      
      console.log('✅ SUCCESS!  Results structure:\n');
      console.log(JSON.stringify(resultsResponse, null, 2));

      if (resultsResponse.payLoad) {
        console.log('\n📊 Results payload structure:\n');
        
        // Check if it's an array or object
        if (Array.isArray(resultsResponse.payLoad)) {
          console.log(`   Found ${resultsResponse.payLoad. length} races with results`);
          
          if (resultsResponse.payLoad. length > 0) {
            console.log('\n🏁 First race result:\n');
            console. log(JSON.stringify(resultsResponse.payLoad[0], null, 2));
          }
        } else {
          console. log('   Payload is an object:', Object. keys(resultsResponse.payLoad));
        }
      }

    } else {
      console. log('⚠️  No meetings found for yesterday');
      console.log('   This might mean yesterday\'s data has been archived');
      console.log('   Or there were no meetings yesterday\n');
      
      // Try today's meetings to see if any races have finished
      console.log('📅 Trying today\'s meetings instead...\n');
      const todayMeetings = await pfClient.getTodaysMeetings();
      
      if (todayMeetings. payLoad && todayMeetings.payLoad.length > 0) {
        const firstMeeting = todayMeetings.payLoad[0];
        console.log(`📍 Found today's meeting: ${firstMeeting.track.name}`);
        console.log(`   Meeting ID: ${firstMeeting.meetingId}\n`);
        
        console.log('🔍 Checking if any results available yet...\n');
        const resultsResponse = await pfClient.getMeetingResults(firstMeeting.meetingId);
        console.log(JSON.stringify(resultsResponse, null, 2));
      }
    }

  } catch (error:  any) {
    console.error('❌ Error:', error.message);
  }
}

debugResults();