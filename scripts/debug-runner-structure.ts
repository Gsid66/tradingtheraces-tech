import { config } from 'dotenv';
config({ path: '.env.local' });

import { getPuntingFormClient } from '../lib/integrations/punting-form/client';

async function debugStructure() {
  const pfClient = getPuntingFormClient();
  
  const targetDate = new Date('2026-02-05');
  const meetingsResponse = await pfClient.getMeetingsByDate(targetDate);
  const meeting = meetingsResponse.payLoad[0];
  
  const fieldsResponse = await pfClient.getAllRacesForMeeting(meeting.meetingId);
  const race = fieldsResponse.payLoad.races[0];
  const runner = race.runners![0] as any; // Type as 'any' to access dynamic properties
  
  console.log('🔍 RUNNER STRUCTURE ANALYSIS\n');
  console.log('═'.repeat(70));
  
  // Check distance record
  console.log('\n📏 DISTANCE RECORD:');
  console.log(JSON.stringify(runner.distanceRecord, null, 2));
  
  // Check track condition records
  console.log('\n🌧️ TRACK CONDITION RECORDS:');
  console.log('Good Record:', JSON.stringify(runner.goodRecord, null, 2));
  console.log('Firm Record:', JSON.stringify(runner.firmRecord, null, 2));
  console.log('Soft Record:', JSON.stringify(runner.softRecord, null, 2));
  console.log('Heavy Record:', JSON.stringify(runner.heavyRecord, null, 2));
  
  // Check jockey/trainer stats
  console.log('\n👥 JOCKEY/TRAINER STATS:');
  console.log('trainerJockeyA2E_Last100:', JSON.stringify(runner.trainerJockeyA2E_Last100, null, 2));
  console.log('jockeyA2E_Last100:', JSON.stringify(runner.jockeyA2E_Last100, null, 2));
  
  // Check meeting expected condition
  console.log('\n🏁 MEETING INFO:');
  console.log('Expected Condition:', fieldsResponse.payLoad.expectedCondition);
  console.log('Track Surface:', meeting.track.surface);
  
  console.log('\n═'.repeat(70));
}

debugStructure().catch(console.error);