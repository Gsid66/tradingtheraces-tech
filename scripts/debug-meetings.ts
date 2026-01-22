import { config } from 'dotenv';
config({ path: '.env.local' });

import { getPuntingFormClient } from '../lib/integrations/punting-form/client';

async function debugMeetings() {
  const pfClient = getPuntingFormClient();

  try {
    console.log('🔍 Checking what data is available...\n');

    // Try today
    console.log('📅 TODAY: ');
    const todayMeetings = await pfClient.getTodaysMeetings();
    console.log(`   Found ${todayMeetings. payLoad.length} meetings`);
    
    if (todayMeetings.payLoad.length > 0) {
      const firstMeeting = todayMeetings.payLoad[0];
      console.log(`   First meeting: ${firstMeeting. track.name} (ID: ${firstMeeting.meetingId})`);
      console.log(`   Stage: ${firstMeeting.stage}\n`);

      // Try to get races for first meeting
      console.log('🔍 Trying to fetch races for first meeting...\n');
      try {
        const racesResponse = await pfClient.getAllRacesForMeeting(firstMeeting.meetingId);
        console.log(`   ✅ SUCCESS!  Found ${racesResponse.payLoad. races.length} races`);
        
        if (racesResponse.payLoad. races.length > 0) {
          const firstRace = racesResponse. payLoad.races[0];
          console.log(`\n   First race: ${firstRace. name}`);
          console.log(`   Runners: ${firstRace.runners?. length || 0}`);
        }
      } catch (error:  any) {
        console.log(`   ❌ FAILED: ${error.message}`);
        console.log(`   This meeting's races are not available yet\n`);
      }
    }

    // Try tomorrow (data is usually available early)
    console.log('\n📅 TOMORROW:');
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowMeetings = await pfClient.getMeetingsByDate(tomorrow);
    console.log(`   Found ${tomorrowMeetings.payLoad.length} meetings`);

    if (tomorrowMeetings.payLoad.length > 0) {
      const firstMeeting = tomorrowMeetings.payLoad[0];
      console.log(`   First meeting: ${firstMeeting.track.name} (ID: ${firstMeeting.meetingId})`);
      
      try {
        const racesResponse = await pfClient.getAllRacesForMeeting(firstMeeting.meetingId);
        console.log(`   ✅ Tomorrow's races ARE available! Found ${racesResponse. payLoad.races.length} races`);
      } catch (error: any) {
        console.log(`   ❌ Tomorrow's races not available yet`);
      }
    }

    // Try yesterday
    console.log('\n📅 YESTERDAY:');
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayMeetings = await pfClient.getMeetingsByDate(yesterday);
    console.log(`   Found ${yesterdayMeetings.payLoad.length} meetings`);

    if (yesterdayMeetings.payLoad. length > 0) {
      const firstMeeting = yesterdayMeetings.payLoad[0];
      console.log(`   First meeting: ${firstMeeting.track.name} (ID: ${firstMeeting.meetingId})`);
      
      try {
        const racesResponse = await pfClient.getAllRacesForMeeting(firstMeeting.meetingId);
        console.log(`   ✅ Yesterday's races available! Found ${racesResponse.payLoad.races.length} races`);
      } catch (error:  any) {
        console.log(`   ❌ Yesterday's races archived/not available`);
      }
    }

  } catch (error: any) {
    console.error('❌ Error:', error.message);
  }
}

debugMeetings();