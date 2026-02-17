import { config } from 'dotenv';
config({ path: '.env.local' });

import { getPuntingFormClient } from '../lib/integrations/punting-form/client';

async function discoverEndpoints() {
  console.log('🔍 Discovering Punting Form API Endpoints\n');
  console.log('═'.repeat(70));
  
  const pfClient = getPuntingFormClient();
  const apiKey = process.env.PUNTING_FORM_API_KEY;
  const baseUrl = 'https://api.puntingform.com.au/v2';
  
  // Get a recent meeting with potential results
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  
  console.log('📅 Fetching yesterday\'s meetings...\n');
  const meetingsResponse = await pfClient.getMeetingsByDate(yesterday);
  const meetings = meetingsResponse.payLoad || [];
  
  if (meetings.length === 0) {
    console.log('⚠️ No meetings found for yesterday, trying today...\n');
    const todayMeetings = await pfClient.getTodaysMeetings();
    meetings.push(...(todayMeetings.payLoad || []));
  }
  
  if (meetings.length === 0) {
    console.log('❌ No meetings found. Cannot test endpoints.');
    return;
  }
  
  const meeting = meetings[0];
  console.log(`📍 Testing with: ${meeting.track.name} (${meeting.meetingId})\n`);
  
  // Get a race
  const racesResponse = await pfClient.getAllRacesForMeeting(meeting.meetingId);
  const races = racesResponse.payLoad?.races || [];
  
  if (races.length === 0) {
    console.log('⚠️ No races found');
    return;
  }
  
  const race = races[0];
  const raceId = race.raceId;
  const meetingId = meeting.meetingId;
  
  console.log(`🏁 Testing with Race: ${race.name || `Race ${race.number}`} (${raceId})\n`);
  console.log('═'.repeat(70));
  
  // Test potential endpoints
  const endpointsToTest = [
    // RESULTS
    { name: 'Race Results', url: `/form/results?raceId=${raceId}&apiKey=${apiKey}` },
    { name: 'Meeting Results', url: `/form/results?meetingId=${meetingId}&apiKey=${apiKey}` },
    
    // SECTIONALS
    { name: 'Race Sectionals', url: `/form/sectionals?raceId=${raceId}&apiKey=${apiKey}` },
    { name: 'Meeting Sectionals', url: `/form/sectionals?meetingId=${meetingId}&apiKey=${apiKey}` },
    { name: 'Sectional Times', url: `/form/sectionaltimes?raceId=${raceId}&apiKey=${apiKey}` },
    
    // DIVIDENDS
    { name: 'Race Dividends', url: `/form/dividends?raceId=${raceId}&apiKey=${apiKey}` },
    { name: 'Meeting Dividends', url: `/form/dividends?meetingId=${meetingId}&apiKey=${apiKey}` },
    { name: 'Payouts', url: `/form/payouts?raceId=${raceId}&apiKey=${apiKey}` },
    
    // SPEED MAPS
    { name: 'Speed Map', url: `/form/speedmap?raceId=${raceId}&apiKey=${apiKey}` },
    { name: 'Speed Maps', url: `/form/speedmaps?raceId=${raceId}&apiKey=${apiKey}` },
    { name: 'Pace Map', url: `/form/pacemap?raceId=${raceId}&apiKey=${apiKey}` },
    
    // STATISTICS
    { name: 'Jockey Stats (Meeting)', url: `/form/stats/jockey?meetingId=${meetingId}&apiKey=${apiKey}` },
    { name: 'Trainer Stats (Meeting)', url: `/form/stats/trainer?meetingId=${meetingId}&apiKey=${apiKey}` },
    { name: 'Track Stats', url: `/form/stats/track?meetingId=${meetingId}&apiKey=${apiKey}` },
    { name: 'Performance Stats', url: `/form/performance?meetingId=${meetingId}&apiKey=${apiKey}` },
    
    // MARKET DATA
    { name: 'Market Movers', url: `/form/marketmovers?meetingId=${meetingId}&apiKey=${apiKey}` },
    { name: 'Market Movers (Race)', url: `/form/marketmovers?raceId=${raceId}&apiKey=${apiKey}` },
    { name: 'Odds', url: `/form/odds?raceId=${raceId}&apiKey=${apiKey}` },
    { name: 'Odds History', url: `/form/oddshistory?raceId=${raceId}&apiKey=${apiKey}` },
    { name: 'Fluctuations', url: `/form/fluctuations?raceId=${raceId}&apiKey=${apiKey}` },
    
    // TRACK WORK
    { name: 'Track Work', url: `/form/trackwork?meetingId=${meetingId}&apiKey=${apiKey}` },
    { name: 'Trials', url: `/form/trials?meetingId=${meetingId}&apiKey=${apiKey}` },
    
    // STEWARDS
    { name: 'Stewards Reports', url: `/form/stewards?meetingId=${meetingId}&apiKey=${apiKey}` },
    { name: 'Stewards (Race)', url: `/form/stewards?raceId=${raceId}&apiKey=${apiKey}` },
    { name: 'Protests', url: `/form/protests?raceId=${raceId}&apiKey=${apiKey}` },
    
    // FORM GUIDE
    { name: 'Form Guide', url: `/form/formguide?raceId=${raceId}&apiKey=${apiKey}` },
    { name: 'Horse Form', url: `/form/horseform?raceId=${raceId}&apiKey=${apiKey}` },
    { name: 'Last Start', url: `/form/laststart?raceId=${raceId}&apiKey=${apiKey}` },
    
    // RATINGS
    { name: 'Ratings', url: `/form/ratings?raceId=${raceId}&apiKey=${apiKey}` },
    { name: 'Ratings (Meeting)', url: `/form/ratings?meetingId=${meetingId}&apiKey=${apiKey}` },
    { name: 'Speed Ratings', url: `/form/speedratings?raceId=${raceId}&apiKey=${apiKey}` },
    
    // BETTING
    { name: 'Betting Guide', url: `/form/bettingguide?raceId=${raceId}&apiKey=${apiKey}` },
    { name: 'Tipping', url: `/form/tips?raceId=${raceId}&apiKey=${apiKey}` },
  ];
  
  const workingEndpoints: Array<{name: string; url: string; structure: string}> = [];
  
  for (const endpoint of endpointsToTest) {
    try {
      console.log(`\n🧪 Testing: ${endpoint.name}`);
      
      const response = await fetch(`${baseUrl}${endpoint.url}`);
      const data = await response.json();
      
      if (response.ok && data.statusCode === 200 && data.payLoad) {
        const hasData = Array.isArray(data.payLoad) 
          ? data.payLoad.length > 0 
          : Object.keys(data.payLoad).length > 0;
          
        if (hasData) {
          console.log(`   ✅ SUCCESS! Has data`);
          
          // Show structure
          const sample = Array.isArray(data.payLoad) ? data.payLoad[0] : data.payLoad;
          if (sample) {
            const keys = Object.keys(sample).slice(0, 10).join(', ');
            console.log(`   📊 Structure: ${keys}`);
            
            workingEndpoints.push({
              name: endpoint.name,
              url: endpoint.url.split('&apiKey')[0],
              structure: keys
            });
          }
        } else {
          console.log(`   ⚠️ Success but no data`);
        }
      } else {
        console.log(`   ⚠️ Status: ${data.statusCode} - ${data.error || data.message || 'No data'}`);
      }
      
      // Rate limiting - be respectful
      await new Promise(resolve => setTimeout(resolve, 500));
      
    } catch (error: any) {
      console.log(`   ❌ Failed: ${error.message}`);
    }
  }
  
  console.log('\n' + '═'.repeat(70));
  console.log('🎯 WORKING ENDPOINTS SUMMARY\n');
  console.log('═'.repeat(70));
  
  if (workingEndpoints.length > 0) {
    workingEndpoints.forEach((ep, i) => {
      console.log(`\n${i + 1}. ${ep.name}`);
      console.log(`   Endpoint: ${ep.url}`);
      console.log(`   Fields: ${ep.structure}`);
    });
  } else {
    console.log('⚠️ No working endpoints found (may need completed races)');
  }
  
  console.log('\n' + '═'.repeat(70));
  console.log('✨ Discovery complete!\n');
}

discoverEndpoints().catch(console.error);