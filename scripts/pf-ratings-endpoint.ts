import { config } from 'dotenv';
config({ path: '.env.local' });

async function checkRatingsEndpoint() {
  const apiKey = process.env.PUNTING_FORM_API_KEY;
  
  if (!apiKey) {
    console.error('❌ PUNTING_FORM_API_KEY not found');
    return;
  }

  console.log('🔍 CHECKING PUNTING FORM RATINGS ENDPOINT\n');
  console.log('═'.repeat(70));

  // Test 1: Check what parameters are available
  console.log('\n📡 Test 1: MeetingRatings endpoint');
  console.log('─'.repeat(70));
  
  const baseUrl = 'https://api.puntingform.com.au/v2/Ratings/MeetingRatings';
  const url = `${baseUrl}?apiKey=${apiKey}`;
  
  console.log(`\nURL: ${baseUrl}`);
  console.log('Calling endpoint...\n');

  try {
    const response = await fetch(url, {
      headers: {
        'accept': 'application/json'
      }
    });

    if (!response.ok) {
      console.error(`❌ Error: ${response.status} ${response.statusText}`);
      const text = await response.text();
      console.log('Response:', text);
      return;
    }

    const data = await response.json();
    
    console.log('✅ SUCCESS! Response structure:\n');
    console.log(JSON.stringify(data, null, 2).substring(0, 2000));
    
    if (JSON.stringify(data).length > 2000) {
      console.log('\n... (truncated, showing first 2000 chars)');
    }

    // Analyze structure
    console.log('\n' + '═'.repeat(70));
    console.log('📊 RESPONSE ANALYSIS:\n');
    
    if (data.payLoad) {
      console.log(`✅ Has payLoad: ${typeof data.payLoad}`);
      
      if (Array.isArray(data.payLoad)) {
        console.log(`   Array length: ${data.payLoad.length}`);
        
        if (data.payLoad.length > 0) {
          const firstItem = data.payLoad[0];
          console.log('\n   First item keys:', Object.keys(firstItem).join(', '));
          
          // Check for ratings-specific fields
          const ratingFields = Object.keys(firstItem).filter(k => 
            k.toLowerCase().includes('rating') || 
            k.toLowerCase().includes('speed') ||
            k.toLowerCase().includes('sectional')
          );
          
          if (ratingFields.length > 0) {
            console.log('\n   🎯 Rating-related fields found:');
            ratingFields.forEach(field => {
              console.log(`      - ${field}: ${typeof firstItem[field]}`);
            });
          }
        }
      }
    }

  } catch (error: any) {
    console.error('❌ Error:', error.message);
  }

  // Test 2: Check with date parameter
  console.log('\n' + '═'.repeat(70));
  console.log('\n📡 Test 2: With date parameter (2026-02-05)');
  console.log('─'.repeat(70));
  
  const dateUrl = `${baseUrl}?meetingDate=05-Feb-2026&apiKey=${apiKey}`;
  console.log(`\nURL: ${baseUrl}?meetingDate=05-Feb-2026`);
  
  try {
    const response = await fetch(dateUrl, {
      headers: {
        'accept': 'application/json'
      }
    });

    if (!response.ok) {
      console.error(`❌ Error: ${response.status} ${response.statusText}`);
      return;
    }

    const data = await response.json();
    
    console.log('\n✅ SUCCESS with date! Sample response:\n');
    console.log(JSON.stringify(data, null, 2).substring(0, 1500));
    
    if (data.payLoad && Array.isArray(data.payLoad) && data.payLoad.length > 0) {
      console.log('\n' + '═'.repeat(70));
      console.log('🎯 RATINGS DATA STRUCTURE:\n');
      
      const sample = data.payLoad[0];
      console.log('Meeting info:');
      if (sample.track) console.log(`  Track: ${sample.track?.name || 'N/A'}`);
      if (sample.meetingDate) console.log(`  Date: ${sample.meetingDate}`);
      
      if (sample.races && Array.isArray(sample.races)) {
        console.log(`\n  Races: ${sample.races.length}`);
        
        if (sample.races.length > 0) {
          const race = sample.races[0];
          console.log(`\n  First race structure:`);
          console.log(`    Race ${race.number || race.raceNumber}: ${race.name || race.raceName || 'N/A'}`);
          
          if (race.runners && Array.isArray(race.runners)) {
            console.log(`    Runners: ${race.runners.length}`);
            
            if (race.runners.length > 0) {
              const runner = race.runners[0];
              console.log(`\n    First runner fields:`);
              Object.keys(runner).forEach(key => {
                const value = runner[key];
                const preview = typeof value === 'object' ? '{...}' : String(value).substring(0, 30);
                console.log(`      - ${key}: ${preview}`);
              });
            }
          }
        }
      }
    }

  } catch (error: any) {
    console.error('❌ Error:', error.message);
  }

  console.log('\n' + '═'.repeat(70) + '\n');
}

checkRatingsEndpoint().catch(console.error);