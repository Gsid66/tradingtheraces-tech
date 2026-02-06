import { config } from 'dotenv';
config({ path: '.env.local' });

import { getPuntingFormClient } from '../lib/integrations/punting-form/client';

async function inspectFields() {
  console.log('🔍 Inspecting ALL Punting Form Runner Fields\n');
  console.log('═'.repeat(70));
  
  const pfClient = getPuntingFormClient();
  
  // Get a meeting from 2026-02-05
  const targetDate = new Date('2026-02-05');
  const meetingsResponse = await pfClient.getMeetingsByDate(targetDate);
  const meetings = meetingsResponse.payLoad || [];
  
  if (meetings.length === 0) {
    console.log('No meetings found');
    return;
  }
  
  const meeting = meetings[0];
  console.log(`📍 Meeting: ${meeting.track.name}\n`);
  
  // Get races
  const fieldsResponse = await pfClient.getAllRacesForMeeting(meeting.meetingId);
  const races = fieldsResponse.payLoad?.races || [];
  
  if (races.length === 0) {
    console.log('No races found');
    return;
  }
  
  const race = races[0];
  console.log(`🏁 Race: ${race.name}`);
  console.log(`   Runners: ${race.runners?.length || 0}\n`);
  
  if (!race.runners || race.runners.length === 0) {
    console.log('No runners found');
    return;
  }
  
  // Get first runner with all fields
  const runner = race.runners[0];
  
  console.log('🐴 COMPLETE RUNNER OBJECT:\n');
  console.log(JSON.stringify(runner, null, 2));
  
  console.log('\n' + '═'.repeat(70));
  console.log('📊 AVAILABLE FIELDS:\n');
  
  const fields = Object.keys(runner).sort();
  fields.forEach(field => {
    const value = (runner as any)[field];
    const type = typeof value;
    const preview = type === 'object' && value !== null 
      ? JSON.stringify(value).substring(0, 50) + '...'
      : String(value).substring(0, 50);
    
    console.log(`${field.padEnd(25)} | ${type.padEnd(10)} | ${preview}`);
  });
  
  console.log('\n' + '═'.repeat(70));
}

inspectFields().catch(console.error);