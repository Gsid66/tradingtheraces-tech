import { config } from 'dotenv';
config({ path: '.env.local' });

import { getPuntingFormClient } from '../lib/integrations/punting-form/client.ts';

async function checkDates() {
  const pfClient = getPuntingFormClient();

  console.log('🔍 Checking what dates have data available...\n');

  // Try a range of dates
  const today = new Date();
  
  for (let offset = -2; offset <= 7; offset++) {
    const checkDate = new Date(today);
    checkDate.setDate(today.getDate() + offset);
    
    const label = offset === 0 ? 'TODAY' : 
                  offset === 1 ?  'TOMORROW' : 
                  offset === -1 ? 'YESTERDAY' : 
                  offset > 0 ? `+${offset} DAYS` : 
                  `${offset} DAYS`;

    try {
      const meetingsResponse = await pfClient.getMeetingsByDate(checkDate);
      const meetings = meetingsResponse.payLoad || [];

      if (meetings.length > 0) {
        console.log(`📅 ${label} (${checkDate.toLocaleDateString()}): ${meetings.length} meetings`);
        
        // Try to get races for first meeting
        const firstMeeting = meetings[0];
        try {
          const racesResponse = await pfClient.getAllRacesForMeeting(firstMeeting.meetingId);
          const races = racesResponse.payLoad?.races || [];
          
          if (races.length > 0) {
            console.log(`   ✅ ${firstMeeting.track.name}:  ${races.length} races with fields available! `);
          } else {
            console.log(`   ⚠️  ${firstMeeting.track.name}: No race data yet`);
          }
        } catch (error) {
          console.log(`   ⚠️  ${firstMeeting.track.name}: Fields not published yet`);
        }
      } else {
        console.log(`📅 ${label} (${checkDate.toLocaleDateString()}): No meetings`);
      }
    } catch (error:  any) {
      console.log(`📅 ${label}: Error - ${error.message}`);
    }
  }
}

checkDates();