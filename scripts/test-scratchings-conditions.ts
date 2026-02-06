import { config } from 'dotenv';
import { getPuntingFormClient } from '../lib/integrations/punting-form/client';

config({ path: '.env.local' });

async function testScratchingsAndConditions() {
  console.log('🧪 Testing Scratchings and Conditions API\n');
  
  const pfClient = getPuntingFormClient();
  
  // Test Scratchings
  console.log('📋 Fetching scratchings...');
  try {
    const scratchingsRes = await pfClient.getScratchings(0);
    console.log(`✅ Found ${scratchingsRes.payLoad?.length || 0} scratchings`);
    
    if (scratchingsRes.payLoad && scratchingsRes.payLoad.length > 0) {
      console.log('\nSample scratching:');
      console.log(JSON.stringify(scratchingsRes.payLoad[0], null, 2));
    }
  } catch (error) {
    console.error('❌ Error fetching scratchings:', error);
  }
  
  // Test Conditions
  console.log('\n🌤️  Fetching track conditions...');
  try {
    const conditionsRes = await pfClient.getConditions(0);
    console.log(`✅ Found ${conditionsRes.payLoad?.length || 0} track conditions`);
    
    if (conditionsRes.payLoad && conditionsRes.payLoad.length > 0) {
      console.log('\nSample condition:');
      console.log(JSON.stringify(conditionsRes.payLoad[0], null, 2));
    }
  } catch (error) {
    console.error('❌ Error fetching conditions:', error);
  }
  
  console.log('\n✨ Test completed!');
}

testScratchingsAndConditions().catch(console.error);
