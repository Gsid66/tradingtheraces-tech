import { config } from 'dotenv';
import { getPuntingFormClient } from '../lib/integrations/punting-form/client';

config({ path: '.env.local' });

async function testClient() {
  console.log('🏇 Testing Punting Form Client\n');
  
  try {
    const client = getPuntingFormClient();
    
    console.log('📅 Fetching today\'s meetings...\n');
    const meetings = await client.getTodaysMeetings();
    
    console.log(`✅ Found ${meetings.payLoad. length} meetings:\n`);
    meetings.payLoad.forEach((m:  any, i: number) => {
      console.log(`  ${i + 1}. ${m.track.name} (${m.track.state}) - ID: ${m.meetingId}`);
    });
    
    if (meetings.payLoad.length > 0) {
      const firstMeeting = meetings.payLoad[0];
      console.log(`\n🏁 Fetching races for ${firstMeeting.track.name}.. .\n`);
      
      const fields = await client.getAllRacesForMeeting(firstMeeting.meetingId);
      const races = fields.payLoad.races || [];
      
      console.log(`✅ Found ${races.length} race(s)\n`);
      
      if (races.length > 0) {
        console.log('First race details:');
        console.log(JSON.stringify(races[0], null, 2));
      }
    }
    
    console.log('\n🎉 Punting Form Client working perfectly!\n');
    
  } catch (error:  any) {
    console.error('❌ Error:', error. message);
    process.exit(1);
  }
}

testClient();