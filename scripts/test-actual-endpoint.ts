import { config } from 'dotenv';
config({ path: '.env.local' });

async function testEndpoint() {
  const apiKey = process.env.PUNTING_FORM_API_KEY;
  const baseUrl = 'https://api.puntingform.com.au/v2';

  console.log('🔍 Testing Punting Form API endpoints...\n');

  // First get a meeting ID
  const meetingsUrl = `${baseUrl}/form/meetingslist?meetingDate=23-Jan-2026&stage=(A)&apiKey=${apiKey}`;
  const meetingsResponse = await fetch(meetingsUrl);
  const meetingsData = await meetingsResponse.json();

  if (!meetingsData.payLoad || meetingsData.payLoad.length === 0) {
    console.log('❌ No meetings found');
    return;
  }

  const meetingId = meetingsData.payLoad[0].meetingId;
  console.log(`📍 Testing with meeting: ${meetingsData.payLoad[0].track.name}`);
  console.log(`   Meeting ID: ${meetingId}\n`);

  // Test different endpoint variations
  const endpointsToTest = [
    { name: 'alltabformguideformeeting', url: `/form/alltabformguideformeeting?meetingId=${meetingId}` },
    { name: 'tabformguideformeeting', url: `/form/tabformguideformeeting?meetingId=${meetingId}` },
    { name: 'formguideformeeting', url: `/form/formguideformeeting?meetingId=${meetingId}` },
    { name: 'formguide', url: `/form/formguide?meetingId=${meetingId}` },
    { name: 'fields', url: `/form/fields?meetingId=${meetingId}` },
    { name: 'form (with meetingId)', url: `/form/form?meetingId=${meetingId}` },
  ];

  for (const endpoint of endpointsToTest) {
    const fullUrl = `${baseUrl}${endpoint.url}&apiKey=${apiKey}`;
    console.log(`\nTesting: ${endpoint.name}`);
    console.log(`URL: ${fullUrl}\n`);

    try {
      const response = await fetch(fullUrl);
      
      if (response.ok) {
        const data = await response.json();
        console.log(`✅ SUCCESS!`);
        console.log(`   Status: ${response.status}`);
        console.log(`   Has payLoad: ${!!data.payLoad}`);
        
        if (data.payLoad) {
          if (Array.isArray(data.payLoad)) {
            console.log(`   PayLoad is array with ${data.payLoad.length} items`);
            if (data.payLoad.length > 0) {
              console.log(`   First item keys: ${Object.keys(data.payLoad[0]).join(', ')}`);
            }
          } else if (typeof data.payLoad === 'object') {
            console.log(`   PayLoad keys: ${Object.keys(data.payLoad).join(', ')}`);
            if (data.payLoad.races) {
              console.log(`   Has ${data.payLoad.races?.length || 0} races`);
            }
          }
        }
        
        console.log(`\n🎉 FOUND WORKING ENDPOINT: ${endpoint.name}`);
        console.log(`\nSample response structure:`);
        console.log(JSON.stringify(data, null, 2).substring(0, 1000));
        break;
      } else {
        console.log(`❌ ${response.status}: ${response.statusText}`);
      }
    } catch (error: any) {
      console.log(`❌ Error: ${error.message}`);
    }
  }
}

testEndpoint();