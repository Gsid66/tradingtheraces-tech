import { config } from 'dotenv';
config({ path: '.env.local' });

async function rawApiTest() {
  const apiKey = process.env.PUNTING_FORM_API_KEY;
  const baseUrl = 'https://api.puntingform.com.au/v2';

  console.log('🔍 Testing Punting Form API directly...\n');

  // Test 1: Get today's meetings (this works)
  const todayDate = new Date().toLocaleDateString('en-AU', { 
    day: '2-digit', 
    month: 'short', 
    year:  'numeric' 
  });
  
  console.log(`📅 Date format: ${todayDate}\n`);

  const meetingsUrl = `${baseUrl}/form/meetingslist? meetingDate=${todayDate}&stage=(A)&apiKey=${apiKey}`;
  console.log('1️⃣ Testing meetings endpoint: ');
  console.log(`   ${meetingsUrl}\n`);

  try {
    const meetingsResponse = await fetch(meetingsUrl);
    const meetingsData = await meetingsResponse.json();
    
    if (meetingsData.payLoad && meetingsData.payLoad.length > 0) {
      const firstMeeting = meetingsData.payLoad[0];
      console.log(`   ✅ Got ${meetingsData.payLoad.length} meetings`);
      console.log(`   First:  ${firstMeeting.track. name} (ID: ${firstMeeting.meetingId})\n`);

      // Test 2: Try different variations of the races endpoint
      const meetingId = firstMeeting.meetingId;

      const endpointsToTry = [
        `/form/alltabformguideformeeting?meetingId=${meetingId}`,
        `/form/formguide?meetingId=${meetingId}`,
        `/form/fields?meetingId=${meetingId}`,
        `/form/races?meetingId=${meetingId}`,
        `/races?meetingId=${meetingId}`,
        `/alltabformguide?meetingId=${meetingId}`,
        `/tabformguide?meetingId=${meetingId}`,
      ];

      for (const endpoint of endpointsToTry) {
        const url = `${baseUrl}${endpoint}&apiKey=${apiKey}`;
        console.log(`\n2️⃣ Testing:  ${endpoint}`);
        
        try {
          const response = await fetch(url);
          
          if (response.ok) {
            const data = await response. json();
            console.log(`   ✅ SUCCESS! `);
            console.log(`   Status: ${response.status}`);
            console.log(`   Response structure: `, Object.keys(data));
            
            if (data.payLoad) {
              console.log(`   PayLoad type: `, Array.isArray(data.payLoad) ? 'Array' : 'Object');
              if (Array.isArray(data.payLoad) && data.payLoad.length > 0) {
                console. log(`   PayLoad[0] keys:`, Object.keys(data.payLoad[0]));
              } else if (typeof data.payLoad === 'object') {
                console.log(`   PayLoad keys:`, Object.keys(data.payLoad));
              }
            }
            
            // Found a working endpoint!
            console.log(`\n   🎉 THIS ENDPOINT WORKS! Full response:`);
            console.log(JSON.stringify(data, null, 2).substring(0, 2000));
            break;
          } else {
            console.log(`   ❌ ${response.status}:  ${response.statusText}`);
          }
        } catch (error:  any) {
          console.log(`   ❌ Error: ${error.message}`);
        }
      }

    } else {
      console. log('   ❌ No meetings found');
    }

  } catch (error: any) {
    console.error('❌ Error:', error.message);
  }
}

rawApiTest();