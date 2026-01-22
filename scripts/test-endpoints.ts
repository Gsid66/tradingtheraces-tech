import { config } from 'dotenv';
config({ path: '.env.local' });

import { getPuntingFormClient } from '../lib/integrations/punting-form/client';

async function testEndpoints() {
  const pfClient = getPuntingFormClient();

  try {
    console.log('🔍 Testing different API endpoints...\n');

    // Get today's meetings first
    const todayMeetings = await pfClient.getTodaysMeetings();
    const firstMeeting = todayMeetings.payLoad[0];
    
    console.log(`📍 Using meeting:  ${firstMeeting.track. name}`);
    console.log(`   Meeting ID: ${firstMeeting. meetingId}\n`);

    // Test 1: alltabformguideformeeting (current one that's failing)
    console.log('1️⃣ Testing:  /form/alltabformguideformeeting');
    try {
      const response = await pfClient.getAllRacesForMeeting(firstMeeting. meetingId);
      console.log(`   ✅ SUCCESS! Found ${response.payLoad.races. length} races\n`);
    } catch (error: any) {
      console.log(`   ❌ FAILED: ${error.message}\n`);
    }

    // Test 2: Try the races endpoint with meetingId as number
    console.log('2️⃣ Testing: /form/races?meetingId=');
    try {
      const meetingIdNum = parseInt(firstMeeting.meetingId);
      const response = await pfClient.getRacesByMeeting(meetingIdNum);
      console.log(`   ✅ SUCCESS! Found ${response.payLoad.length} races`);
      
      if (response.payLoad.length > 0) {
        console.log(`   First race: ${response.payLoad[0].name}`);
        console.log(`   Race has runners field: ${response.payLoad[0].runners ?  'YES' : 'NO'}\n`);
      }
    } catch (error: any) {
      console.log(`   ❌ FAILED: ${error.message}\n`);
    }

    // Test 3: Try getting races then runners separately
    console.log('3️⃣ Testing: /form/races then /form/runners');
    try {
      const meetingIdNum = parseInt(firstMeeting. meetingId);
      const racesResponse = await pfClient.getRacesByMeeting(meetingIdNum);
      
      if (racesResponse.payLoad.length > 0) {
        const firstRace = racesResponse. payLoad[0];
        console.log(`   ✅ Got race: ${firstRace.name}`);
        console.log(`   Race ID: ${firstRace.raceId}`);
        
        // Now try to get runners
        const raceIdNum = parseInt(firstRace. raceId);
        const runnersResponse = await pfClient.getRunnersByRace(raceIdNum);
        console.log(`   ✅ Got ${runnersResponse.payLoad. runners. length} runners\n`);
      }
    } catch (error: any) {
      console.log(`   ❌ FAILED: ${error.message}\n`);
    }

    // Test 4: Try formguide endpoint (without "alltab")
    console.log('4️⃣ Testing: /form/formguide? meetingId=');
    try {
      const apiKey = process.env.PUNTING_FORM_API_KEY;
      const url = `https://api.puntingform.com.au/v2/form/formguide? meetingId=${firstMeeting.meetingId}&apiKey=${apiKey}`;
      console.log(`   🔗 ${url}`);
      
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        console.log(`   ✅ SUCCESS! `);
        console.log(`   Response keys: `, Object.keys(data));
        if (data.payLoad) {
          console.log(`   PayLoad keys:`, Object.keys(data.payLoad));
        }
      } else {
        console.log(`   ❌ FAILED: ${response.statusText}`);
      }
    } catch (error: any) {
      console.log(`   ❌ FAILED: ${error.message}`);
    }

  } catch (error: any) {
    console.error('❌ Error:', error.message);
  }
}

testEndpoints();